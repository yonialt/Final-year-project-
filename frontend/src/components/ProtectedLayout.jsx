import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

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

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;
