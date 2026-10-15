import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const u = await login(email, password);
      nav(u.role === 'admin' ? '/admin' : '/staff');
    } catch (e) {
      setErr(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center w-16 h-16 rounded-2xl
                          bg-terracotta-500 shadow-lift text-3xl mb-4">
            🍽️
          </div>
          <h1 className="text-3xl mb-1">Welcome back</h1>
          <p className="text-sm text-ink-500">Sign in to manage your restaurant</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {err && (
            <div className="rounded-lg bg-red-50 border border-red-200
                            text-red-700 text-sm px-3 py-2 animate-fade-up">
              {err}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              className="input" type="email" required
              placeholder="you@restaurant.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input" type="password" required
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-400 mt-6">
          Savory POS · v1.0
        </p>
      </div>
    </div>
  );
}