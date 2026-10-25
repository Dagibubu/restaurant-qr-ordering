import { Op } from 'sequelize';
import { MenuItem, Order } from '../models/index.js';

/*
  Builds the small, aggregated, PII-free summary that is sent to Gemini.

  What is deliberately NOT included: customer notes (free text), order ids,
  user accounts / emails / passwords, table QR codes, payment data. Only
  totals, counts and dish names leave the server.
*/

const TIMEZONE = process.env.RESTAURANT_TIMEZONE || 'Africa/Addis_Ababa';
const WINDOW_DAYS = 30;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const round2 = (n) => Math.round(n * 100) / 100;

// Local calendar parts of a Date in the restaurant's timezone
function localParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      weekday: 'short',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
    weekday: parts.weekday,
  };
}

const topN = (entries, n) =>
  [...entries].sort((a, b) => b[1] - a[1]).slice(0, n);

export async function buildAnalyticsSnapshot() {
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [orders, menu] = await Promise.all([
    Order.findAll({
      where: { createdAt: { [Op.gte]: since } },
      attributes: ['items', 'total', 'status', 'createdAt', 'tableId'], // no `note`
    }),
    MenuItem.findAll({ attributes: ['id', 'name', 'available'] }),
  ]);

  const today = localParts(now).day;
  const last7 = new Set(
    Array.from({ length: 7 }, (_, i) =>
      localParts(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)).day
    )
  );

  const periods = {
    today: { orders: 0, revenue: 0 },
    last7Days: { orders: 0, revenue: 0 },
    last30Days: { orders: 0, revenue: 0 },
  };
  const byHour = Array(24).fill(0);
  const byWeekday = Object.fromEntries(WEEKDAYS.map((d) => [d, 0]));
  const dishQty = new Map(); // name -> units sold
  const dishRevenue = new Map();
  const leftOut = new Map(); // ingredient -> times removed
  const tableOrders = new Map();
  const statusCounts = {};
  let cancelled = 0;

  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    if (o.status === 'cancelled') {
      cancelled += 1;
      continue;
    }

    const total = Number(o.total) || 0;
    const { day, hour, weekday } = localParts(new Date(o.createdAt));

    periods.last30Days.orders += 1;
    periods.last30Days.revenue += total;
    if (last7.has(day)) {
      periods.last7Days.orders += 1;
      periods.last7Days.revenue += total;
    }
    if (day === today) {
      periods.today.orders += 1;
      periods.today.revenue += total;
    }

    byHour[hour] += 1;
    if (weekday in byWeekday) byWeekday[weekday] += 1;
    tableOrders.set(o.tableId, (tableOrders.get(o.tableId) || 0) + 1);

    for (const it of o.items || []) {
      const qty = Number(it.quantity) || 0;
      dishQty.set(it.name, (dishQty.get(it.name) || 0) + qty);
      dishRevenue.set(it.name, (dishRevenue.get(it.name) || 0) + qty * (Number(it.price) || 0));
      for (const ing of it.exclude || []) {
        leftOut.set(ing, (leftOut.get(ing) || 0) + qty);
      }
    }
  }

  for (const p of Object.values(periods)) p.revenue = round2(p.revenue);

  const sold = [...dishQty.entries()];
  const neverSold = menu
    .filter((m) => !dishQty.has(m.name))
    .map((m) => m.name)
    .slice(0, 10);

  const orderCount = periods.last30Days.orders;
  const totalOrders = orders.length;

  return {
    currency: 'unspecified (prices shown as plain numbers)',
    timezone: TIMEZONE,
    generatedAt: now.toISOString(),
    windowDays: WINDOW_DAYS,

    sales: {
      ...periods,
      averageOrderValue: orderCount ? round2(periods.last30Days.revenue / orderCount) : 0,
    },

    orderStatus: {
      byStatus: statusCounts,
      cancelledOrders: cancelled,
      cancellationRatePercent: totalOrders ? round2((cancelled / totalOrders) * 100) : 0,
    },

    menu: {
      totalDishes: menu.length,
      markedUnavailable: menu.filter((m) => !m.available).map((m) => m.name),
      topSellers: topN(sold, 5).map(([name, qty]) => ({
        name,
        unitsSold: qty,
        revenue: round2(dishRevenue.get(name) || 0),
      })),
      // lowest sellers among dishes that sold at least once
      bottomSellers: [...sold]
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, unitsSold: qty })),
      neverSoldInWindow: neverSold,
    },

    demand: {
      peakHours: topN(
        byHour.map((count, hour) => [`${String(hour).padStart(2, '0')}:00`, count]).filter(([, c]) => c > 0),
        3
      ).map(([hour, orders]) => ({ hour, orders })),
      ordersByWeekday: byWeekday,
      busiestTables: topN([...tableOrders.entries()], 3).map(([id, n]) => ({
        tableNumberRef: `table-${id}`,
        orders: n,
      })),
      serviceModel: 'All orders are dine-in via table QR codes (no delivery channel).',
    },

    // Proxy signals for waste, since stock levels are not tracked
    inventory: {
      stockTrackingAvailable: false,
      note:
        'The system does not track ingredient stock levels. Use sales velocity, ' +
        'cancellations and dishes that never sell as proxies for waste risk.',
      mostOftenLeftOutIngredients: topN([...leftOut.entries()], 5).map(([ingredient, times]) => ({
        ingredient,
        timesRemoved: times,
      })),
    },
  };
}
