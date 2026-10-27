'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar({ onOpenAuth }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-3) var(--space-6)',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontWeight: 600,
          letterSpacing: '-0.3px',
          color: 'var(--text-primary)',
        }}>
          <span style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
          }}></span>
          Pulse
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          <Link href="/" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Overview
          </Link>
          <Link href="#monitors" style={{ color: 'var(--text-secondary)' }}>
            Monitors
          </Link>
          <Link href="#status-pages" style={{ color: 'var(--text-secondary)' }}>
            Status pages
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Light/Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle visual theme"
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {user.email}
            </span>
            <button
              onClick={logout}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
            >
              Sign in
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth('signup')}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
            >
              Create account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
