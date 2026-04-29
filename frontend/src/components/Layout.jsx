import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardList, Activity, BarChart2, Users, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* Nav items visible per role */
const NAV = [
  { name:'Dashboard',    path:'/dashboard',   icon:LayoutDashboard, roles:['ALL'] },
  { name:'Asset Fleet',  path:'/resources',   icon:Database,        roles:['ALL'] },
  { name:'Workflows',    path:'/requests',    icon:ClipboardList,   roles:['ALL'] },
  { name:'Maintenance',  path:'/maintenance', icon:Activity,        roles:['RESOURCE_OFFICER','TECHNICIAN','ADMIN'] },
  { name:'Analytics',   path:'/analytics',   icon:BarChart2,       roles:['RESOURCE_OFFICER','ACADEMIC_DEAN','ADMIN'] },
  { name:'Users',        path:'/users',       icon:Users,           roles:['ADMIN'] },
];

const ROLE_COLOR = {
  ADMIN:            '#f59e0b',
  RESOURCE_OFFICER: 'var(--accent-emerald)',
  ACADEMIC_DEAN:    'var(--accent-purple)',
  DEPARTMENT_HEAD:  'var(--accent-blue)',
  TECHNICIAN:       'var(--accent-rose)',
  STAFF:            'var(--text-dim)',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleNav = NAV.filter(item =>
    item.roles.includes('ALL') || item.roles.includes(user?.role)
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'2.5rem',paddingLeft:'0.5rem'}}>
          <div style={{width:40,height:40,background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--glow-blue)',flexShrink:0}}>
            <Cpu size={22} color="white"/>
          </div>
          <div>
            <span style={{fontSize:'1.25rem',fontWeight:800,letterSpacing:'-0.04em',display:'block',lineHeight:1}}>SmartRes</span>
            <span style={{fontSize:'0.65rem',color:'var(--text-dim)',fontWeight:600,letterSpacing:'0.05em'}}>UoG SRMS v2.0</span>
          </div>
        </div>

        <div style={{fontSize:'0.6rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'var(--text-dim)',paddingLeft:'0.5rem',marginBottom:'0.75rem'}}>
          Navigation
        </div>

        <nav style={{flex:1}}>
          {visibleNav.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({isActive}) => `nav-link ${isActive?'active':''}`}>
              <item.icon className="icon" size={20}/>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div style={{marginTop:'auto',borderTop:'1px solid var(--border-glass)',paddingTop:'1.5rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1rem',padding:'0.75rem',background:'rgba(255,255,255,0.03)',borderRadius:14,border:'1px solid var(--border-glass)'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${ROLE_COLOR[user?.role]||'var(--accent-blue)'},var(--accent-purple))`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:'0.9rem',flexShrink:0}}>
              {user?.name?.charAt(0).toUpperCase()||'?'}
            </div>
            <div style={{overflow:'hidden',flex:1}}>
              <p style={{fontSize:'0.875rem',fontWeight:700,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.name||'User'}</p>
              <p style={{fontSize:'0.65rem',color:ROLE_COLOR[user?.role]||'var(--text-dim)',margin:0,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.04em'}}>{user?.role?.replace(/_/g,' ')||'—'}</p>
            </div>
          </div>
          <button onClick={()=>{ logout(); navigate('/login'); }}
            className="nav-link" style={{width:'100%',border:'none',background:'transparent',cursor:'pointer',color:'var(--accent-rose)'}}>
            <LogOut size={20}/>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
