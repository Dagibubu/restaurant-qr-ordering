import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { DashboardSkeleton } from '../../components/Skeleton';
import { useLang } from '../../i18n/LanguageContext';
import AiAnalytics from '../../components/AiAnalytics';

export default function Dashboard() {
  const { t, lang } = useLang();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/reports/summary')
      .then((r) => setD(r.data))
      .catch(() => setError('dash.failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200
                        text-red-700 text-sm px-4 py-3">
          {t(error)}
        </div>
      </div>
    );
  }

  if (!d) return null;

  const maxQty = d.topItems[0]?.qty || 1;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-terracotta-600 uppercase mb-1">
          {t('dash.overview')}
        </p>
        <h1 className="text-3xl">{t('dash.title')}</h1>
        <p className="text-sm text-ink-500 mt-1">
          {new Date().toLocaleDateString(lang === 'am' ? 'am-ET' : undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Stat
          label={t('dash.ordersToday')}
          value={d.todayOrders}
          accent="terracotta"
          icon="🧾"
        />
        <Stat
          label={t('dash.revenueToday')}
          value={`$${Number(d.todayRevenue).toFixed(2)}`}
          accent="sage"
          icon="💰"
        />
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-5">{t('dash.topSelling')}</h2>
        {d.topItems.length ? (
          <div className="space-y-3.5">
            {d.topItems.map((t, i) => (
              <div key={t.name} className="flex items-center gap-4">
                <span className="w-7 h-7 grid place-items-center rounded-full
                                 bg-terracotta-100 text-terracotta-700
                                 text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm">{t.name}</span>
                <div className="w-32 h-1.5 rounded-full bg-cream-200 overflow-hidden shrink-0">
                  <div
                    className="h-full bg-terracotta-500 rounded-full transition-all duration-500"
                    style={{ width: `${(t.qty / maxQty) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-10 text-right shrink-0">
                  {t.qty}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-ink-400">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">{t('dash.noSales')}</p>
          </div>
        )}
      </div>

      <AiAnalytics />
    </div>
  );
}

function Stat({ label, value, accent, icon }) {
  const bg =
    accent === 'sage'
      ? 'from-sage-500 to-sage-700'
      : 'from-terracotta-500 to-terracotta-700';

  return (
    <div className="card p-6 overflow-hidden relative">
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full
                       bg-gradient-to-br ${bg} opacity-10`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="label mb-0">{label}</p>
          <p className="text-4xl font-display font-semibold mt-2">{value}</p>
        </div>
        <div className={`w-11 h-11 grid place-items-center rounded-xl
                         bg-gradient-to-br ${bg} text-white text-xl shadow-lift`}>
          {icon}
        </div>
      </div>
    </div>
  );
}