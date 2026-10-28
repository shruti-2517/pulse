'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MonitorList({ onNewMonitorClick }) {
  const { token } = useAuth();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonitors = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/v1/monitors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active && res.ok) {
          const data = await res.json();
          setMonitors(data);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [token]);

  const handleTogglePause = async (monitor) => {
    const action = monitor.is_active ? 'pause' : 'resume';
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitors/${monitor.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMonitors();
      }
    } catch {
      // Ignored
    }
  };

  const handleDelete = async (monitorId) => {
    if (!window.confirm('Are you sure you want to delete this monitor?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitors/${monitorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMonitors();
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 'var(--space-6)',
    }}>
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Registered monitors</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
            Endpoints scheduled for periodic health checks
          </p>
        </div>

        <button
          onClick={onNewMonitorClick}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
        >
          Add monitor
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Loading monitors...
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-4)', color: 'var(--status-down)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      ) : monitors.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            No monitors configured yet.
          </p>
          <button
            onClick={onNewMonitorClick}
            className="btn-secondary"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            Create your first monitor
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>STATUS</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>NAME</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>TARGET</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>INTERVAL</th>
                <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 500, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className={`status-dot ${m.is_active ? 'status-dot-up' : 'status-dot-down'}`}></span>
                      <span style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize', color: m.is_active ? 'var(--status-up)' : 'var(--text-muted)' }}>
                        {m.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                    {m.name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>
                    <span className="font-mono" style={{ fontSize: 'var(--text-xs)' }}>
                      {m.type === 'http' ? m.url : `${m.hostname}:${m.port}`}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    {m.interval_seconds}s
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                      <button
                        onClick={() => handleTogglePause(m)}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 'var(--text-xs)' }}
                      >
                        {m.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 'var(--text-xs)', color: 'var(--status-down)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
