import Navbar from '@/components/Navbar';
import HealthStatus from '@/components/HealthStatus';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.8rem',
            color: '#a5b4fc',
            marginBottom: '1.25rem'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#818cf8',
              display: 'inline-block'
            }}></span>
            Pulse Uptime Platform · Feature 1 Complete
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-1px',
            marginBottom: '1rem',
            lineHeight: 1.15
          }}>
            High-Performance Distributed <br />
            <span style={{
              background: 'var(--brand-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Uptime Monitoring
            </span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Multi-region probes, sub-second failure detection, quorum alerting, and instant cache-backed public status pages.
          </p>
        </div>

        {/* Real-time Health Telemetry */}
        <HealthStatus />

        {/* Feature Preview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Multi-Region Probes
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Distributed workers ping endpoints from worldwide edge locations to eliminate false alarms via regional quorum.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Redis Streams & Queuing
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              High-throughput job dispatching, consumer groups, visibility timeouts, and dead-letter queues.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Cache-Backed Status Pages
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Sub-50ms public status pages backed by Redis cache-aside patterns that survive massive traffic spikes during outages.
            </p>
          </div>
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        Pulse Uptime Platform · Pair-Programming Mastery Project
      </footer>
    </div>
  );
}
