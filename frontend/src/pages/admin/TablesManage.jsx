import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import api from '../../api/axios';

export default function TablesManage() {
  const [tables, setTables] = useState([]);
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/tables')
      .then((r) => setTables(r.data))
      .catch(() => setError('Failed to load tables'));
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!number.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/tables', { number });
      setNumber('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete table?')) return;
    await api.delete(`/tables/${id}`);
    load();
  };

  const printAll = () => {
    if (!tables.length) return;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    const cols = 2,
      rows = 3;
    const cardW = 80,
      cardH = 90;
    const gapX = (210 - cols * cardW) / (cols + 1);
    const gapY = (297 - rows * cardH) / (rows + 1);

    tables.forEach((t, i) => {
      const idxOnPage = i % (cols * rows);
      if (i > 0 && idxOnPage === 0) pdf.addPage();

      const col = idxOnPage % cols;
      const row = Math.floor(idxOnPage / cols);
      const x = gapX + col * (cardW + gapX);
      const y = gapY + row * (cardH + gapY);

      pdf.setDrawColor(230, 228, 220);
      pdf.setFillColor(253, 251, 247);
      pdf.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(31, 26, 20);
      pdf.text('SCAN TO ORDER', x + cardW / 2, y + 10, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(18);
      pdf.setTextColor(201, 107, 63);
      pdf.text(`Table ${t.number}`, x + cardW / 2, y + 19, {
        align: 'center',
      });

      if (t.qrCode) {
        const qrSize = 52;
        pdf.addImage(
          t.qrCode,
          'PNG',
          x + (cardW - qrSize) / 2,
          y + 25,
          qrSize,
          qrSize
        );
      }

      pdf.setFontSize(9);
      pdf.setTextColor(107, 97, 85);
      pdf.text('Point your camera at the QR', x + cardW / 2, y + cardH - 8, {
        align: 'center',
      });
    });

    pdf.save('restaurant-qr-codes.pdf');
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-terracotta-600 uppercase mb-1">
            Tables
          </p>
          <h1 className="text-3xl">QR Codes</h1>
        </div>
        {tables.length > 0 && (
          <button onClick={printAll} className="btn-outline">
            🖨️ Print All ({tables.length})
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200
                        text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={add} className="card p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">New table number</label>
          <input
            required
            className="input"
            placeholder="e.g. 7 or A3"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <button disabled={loading} className="btn-primary">
          {loading ? 'Adding…' : 'Add Table'}
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="card p-4 text-center group animate-fade-up">
            <p className="font-display text-lg mb-2">Table {t.number}</p>
            {t.qrCode && (
              <div className="bg-white rounded-lg p-2 mb-3">
                <img
                  src={t.qrCode}
                  alt={`QR for table ${t.number}`}
                  className="w-full aspect-square"
                />
              </div>
            )}
            <div className="flex justify-center gap-3 text-xs opacity-0
                            group-hover:opacity-100 transition-opacity">
              <a
                href={t.qrCode}
                download={`table-${t.number}.png`}
                className="text-ink-500 hover:text-terracotta-600"
              >
                Download
              </a>
              <button
                onClick={() => del(t.id)}
                className="text-ink-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!tables.length && (
          <div className="col-span-full card p-16 text-center text-ink-400">
            <div className="text-5xl mb-3">🪑</div>
            <p>No tables yet — add your first one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}