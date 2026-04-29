import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Database, ClipboardList, AlertTriangle, Sparkles, Activity, ShieldCheck, TrendingUp, Plus, Wrench, CheckCircle } from 'lucide-react';
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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ resources:0, requests:0, damaged:0, aiDecisions:0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [rRes, qRes] = await Promise.all([
        API.get('/resources'),
        API.get('/requests')
      ]);
      const resources = rRes.data.data;
      const requests  = qRes.data.data;
      setStats({
        resources:  resources.length,
        requests:   requests.filter(r => !['COMPLETED','REJECTED'].includes(r.status)).length,
        damaged:    resources.filter(r => r.status==='DAMAGED').length,
        aiDecisions:resources.reduce((acc,r) => acc+(r.maintenances?.filter(m=>m.aiDecision).length||0), 0)
      });
    } catch {}
  };

  const getQuickActions = () => {
    const role = user?.role;
    if (role === 'STAFF') {
      return [
        { label: 'Report Damaged Resource', icon: AlertTriangle, onClick: () => navigate('/requests'), color: 'var(--accent-rose)' },
        { label: 'Request New Resource', icon: Plus, onClick: () => navigate('/requests'), color: 'var(--accent-blue)' },
        { label: 'Track My Requests', icon: ClipboardList, onClick: () => navigate('/requests'), color: 'var(--text-dim)' }
      ];
    }
    if (role === 'DEPARTMENT_HEAD' || role === 'ACADEMIC_DEAN') {
      return [
        { label: 'Review Pending Requests', icon: CheckCircle, onClick: () => navigate('/requests'), color: 'var(--accent-emerald)' },
        { label: 'View Analytics', icon: TrendingUp, onClick: () => navigate('/analytics'), color: 'var(--accent-purple)' }
      ];
    }
    if (role === 'RESOURCE_OFFICER' || role === 'ADMIN') {
      return [
        { label: 'Add New Resource', icon: Plus, onClick: () => navigate('/resources'), color: 'var(--accent-blue)' },
        { label: 'Assign Technicians', icon: Wrench, onClick: () => navigate('/maintenance'), color: 'var(--accent-rose)' },
        { label: 'Approve Work Completion', icon: CheckCircle, onClick: () => navigate('/maintenance'), color: 'var(--accent-emerald)' },
        { label: 'Manage Purchase Requests', icon: ClipboardList, onClick: () => navigate('/requests'), color: 'var(--accent-purple)' }
      ];
    }
    if (role === 'TECHNICIAN') {
      return [
        { label: 'View Assigned Tasks', icon: Wrench, onClick: () => navigate('/maintenance'), color: 'var(--accent-blue)' },
        { label: 'Assess Damage Levels', icon: AlertTriangle, onClick: () => navigate('/maintenance'), color: 'var(--accent-rose)' }
      ];
    }
    return [];
  };

  const quickActions = getQuickActions();

  const cards = [
    { title:'Fleet Assets',      value:stats.resources,   icon:Database,     color:'var(--accent-blue)',   trend:'+2 this month' },
    { title:'Open Requests',     value:stats.requests,    icon:ClipboardList,color:'var(--accent-emerald)',trend:'In progress' },
    { title:'Damaged Assets',    value:stats.damaged,     icon:AlertTriangle,color:'var(--accent-rose)',   trend:'Action needed' },
    { title:'AI Optimisations',  value:stats.aiDecisions, icon:Sparkles,     color:'var(--accent-purple)', trend:'98.2% accuracy', glow:true },
  ];

  return (
    <div className="animate-in">
      <header style={{marginBottom:'3rem'}}>
        <div className="badge-ai" style={{marginBottom:'1rem',display:'inline-flex'}}>
          <Activity size={14} className="pulse"/>System Operational
        </div>
        <h1 className="gradient-text">Resource Intelligence</h1>
        <p style={{color:'var(--text-muted)',fontSize:'1.05rem'}}>
          Welcome back, <strong style={{color:'var(--text-main)'}}>{user?.name||'Administrator'}</strong>. AI-driven asset management hub.
        </p>
      </header>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {quickActions.map((action, i) => (
              <button 
                key={i}
                onClick={action.onClick}
                className="glass-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                  cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s', textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = action.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${action.color}20`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <action.icon size={20} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.5rem',marginBottom:'3rem'}}>
        {cards.map((c,i) => (
          <div key={i} className={`glass-card ${c.glow?'ai-glow':''}`}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
              <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid var(--border-glass)',display:'flex',alignItems:'center',justifyContent:'center',color:c.color}}>
                <c.icon size={22}/>
              </div>
              <span style={{fontSize:'0.75rem',color:c.glow?'var(--accent-blue)':'var(--text-dim)',fontWeight:600}}>{c.trend}</span>
            </div>
            <p style={{fontSize:'0.85rem',color:'var(--text-dim)',fontWeight:500,marginBottom:'0.25rem'}}>{c.title}</p>
            <h2 style={{fontSize:'2.25rem',fontWeight:900,margin:0}}>{c.value}</h2>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:'1.5rem'}}>
        <div className="glass-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
            <h2 style={{fontWeight:700,fontSize:'1.15rem',margin:0}}>Maintenance Trajectory</h2>
            <div style={{display:'flex',gap:'1rem'}}>
              {[{c:'var(--accent-blue)',l:'Repairs'},{c:'var(--accent-rose)',l:'Replacements'}].map(({c,l})=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:c}}/>
                  <span style={{fontSize:'0.75rem',color:'var(--text-dim)'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{height:320}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                <XAxis dataKey="day" stroke="var(--text-dim)" fontSize={12} axisLine={false} tickLine={false}/>
                <YAxis stroke="var(--text-dim)" fontSize={12} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,backdropFilter:'blur(10px)'}}/>
                <Area type="monotone" dataKey="repair" name="Repairs" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#gBlue)"/>
                <Area type="monotone" dataKey="replace" name="Replacements" stroke="var(--accent-rose)" strokeWidth={3} fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{fontWeight:700,fontSize:'1.15rem',marginBottom:'1.5rem'}}>Recent AI Insights</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[
              { icon:ShieldCheck, title:'Cost Optimisation',  desc:'Predictive model saved $1,200 this week by recommending repair for 5 lab units.', color:'var(--accent-emerald)' },
              { icon:TrendingUp,  title:'Efficiency Peak',    desc:'Technician response time improved by 14% after smart routing.', color:'var(--accent-blue)' },
              { icon:AlertTriangle,title:'Risk Alert',        desc:'3 high-value servers show signs of terminal failure. Early replacement advised.', color:'var(--accent-rose)' },
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'1rem',background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{color:item.color,flexShrink:0,marginTop:2}}><item.icon size={18}/></div>
                <div>
                  <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:4}}>{item.title}</h4>
                  <p style={{fontSize:'0.78rem',color:'var(--text-muted)',lineHeight:1.45,margin:0}}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
