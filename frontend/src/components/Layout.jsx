import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, ClipboardList, AlertTriangle,
  Activity, BarChart2, Users, LogOut, Bell, Check, ChevronRight, KeyRound, UserPlus, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../lib/api';
import SidebarToggle from './Layout/SidebarToggle';

const NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
  { name: 'Asset Fleet', path: '/resources', icon: Database, roles: ['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER'] },
  { name: 'New Requests', path: '/requests', icon: ClipboardList, roles: ['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN'] },
  { name: 'Damage Reports', path: '/damage-reports', icon: AlertTriangle, roles: ['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN'] },
  { name: 'Maintenance', path: '/maintenance', icon: Activity, roles: ['RESOURCE_OFFICER', 'TECHNICIAN'] },
  { name: 'Analytics', path: '/analytics', icon: BarChart2, roles: ['RESOURCE_OFFICER', 'ACADEMIC_DEAN'] },
  { name: 'Users', path: '/users', icon: Users, roles: ['ADMIN', 'DEPARTMENT_HEAD'] },
  { name: 'Register User', path: '/users', icon: UserPlus, roles: ['ADMIN', 'DEPARTMENT_HEAD'] },
];

const ROLE_LABEL = {
  ADMIN: 'System Admin',
  RESOURCE_OFFICER: 'Resource Officer',
  ACADEMIC_DEAN: 'Academic Dean',
  DEPARTMENT_HEAD: 'Dept Head',
  TECHNICIAN: 'Technician',
  STAFF: 'Staff Member',
};

const NOTIF_ICON = { SUCCESS: '✅', WARNING: '⚠️', ACTION: '🔔', INFO: 'ℹ️' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const openMobile  = () => setIsMobileOpen(true);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  /* Lock body scroll while mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  /* Close drawer when viewport grows past mobile breakpoint */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => { if (e.matches) closeMobile(); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [closeMobile]);

  const visibleNav = NAV.filter(
    item => item.roles.includes('ALL') || item.roles.includes(user?.role)
  );

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch { }
  };

  const markAllRead = async () => {
    try { await API.patch('/notifications/read-all'); fetchNotifications(); } catch { }
  };

  const handleNotifClick = async (n) => {
    if (!n.read) { try { await API.patch(`/notifications/${n.id}/read`); } catch { } }
    setShowNotifs(false);
    if (n.link) navigate(n.link);
    fetchNotifications();
  };

  return (
    <div className="app-layout">

      {/* ── Mobile backdrop ── */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>

        {/* ── Header: logo + brand + toggle ── */}
        <div className="sidebar-brand-header">
          {/* Logo mark */}
          <div className="sidebar-logo">
            <img src="/uog-logo.png" alt="UoG" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
          </div>

          {/* Brand text — fades out when collapsed */}
          <div className="sidebar-text-fade" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.25, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SRMS Portal</div>
            <div style={{ fontSize: '0.62rem', opacity: 0.6, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 1 }}>Univ. of Gondar</div>
          </div>

          {/* Claude-style toggle button */}
          <SidebarToggle collapsed={isCollapsed} onToggle={toggleSidebar} />
        </div>

        <div className="sidebar-text-fade" style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.45, padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          Main Menu
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : ''}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={closeMobile}
            >
              <item.icon size={17} style={{ flexShrink: 0 }} />
              <span className="sidebar-text-fade" style={{ fontSize: '0.865rem' }}>{item.name}</span>
              <ChevronRight size={13} className="sidebar-text-fade" style={{ marginLeft: 'auto', opacity: 0.35 }} />
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.9rem', marginTop: 'auto' }}>
          <div className="user-box" style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.6rem 0.75rem', marginBottom: '0.6rem',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.25)',
            }}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="sidebar-text-fade user-details" style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 600, letterSpacing: '0.03em' }}>{ROLE_LABEL[user?.role] || '—'}</div>
            </div>
          </div>

          <button onClick={() => { navigate('/change-password'); closeMobile(); }} className="nav-link" title={isCollapsed ? "Change Password" : ""}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', marginBottom: '0.25rem' }}>
            <KeyRound size={16} style={{ flexShrink: 0 }} /><span className="sidebar-text-fade">Change Password</span>
          </button>

          <button onClick={() => { logout(); navigate('/login'); }} className="nav-link" title={isCollapsed ? "Sign Out" : ""}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)' }}>
            <LogOut size={16} style={{ flexShrink: 0 }} /><span className="sidebar-text-fade">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={`main-content${isCollapsed ? ' collapsed' : ''}`}>
        <div className="topbar">
          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={openMobile}
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
          >
            <Menu size={22} />
          </button>
          {/* Brand — matches sidebar style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
              background: '#ffffff', border: '1px solid #dde6f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/uog-logo.png" alt="UoG" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a3f6f', lineHeight: 1.2 }}>Smart Resource Management System For University of Gondar</div>

            </div>
          </div>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{
                position: 'relative', background: '#f0f6ff', border: '1px solid #dde6f5',
                borderRadius: 9, padding: '0.45rem 0.55rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#1a3f6f',
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  background: '#dc2626', color: '#fff', borderRadius: '50%',
                  width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 800,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', top: 44, right: 0, width: 320, maxHeight: 380,
                overflowY: 'auto', background: '#fff', borderRadius: 12,
                border: '1px solid #dde6f5', boxShadow: '0 8px 30px rgba(26,63,111,0.14)',
                zIndex: 200,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #f0f4f8' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a56db', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No notifications</div>
                ) : notifications.slice(0, 20).map(n => (
                  <div key={n.id} onClick={() => handleNotifClick(n)}
                    style={{
                      display: 'flex', gap: '0.6rem', padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                      background: n.read ? '#fff' : '#eff6ff', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#eff6ff'}
                  >
                    <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{NOTIF_ICON[n.type] || 'ℹ️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: n.read ? '#64748b' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</div>
                      <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: 3 }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}