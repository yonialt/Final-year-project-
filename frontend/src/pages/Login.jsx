import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Cpu, Lock, Mail, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await API.post('/auth/login', {
        email,
        password,
      });
      
      login(res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-deep)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>

      <div className="animate-in" style={{ width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div className="glass-card" style={{ padding: '3rem 2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex-col items-center mb-xl">
            <div style={{ 
              width: 56, 
              height: 56, 
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--glow-blue)',
              marginBottom: '1.5rem'
            }}>
              <Cpu size={32} color="white" />
            </div>
            <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>SmartRes</h1>
            <p className="text-dim" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.5rem' }}>AI Infrastructure Portal</p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(251, 113, 133, 0.1)', 
              border: '1px solid rgba(251, 113, 133, 0.2)', 
              color: 'var(--accent-rose)', 
              padding: '0.75rem', 
              borderRadius: 12, 
              fontSize: '0.85rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Shield size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-lg">
            <div className="flex-col gap-xs">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Command Credentials</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  className="input-glass"
                  style={{ paddingLeft: 44 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                />
              </div>
            </div>

            <div className="flex-col gap-xs">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Security Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  className="input-glass"
                  style={{ paddingLeft: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-premium w-full" style={{ padding: '1rem', marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-sm">
                  <Zap size={18} className="pulse" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>Access Terminal</span>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p className="text-dim" style={{ fontSize: '0.75rem' }}>
              Secured by University Neural Network &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
