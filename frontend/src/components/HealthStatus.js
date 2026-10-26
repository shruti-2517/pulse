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
    <div className="glass-panel" style={{ padding: '1.75rem', maxWidth: '780px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`ping-indicator ${isReady ? 'ping-up' : 'ping-down'}`}></span>
            Core System Readiness
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Real-time readiness telemetry from <code style={{ color: 'var(--text-secondary)' }}>/api/v1/health/ready</code>
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--status-down)',
          borderRadius: 'var(--radius-md)',
          color: '#fca5a5',
          fontSize: '0.875rem'
        }}>
          <strong>Connection Error:</strong> {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* PostgreSQL Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>PostgreSQL / TimescaleDB</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                background: dbHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: dbHealth?.status === 'healthy' ? 'var(--status-up)' : 'var(--status-down)',
                border: `1px solid ${dbHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {dbHealth?.status ? dbHealth.status.toUpperCase() : 'UNKNOWN'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              <span>Latency</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {dbHealth?.latency_ms !== undefined ? `${dbHealth.latency_ms} ms` : '—'}
              </span>
            </div>
            {dbHealth?.error && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f87171' }}>
                Error: {dbHealth.error}
              </p>
            )}
          </div>

          {/* Redis Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Redis Cache & Queues</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                background: redisHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: redisHealth?.status === 'healthy' ? 'var(--status-up)' : 'var(--status-down)',
                border: `1px solid ${redisHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {redisHealth?.status ? redisHealth.status.toUpperCase() : 'UNKNOWN'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              <span>Latency</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {redisHealth?.latency_ms !== undefined ? `${redisHealth.latency_ms} ms` : '—'}
              </span>
            </div>
            {redisHealth?.error && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f87171' }}>
                Error: {redisHealth.error}
              </p>
            )}
          </div>
        </div>
      )}

      {lastUpdated && (
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Auto-refreshing every 10s · Last checked at {lastUpdated}
        </div>
      )}
    </div>
  );
}
