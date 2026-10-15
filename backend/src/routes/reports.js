import express from 'express';
import { Op, fn, col } from 'sequelize';
import { Order } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, adminOnly, async (_, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.count({
      where: { createdAt: { [Op.gte]: today } },
    });

    const revenueRow = await Order.findOne({
      attributes: [[fn('SUM', col('total')), 'total']],
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.gte]: today },
      },
      raw: true,
    });

    // Top items — need to aggregate JSON items array in JS
    const recentOrders = await Order.findAll({
      where: { status: { [Op.ne]: 'cancelled' } },
      attributes: ['items'],
      raw: true,
    });

    const counts = {};
    for (const o of recentOrders) {
      for (const item of o.items || []) {
        const key = item.name;
        counts[key] = (counts[key] || 0) + item.quantity;
      }
    }
    const topItems = Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      todayOrders,
      todayRevenue: Number(revenueRow?.total || 0),
      topItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;