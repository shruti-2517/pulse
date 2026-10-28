'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HealthStatus from '@/components/HealthStatus';
import AuthModal from '@/components/AuthModal';
import MonitorList from '@/components/MonitorList';
import CreateMonitorModal from '@/components/CreateMonitorModal';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [monitorListKey, setMonitorListKey] = useState(0);

  const { user } = useAuth();

  const openAuth = (mode) => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal({ isOpen: false, mode: 'login' });

  const handleMonitorCreated = () => {
    // Refresh monitor list
    setMonitorListKey((k) => k + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenAuth={openAuth} />

      <main style={{
        flex: 1,
        maxWidth: '1150px',
        margin: '0 auto',
        width: '100%',
        padding: 'var(--space-8) var(--space-6)',
      }}>
        {/* Header Block: Left-aligned, utilitarian */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: '-0.5px' }}>
                System overview
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginTop: 'var(--space-1)' }}>
                Pulse distributed uptime monitoring platform and health probes.
              </p>
            </div>

            {user ? (
              <div style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: 'var(--text-sm)',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Signed in as: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
              </div>
            ) : (
              <button
                onClick={() => openAuth('signup')}
                className="btn-primary"
              >
                Create operator account
              </button>
            )}
          </div>
        </div>

        {/* Live System Health */}
        <HealthStatus />

        {/* User Monitor Management or Auth Gate */}
        {user ? (
          <section id="monitors">
            <MonitorList
              key={monitorListKey}
              onNewMonitorClick={() => setIsCreateModalOpen(true)}
            />
          </section>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Authentication required for monitor configuration</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                Sign in or register an account to access monitor CRUD, probe scheduling, and alert dispatch.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={() => openAuth('login')} className="btn-secondary">
                Sign in
              </button>
              <button onClick={() => openAuth('signup')} className="btn-primary">
                Sign up
              </button>
            </div>
          </div>
        )}

        {/* Milestones and Technical Architecture Table */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Implementation milestones</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>#</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>COMPONENT</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>CONTRACT</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)' }}>01</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>System Skeleton & Probes</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>Liveness / readiness probes & Docker Compose</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: 'var(--status-up)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>COMPLETE</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)' }}>02</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Authentication & Cryptography</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>Bcrypt hashing & JWT signature verification</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: 'var(--status-up)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>COMPLETE</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)' }}>03</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Monitor Management (CRUD)</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>HTTP/TCP endpoints, intervals, regions</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-xs)' }}>LIVE</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)' }}>04</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>Single-Worker Check Execution</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>Async probe execution & result storage</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>NEXT UP</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <footer style={{
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-surface)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Pulse Uptime Platform · Engineering Pair-Programming
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={closeAuth}
      />
      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleMonitorCreated}
      />
    </div>
  );
}
