import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Database, ClipboardList, Users, Brain, DollarSign, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

const COLORS = ['var(--accent-blue)','var(--accent-emerald)','var(--accent-rose)','var(--accent-purple)','#fb923c','#a78bfa'];

const StatCard = ({ icon: Icon, title, value, sub, color }) => (
  <div className="glass-card" style={{padding:'1.5rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
      <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border-glass)',display:'flex',alignItems:'center',justifyContent:'center',color:color||'var(--accent-blue)'}}>
        <Icon size={20}/>
      </div>
      {sub && <span style={{fontSize:'0.75rem',color:'var(--text-dim)',fontWeight:600}}>{sub}</span>}
    </div>
    <p style={{fontSize:'0.8rem',color:'var(--text-dim)',fontWeight:500,marginBottom:'0.25rem'}}>{title}</p>
    <h2 style={{fontSize:'2rem',fontWeight:900,margin:0}}>{value}</h2>
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await API.get('/admin/analytics');
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.status === 403 ? 'Access restricted to management roles.' : 'Failed to load analytics.');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh'}}>
      <div className="pulse" style={{width:60,height:60,background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',borderRadius:16,marginBottom:'2rem',boxShadow:'var(--glow-blue)'}}/>
      <p className="text-muted">Loading analytics data...</p>
    </div>
  );

  if (error) return (
    <div className="glass-card" style={{textAlign:'center',padding:'4rem',maxWidth:500,margin:'4rem auto'}}>
      <AlertTriangle size={48} style={{color:'var(--accent-rose)',margin:'0 auto 1.5rem',display:'block'}}/>
      <h2 style={{fontWeight:800,marginBottom:'0.75rem'}}>Access Restricted</h2>
      <p style={{color:'var(--text-dim)'}}>{error}</p>
    </div>
  );

  const resourcePieData = [
    { name:'Available', value: data.resources.available },
    { name:'Damaged',   value: data.resources.damaged },
    { name:'Disposed',  value: data.resources.disposed },
    { name:'In Use',    value: data.resources.total - data.resources.available - data.resources.damaged - data.resources.disposed },
  ].filter(d => d.value > 0);

  const aiPieData = [
    { name:'Repair',  value: data.maintenance.repairDecisions },
    { name:'Replace', value: data.maintenance.replaceDecisions },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-in">
      <header style={{marginBottom:'3rem'}}>
        <div className="badge-ai" style={{marginBottom:'1rem',display:'inline-flex'}}>
          <Activity size={14} className="pulse"/>Analytics Intelligence
        </div>
        <h1 className="gradient-text">System Analytics</h1>
        <p className="text-muted">Real-time performance metrics and resource utilisation insights.</p>
      </header>

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginBottom:'2.5rem'}}>
        <StatCard icon={Database} title="Total Assets" value={data.resources.total} sub={`${data.resources.damaged} damaged`} color="var(--accent-blue)"/>
        <StatCard icon={ClipboardList} title="Total Requests" value={data.requests.total} sub={`${data.requests.pending} pending`} color="var(--accent-emerald)"/>
        <StatCard icon={Brain} title="AI Decisions Made" value={data.maintenance.total} sub={`${Math.round((data.maintenance.avgConfidence||0)*100)}% avg confidence`} color="var(--accent-purple)"/>
        <StatCard icon={DollarSign} title="Total Repair Cost" value={`$${Number(data.maintenance.totalRepairCost||0).toLocaleString()}`} sub={`Avg $${Number(data.maintenance.avgRepairCost||0).toFixed(0)}/task`} color="var(--accent-rose)"/>
        <StatCard icon={Users} title="Total Users" value={data.users.total} color="var(--accent-blue)"/>
        <StatCard icon={CheckCircle} title="Completed Requests" value={data.requests.completed} sub={`${data.requests.rejected} rejected`} color="var(--accent-emerald)"/>
      </div>

      {/* Charts Row 1 */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
        {/* Requests by day */}
        <div className="glass-card">
          <h3 style={{fontWeight:700,marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:8}}>
            <TrendingUp size={18} style={{color:'var(--accent-blue)'}}/>Request Activity (Last 7 Days)
          </h3>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.requestsByDay}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d=>d.slice(5)}/>
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,backdropFilter:'blur(10px)'}} labelStyle={{color:'var(--text-main)'}}/>
                <Area type="monotone" dataKey="count" name="Total" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#gBlue)"/>
                <Area type="monotone" dataKey="damage" name="Damage Reports" stroke="var(--accent-rose)" strokeWidth={2} fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource status pie */}
        <div className="glass-card">
          <h3 style={{fontWeight:700,marginBottom:'1.5rem'}}>Asset Status Distribution</h3>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resourcePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {resourcePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.5rem'}}>
            {resourcePieData.map((d,i) => (
              <div key={d.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.75rem'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>
                <span style={{color:'var(--text-dim)'}}>{d.name}: <strong style={{color:'var(--text-main)'}}>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        {/* Assets by type */}
        <div className="glass-card">
          <h3 style={{fontWeight:700,marginBottom:'1.5rem'}}>Assets by Category</h3>
          <div style={{height:250}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resourcesByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis type="category" dataKey="type" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} width={100}/>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12}}/>
                <Bar dataKey="count" fill="var(--accent-blue)" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI decisions */}
        <div className="glass-card">
          <h3 style={{fontWeight:700,marginBottom:'1rem',display:'flex',alignItems:'center',gap:8}}>
            <Brain size={18} style={{color:'var(--accent-purple)'}}/>AI Decision Summary
          </h3>
          {aiPieData.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>No AI decisions recorded yet.</div>
          ) : (
            <>
              <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={aiPieData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      <Cell fill="var(--accent-emerald)"/>
                      <Cell fill="var(--accent-rose)"/>
                    </Pie>
                    <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1rem'}}>
                <div style={{textAlign:'center',padding:'1rem',background:'rgba(52,211,153,0.08)',borderRadius:12,border:'1px solid rgba(52,211,153,0.15)'}}>
                  <p style={{fontSize:'0.7rem',color:'var(--accent-emerald)',fontWeight:700,textTransform:'uppercase',marginBottom:'0.4rem'}}>Repair</p>
                  <h2 style={{fontSize:'2rem',fontWeight:900,margin:0}}>{data.maintenance.repairDecisions}</h2>
                </div>
                <div style={{textAlign:'center',padding:'1rem',background:'rgba(251,113,133,0.08)',borderRadius:12,border:'1px solid rgba(251,113,133,0.15)'}}>
                  <p style={{fontSize:'0.7rem',color:'var(--accent-rose)',fontWeight:700,textTransform:'uppercase',marginBottom:'0.4rem'}}>Replace</p>
                  <h2 style={{fontSize:'2rem',fontWeight:900,margin:0}}>{data.maintenance.replaceDecisions}</h2>
                </div>
              </div>
            </>
          )}
          <div style={{marginTop:'1rem',padding:'1rem',background:'rgba(129,140,248,0.05)',borderRadius:12,border:'1px solid rgba(129,140,248,0.1)'}}>
            <p style={{fontSize:'0.75rem',color:'var(--text-dim)',margin:0}}>
              Average AI confidence: <strong style={{color:'var(--accent-purple)'}}>{Math.round((data.maintenance.avgConfidence||0)*100)}%</strong> across {data.maintenance.total} assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Price Catalog */}
      {data.priceCatalog?.length > 0 && (
        <div className="glass-card" style={{marginTop:'1.5rem'}}>
          <h3 style={{fontWeight:700,marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:8}}>
            <DollarSign size={18} style={{color:'var(--accent-emerald)'}}/>Live Price Catalog (E-Commerce API)
          </h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border-glass)'}}>
                  {['Resource Type','Market Price (New)','Est. Repair Cost','Last Synced'].map(h=>(
                    <th key={h} style={{padding:'0.75rem 1rem',fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.priceCatalog.map(p=>(
                  <tr key={p.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'0.75rem 1rem',fontWeight:700}}>{p.resourceType}</td>
                    <td style={{padding:'0.75rem 1rem',color:'var(--accent-emerald)',fontWeight:700}}>${Number(p.newPrice).toLocaleString()}</td>
                    <td style={{padding:'0.75rem 1rem',color:'var(--accent-rose)',fontWeight:700}}>${Number(p.repairCost).toLocaleString()}</td>
                    <td style={{padding:'0.75rem 1rem',color:'var(--text-dim)',fontSize:'0.8rem'}}>{new Date(p.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
