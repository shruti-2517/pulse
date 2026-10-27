'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HealthStatus() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/health/ready`, { cache: 'no-store' });
      const data = await res.json();
      setHealthData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(`Unable to connect to Pulse API at ${API_BASE}. Make sure the backend service is running.`);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/health/ready`, { cache: 'no-store' });
        const data = await res.json();
        if (isMounted) {
          setHealthData(data);
          setLastUpdated(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Unable to connect to Pulse API at ${API_BASE}. Make sure the backend service is running.`);
          setHealthData(null);
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isReady = healthData?.status === 'ready';
  const dbHealth = healthData?.components?.database;
  const redisHealth = healthData?.components?.redis;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 'var(--space-5)',
      boxShadow: 'var(--shadow-sm)',
      margin: 'var(--space-6) 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className={`status-dot ${isReady ? 'status-dot-up' : 'status-dot-down'}`}></span>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>System readiness telemetry</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
            Polling <code className="font-mono">/api/v1/health/ready</code> every 10 seconds
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--status-down-subtle)',
          border: '1px solid var(--status-down)',
          borderRadius: 'var(--radius)',
          color: 'var(--status-down)',
          fontSize: 'var(--text-sm)',
        }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
          {/* PostgreSQL / TimescaleDB */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>PostgreSQL</span>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: dbHealth?.status === 'healthy' ? 'var(--status-up)' : 'var(--status-down)',
              }}>
                {dbHealth?.status ? dbHealth.status.toUpperCase() : 'CHECKING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <span>Latency</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {dbHealth?.latency_ms !== undefined ? `${dbHealth.latency_ms} ms` : '—'}
              </span>
            </div>
            {dbHealth?.error && (
              <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--status-down)' }}>
                {dbHealth.error}
              </p>
            )}
          </div>

          {/* Redis */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Redis</span>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: redisHealth?.status === 'healthy' ? 'var(--status-up)' : 'var(--status-down)',
              }}>
                {redisHealth?.status ? redisHealth.status.toUpperCase() : 'CHECKING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <span>Latency</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {redisHealth?.latency_ms !== undefined ? `${redisHealth.latency_ms} ms` : '—'}
              </span>
            </div>
            {redisHealth?.error && (
              <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--status-down)' }}>
                {redisHealth.error}
              </p>
            )}
          </div>
        </div>
      )}

      {lastUpdated && (
        <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
          Last checked at {lastUpdated}
        </div>
      )}
    </div>
  );
}
