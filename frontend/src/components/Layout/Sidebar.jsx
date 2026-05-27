import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardList, Wrench, BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SidebarToggle from './SidebarToggle';
import './Sidebar.css';
import './SidebarToggle.css';

const Sidebar = ({ isMobile = false, mobileOpen = false, onCloseMobile = () => {} }) => {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/resources', label: 'Resources', icon: Database },
    { path: '/requests', label: 'Requests', icon: ClipboardList },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/ai-panel', label: 'AI Panel', icon: BrainCircuit },
  ];

  const sidebarClassName = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    isMobile ? 'sidebar--mobile' : '',
    isMobile && mobileOpen ? 'sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {isMobile && mobileOpen && <button type="button" className="sidebar-overlay" onClick={onCloseMobile} aria-label="Close navigation menu" />}
      <aside className={sidebarClassName}>
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="logo-icon flex items-center justify-center">
          <Database size={24} className="text-accent" />
        </div>
        {!collapsed && <h2 className="brand-name">CampusRes</h2>}

        {/* Toggle button — sits at the right end of the header */}
        <SidebarToggle collapsed={collapsed} onToggle={toggle} light />
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
            onClick={() => {
              if (isMobile) onCloseMobile();
            }}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role text-muted">{user?.role || 'STAFF'}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            logout();
            if (isMobile) onCloseMobile();
          }}
          className="logout-btn"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
