'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CreateMonitorModal({ isOpen, onClose, onCreated }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('http');
  const [url, setUrl] = useState('https://');
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState(443);
  const [interval, setInterval] = useState(60);
  const [timeout, setTimeout] = useState(10);
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name,
        type,
        interval_seconds: Number(interval),
        timeout_seconds: Number(timeout),
        regions: ['us-east', 'eu-central'],
      };

      if (type === 'http') {
        payload.url = url;
        payload.method = 'GET';
        payload.expected_status_code = Number(expectedStatusCode);
      } else if (type === 'tcp') {
        payload.hostname = hostname;
        payload.port = Number(port);
      }

      const res = await fetch(`${API_BASE}/api/v1/monitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to create monitor');
      }

      const created = await res.json();
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      zIndex: 100,
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '520px',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Create new monitor</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--status-down-subtle)',
            border: '1px solid var(--status-down)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--status-down)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="mName">Monitor name</label>
            <input
              id="mName"
              type="text"
              required
              className="form-input"
              placeholder="API Gateway or Main Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mType">Type</label>
            <select
              id="mType"
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={submitting}
            >
              <option value="http">HTTP(S) Endpoint</option>
              <option value="tcp">TCP Port</option>
            </select>
          </div>

          {type === 'http' ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="mUrl">Target URL</label>
                <input
                  id="mUrl"
                  type="url"
                  required
                  className="form-input"
                  placeholder="https://api.example.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mCode">Expected HTTP status</label>
                <input
                  id="mCode"
                  type="number"
                  className="form-input"
                  value={expectedStatusCode}
                  onChange={(e) => setExpectedStatusCode(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="mHost">Hostname or IP</label>
                <input
                  id="mHost"
                  type="text"
                  required
                  className="form-input"
                  placeholder="db.example.com"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mPort">Port</label>
                <input
                  id="mPort"
                  type="number"
                  required
                  min={1}
                  max={65535}
                  className="form-input"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="mInterval">Interval (seconds)</label>
              <input
                id="mInterval"
                type="number"
                min={30}
                max={86400}
                className="form-input"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="mTimeout">Timeout (seconds)</label>
              <input
                id="mTimeout"
                type="number"
                min={1}
                max={60}
                className="form-input"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Creating...' : 'Create monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
