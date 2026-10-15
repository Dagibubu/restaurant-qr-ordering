import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import api from '../../api/axios';
import { MenuSkeleton } from '../../components/Skeleton';

/* ──────────────────────────────
   Animation variants
────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const rowVariant = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24 },
  },
};

/* ──────────────────────────────
   Particle burst on add
────────────────────────────── */
function burstParticles(x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = 60 + Math.random() * 70;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

/* ──────────────────────────────
   Main
────────────────────────────── */
export default function CustomerMenu() {
  const { tableId } = useParams();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/menu/items'), api.get('/menu/categories')])
      .then(([i, c]) => {
        setItems(i.data);
        setCats(c.data);
      })
      .catch(() => setError('Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      activeCat === 'all'
        ? items
        : items.filter((i) => String(i.categoryId) === String(activeCat)),
    [items, activeCat]
  );

  const add = (item, e) => {
    if (e) {
      const x = e.clientX || e.target.getBoundingClientRect().x;
      const y = e.clientY || e.target.getBoundingClientRect().y;
      burstParticles(x, y);
    }
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 700);
    setCart((c) => ({
      ...c,
      [item.id]: { ...item, quantity: (c[item.id]?.quantity || 0) + 1 },
    }));
  };

  const remove = (id) =>
    setCart((c) => {
      const n = { ...c };
      if (n[id].quantity > 1) n[id].quantity--;
      else delete n[id];
      return n;
    });

  const totalQty = Object.values(cart).reduce((s, i) => s + i.quantity, 0);
  const total = Object.values(cart).reduce(
    (s, i) => s + Number(i.price) * i.quantity,
    0
  );

  const submit = async () => {
    if (submitting) return;
    const orderItems = Object.values(cart).map((i) => ({
      menuItemId: i.id,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    }));
    if (!orderItems.length) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        tableId,
        items: orderItems,
        note,
      });
      nav(`/order/${tableId}/status/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      setSubmitting(false);
    }
  };

  return (
    <div className="menu-dark pb-32">
      {/* ─── Hero ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-6 pt-14 pb-12 text-center relative"
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[11px] tracking-[0.4em] uppercase mb-4"
          style={{ color: 'var(--menu-amber)' }}
        >
          ✦ Table Service ✦
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hero-title font-display text-5xl sm:text-6xl leading-[1.05] mb-4"
          style={{ fontWeight: 500 }}
        >
          Tonight's
          <br />
          Selection
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mx-auto h-px w-32 my-5"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--menu-amber), transparent)',
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="text-sm max-w-md mx-auto"
          style={{ color: 'var(--menu-text-dim)' }}
        >
          Follow the trail. Tap any dish to add it to your table's order.
        </motion.p>
      </motion.section>

      {/* ─── Error ─── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-6 mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              color: '#fca5a5',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Category chips ─── */}
      {!loading && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="sticky top-0 z-30 py-3 mb-6"
          style={{
            background: 'rgba(10, 9, 8, 0.75)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            borderBottom: '1px solid rgba(255, 200, 130, 0.06)',
          }}
        >
          <div className="flex gap-2 overflow-x-auto px-6 no-scrollbar justify-center">
            <button
              onClick={() => setActiveCat('all')}
              className={`chip-dark ${activeCat === 'all' ? 'is-active' : ''}`}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`chip-dark ${
                  String(activeCat) === String(c.id) ? 'is-active' : ''
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Journey trail ─── */}
      {loading ? (
        <MenuSkeleton />
      ) : (
        <div className="journey-wrapper max-w-3xl mx-auto px-4 sm:px-6">
          <svg
            className="journey-trail"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,200,130,0.5)" />
                <stop offset="50%" stopColor="rgba(255,200,130,0.15)" />
                <stop offset="100%" stopColor="rgba(255,200,130,0.5)" />
              </linearGradient>
            </defs>
            <path
              d="M 12 2 Q 88 12, 88 25 T 12 50 T 88 75 T 12 98"
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="0.35"
              strokeDasharray="2 1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <LayoutGroup>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="relative space-y-16 sm:space-y-24 py-8"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item, idx) => (
                  <JourneyRow
                    key={item.id}
                    item={item}
                    side={idx % 2 === 0 ? 'left' : 'right'}
                    quantity={cart[item.id]?.quantity || 0}
                    justAdded={justAdded === item.id}
                    onAdd={(e) => add(item, e)}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>

          {!filtered.length && (
            <div
              className="text-center py-20"
              style={{ color: 'var(--menu-text-dim)' }}
            >
              <div className="text-5xl mb-4">🍽️</div>
              <p className="text-sm">No items in this category yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Floating cart ─── */}
      <AnimatePresence>
        {totalQty > 0 && !cartOpen && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCartOpen(true)}
            className="cart-float fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                       rounded-full pl-2 pr-5 py-2 flex items-center gap-3"
          >
            <motion.span
              key={totalQty}
              initial={{ scale: 1.6, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="w-9 h-9 grid place-items-center rounded-full
                         text-sm font-bold"
              style={{ background: '#0a0908', color: 'var(--menu-amber)' }}
            >
              {totalQty}
            </motion.span>
            <span className="text-sm">View Order</span>
            <span className="text-sm font-semibold">${total.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Cart drawer ─── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
              }}
              onClick={() => !submitting && setCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) setCartOpen(false);
              }}
              className="glass-drawer fixed bottom-0 left-0 right-0 z-50
                         rounded-t-3xl p-5 max-w-lg mx-auto"
            >
              <div
                className="w-12 h-1 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing"
                style={{ background: 'rgba(255, 200, 130, 0.25)' }}
              />

              <div className="flex items-center justify-between mb-5">
                <h2
                  className="font-display text-2xl"
                  style={{ color: 'var(--menu-text)' }}
                >
                  Your Order
                </h2>
                <button
                  onClick={() => !submitting && setCartOpen(false)}
                  className="text-xs uppercase tracking-wider"
                  style={{ color: 'var(--menu-text-dim)' }}
                >
                  Close
                </button>
              </div>

              <div className="max-h-64 overflow-auto -mx-1 px-1 space-y-1 mb-4">
                <AnimatePresence>
                  {Object.values(cart).map((i) => (
                    <motion.div
                      key={i.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 26,
                      }}
                      className="flex items-center gap-3 py-2.5"
                      style={{
                        borderBottom: '1px solid rgba(255, 200, 130, 0.06)',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {i.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--menu-text-dim)' }}
                        >
                          ${Number(i.price).toFixed(2)} each
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-2 rounded-full p-0.5"
                        style={{ background: 'rgba(255, 200, 130, 0.06)' }}
                      >
                        <button
                          onClick={() => remove(i.id)}
                          className="w-7 h-7 grid place-items-center rounded-full text-sm"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--menu-text)',
                          }}
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">
                          {i.quantity}
                        </span>
                        <button
                          onClick={(e) => add(i, e)}
                          className="w-7 h-7 grid place-items-center rounded-full text-sm font-bold"
                          style={{
                            background:
                              'linear-gradient(135deg, var(--menu-amber-bright), var(--menu-amber))',
                            color: '#0a0908',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold w-16 text-right">
                        ${(Number(i.price) * i.quantity).toFixed(2)}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <input
                className="w-full px-4 py-3 rounded-xl mb-4 text-sm focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 200, 130, 0.1)',
                  color: 'var(--menu-text)',
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = 'rgba(255, 200, 130, 0.4)')
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = 'rgba(255, 200, 130, 0.1)')
                }
                placeholder="Add a note for the kitchen (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />

              <div className="flex items-center justify-between mb-4 px-1">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: 'var(--menu-text-dim)' }}
                >
                  Total
                </span>
                <span className="font-display text-3xl">
                  ${total.toFixed(2)}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-semibold text-sm disabled:opacity-60"
                style={{
                  background:
                    'linear-gradient(135deg, var(--menu-amber-bright), var(--menu-amber))',
                  color: '#0a0908',
                  boxShadow: '0 20px 40px -12px rgba(240, 169, 76, 0.5)',
                }}
              >
                {submitting ? 'Placing your order…' : 'Place Order →'}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────
   Journey row — alternating circular dish
────────────────────────────── */
function JourneyRow({ item, side, quantity, justAdded, onAdd, onRemove }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      variants={rowVariant}
      layout
      className={`journey-row ${isLeft ? 'is-left' : 'is-right'}`}
    >
      {/* Circle image */}
      <motion.div
        className={`journey-dish ${justAdded ? 'is-pulsing' : ''}`}
        whileHover={{ scale: 1.04, rotate: isLeft ? -3 : 3 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="journey-ring" />
        <div className="journey-ring journey-ring-2" />
        <div className="journey-photo">
          {item.image ? (
            <img src={item.image} alt={item.name} />
          ) : (
            <span className="text-4xl">🍴</span>
          )}
        </div>
        <span className="journey-dot journey-dot-a" />
        <span className="journey-dot journey-dot-b" />
        <span className="journey-dot journey-dot-c" />
      </motion.div>

      {/* Info card */}
      <motion.div
        layout
        className={`journey-card ${quantity > 0 ? 'is-active' : ''}`}
      >
        <span
          className="journey-price"
          style={{
            [isLeft ? 'right' : 'left']: '-12px',
          }}
        >
          ${Number(item.price).toFixed(2)}
        </span>

        <h3 className="journey-title">{item.name}</h3>
        {item.category?.name && (
          <p className="journey-cat">{item.category.name}</p>
        )}
        {item.description && (
          <p className="journey-desc">{item.description}</p>
        )}

        <div className="journey-cta">
          {quantity === 0 ? (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={onAdd}
              className="journey-btn"
            >
              <span>Order Now</span>
              <span className="journey-btn-arrow">→</span>
            </motion.button>
          ) : (
            <div className="journey-counter">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onRemove}
                className="journey-counter-btn"
              >
                −
              </motion.button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.4, color: 'var(--menu-amber-bright)' }}
                animate={{ scale: 1, color: 'var(--menu-text)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="journey-counter-val"
              >
                {quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onAdd}
                className="journey-counter-btn is-filled"
              >
                +
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}