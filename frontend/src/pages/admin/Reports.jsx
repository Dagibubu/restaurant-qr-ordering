import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useLang } from '../../i18n/LanguageContext';

export default function Reports() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders')
      .then((r) => setOrders(r.data))
      .catch(() => setError('reports.failed'))
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-6">
        <p className="text-xs tracking-[0.3em] text-terracotta-600 uppercase mb-1">
          {t('reports.history')}
        </p>
        <h1 className="text-3xl">{t('reports.title')}</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200
                        text-red-700 text-sm px-3 py-2">
          {t(error)}
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-ink-400 animate-pulse-soft">
            {t('loading')}
          </div>
        ) : !orders.length ? (
          <div className="p-12 text-center text-ink-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">{t('reports.none')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left">
              <tr>
                <th className="p-3">{t('reports.date')}</th>
                <th className="p-3">{t('reports.order')}</th>
                <th className="p-3">{t('table')}</th>
                <th className="p-3">{t('reports.items')}</th>
                <th className="p-3">{t('total')}</th>
                <th className="p-3">{t('reports.status')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-ink-900/5">
                  <td className="p-3 text-ink-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    #{String(o.id).padStart(6, '0')}
                  </td>
                  <td className="p-3">{o.table?.number || '—'}</td>
                  <td className="p-3">
                    {o.items
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(', ')}
                  </td>
                  <td className="p-3 font-medium">
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className={`badge-${o.status} capitalize`}>
                      {t(`status.${o.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-cream-100 font-bold">
              <tr>
                <td colSpan="4" className="p-3 text-right">
                  {t('reports.revenue')}
                </td>
                <td className="p-3">${revenue.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}