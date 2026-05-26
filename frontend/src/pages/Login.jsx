import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, mustChangePassword } = res.data.data;
      login(token, mustChangePassword);
      if (mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Check that VITE_API_URL is set correctly in Vercel.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Card */}
      <div className="login-card">

        {/* UoG Logo */}
        <img
          src="/uog-logo.png"
          alt="University of Gondar"
          className="login-logo"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* University name */}
        <h1 className="login-title">University of Gondar</h1>
        <p className="login-subtitle">Smart Resource Management System</p>

        {/* Error */}
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            id="login-email"
            type="email"
            placeholder="University email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="login-btn"
          >
            {isLoading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider" />

        {/* Footer */}
        <p className="login-footer-title">
          Smart Resource Management System @2026
        </p>
        <p className="login-footer-sub">
          University of Gondar — Department of computer science 
        </p>
      </div>
    </div>
  );
}
