import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  const link = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <header className="topbar">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-1">
        <Link to="/" className="flex items-center gap-2 mr-4">
          <span className="text-xl">🍽️</span>
          <span className="font-display font-semibold text-ink-900 tracking-tight">
            Savory
          </span>
        </Link>

        {user.role === 'admin' && (
          <nav className="hidden sm:flex items-center gap-0.5">
            <NavLink to="/admin"          className={link} end>Dashboard</NavLink>
            <NavLink to="/admin/menu"     className={link}>Menu</NavLink>
            <NavLink to="/admin/tables"   className={link}>Tables</NavLink>
            <NavLink to="/admin/reports"  className={link}>Reports</NavLink>
          </nav>
        )}
        {user.role === 'staff' && (
          <nav className="hidden sm:flex items-center gap-0.5">
            <NavLink to="/staff" className={link}>Live Orders</NavLink>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-terracotta-100 text-terracotta-700
                            grid place-items-center text-xs font-semibold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-ink-700">{user.name}</span>
          </div>
          <button
            onClick={() => { logout(); nav('/login'); }}
            className="text-xs text-ink-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}