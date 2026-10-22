import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import { useLang } from '../../i18n/LanguageContext';

const EMPTY_ITEM = {
  name: '',
  nameAm: '',
  price: '',
  description: '',
  descriptionAm: '',
  categoryId: '',
  image: '',
};

export default function MenuManage() {
  const { t, localized } = useLang();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [catForm, setCatForm] = useState({ name: '', nameAm: '', parentId: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [catError, setCatError] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    const [i, c] = await Promise.all([
      api.get('/menu/items'),
      api.get('/menu/categories'),
    ]);
    setItems(i.data);
    setCats(c.data);
  };
  useEffect(() => {
    load();
  }, []);

  // Main categories, each with its sub-categories (flat list from the API -> tree)
  const tree = useMemo(() => {
    const mains = cats.filter((c) => !c.parentId);
    return mains.map((m) => ({
      ...m,
      subs: cats.filter((c) => c.parentId === m.id),
    }));
  }, [cats]);

  const catPath = (cat) => {
    if (!cat) return t('manage.noCategory');
    const parent = cat.parentId && cats.find((c) => c.id === cat.parentId);
    return parent
      ? `${localized(parent, 'name')} › ${localized(cat, 'name')}`
      : localized(cat, 'name');
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      setError(err.response?.data?.message || t('manage.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.categoryId) return setError(t('manage.chooseCategory'));
    setError('');
    try {
      await api.post('/menu/items', { ...form, price: Number(form.price) });
      setForm(EMPTY_ITEM);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatError('');
    try {
      await api.post('/menu/categories', {
        name: catForm.name,
        nameAm: catForm.nameAm,
        parentId: catForm.parentId || null,
      });
      // keep the chosen parent so several sub-categories can be added in a row
      setCatForm((f) => ({ name: '', nameAm: '', parentId: f.parentId }));
      load();
    } catch (err) {
      const status = err.response?.status;
      setCatError(
        status === 401 || status === 403
          ? t('manage.sessionExpired')
          : err.response?.data?.message || err.message
      );
    }
  };

  const delItem = async (id) => {
    if (!confirm(t('manage.confirmDeleteItem'))) return;
    await api.delete(`/menu/items/${id}`);
    load();
  };

  const delCat = async (cat) => {
    const subCount = cats.filter((c) => c.parentId === cat.id).length;
    const msg = cat.parentId
      ? t('manage.confirmDeleteSub')
      : t('manage.confirmDeleteMain', { n: subCount });
    if (!confirm(msg)) return;
    await api.delete(`/menu/categories/${cat.id}`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-terracotta-600 uppercase mb-1">
          {t('manage.eyebrow')}
        </p>
        <h1 className="text-3xl">{t('manage.title')}</h1>
      </div>

      {/* Categories */}
      <div className="card p-5">
        <h2 className="section-title mb-4">
          {t('manage.categories', { n: cats.length })}
        </h2>
        <form onSubmit={addCategory} className="grid sm:grid-cols-12 gap-3 mb-5">
          <input
            className="input sm:col-span-4"
            placeholder={t('manage.newCategory')}
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
          />
          <input
            className="input sm:col-span-3"
            placeholder={t('manage.newCategoryAm')}
            value={catForm.nameAm}
            onChange={(e) => setCatForm({ ...catForm, nameAm: e.target.value })}
          />
          <select
            className="input sm:col-span-3"
            aria-label={t('manage.subOf')}
            value={catForm.parentId}
            onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })}
          >
            <option value="">{t('manage.mainCategory')}</option>
            {tree.map((m) => (
              <option key={m.id} value={m.id}>
                {t('manage.subOf')} {localized(m, 'name')}
              </option>
            ))}
          </select>
          <button className="btn-primary whitespace-nowrap sm:col-span-2">
            {catForm.parentId ? t('manage.addSub') : t('manage.addCategory')}
          </button>
        </form>

        {catError && (
          <div className="mb-4 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
            {catError}
          </div>
        )}

        <div className="space-y-3">
          {tree.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2">
              <CatChip label={localized(m, 'name')} onDelete={() => delCat(m)} main />
              {m.subs.length > 0 && <span className="text-ink-400 text-sm">›</span>}
              {m.subs.map((sc) => (
                <CatChip
                  key={sc.id}
                  label={localized(sc, 'name')}
                  onDelete={() => delCat(sc)}
                />
              ))}
            </div>
          ))}
          {!cats.length && (
            <p className="text-sm text-ink-400">{t('manage.noCategories')}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left: items list */}
        <div className="md:col-span-3">
          <h2 className="section-title mb-4">{t('manage.items', { n: items.length })}</h2>
          <div className="card divide-y divide-ink-900/6">
            {items.map((i) => (
              <div key={i.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0
                                bg-gradient-to-br from-cream-100 to-terracotta-50
                                grid place-items-center text-2xl">
                  {i.image ? (
                    <img
                      src={i.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🍴'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{localized(i, 'name')}</p>
                  <p className="text-xs text-ink-400">
                    {catPath(i.category)} · $
                    {Number(i.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => delItem(i.id)}
                  className="text-xs text-ink-400 hover:text-red-600 transition"
                >
                  {t('delete')}
                </button>
              </div>
            ))}
            {!items.length && (
              <p className="p-6 text-sm text-ink-400 text-center">
                {t('manage.noItems')}
              </p>
            )}
          </div>
        </div>

        {/* Right: add item form */}
        <div className="md:col-span-2">
          <h2 className="section-title mb-4">{t('manage.addNew')}</h2>
          <form onSubmit={addItem} className="card p-5 space-y-3">
            {error && (
              <div className="text-xs bg-red-50 border border-red-200 text-red-700
                              rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="label">{t('manage.photo')}</label>
              <label className="block cursor-pointer">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <div
                  className={`aspect-video rounded-xl border-2 border-dashed
                              grid place-items-center overflow-hidden
                              transition-colors
                    ${
                      form.image
                        ? 'border-terracotta-300'
                        : 'border-ink-900/15 hover:border-terracotta-500 bg-cream-50'
                    }`}
                >
                  {uploading ? (
                    <div className="text-center text-ink-400 animate-pulse-soft">
                      <div className="text-3xl mb-1">⬆️</div>
                      <p className="text-xs">{t('manage.uploading')}</p>
                    </div>
                  ) : form.image ? (
                    <img
                      src={form.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-ink-400">
                      <div className="text-3xl mb-1">📷</div>
                      <p className="text-xs">{t('manage.upload')}</p>
                    </div>
                  )}
                </div>
              </label>
              {form.image && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image: '' }))}
                  className="text-[11px] text-ink-400 hover:text-red-600 mt-1"
                >
                  {t('manage.removePhoto')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('manage.name')}</label>
                <input
                  required
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t('manage.nameAm')}</label>
                <input
                  className="input"
                  value={form.nameAm}
                  onChange={(e) => setForm({ ...form, nameAm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('manage.price')}</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">{t('manage.category')}</label>
                <select
                  required
                  className="input"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">{t('manage.select')}</option>
                  {tree.map((m) => (
                    <optgroup key={m.id} label={localized(m, 'name')}>
                      <option value={m.id}>{localized(m, 'name')}</option>
                      {m.subs.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {localized(m, 'name')} › {localized(sc, 'name')}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t('manage.description')}</label>
              <textarea
                rows={2}
                className="input resize-none"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">{t('manage.descriptionAm')}</label>
              <textarea
                rows={2}
                className="input resize-none"
                value={form.descriptionAm}
                onChange={(e) =>
                  setForm({ ...form, descriptionAm: e.target.value })
                }
              />
            </div>

            <button className="btn-primary w-full" disabled={uploading}>
              {t('manage.addItem')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
function CatChip({ label, onDelete, main = false }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-ink-900/5 text-sm
        ${main ? 'px-3 py-1.5 bg-terracotta-50 font-medium' : 'px-2.5 py-1 bg-cream-100 text-xs'}`}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onDelete}
        className="text-ink-400 hover:text-red-600 text-xs"
      >
        ✕
      </button>
    </div>
  );
}
