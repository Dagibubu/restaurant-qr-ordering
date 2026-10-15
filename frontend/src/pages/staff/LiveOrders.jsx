import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const STEPS = [
  { key: 'pending', label: 'Placed', icon: '📝' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready', label: 'Ready', icon: '🔔' },
  { key: 'served', label: 'Served', icon: '🍽️' },
];

export default function OrderStatus() {
  const { orderId, tableId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () =>
      api
        .get(`/orders/${orderId}`)
        .then((r) => setOrder(r.data))
        .catch(() => setError('Could not load order'));
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [orderId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center text-ink-400">
        <div className="text-5xl mb-3">⚠️</div>
        <p>{error}</p>
        <Link to={`/order/${tableId}`} className="btn-outline mt-6 inline-block">
          Back to menu
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-400">
        <div className="text-center animate-pulse-soft">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="text-sm">Loading your order…</p>
        </div>
      </div>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <div className="text-center mb-8">
        <div className="inline-grid place-items-center w-16 h-16 rounded-full
                        bg-sage-100 text-3xl mb-4">
          {cancelled ? '✕' : '✓'}
        </div>
        <h1 className="text-3xl mb-1">
          {cancelled ? 'Order cancelled' : 'Order confirmed'}
        </h1>
        <p className="text-sm text-ink-500">
          Table {order.table?.number} · #
          {String(order.id).padStart(6, '0')}
        </p>
      </div>

      {!cancelled && (
        <div className="card p-6 mb-5">
          <div className="flex items-start justify-between relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-cream-200" />
            {STEPS.map((s, i) => (
              <div key={s.key} className="relative z-10 flex-1 text-center">
                <div
                  className={`w-10 h-10 mx-auto mb-2 rounded-full grid place-items-center
                               text-lg shadow-soft transition-all duration-300
                    ${
                      i <= idx
                        ? 'bg-terracotta-500 text-white'
                        : 'bg-white text-ink-400 border border-ink-900/10'
                    }`}
                >
                  {i < idx ? '✓' : s.icon}
                </div>
                <p
                  className={`text-xs font-medium
                    ${i <= idx ? 'text-ink-900' : 'text-ink-400'}`}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5 mb-5">
        <h2 className="text-lg mb-3">Your items</h2>
        <div className="space-y-2">
          {order.items.map((i, k) => (
            <div key={k} className="flex justify-between text-sm py-1">
              <span>
                <span className="text-ink-400 mr-2">{i.quantity}×</span>
                {i.name}
              </span>
              <span className="font-medium">
                ${(Number(i.price) * i.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-900/8 mt-3 pt-3 flex justify-between">
          <span className="text-ink-500">Total</span>
          <span className="font-display text-xl font-semibold">
            ${Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      {order.note && (
        <p className="text-xs text-ink-500 italic mb-5 text-center">
          📝 "{order.note}"
        </p>
      )}

      <div className="text-center">
        <Link to={`/order/${tableId}`} className="btn-outline">
          ← Back to menu
        </Link>
      </div>
    </div>
  );
}