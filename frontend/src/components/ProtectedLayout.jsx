import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

// ── Session-expiry warning modal ────────────────────────────────────────────
const COUNTDOWN_SECS = 60; // matches the 1-min gap between warn & logout

function SessionWarningModal({ onKeepAlive, onLogout }) {
  const [secs, setSecs] = useState(COUNTDOWN_SECS);

  useEffect(() => {
    if (secs <= 0) { onLogout(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onLogout]);

  const pct = (secs / COUNTDOWN_SECS) * 100;
  const urgent = secs <= 20;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(26,63,111,0.22)',
        borderTop: `4px solid ${urgent ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
        animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: urgent ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)',
          border: `1.5px solid ${urgent ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <ShieldAlert size={24} style={{ color: urgent ? 'var(--accent-rose)' : 'var(--accent-amber)' }} />
        </div>

        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Session Expiring Soon
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          You've been inactive for a while. For your security, you'll be logged out automatically
          in <strong style={{ color: urgent ? 'var(--accent-rose)' : 'var(--text-main)' }}>{secs} second{secs !== 1 ? 's' : ''}</strong>.
        </p>

        {/* Countdown bar */}
        <div style={{
          height: 5, borderRadius: 99,
          background: 'var(--border-glass)',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            background: urgent
              ? 'linear-gradient(90deg, var(--accent-rose), #f87171)'
              : 'linear-gradient(90deg, var(--accent-amber), #fbbf24)',
            transition: 'width 1s linear, background 0.5s ease',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onLogout}
            style={{
              flex: 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 1rem',
              borderRadius: 8,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)',
              color: 'var(--accent-rose)',
              fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={15} /> Logout Now
          </button>
          <button
            onClick={onKeepAlive}
            style={{
              flex: 2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 1rem',
              borderRadius: 8,
              background: 'var(--accent-blue)',
              border: 'none',
              color: '#fff',
              fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(26,86,219,0.28)',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={15} /> Stay Logged In
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Protected layout ─────────────────────────────────────────────────────────
const ProtectedLayout = () => {
  const { isAuthenticated, loading, mustChangePassword, sessionWarning, keepAlive, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <div className="pulse" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: 16, marginBottom: '2rem', boxShadow: 'var(--glow-blue)' }}></div>
        <h2 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initializing Intelligence...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change if required (but allow access to the change-password page itself)
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <Layout>
      <Outlet />
      {sessionWarning && (
        <SessionWarningModal
          onKeepAlive={keepAlive}
          onLogout={logout}
        />
      )}
    </Layout>
  );
};

export default ProtectedLayout;
