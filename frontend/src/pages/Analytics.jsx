import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Database, ClipboardList, Users, Brain, DollarSign, AlertTriangle, CheckCircle, Activity, FileWarning } from 'lucide-react';

const COLORS = ['var(--accent-blue)','var(--accent-emerald)','var(--accent-rose)','var(--accent-purple)','#fb923c','#a78bfa'];

const StatCard = ({ icon: Icon, title, value, sub, color }) => (
  <div className="glass-card" style={{padding:'1.25rem'}}>
    <div className="flex justify-between items-start mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
           style={{background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-glass)', color:color||'var(--accent-blue)'}}>
        <Icon size={18}/>
      </div>
      {sub && <span className="text-[0.7rem] font-semibold" style={{color:'var(--text-dim)'}}>{sub}</span>}
    </div>
    <p className="text-xs font-medium mb-0.5" style={{color:'var(--text-dim)'}}>{title}</p>
    <h2 className="text-2xl font-black">{value}</h2>
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
    <div className="flex flex-col items-center justify-center" style={{height:'60vh'}}>
      <div className="pulse w-14 h-14 rounded-2xl mb-6" style={{background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', boxShadow:'var(--glow-blue)'}}/>
      <p style={{color:'var(--text-muted)'}}>Loading analytics data...</p>
    </div>
  );

  if (error) return (
    <div className="glass-card text-center py-12 max-w-md mx-auto mt-16">
      <AlertTriangle size={40} className="mx-auto mb-4" style={{color:'var(--accent-rose)'}}/>
      <h2 className="font-extrabold text-lg mb-2">Access Restricted</h2>
      <p className="text-sm" style={{color:'var(--text-dim)'}}>{error}</p>
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
      <header className="mb-8">
        <div className="badge-ai mb-3 inline-flex"><Activity size={13} className="pulse"/>Analytics Intelligence</div>
        <h1 className="gradient-text text-3xl font-extrabold tracking-tight">System Analytics</h1>
        <p className="mt-1 text-sm" style={{color:'var(--text-muted)'}}>Real-time performance metrics and resource utilisation insights.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))'}}>
        <StatCard icon={Database} title="Total Assets" value={data.resources.total} sub={`${data.resources.damaged} damaged`} color="var(--accent-blue)"/>
        <StatCard icon={ClipboardList} title="Total Requests" value={data.requests.total} sub={`${data.requests.pending} pending`} color="var(--accent-emerald)"/>
        <StatCard icon={FileWarning} title="Damage Reports" value={data.damageReports?.total||0} sub={`${data.damageReports?.pending||0} pending`} color="var(--accent-rose)"/>
        <StatCard icon={Brain} title="AI Decisions" value={data.maintenance.total} sub={`${Math.round((data.maintenance.avgConfidence||0)*100)}% avg conf.`} color="var(--accent-purple)"/>
        <StatCard icon={DollarSign} title="Total Repair Cost" value={`$${Number(data.maintenance.totalRepairCost||0).toLocaleString()}`} sub={`Avg $${Number(data.maintenance.avgRepairCost||0).toFixed(0)}`} color="var(--accent-amber)"/>
        <StatCard icon={Users} title="Total Users" value={data.users.total} color="var(--accent-blue)"/>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 mb-4" style={{gridTemplateColumns:'2fr 1fr'}}>
        <div className="glass-card">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={16} style={{color:'var(--accent-blue)'}}/>Request Activity (Last 7 Days)
          </h3>
          <div style={{height:250}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.requestsByDay}>
                <defs>
                  <linearGradient id="gBlueA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={d=>d.slice(5)}/>
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,backdropFilter:'blur(10px)'}} labelStyle={{color:'var(--text-main)'}}/>
                <Area type="monotone" dataKey="count" name="Total" stroke="var(--accent-blue)" strokeWidth={2.5} fill="url(#gBlueA)"/>
                <Area type="monotone" dataKey="damage" name="Damage" stroke="var(--accent-rose)" strokeWidth={2} fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="font-bold text-sm mb-4">Asset Status Distribution</h3>
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resourcePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                  {resourcePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {resourcePieData.map((d,i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[0.7rem]">
                <div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                <span style={{color:'var(--text-dim)'}}>{d.name}: <strong style={{color:'var(--text-main)'}}>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass-card">
          <h3 className="font-bold text-sm mb-4">Assets by Category</h3>
          <div style={{height:220}}>
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

        <div className="glass-card">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Brain size={16} style={{color:'var(--accent-purple)'}}/>AI Decision Summary
          </h3>
          {aiPieData.length === 0 ? (
            <div className="text-center py-10" style={{color:'var(--text-dim)'}}>No AI decisions recorded yet.</div>
          ) : (
            <>
              <div style={{height:170}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={aiPieData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value"
                         label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      <Cell fill="var(--accent-emerald)"/>
                      <Cell fill="var(--accent-rose)"/>
                    </Pie>
                    <Tooltip contentStyle={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="text-center p-3 rounded-xl" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.15)'}}>
                  <p className="text-[0.65rem] font-bold uppercase mb-1" style={{color:'var(--accent-emerald)'}}>Repair</p>
                  <h2 className="text-2xl font-black">{data.maintenance.repairDecisions}</h2>
                </div>
                <div className="text-center p-3 rounded-xl" style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)'}}>
                  <p className="text-[0.65rem] font-bold uppercase mb-1" style={{color:'var(--accent-rose)'}}>Replace</p>
                  <h2 className="text-2xl font-black">{data.maintenance.replaceDecisions}</h2>
                </div>
              </div>
            </>
          )}
          <div className="mt-3 p-3 rounded-xl" style={{background:'rgba(129,140,248,0.05)',border:'1px solid rgba(129,140,248,0.1)'}}>
            <p className="text-xs" style={{color:'var(--text-dim)'}}>
              Average AI confidence: <strong style={{color:'var(--accent-purple)'}}>{Math.round((data.maintenance.avgConfidence||0)*100)}%</strong> across {data.maintenance.total} assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Recent AI Decisions */}
      {data.ai?.recentDecisions?.length > 0 && (
        <div className="glass-card mb-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Brain size={16} style={{color:'var(--accent-blue)'}}/>Recent AI Recommendations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border-glass)'}}>
                  {['Resource','Decision','Confidence','Method','Date'].map(h=>(
                    <th key={h} className="text-left px-3 py-2 text-[0.65rem] font-bold uppercase" style={{color:'var(--text-dim)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ai.recentDecisions.map(r=>(
                  <tr key={r.id} className="table-row-hover" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td className="px-3 py-2 text-sm font-semibold">{r.damageReport?.resource?.name||'—'}</td>
                    <td className="px-3 py-2">
                      <span className="badge" style={{
                        color:r.decision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)',
                        background:r.decision==='REPLACE'?'rgba(251,113,133,0.1)':'rgba(52,211,153,0.1)',
                        border:`1px solid ${r.decision==='REPLACE'?'rgba(251,113,133,0.2)':'rgba(52,211,153,0.2)'}`
                      }}>{r.decision}</span>
                    </td>
                    <td className="px-3 py-2 text-sm font-bold">{Math.round(r.confidence*100)}%</td>
                    <td className="px-3 py-2 text-xs" style={{color:'var(--text-dim)'}}>{r.method||'—'}</td>
                    <td className="px-3 py-2 text-xs" style={{color:'var(--text-dim)'}}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price Catalog */}
      {data.priceCatalog?.length > 0 && (
        <div className="glass-card">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <DollarSign size={16} style={{color:'var(--accent-emerald)'}}/>Live Price Catalog (E-Commerce API)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border-glass)'}}>
                  {['Resource Type','Market Price (New)','Est. Repair Cost','Last Synced'].map(h=>(
                    <th key={h} className="text-left px-3 py-2 text-[0.65rem] font-bold uppercase" style={{color:'var(--text-dim)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.priceCatalog.map(p=>(
                  <tr key={p.id} className="table-row-hover" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td className="px-3 py-2 font-bold text-sm">{p.resourceType}</td>
                    <td className="px-3 py-2 font-bold text-sm" style={{color:'var(--accent-emerald)'}}>${Number(p.newPrice).toLocaleString()}</td>
                    <td className="px-3 py-2 font-bold text-sm" style={{color:'var(--accent-rose)'}}>${Number(p.repairCost).toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs" style={{color:'var(--text-dim)'}}>{new Date(p.updatedAt).toLocaleString()}</td>
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
