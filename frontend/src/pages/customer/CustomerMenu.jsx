import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { MenuSkeleton } from '../../components/Skeleton';
import { useLang } from '../../i18n/LanguageContext';
import LanguageSwitch from '../../components/LanguageSwitch';
import { parseIngredients } from '../../utils/ingredients';

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
  const { t, lang, localized } = useLang();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [activeSub, setActiveSub] = useState('all');
  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [customize, setCustomize] = useState(null); // dish whose ingredient picker is open
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/menu/items'), api.get('/menu/categories')])
      .then(([i, c]) => {
        setItems(i.data);
        setCats(c.data);
      })
      .catch(() => setError('menu.loadFailed'))
      .finally(() => setLoading(false));
  }, []);

  const mains = useMemo(() => cats.filter((c) => !c.parentId), [cats]);
  const activeMain = mains.find((m) => String(m.id) === String(activeCat));

  // Dishes grouped into horizontally-scrolling rows: one per category,
  // and one per sub-category inside a main category.
  const sections = useMemo(() => {
    const inCat = (id) => items.filter((i) => i.categoryId === id);
    const sectionsFor = (main) => {
      const subs = cats.filter((c) => c.parentId === main.id);
      if (activeMain && activeSub !== 'all') {
        const sub = subs.find((c) => String(c.id) === String(activeSub));
        return sub ? [{ cat: sub, parent: main, items: inCat(sub.id) }] : [];
      }
      return [
        { cat: main, items: inCat(main.id) },
        ...subs.map((sub) => ({ cat: sub, parent: main, items: inCat(sub.id) })),
      ];
    };

    const list = (activeMain ? [activeMain] : mains).flatMap(sectionsFor);

    if (!activeMain) {
      const known = new Set(cats.map((c) => c.id));
      const orphans = items.filter((i) => !known.has(i.categoryId));
      if (orphans.length) list.push({ cat: null, items: orphans });
    }
    return list.filter((sec) => sec.items.length);
  }, [items, cats, mains, activeMain, activeSub]);

  // Everything in view as ONE strip, each card tagged with its category
  const strip = useMemo(
    () =>
      sections.flatMap((sec) => {
        const label = sec.cat
          ? sec.parent
            ? `${localized(sec.parent, 'name')} · ${localized(sec.cat, 'name')}`
            : localized(sec.cat, 'name')
          : t('menu.other');
        return sec.items.map((item) => ({ item, label }));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, localized, t]
  );

  // Sub-category cards shown under the showroom: the open main category's
  // subs, or every sub when "All" is selected.
  const subCards = useMemo(() => {
    const parents = activeMain ? [activeMain] : mains;
    return parents.flatMap((parent) =>
      cats
        .filter((c) => c.parentId === parent.id)
        .map((sub) => {
          const subItems = items.filter((i) => i.categoryId === sub.id);
          return {
            sub,
            parent,
            count: subItems.length,
            image: subItems.find((i) => i.image)?.image,
          };
        })
    );
  }, [cats, items, mains, activeMain]);

  const pickSub = (card) => {
    const same =
      String(activeCat) === String(card.parent.id) &&
      String(activeSub) === String(card.sub.id);
    setActiveCat(card.parent.id);
    setActiveSub(same ? 'all' : card.sub.id);
  };

  const pickCat = (id) => {
    setActiveCat(id);
    setActiveSub('all');
  };

  // A cart line is a dish + the ingredients left out, so the same dish can
  // appear twice (e.g. one plain, one without onions).
  const add = (item, e, exclude = []) => {
    if (e) {
      const x = e.clientX || e.target.getBoundingClientRect().x;
      const y = e.clientY || e.target.getBoundingClientRect().y;
      burstParticles(x, y);
    }
    const key = exclude.length
      ? `${item.id}:${[...exclude].sort().join('|')}`
      : String(item.id);
    const excludeAm = parseIngredients(item)
      .filter((g) => exclude.includes(g.en))
      .map((g) => g.am);

    setCart((c) => ({
      ...c,
      [key]: {
        ...item,
        key,
        exclude,
        excludeAm,
        quantity: (c[key]?.quantity || 0) + 1,
      },
    }));
  };

  const remove = (key) =>
    setCart((c) => {
      const line = c[key];
      if (!line) return c;
      if (line.quantity > 1) return { ...c, [key]: { ...line, quantity: line.quantity - 1 } };
      const next = { ...c };
      delete next[key];
      return next;
    });

  const qtyOf = (itemId) =>
    Object.values(cart)
      .filter((l) => l.id === itemId)
      .reduce((s, l) => s + l.quantity, 0);

  const removeLastOf = (itemId) => {
    const keys = Object.keys(cart).filter((k) => cart[k].id === itemId);
    if (keys.length) remove(keys[keys.length - 1]);
  };

  // Dishes with ingredients ask what to leave out first; others add straight away
  const order = (item, e) =>
    parseIngredients(item).length ? setCustomize(item) : add(item, e);

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
      exclude: i.exclude,
      excludeAm: i.excludeAm,
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
      setError(err.response?.data?.message || t('menu.orderFailed'));
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
        <LanguageSwitch dark className="absolute top-4 right-4" />

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[11px] tracking-[0.4em] uppercase mb-4"
          style={{ color: 'var(--menu-amber)' }}
        >
          ✦ {t('menu.tableService')} ✦
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hero-title font-display text-5xl sm:text-6xl leading-[1.05] mb-4"
          style={{ fontWeight: 500 }}
        >
          {t('menu.heroTop')}
          <br />
          {t('menu.heroBottom')}
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
          {t('menu.hint')}
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
            {t(error)}
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
          <div className="flex gap-2 overflow-x-auto px-6 no-scrollbar sm:justify-center">
            <button
              onClick={() => pickCat('all')}
              className={`chip-dark ${activeCat === 'all' ? 'is-active' : ''}`}
            >
              {t('all')}
            </button>
            {mains.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCat(c.id)}
                className={`chip-dark ${
                  String(activeCat) === String(c.id) ? 'is-active' : ''
                }`}
              >
                {localized(c, 'name')}
              </button>
            ))}
          </div>

        </motion.div>
      )}

      {/* ─── Showroom strip (auto-scrolls right → left, draggable) ─── */}
      {loading ? (
        <MenuSkeleton />
      ) : strip.length ? (
        <Marquee
          entries={strip}
          renderCard={({ item, label }, key, copy) => (
            <DishCard
              key={key}
              item={item}
              label={label}
              copy={copy}
              quantity={qtyOf(item.id)}
              onAdd={(e) => order(item, e)}
              onRemove={() => removeLastOf(item.id)}
            />
          )}
        />
      ) : (
        <div
          className="text-center py-20"
          style={{ color: 'var(--menu-text-dim)' }}
        >
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-sm">{t('menu.empty')}</p>
        </div>
      )}

      {/* ─── Sub-categories (scroll only, no drift) ─── */}
      {!loading && subCards.length > 0 && (
        <section className="max-w-6xl mx-auto mt-2 mb-6">
          <p className="menu-section-eyebrow px-6 mb-3">{t('menu.browseByType')}</p>
          <SubStrip>
            {activeMain && (
              <button
                type="button"
                onClick={() => setActiveSub('all')}
                className={`sub-card ${activeSub === 'all' ? 'is-active' : ''}`}
              >
                <span className="sub-thumb">✦</span>
                <span className="sub-text">
                  <span className="sub-name">{t('all')}</span>
                  <span className="sub-count">{localized(activeMain, 'name')}</span>
                </span>
              </button>
            )}
            {subCards.map((card) => (
              <button
                key={card.sub.id}
                type="button"
                onClick={() => pickSub(card)}
                className={`sub-card ${
                  String(activeSub) === String(card.sub.id) ? 'is-active' : ''
                }`}
              >
                <span className="sub-thumb">
                  {card.image ? (
                    <img src={card.image} alt="" draggable="false" loading="lazy" />
                  ) : (
                    '🍴'
                  )}
                </span>
                <span className="sub-text">
                  <span className="sub-name">{localized(card.sub, 'name')}</span>
                  <span className="sub-count">
                    {!activeMain && `${localized(card.parent, 'name')} · `}
                    {t('menu.count', { n: card.count })}
                  </span>
                </span>
              </button>
            ))}
          </SubStrip>
        </section>
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
            <span className="text-sm">{t('menu.viewOrder')}</span>
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
                  {t('menu.yourOrder')}
                </h2>
                <button
                  onClick={() => !submitting && setCartOpen(false)}
                  className="text-xs uppercase tracking-wider"
                  style={{ color: 'var(--menu-text-dim)' }}
                >
                  {t('menu.close')}
                </button>
              </div>

              <div className="max-h-64 overflow-auto -mx-1 px-1 space-y-1 mb-4">
                <AnimatePresence>
                  {Object.values(cart).map((i) => (
                    <motion.div
                      key={i.key}
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
                          {localized(i, 'name')}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--menu-text-dim)' }}
                        >
                          ${Number(i.price).toFixed(2)} {t('menu.each')}
                        </p>
                        {i.exclude?.length > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: '#fca5a5' }}>
                            {t('menu.without')}{' '}
                            {(lang === 'am' ? i.excludeAm : i.exclude).join(', ')}
                          </p>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-2 rounded-full p-0.5"
                        style={{ background: 'rgba(255, 200, 130, 0.06)' }}
                      >
                        <button
                          onClick={() => remove(i.key)}
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
                          onClick={(e) => add(i, e, i.exclude)}
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
                placeholder={t('menu.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />

              <div className="flex items-center justify-between mb-4 px-1">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: 'var(--menu-text-dim)' }}
                >
                  {t('total')}
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
                {submitting ? t('menu.placing') : t('menu.placeOrder')}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Ingredient picker ─── */}
      <AnimatePresence>
        {customize && (
          <IngredientSheet
            key={customize.id}
            item={customize}
            onClose={() => setCustomize(null)}
            onConfirm={(exclude, e) => {
              add(customize, e, exclude);
              setCustomize(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────
   Ingredient picker — tap what to leave out, then add to the order
────────────────────────────── */
function IngredientSheet({ item, onClose, onConfirm }) {
  const { t, lang, localized } = useLang();
  const ingredients = parseIngredients(item);
  const [out, setOut] = useState(() => new Set());

  const toggle = (en) =>
    setOut((prev) => {
      const next = new Set(prev);
      if (next.has(en)) next.delete(en);
      else next.add(en);
      return next;
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label={t('menu.customize')}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="glass-drawer fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl p-5 max-w-lg mx-auto"
      >
        <div
          className="w-12 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'rgba(255, 200, 130, 0.25)' }}
        />

        <p className="menu-section-eyebrow mb-1">{t('menu.customize')}</p>
        <h2 className="font-display text-2xl mb-1" style={{ color: 'var(--menu-text)' }}>
          {localized(item, 'name')}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--menu-text-dim)' }}>
          {t('menu.customizeHint')}
        </p>

        <div className="flex flex-wrap gap-2 mb-5 max-h-56 overflow-auto">
          {ingredients.map((g) => {
            const isOut = out.has(g.en);
            return (
              <button
                key={g.en}
                type="button"
                aria-pressed={isOut}
                onClick={() => toggle(g.en)}
                className={`ing-chip ${isOut ? 'is-out' : ''}`}
              >
                <span className="ing-mark">{isOut ? '✕' : '✓'}</span>
                {lang === 'am' ? g.am : g.en}
              </button>
            );
          })}
        </div>

        {out.size > 0 && (
          <p className="text-xs mb-3" style={{ color: '#fca5a5' }}>
            {t('menu.leftOut')}:{' '}
            {ingredients
              .filter((g) => out.has(g.en))
              .map((g) => (lang === 'am' ? g.am : g.en))
              .join(', ')}
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={(e) => onConfirm([...out], e)}
          className="w-full py-4 rounded-xl font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--menu-amber-bright), var(--menu-amber))',
            color: '#0a0908',
            boxShadow: '0 20px 40px -12px rgba(240, 169, 76, 0.5)',
          }}
        >
          {t('menu.addToOrder')} · ${Number(item.price).toFixed(2)}
        </motion.button>
      </motion.div>
    </>
  );
}

/* ──────────────────────────────
   Drag-to-scroll for a plain horizontal strip (mouse; touch is native)
────────────────────────────── */
function SubStrip({ children }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) d.moved = true;
    if (d.moved) ref.current.scrollLeft = d.left - dx;
  };
  const end = () => {
    // keep `moved` until the click that follows the drag has been swallowed
    if (drag.current && !drag.current.moved) drag.current = null;
    else setTimeout(() => (drag.current = null), 0);
  };

  return (
    <div
      ref={ref}
      className="sub-strip no-scrollbar"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerLeave={end}
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────
   Showroom marquee
   A track that glides right → left on its own. The offset is driven by a
   velocity that eases toward the drift speed, so everything feels physical:
   hovering eases it to a stop, a drag/fling carries momentum, and after a
   short rest it eases back into the drift.
   Cards are rendered several times so the loop has no seam.
────────────────────────────── */
const DRIFT_SPEED = 38; // px per second
const REST_AFTER_TOUCH = 1600; // ms to stay still after the customer lets go

function Marquee({ entries, renderCard }) {
  const viewport = useRef(null);
  const track = useRef(null);
  const st = useRef({ x: 0, vel: DRIFT_SPEED, hover: false, rest: 0, drag: null, moved: false });
  const copies = Math.max(3, Math.ceil(16 / entries.length));

  useEffect(() => {
    const el = track.current;
    const state = st.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      const w = el.scrollWidth / copies;

      if (!state.drag) {
        const wantsRest = state.hover || now < state.rest || reduce;
        const target = wantsRest ? 0 : DRIFT_SPEED;
        const ease = target === 0 ? 3 : 1.1; // brake firmly, accelerate gently
        state.vel += (target - state.vel) * Math.min(1, dt * ease);
        state.x += state.vel * dt;
      }
      if (w > 0) state.x = ((state.x % w) + w) % w;

      el.style.transform = `translate3d(${-state.x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [entries, copies]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const state = st.current;
    state.drag = { id: e.pointerId, lastX: e.clientX, lastT: performance.now(), captured: false };
    state.moved = false;
    state.vel = 0;
  };

  const onPointerMove = (e) => {
    const state = st.current;
    const d = state.drag;
    if (!d || d.id !== e.pointerId) return;

    const now = performance.now();
    const dx = e.clientX - d.lastX;
    if (!d.captured && Math.abs(dx) < 4) return;

    if (!d.captured) {
      // From here on it is a drag, not a tap on a card
      d.captured = true;
      state.moved = true;
      viewport.current.setPointerCapture(e.pointerId);
      viewport.current.classList.add('is-dragging');
    }
    const dt = Math.max(now - d.lastT, 1) / 1000;
    state.x -= dx;
    state.vel = state.vel * 0.6 + (-dx / dt) * 0.4; // smoothed finger velocity
    d.lastX = e.clientX;
    d.lastT = now;
  };

  const endDrag = (e) => {
    const state = st.current;
    if (!state.drag || state.drag.id !== e.pointerId) return;
    if (state.drag.captured) {
      // A stale velocity (finger stopped before lifting) shouldn't fling
      if (performance.now() - state.drag.lastT > 90) state.vel = 0;
      state.vel = Math.max(-2500, Math.min(2500, state.vel));
      viewport.current.classList.remove('is-dragging');
    }
    state.drag = null;
    state.rest = performance.now() + REST_AFTER_TOUCH;
  };

  const onWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // leave vertical page scroll alone
    st.current.x += e.deltaX;
    st.current.vel = 0;
    st.current.rest = performance.now() + REST_AFTER_TOUCH;
  };

  const swallowClickAfterDrag = (e) => {
    if (st.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      st.current.moved = false;
    }
  };

  const nudge = (dir) => {
    st.current.vel = dir * 1500;
    st.current.rest = performance.now() + REST_AFTER_TOUCH;
  };

  return (
    <div className="dish-rail-wrap">
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        className="rail-arrow is-prev hidden md:grid"
      >
        ‹
      </button>

      <div
        ref={viewport}
        className="dish-rail"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') st.current.hover = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') st.current.hover = false;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onClickCapture={swallowClickAfterDrag}
      >
        <div ref={track} className="dish-track">
          {Array.from({ length: copies }, (_, c) => (
            <div
              key={c}
              className="dish-rail-copy"
              aria-hidden={c > 0 ? true : undefined}
            >
              {entries.map((entry) =>
                renderCard(entry, `${c}-${entry.item.id}`, c > 0)
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => nudge(1)}
        className="rail-arrow is-next hidden md:grid"
      >
        ›
      </button>
    </div>
  );
}

/* ──────────────────────────────
   Dish card — circular photo
────────────────────────────── */
// `copy` = a repeated card in the seamless loop: fully clickable, but skipped by keyboard focus
function DishCard({ item, label, copy, quantity, onAdd, onRemove }) {
  const { t, localized } = useLang();
  const name = localized(item, 'name');
  const description = localized(item, 'description');

  return (
    <article className={`dish-card ${quantity > 0 ? 'is-active' : ''}`}>
      <div className="dish-photo-wrap">
        <div className="dish-photo">
          {item.image ? (
            <img src={item.image} alt={name} loading="lazy" draggable="false" />
          ) : (
            <span>🍴</span>
          )}
        </div>
        <span className="dish-price">${Number(item.price).toFixed(2)}</span>
      </div>

      <div className="dish-body">
        {label && <p className="dish-cat">{label}</p>}
        <h3 className="dish-title">{name}</h3>
        {description && <p className="dish-desc">{description}</p>}

        <div className="dish-cta">
          {quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAdd}
              tabIndex={copy ? -1 : undefined}
              className="dish-btn"
            >
              <span>{t('menu.orderNow')}</span>
              <span>→</span>
            </motion.button>
          ) : (
            <div className="dish-counter">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onRemove}
                tabIndex={copy ? -1 : undefined}
                className="dish-counter-btn"
              >
                −
              </motion.button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.4, color: 'var(--menu-amber-bright)' }}
                animate={{ scale: 1, color: 'var(--menu-text)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="dish-counter-val"
              >
                {quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onAdd}
                tabIndex={copy ? -1 : undefined}
                className="dish-counter-btn is-filled"
              >
                +
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
