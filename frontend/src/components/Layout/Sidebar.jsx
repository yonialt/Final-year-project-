import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardList, Wrench, BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/resources', label: 'Resources', icon: Database },
    { path: '/requests', label: 'Requests', icon: ClipboardList },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/ai-panel', label: 'AI Panel', icon: BrainCircuit },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon flex items-center justify-center">
          <Database size={24} className="text-accent" />
        </div>
        <h2 className="brand-name">CampusRes</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role text-muted">{user?.role || 'STAFF'}</span>
          </div>
        </div>
        <button onClick={logout} className="logout-btn" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
