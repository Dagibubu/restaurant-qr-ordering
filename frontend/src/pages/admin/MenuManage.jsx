import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

export default function MenuManage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    image: '',
  });
  const [catForm, setCatForm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
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
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.categoryId) return setError('Please choose a category');
    await api.post('/menu/items', { ...form, price: Number(form.price) });
    setForm({ name: '', price: '', description: '', categoryId: '', image: '' });
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!catForm.trim()) return;
    await api.post('/menu/categories', { name: catForm });
    setCatForm('');
    load();
  };

  const delItem = async (id) => {
    if (!confirm('Delete item?')) return;
    await api.delete(`/menu/items/${id}`);
    load();
  };

  const delCat = async (id) => {
    if (!confirm('Delete category? Items will be orphaned.')) return;
    await api.delete(`/menu/categories/${id}`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-terracotta-600 uppercase mb-1">
          Menu
        </p>
        <h1 className="text-3xl">Manage Menu</h1>
      </div>

      {/* Categories */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Categories ({cats.length})</h2>
        <form onSubmit={addCategory} className="flex gap-3 mb-4">
          <input
            className="input flex-1"
            placeholder="New category name (e.g. Starters, Drinks)"
            value={catForm}
            onChange={(e) => setCatForm(e.target.value)}
          />
          <button className="btn-primary whitespace-nowrap">Add Category</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full
                         bg-cream-100 border border-ink-900/5 text-sm"
            >
              <span>{c.name}</span>
              <button
                onClick={() => delCat(c.id)}
                className="text-ink-400 hover:text-red-600 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {!cats.length && (
            <p className="text-sm text-ink-400">No categories yet.</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left: items list */}
        <div className="md:col-span-3">
          <h2 className="section-title mb-4">Menu Items ({items.length})</h2>
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
                  <p className="font-medium truncate">{i.name}</p>
                  <p className="text-xs text-ink-400">
                    {i.category?.name || 'No category'} · $
                    {Number(i.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => delItem(i.id)}
                  className="text-xs text-ink-400 hover:text-red-600 transition"
                >
                  Delete
                </button>
              </div>
            ))}
            {!items.length && (
              <p className="p-6 text-sm text-ink-400 text-center">
                No items yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: add item form */}
        <div className="md:col-span-2">
          <h2 className="section-title mb-4">Add New Item</h2>
          <form onSubmit={addItem} className="card p-5 space-y-3">
            {error && (
              <div className="text-xs bg-red-50 border border-red-200 text-red-700
                              rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="label">Photo</label>
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
                      <p className="text-xs">Uploading…</p>
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
                      <p className="text-xs">Click to upload</p>
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
                  Remove photo
                </button>
              )}
            </div>

            <div>
              <label className="label">Name</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Price</label>
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
                <label className="label">Category</label>
                <select
                  required
                  className="input"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                rows={3}
                className="input resize-none"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <button className="btn-primary w-full" disabled={uploading}>
              Add Item
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}