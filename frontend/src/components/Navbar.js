'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 2rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--brand-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: '#fff',
          fontSize: '1.1rem',
          boxShadow: 'var(--shadow-glow)'
        }}>
          P
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Pulse<span style={{ color: 'var(--brand-primary)' }}>.</span>
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem' }}>
        <Link href="/" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Dashboard
        </Link>
        <Link href="#monitors" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
          Monitors
        </Link>
        <Link href="#status-pages" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
          Status Pages
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="#login" style={{
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          transition: 'all 0.2s'
        }}>
          Sign In
        </Link>
        <Link href="#signup" style={{
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#fff',
          background: 'var(--brand-primary)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 2px 10px var(--brand-glow)',
          transition: 'all 0.2s'
        }}>
          Get Started
        </Link>
      </div>
    </header>
  );
}
