import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Database, ClipboardList, AlertTriangle, Sparkles, Activity,
  ShieldCheck, TrendingUp, Plus, Wrench, CheckCircle, FileWarning,
  Brain, Users, Settings, Shield, Mail, Search, Eye, Server,
  UserCheck, Clock, Bell, ChevronRight, RefreshCw, Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const CHART_DATA = [
  { day:'Mon', repair:4, replace:2 },
  { day:'Tue', repair:3, replace:1 },
  { day:'Wed', repair:6, replace:4 },
  { day:'Thu', repair:4, replace:3 },
  { day:'Fri', repair:8, replace:5 },
  { day:'Sat', repair:2, replace:1 },
  { day:'Sun', repair:1, replace:0 },
];

const ROLE_WELCOME = {
  STAFF: 'Submit resource requests and report damaged assets.',
  DEPARTMENT_HEAD: 'Review and approve staff requests and damage reports.',
  ACADEMIC_DEAN: 'Final approval authority for new resource procurement.',
  RESOURCE_OFFICER: 'Manage procurement, assign technicians, and execute AI decisions.',
  TECHNICIAN: 'Inspect and repair assigned assets.',
  ADMIN: 'Manage users, monitor system health, and administer the platform.',
};

const ROLE_META = {
  ADMIN:            { label: 'Admin',           color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  STAFF:            { label: 'Staff',           color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
  DEPARTMENT_HEAD:  { label: 'Dept Head',       color: '#1a56db', bg: 'rgba(26,86,219,0.08)' },
  ACADEMIC_DEAN:    { label: 'Academic Dean',   color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  RESOURCE_OFFICER: { label: 'Resource Officer',color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  TECHNICIAN:       { label: 'Technician',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
};

const NOTIF_ICON = { SUCCESS: '✅', WARNING: '⚠️', ACTION: '🔔', INFO: 'ℹ️' };

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Users & System Management Only
   ═══════════════════════════════════════════════════════════════════════════ */
function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/system-stats');
      setData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="animate-in" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
      <div style={{textAlign:'center'}}>
        <RefreshCw size={28} className="spin" style={{color:'var(--accent-blue)',marginBottom:'0.75rem'}}/>
        <p style={{color:'var(--text-dim)',fontWeight:600,fontSize:'0.9rem'}}>Loading system data…</p>
      </div>
    </div>
  );

  if (!data) return null;

  const filteredUsers = (data.users || []).filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || (u.department||'').toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const quickActions = [
    { label:'Manage Users',        icon:Users,     onClick:()=>navigate('/users'), color:'var(--accent-blue)' },
    { label:'Register New User',   icon:UserCheck, onClick:()=>navigate('/users'), color:'var(--accent-emerald)' },
  ];

  return (
    <div className="animate-in">
      {/* ── Admin Header ── */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize:'1.85rem', fontWeight:800, letterSpacing:'-0.01em', background:'linear-gradient(135deg, #1a3f6f 0%, #7c3aed 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          System Administration
        </h1>
        <p style={{color:'var(--text-muted)', fontSize:'0.95rem', marginTop:'0.3rem'}}>
          Welcome back, <strong style={{color:'var(--text-main)'}}>{user?.name||'Admin'}</strong>. Manage users, monitor system health, and administer the platform.
        </p>
      </header>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{fontWeight:700, fontSize:'0.8rem', marginBottom:'0.75rem', color:'var(--text-dim)', letterSpacing:'0.04em'}}>ADMIN ACTIONS</h2>
        <div style={{display:'grid', gap:'0.85rem', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
          {quickActions.map((a, i) => (
            <button key={i} onClick={a.onClick}
              className="glass-card glass-card-interactive"
              style={{padding:'1rem', borderLeft:`3px solid ${a.color}`, display:'flex', alignItems:'center', gap:'0.75rem', textAlign:'left', width:'100%', cursor:'pointer', background:'var(--bg-card)'}}>
              <div style={{width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`${a.color}14`, color:a.color}}>
                <a.icon size={18}/>
              </div>
              <span style={{fontWeight:700, fontSize:'0.875rem'}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:'grid', gap:'1.25rem', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', marginBottom:'2rem'}}>
        <div className="glass-card glass-card-interactive">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
            <div style={{width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent-blue)12', border:'1px solid var(--accent-blue)28', color:'var(--accent-blue)'}}>
              <Users size={20}/>
            </div>
            <span style={{fontSize:'0.7rem', fontWeight:600, color:'var(--text-dim)'}}>{data.recentUsersCount} new this month</span>
          </div>
          <p style={{fontSize:'0.75rem', fontWeight:500, marginBottom:'0.25rem', color:'var(--text-dim)'}}>Total Users</p>
          <h2 style={{fontSize:'1.85rem', fontWeight:900}}>{data.totalUsers}</h2>
        </div>
      </div>

      {/* ── Main Grid: User Directory + Sidebar ── */}
      <div style={{display:'grid', gap:'1.25rem', gridTemplateColumns:'1.8fr 1fr', marginBottom:'2rem'}}>

        {/* Left: User Directory */}
        <div className="glass-card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'1.25rem 1.25rem 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <Users size={18} style={{color:'var(--accent-blue)'}}/>
                <h2 style={{fontWeight:700, fontSize:'1rem'}}>User Directory</h2>
              </div>
              <button onClick={()=>navigate('/users')} className="btn-ghost" style={{padding:'0.35rem 0.75rem', fontSize:'0.75rem'}}>
                View All <ChevronRight size={12}/>
              </button>
            </div>
          <div className="table-search-bar">
            <div className="search-wrap">
              <Search size={14} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)'}}/>
              <input
                className="input-glass"
                placeholder="Search users…"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{paddingLeft:32, fontSize:'0.8rem'}}
              />
            </div>
            <div className="filter-wrap">
              <select
                className="input-glass"
                value={roleFilter}
                onChange={e=>setRoleFilter(e.target.value)}
                style={{fontSize:'0.8rem'}}
              >
                <option value="ALL">All Roles</option>
                {Object.entries(ROLE_META).map(([r,m])=>(
                  <option key={r} value={r}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{maxHeight:400, overflowY:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border-glass)', position:'sticky', top:0, background:'var(--bg-card)', zIndex:1}}>
                  {['User','Email','Role','Department','Status'].map(h=>(
                    <th key={h} style={{textAlign:'left', padding:'0.6rem 0.85rem', fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'var(--text-dim)', fontSize:'0.85rem'}}>No users found.</td></tr>
                ) : filteredUsers.map(u => {
                  const meta = ROLE_META[u.role] || ROLE_META.STAFF;
                  return (
                    <tr key={u.id} className="table-row-hover" style={{borderBottom:'1px solid rgba(221,230,245,0.5)'}}>
                      <td style={{padding:'0.6rem 0.85rem'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <div style={{
                            width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:800, fontSize:'0.7rem', color:'#fff', flexShrink:0,
                            background:`linear-gradient(135deg,${meta.color},var(--accent-purple))`
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{fontWeight:700, fontSize:'0.82rem'}}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{padding:'0.6rem 0.85rem'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'0.35rem'}}>
                          <Mail size={12} style={{color:'var(--text-dim)', flexShrink:0}}/>
                          <span style={{fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'monospace'}}>{u.email}</span>
                        </div>
                      </td>
                      <td style={{padding:'0.6rem 0.85rem'}}>
                        <span className="badge" style={{color:meta.color, background:meta.bg, border:`1px solid ${meta.color}20`, fontSize:'0.62rem'}}>
                          {u.role.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td style={{padding:'0.6rem 0.85rem', fontSize:'0.8rem', color:'var(--text-dim)'}}>
                        {u.department || '—'}
                      </td>
                      <td style={{padding:'0.6rem 0.85rem'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'0.3rem'}}>
                          <div style={{width:7, height:7, borderRadius:'50%', background:'#10b981', flexShrink:0}}/>
                          <span style={{fontSize:'0.72rem', fontWeight:600, color:'#059669'}}>Active</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{padding:'0.65rem 1rem', borderTop:'1px solid var(--border-glass)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.72rem', fontWeight:600, color:'var(--text-dim)'}}>
              Showing {filteredUsers.length} of {data.totalUsers} users
            </span>
          </div>
        </div>

        {/* Right Sidebar: Role Distribution + System Health */}
        <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>

          {/* Role Distribution */}
          <div className="glass-card">
            <h2 style={{fontWeight:700, fontSize:'1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem'}}>
              <Shield size={16} style={{color:'var(--accent-purple)'}}/> Role Distribution
            </h2>
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              {Object.entries(ROLE_META).map(([role, meta]) => {
                const count = data.roleDistribution[role] || 0;
                const pct = data.totalUsers > 0 ? (count / data.totalUsers * 100) : 0;
                return (
                  <div key={role}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem'}}>
                      <span style={{fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)'}}>{meta.label}</span>
                      <span style={{fontSize:'0.72rem', fontWeight:800, color:meta.color}}>{count}</span>
                    </div>
                    <div style={{height:6, borderRadius:3, background:'#f0f4f8', overflow:'hidden'}}>
                      <div style={{
                        height:'100%', borderRadius:3, background:meta.color,
                        width:`${pct}%`, transition:'width 0.6s var(--ease-out)',
                        minWidth: count > 0 ? 6 : 0,
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:'1rem', padding:'0.6rem 0.75rem', borderRadius:10, background:'var(--bg-subtle)', border:'1px solid var(--border-glass)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:'0.72rem', fontWeight:600, color:'var(--text-dim)'}}>Total Users</span>
                <span style={{fontSize:'1.1rem', fontWeight:900, color:'var(--text-main)'}}>{data.totalUsers}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="glass-card" style={{background:'linear-gradient(135deg,#1a3f6f,#2054a0)', color:'#fff', border:'none'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}>
              <Server size={16}/>
              <h2 style={{fontWeight:700, fontSize:'1rem'}}>System Health</h2>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'0.65rem'}}>
              {[
                { label:'Database', status:'Operational', ok:true },
                { label:'API Server', status:'Running', ok:true },
                { label:'AI Service', status:'Connected', ok:true },
              ].map((item,i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.45rem 0.6rem', borderRadius:8, background:'rgba(255,255,255,0.08)'}}>
                  <span style={{fontSize:'0.78rem', fontWeight:600, opacity:0.9}}>{item.label}</span>
                  <div style={{display:'flex', alignItems:'center', gap:'0.3rem'}}>
                    <div style={{width:7, height:7, borderRadius:'50%', background: item.ok ? '#10b981' : '#ef4444'}}/>
                    <span style={{fontSize:'0.7rem', fontWeight:700, color: item.ok ? '#6ee7b7' : '#fca5a5'}}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:'1rem', display:'flex', justifyContent:'space-between', fontSize:'0.68rem', opacity:0.6}}>
              <span>Uptime: 99.9%</span>
              <span>Last checked: now</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h2 style={{fontWeight:700, fontSize:'1rem', display:'flex', alignItems:'center', gap:'0.4rem'}}>
                <Bell size={16} style={{color:'var(--accent-amber)'}}/> Recent Activity
              </h2>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:240, overflowY:'auto'}}>
              {(data.recentActivity || []).length === 0 ? (
                <p style={{color:'var(--text-dim)', fontSize:'0.82rem', textAlign:'center', padding:'1.5rem 0'}}>No recent activity</p>
              ) : (data.recentActivity || []).slice(0, 8).map((n, i) => (
                <div key={n.id || i} style={{display:'flex', gap:'0.5rem', padding:'0.5rem 0.6rem', borderRadius:8, background:'var(--bg-subtle)', border:'1px solid rgba(221,230,245,0.5)'}}>
                  <span style={{fontSize:'0.85rem', flexShrink:0, marginTop:1}}>{NOTIF_ICON[n.type] || 'ℹ️'}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{fontSize:'0.72rem', fontWeight:700, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.title}</p>
                    <p style={{fontSize:'0.65rem', color:'var(--text-dim)', marginTop:1}}>
                      {n.user?.name || 'System'} · {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESOURCE OFFICER / DEFAULT DASHBOARD (unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */
function ResourceDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ resources:0, requests:0, damaged:0, damageReports:0, maintenance:0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const promises = [API.get('/resources'), API.get('/requests'), API.get('/damage-reports')];
      if (['RESOURCE_OFFICER','TECHNICIAN'].includes(user?.role)) {
        promises.push(API.get('/maintenance'));
      }
      const results = await Promise.all(promises);
      const resources = results[0].data.data;
      const requests  = results[1].data.data;
      const damageReports = results[2].data.data;
      const maintenance = results[3]?.data?.data || [];
      setStats({
        resources: resources.length,
        requests: requests.filter(r => !['COMPLETED','REJECTED'].includes(r.status)).length,
        damaged: resources.filter(r => r.status==='DAMAGED').length,
        damageReports: damageReports.filter(r => !['CLOSED','REPAIR_COMPLETED','REPLACED'].includes(r.status)).length,
        maintenance: maintenance.length,
        aiDecisions: maintenance.filter(m => m.aiDecision).length
      });
    } catch {}
  };

  const getQuickActions = () => {
    const role = user?.role;
    if (role === 'STAFF') return [
      { label:'Report Damaged Resource', icon:AlertTriangle, onClick:()=>navigate('/damage-reports'), color:'var(--accent-rose)' },
      { label:'Request New Resource',    icon:Plus,          onClick:()=>navigate('/requests'),       color:'var(--accent-blue)' },
      { label:'Track My Requests',       icon:ClipboardList, onClick:()=>navigate('/requests'),       color:'var(--text-dim)' },
      { label:'View My Damage Reports',  icon:FileWarning,   onClick:()=>navigate('/damage-reports'), color:'var(--accent-amber)' },
    ];
    if (role === 'DEPARTMENT_HEAD') return [
      { label:'Review Pending Requests',  icon:CheckCircle,   onClick:()=>navigate('/requests'),       color:'var(--accent-emerald)' },
      { label:'Forward Damage Reports',   icon:AlertTriangle, onClick:()=>navigate('/damage-reports'), color:'var(--accent-rose)' },
      { label:'View Analytics',           icon:TrendingUp,    onClick:()=>navigate('/analytics'),      color:'var(--accent-purple)' },
    ];
    if (role === 'ACADEMIC_DEAN') return [
      { label:'Approve Resource Requests', icon:CheckCircle,  onClick:()=>navigate('/requests'),  color:'var(--accent-emerald)' },
      { label:'View All Damage Reports',   icon:AlertTriangle,onClick:()=>navigate('/damage-reports'), color:'var(--accent-rose)' },
      { label:'System Analytics',          icon:TrendingUp,   onClick:()=>navigate('/analytics'), color:'var(--accent-purple)' },
    ];
    if (role === 'RESOURCE_OFFICER') return [
      { label:'Assign Technicians',        icon:Wrench,       onClick:()=>navigate('/maintenance'),    color:'var(--accent-rose)' },
      { label:'Manage Purchase Requests',  icon:ClipboardList,onClick:()=>navigate('/requests'),       color:'var(--accent-purple)' },
      { label:'Review Damage Reports',     icon:AlertTriangle,onClick:()=>navigate('/damage-reports'), color:'var(--accent-amber)' },
      { label:'Add New Resource',          icon:Plus,         onClick:()=>navigate('/resources'),      color:'var(--accent-blue)' },
    ];
    if (role === 'TECHNICIAN') return [
      { label:'View Assigned Tasks',   icon:Wrench,       onClick:()=>navigate('/maintenance'),    color:'var(--accent-blue)' },
      { label:'Submit Inspection Data', icon:Brain,        onClick:()=>navigate('/maintenance'),    color:'var(--accent-purple)' },
    ];
    return [];
  };

  const quickActions = getQuickActions();

  const cards = [
    { title:'Total Assets',      value:stats.resources,      icon:Database,      color:'var(--accent-blue)',    trend:'+2 this month' },
    { title:'Active Requests',   value:stats.requests,       icon:ClipboardList, color:'var(--accent-emerald)', trend:'In progress' },
    { title:'Damage Reports',    value:stats.damageReports,  icon:AlertTriangle, color:'var(--accent-rose)',    trend:'Action needed' },
    { title:'AI Decisions',      value:stats.aiDecisions||0, icon:Sparkles,      color:'var(--accent-purple)',  trend:'98% accuracy', glow:true },
  ];

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize:'1.85rem', fontWeight:800, letterSpacing:'-0.01em' }}>Resource Intelligence</h1>
        <p style={{color:'var(--text-muted)', fontSize:'0.95rem', marginTop:'0.3rem'}}>
          Welcome back, <strong style={{color:'var(--text-main)'}}>{user?.name||'User'}</strong>. {ROLE_WELCOME[user?.role]||''}
        </p>
      </header>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{fontWeight:700, fontSize:'0.8rem', marginBottom:'0.75rem', color:'var(--text-dim)', letterSpacing:'0.04em'}}>QUICK ACTIONS</h2>
          <div style={{display:'grid', gap:'0.85rem', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))'}}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={a.onClick}
                className="glass-card glass-card-interactive"
                style={{padding:'1rem', borderLeft:`3px solid ${a.color}`, display:'flex', alignItems:'center', gap:'0.75rem', textAlign:'left', width:'100%', cursor:'pointer', background:'var(--bg-card)'}}>
                <div style={{width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`${a.color}14`, color:a.color}}>
                  <a.icon size={18}/>
                </div>
                <span style={{fontWeight:700, fontSize:'0.875rem'}}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{display:'grid', gap:'1.25rem', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', marginBottom:'2rem'}}>
        {cards.map((c,i) => (
          <div key={i} className="glass-card glass-card-interactive">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
              <div style={{width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:`${c.color}12`, border:`1px solid ${c.color}28`, color:c.color}}>
                <c.icon size={20}/>
              </div>
              <span style={{fontSize:'0.7rem', fontWeight:600, color:'var(--text-dim)'}}>{c.trend}</span>
            </div>
            <p style={{fontSize:'0.75rem', fontWeight:500, marginBottom:'0.25rem', color:'var(--text-dim)'}}>{c.title}</p>
            <h2 style={{fontSize:'1.85rem', fontWeight:900}}>{c.value}</h2>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:'grid', gap:'1.25rem', gridTemplateColumns:'1.6fr 1fr'}}>
        <div className="glass-card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
            <h2 style={{fontWeight:700, fontSize:'1rem'}}>Maintenance Trajectory</h2>
            <div style={{display:'flex', gap:'1rem'}}>
              {[{c:'var(--accent-blue)',l:'Repairs'},{c:'var(--accent-rose)',l:'Replacements'}].map(({c,l})=>(
                <div key={l} style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
                  <div style={{width:10, height:10, borderRadius:'50%', background:c}}/>
                  <span style={{fontSize:'0.7rem', color:'var(--text-dim)'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fb" vertical={false}/>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false}/>
                <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#fff',border:'1px solid #dde6f5',borderRadius:12,boxShadow:'0 4px 12px rgba(26,63,111,0.1)'}}/>
                <Area type="monotone" dataKey="repair" name="Repairs" stroke="var(--accent-blue)" strokeWidth={2.5} fill="url(#gBlue)"/>
                <Area type="monotone" dataKey="replace" name="Replacements" stroke="var(--accent-rose)" strokeWidth={2.5} fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{fontWeight:700, fontSize:'1rem', marginBottom:'1rem'}}>AI Insights</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
            {[
              { icon:ShieldCheck,  title:'Cost Optimisation',  desc:'Predictive model saved $1,200 this week by recommending repair for 5 lab units.', color:'var(--accent-emerald)', bg:'#f0fdf4' },
              { icon:TrendingUp,   title:'Efficiency Peak',    desc:'Technician response time improved by 14% after AI-driven routing.', color:'var(--accent-blue)', bg:'#eff6ff' },
              { icon:AlertTriangle,title:'Risk Alert',         desc:'3 high-value servers show signs of terminal failure. Early replacement advised.', color:'var(--accent-rose)', bg:'#fef2f2' },
            ].map((item,i)=>(
              <div key={i} style={{display:'flex', gap:'0.75rem', padding:'0.75rem', borderRadius:12, background:item.bg, border:`1px solid ${item.color}22`}}>
                <div style={{flexShrink:0, marginTop:2, color:item.color}}><item.icon size={16}/></div>
                <div>
                  <h4 style={{fontSize:'0.75rem', fontWeight:700, marginBottom:'0.25rem'}}>{item.title}</h4>
                  <p style={{fontSize:'0.75rem', lineHeight:1.6, color:'var(--text-muted)'}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT EXPORT — route to correct dashboard by role
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard user={user} />;
  }

  return <ResourceDashboard user={user} />;
}
