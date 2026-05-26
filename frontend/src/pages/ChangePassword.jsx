import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const { mustChangePassword, clearMustChangePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('New password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('New password must contain at least one number.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully! Redirecting...');
      clearMustChangePassword();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* UoG Logo */}
        <img
          src="/uog-logo.png"
          alt="University of Gondar"
          className="login-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <h1 className="login-title">Change Password</h1>

        {mustChangePassword ? (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: '#b45309',
            lineHeight: 1.5,
          }}>
            ⚠️ Your account was created by an administrator. You must change your default password before continuing.
          </div>
        ) : (
          <p className="login-subtitle">Update your account password</p>
        )}

        {/* Error */}
        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: '#059669',
            textAlign: 'center',
          }}>
            ✅ {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            id="change-current-password"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            className="login-input"
          />
          <input
            id="change-new-password"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            className="login-input"
          />
          <input
            id="change-confirm-password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="login-input"
          />

          {/* Password requirements hint */}
          <div style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            marginBottom: '0.5rem',
          }}>
            Password must be at least 8 characters with one uppercase letter and one number.
          </div>

          <button
            id="change-password-submit"
            type="submit"
            disabled={isLoading}
            className="login-btn"
          >
            {isLoading ? 'Changing password…' : 'Change Password'}
          </button>
        </form>

        {!mustChangePassword && (
          <>
            <div className="login-divider" />
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a56db',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              ← Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
