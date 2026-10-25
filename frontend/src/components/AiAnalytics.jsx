import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import { useLang } from '../i18n/LanguageContext';

const QUICK_ACTIONS = [
  { type: 'daily_summary', icon: '📊', label: 'ai.quickDaily' },
  { type: 'top_sellers', icon: '🥩', label: 'ai.quickTop' },
  { type: 'inventory', icon: '⚠️', label: 'ai.quickInventory' },
];

export default function AiAnalytics() {
  const { t, lang } = useLang();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { title, answer, generatedAt, cached }
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0); // seconds left after a 429
  const timer = useRef(null);

  // Count down after a rate-limit so the buttons re-enable on their own
  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [cooldown]);

  const run = async ({ type, title, question: q }) => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/admin/ai-analytics', { type, question: q, lang });
      setResult({ title, ...data });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setCooldown(err.response.data?.retryAfter || 30);
        setError(t('ai.rateLimited'));
      } else if (status === 503) {
        setError(t('ai.notConfigured'));
      } else if (status === 401 || status === 403) {
        setError(t('manage.sessionExpired'));
      } else {
        setError(err.response?.data?.message || t('ai.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const ask = (e) => {
    e.preventDefault();
    const q = question.trim();
    if (q) run({ type: 'custom', question: q, title: q });
  };

  const busy = loading || cooldown > 0;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h2 className="section-title flex-1 min-w-[12rem]">{t('ai.title')}</h2>
        <button
          onClick={() => run({ type: 'health_audit', title: t('ai.audit') })}
          disabled={busy}
          className="btn-primary"
        >
          ✨ {t('ai.audit')}
        </button>
      </div>
      <p className="text-sm text-ink-500 mb-4">{t('ai.subtitle')}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.type}
            disabled={busy}
            onClick={() => run({ type: a.type, title: `${a.icon} ${t(a.label)}` })}
            className="btn-outline text-xs"
          >
            {a.icon} {t(a.label)}
          </button>
        ))}
      </div>

      <form onSubmit={ask} className="flex gap-3 mb-4">
        <input
          className="input flex-1"
          maxLength={500}
          placeholder={t('ai.placeholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
        />
        <button className="btn-sage whitespace-nowrap" disabled={busy || !question.trim()}>
          {t('ai.ask')}
        </button>
      </form>

      {cooldown > 0 && (
        <p className="text-xs text-amber-700 mb-3">
          {t('ai.cooldown', { n: cooldown })}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-cream-100 px-4 py-5 text-sm text-ink-500">
          <span
            className="inline-block w-5 h-5 rounded-full border-2 border-terracotta-500
                       border-t-transparent animate-spin"
            aria-hidden="true"
          />
          {t('ai.loading')}
        </div>
      )}

      {!loading && result && (
        <div className="rounded-xl border border-ink-900/8 bg-cream-50 p-5 animate-fade-up">
          <p className="text-xs uppercase tracking-wider text-terracotta-600 mb-3 break-words">
            {result.title}
          </p>
          <div className="ai-md">
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
          <p className="text-[11px] text-ink-400 mt-4">
            {new Date(result.generatedAt).toLocaleString()}
            {result.cached ? ` · ${t('ai.cached')}` : ''} · {t('ai.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
}
