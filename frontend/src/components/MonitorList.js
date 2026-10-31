'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MonitorList({ onNewMonitorClick }) {
  const { token } = useAuth();
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active monitor for viewing check history
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [historyResults, setHistoryResults] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

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
        if (selectedMonitor?.id === monitorId) {
          setSelectedMonitor(null);
        }
        fetchMonitors();
      }
    } catch {
      // Ignored
    }
  };

  const handleRunCheck = async (monitor) => {
    setCheckingId(monitor.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitors/${monitor.id}/check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMonitors();
        if (selectedMonitor?.id === monitor.id) {
          loadHistory(monitor.id);
        }
      }
    } catch {
      // Ignored
    } finally {
      setCheckingId(null);
    }
  };

  const loadHistory = async (monitorId) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/monitors/${monitorId}/results?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryResults(data);
      }
    } catch {
      // Ignored
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectMonitor = (monitor) => {
    if (selectedMonitor?.id === monitor.id) {
      setSelectedMonitor(null);
    } else {
      setSelectedMonitor(monitor);
      loadHistory(monitor.id);
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
              {monitors.map((m) => {
                const isSelected = selectedMonitor?.id === m.id;
                const isChecking = checkingId === m.id;
                const isUp = m.status === 'up' || m.status === 'active';

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--bg-subtle)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className={`status-dot ${isUp ? 'status-dot-up' : 'status-dot-down'}`}></span>
                        <span style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize', color: isUp ? 'var(--status-up)' : 'var(--status-down)' }}>
                          {m.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                      <button
                        onClick={() => handleSelectMonitor(m)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                        }}
                      >
                        {m.name}
                      </button>
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
                          onClick={() => handleRunCheck(m)}
                          disabled={isChecking}
                          className="btn-secondary"
                          style={{ padding: '3px 8px', fontSize: 'var(--text-xs)' }}
                        >
                          {isChecking ? 'Probing...' : 'Check now'}
                        </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Check Results Telemetry Drawer */}
      {selectedMonitor && (
        <div style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                Recent probe results: <span style={{ color: 'var(--accent)' }}>{selectedMonitor.name}</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                Time-series execution history recorded from regional probe workers
              </p>
            </div>
            <button
              onClick={() => handleSelectMonitor(selectedMonitor)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
            >
              Hide history
            </button>
          </div>

          {historyLoading ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-3) 0' }}>
              Fetching probe telemetry...
            </div>
          ) : historyResults.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-3) 0' }}>
              No probe executions recorded yet. Click <strong>&quot;Check now&quot;</strong> above to trigger an immediate check!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 'var(--space-2)' }}>TIMESTAMP</th>
                    <th style={{ padding: 'var(--space-2)' }}>STATUS</th>
                    <th style={{ padding: 'var(--space-2)' }}>LATENCY</th>
                    <th style={{ padding: 'var(--space-2)' }}>CODE</th>
                    <th style={{ padding: 'var(--space-2)' }}>REGION</th>
                    <th style={{ padding: 'var(--space-2)' }}>DETAILS / ERROR</th>
                  </tr>
                </thead>
                <tbody>
                  {historyResults.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <span style={{
                          fontWeight: 600,
                          color: r.status === 'up' ? 'var(--status-up)' : 'var(--status-down)',
                        }}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <span className="font-mono">{r.response_time_ms} ms</span>
                      </td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                        {r.status_code || '—'}
                      </td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>
                        {r.region}
                      </td>
                      <td style={{ padding: 'var(--space-2)', color: r.error_message ? 'var(--status-down)' : 'var(--text-muted)' }}>
                        {r.error_message || 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
