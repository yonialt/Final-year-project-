import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import './Layout.css';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <main className="main-content">
        {isMobile && (
          <div className="mobile-topbar">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="mobile-topbar-title">CampusRes</h1>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
