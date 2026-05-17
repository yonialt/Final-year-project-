import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Database, ClipboardList, AlertTriangle, Sparkles, Activity, ShieldCheck, TrendingUp, Plus, Wrench, CheckCircle, FileWarning, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  ADMIN: 'Full system administration and oversight.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ resources:0, requests:0, damaged:0, damageReports:0, maintenance:0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const promises = [API.get('/resources'), API.get('/requests'), API.get('/damage-reports')];
      if (['RESOURCE_OFFICER','TECHNICIAN','ADMIN'].includes(user?.role)) {
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
    if (role === 'RESOURCE_OFFICER' || role === 'ADMIN') return [
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
        <div className="badge-ai" style={{background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1a56db', display:'inline-flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.75rem'}}><Activity size={13} className="pulse"/>System Operational</div>
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
