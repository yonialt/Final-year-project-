import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, Brain, CheckCircle, Info, DollarSign, Activity, X, User, RefreshCw, Zap, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

const DAMAGE_LABELS = { 1:'Minor (Cosmetic)', 2:'Moderate (Functional)', 3:'Severe (Terminal)' };

const AiCard = ({ task }) => {
  if (!task?.aiDecision) return null;
  const isReplace = task.aiDecision === 'REPLACE';
  const pct = Math.round((task.aiConfidence||0)*100);
  const ratio = task.repairCost && task.newPrice ? ((task.repairCost/task.newPrice)*100).toFixed(1) : null;
  return (
    <div className="glass-card animate-in" style={{borderLeft:`4px solid ${isReplace?'var(--accent-rose)':'var(--accent-emerald)'}`,marginTop:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1.5rem'}}>
        <Brain size={20} style={{color:'var(--accent-blue)'}} className="pulse"/>
        <h3 style={{margin:0,fontWeight:800}}>AI Recommendation</h3>
        <span className="badge-ai" style={{marginLeft:'auto'}}><Zap size={12}/>Live</span>
      </div>
      <div style={{textAlign:'center',padding:'1.5rem',background:isReplace?'rgba(251,113,133,0.05)':'rgba(52,211,153,0.05)',borderRadius:12,border:`1px solid ${isReplace?'rgba(251,113,133,0.15)':'rgba(52,211,153,0.15)'}`,marginBottom:'1.5rem'}}>
        <p style={{fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-dim)',marginBottom:'0.5rem'}}>Decision</p>
        <h1 style={{color:isReplace?'var(--accent-rose)':'var(--accent-emerald)',fontSize:'2.5rem',fontWeight:900,margin:0}}>{task.aiDecision}</h1>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:'0.5rem',color:'var(--text-muted)'}}>
          <TrendingUp size={14}/><span style={{fontSize:'0.875rem',fontWeight:600}}>{pct}% Confidence</span>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <div style={{background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'0.875rem',border:'1px solid var(--border-glass)'}}>
          <p style={{fontSize:'0.65rem',color:'var(--text-dim)',fontWeight:700,textTransform:'uppercase',marginBottom:'0.3rem'}}>Asset Age</p>
          <p style={{fontWeight:800,fontSize:'1.1rem'}}>{task.age} <span style={{fontSize:'0.8rem',fontWeight:500,color:'var(--text-dim)'}}>yrs</span></p>
        </div>
        <div style={{background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'0.875rem',border:'1px solid var(--border-glass)'}}>
          <p style={{fontSize:'0.65rem',color:'var(--text-dim)',fontWeight:700,textTransform:'uppercase',marginBottom:'0.3rem'}}>Damage Level</p>
          <p style={{fontWeight:800,fontSize:'1.1rem'}}>{task.damageLevel}<span style={{color:'var(--text-dim)'}}>/3</span></p>
        </div>
      </div>
      {ratio && (
        <div style={{marginBottom:'1rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',marginBottom:'0.4rem'}}>
            <span style={{color:'var(--text-dim)'}}>Repair / New Price Ratio</span>
            <span style={{fontWeight:700}}>{ratio}%</span>
          </div>
          <div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${Math.min(parseFloat(ratio),100)}%`,height:'100%',background:'var(--accent-blue)',borderRadius:3}}/>
          </div>
        </div>
      )}
      <div style={{background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'1rem',border:'1px solid var(--border-glass)',display:'flex',gap:10,alignItems:'flex-start'}}>
        <Info size={16} style={{color:'var(--accent-blue)',flexShrink:0,marginTop:2}}/>
        <p style={{fontSize:'0.82rem',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>
          {isReplace ? 'High repair-to-value ratio or severe damage detected. Replacement is more cost-effective over 24 months.' : 'Asset integrity is adequate. Repair cost is within threshold. Expected service extension: 18-24 months.'}
        </p>
      </div>
    </div>
  );
};

export default function Maintenance() {
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN';
  const isOfficer = user?.role === 'RESOURCE_OFFICER' || user?.role === 'ADMIN';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ damageLevel:1, repairCost:'', notes:'' });
  const [saving, setSaving] = useState(false);

  // Assign modal state
  const [assignModal, setAssignModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignForm, setAssignForm] = useState({ requestId:'', technicianId:'' });
  const [assigning, setAssigning] = useState(false);

  // Finalize modal state
  const [finalModal, setFinalModal] = useState(false);
  const [finalDecision, setFinalDecision] = useState('REPAIR');
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/maintenance');
      setTasks(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  const openAssignModal = async () => {
    try {
      const [rRes, uRes] = await Promise.all([
        API.get('/requests'),
        API.get('/admin/users')
      ]);
      setRequests(rRes.data.data.filter(r => 
        (r.status==='APPROVED_BY_OFFICER' || r.status==='APPROVED_BY_DEAN') && r.resourceId
      ));
      setTechnicians(uRes.data.data.filter(u => u.role==='TECHNICIAN'));
      setAssignForm({ requestId:'', technicianId:'' });
      setAssignModal(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load assign modal data');
    }
  };

  const handleAssign = async () => {
    if (!assignForm.requestId||!assignForm.technicianId) return;
    setAssigning(true);
    try {
      await API.post('/maintenance/start', assignForm);
      setAssignModal(false);
      fetchTasks();
    } catch {} finally { setAssigning(false); }
  };

  const handleInputData = async () => {
    if (!form.repairCost) return;
    setSaving(true);
    try {
      const res = await API.patch(`/maintenance/${selected.id}/data`, {
        damageLevel: parseInt(form.damageLevel),
        repairCost: parseFloat(form.repairCost),
        notes: form.notes
      });
      setSelected(res.data.data);
      fetchTasks();
    } catch {} finally { setSaving(false); }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await API.patch(`/maintenance/${selected.id}/finalize`, { finalDecision });
      setFinalModal(false);
      fetchTasks();
      setSelected(null);
    } catch {} finally { setFinalizing(false); }
  };

  const StatusChip = ({ task }) => {
    if (task.finalDecision) return <span style={{padding:'0.2rem 0.6rem',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:'rgba(52,211,153,0.1)',color:'var(--accent-emerald)',border:'1px solid rgba(52,211,153,0.2)'}}>Finalized: {task.finalDecision}</span>;
    if (task.aiDecision) return <span style={{padding:'0.2rem 0.6rem',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:'rgba(56,189,248,0.1)',color:'var(--accent-blue)',border:'1px solid rgba(56,189,248,0.2)'}}>AI: {task.aiDecision}</span>;
    return <span style={{padding:'0.2rem 0.6rem',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:'rgba(251,113,133,0.1)',color:'var(--accent-rose)',border:'1px solid rgba(251,113,133,0.2)'}}>Awaiting Assessment</span>;
  };

  return (
    <div className="animate-in">
      <header style={{marginBottom:'2.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <h1 className="gradient-text">{isTechnician ? 'My Repair Tasks' : 'Maintenance Control'}</h1>
          <p className="text-muted">AI-assisted diagnostics and repair workflow management.</p>
        </div>
        {isOfficer && (
          <button className="btn-premium" onClick={openAssignModal}>
            <User size={18}/><span>Assign Technician</span>
          </button>
        )}
      </header>

      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:'2rem',alignItems:'start'}}>
        {/* Task List */}
        <div>
          <div className="glass-card" style={{padding:'1.5rem',marginBottom:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1.5rem'}}>
              <Activity size={20} style={{color:'var(--accent-blue)'}}/>
              <h2 style={{margin:0,fontWeight:700,fontSize:'1.15rem'}}>
                {isTechnician ? 'Assigned Diagnostics' : 'All Maintenance Tasks'}
              </h2>
              <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-dim)',fontWeight:600}}>{tasks.length} tasks</span>
            </div>
            {loading ? (
              <div style={{textAlign:'center',padding:'3rem',color:'var(--accent-blue)'}} className="pulse">Loading tasks...</div>
            ) : tasks.length===0 ? (
              <div style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>
                <Wrench size={40} style={{margin:'0 auto 1rem',opacity:0.2,display:'block'}}/>
                No maintenance tasks {isTechnician?'assigned to you':''} yet.
              </div>
            ) : tasks.map(t => (
              <div key={t.id} onClick={()=>{ setSelected(t); setForm({damageLevel:t.damageLevel||1,repairCost:t.repairCost||'',notes:t.notes||''}); }}
                style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1rem',borderRadius:12,cursor:'pointer',marginBottom:'0.75rem',
                  background:selected?.id===t.id?'rgba(56,189,248,0.05)':'rgba(255,255,255,0.02)',
                  border:selected?.id===t.id?'1px solid var(--accent-blue)':'1px solid rgba(255,255,255,0.06)',
                  transition:'all 0.2s'}}>
                <div style={{padding:'0.7rem',background:'rgba(255,255,255,0.04)',borderRadius:10,color:'var(--text-dim)'}}>
                  <Wrench size={20}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:'0.95rem',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.resource?.name||'Unknown Asset'}</p>
                  <p style={{fontSize:'0.75rem',color:'var(--text-dim)',margin:'0.2rem 0 0'}}>Tech: {t.technician?.name||'—'} • {t.resource?.type||'—'}</p>
                </div>
                <StatusChip task={t}/>
              </div>
            ))}
          </div>

          {/* Assessment Form */}
          {selected && isTechnician && !selected.finalDecision && (
            <div className="glass-card animate-in" style={{padding:'2rem',borderTop:'4px solid var(--accent-blue)'}}>
              <h2 style={{fontSize:'1.25rem',fontWeight:800,marginBottom:'0.4rem'}}>Submit Assessment</h2>
              <p style={{color:'var(--text-dim)',fontSize:'0.85rem',marginBottom:'1.5rem'}}>Asset: <strong style={{color:'var(--text-main)'}}>{selected.resource?.name}</strong> (ID: {selected.id.substring(0,10)})</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <div>
                  <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Damage Level</label>
                  <select className="input-glass" value={form.damageLevel} onChange={e=>setForm(f=>({...f,damageLevel:e.target.value}))}>
                    <option value="1">Level 1 — Minor / Cosmetic</option>
                    <option value="2">Level 2 — Functional Impairment</option>
                    <option value="3">Level 3 — Terminal Failure</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Est. Repair Cost ($)</label>
                  <div style={{position:'relative'}}>
                    <DollarSign size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)'}}/>
                    <input type="number" className="input-glass" style={{paddingLeft:36}} value={form.repairCost} onChange={e=>setForm(f=>({...f,repairCost:e.target.value}))} placeholder="0.00"/>
                  </div>
                </div>
              </div>
              <div style={{marginBottom:'1.5rem'}}>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Technician Observations</label>
                <textarea className="input-glass" rows="3" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Detail issues, part availability, structural concerns..."/>
              </div>
              <button onClick={handleInputData} disabled={saving||!form.repairCost} className="btn-premium" style={{width:'100%',justifyContent:'center',padding:'1rem'}}>
                {saving?<RefreshCw size={18} className="pulse"/>:<Brain size={18}/>}{saving?'Processing AI...':'Run AI Analysis'}
              </button>
            </div>
          )}

          {/* Resource Officer Finalize */}
          {selected && isOfficer && selected.aiDecision && !selected.finalDecision && (
            <div className="glass-card animate-in" style={{padding:'1.5rem',background:'rgba(56,189,248,0.03)',border:'1px solid rgba(56,189,248,0.1)'}}>
              <h3 style={{fontWeight:800,marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:8}}>
                <CheckCircle size={18} style={{color:'var(--accent-emerald)'}}/>Make Final Decision
              </h3>
              <p style={{fontSize:'0.85rem',color:'var(--text-dim)',marginBottom:'1rem'}}>AI recommends <strong style={{color:selected.aiDecision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)'}}>{selected.aiDecision}</strong>. Confirm or override below.</p>
              <button onClick={()=>setFinalModal(true)} className="btn-premium" style={{width:'100%',justifyContent:'center',padding:'0.875rem'}}>
                <CheckCircle size={18}/>Finalize Decision
              </button>
            </div>
          )}
        </div>

        {/* AI Sidebar */}
        <aside>
          {!selected ? (
            <div className="glass-card" style={{textAlign:'center',padding:'3rem',minHeight:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <Brain size={48} style={{opacity:0.2,marginBottom:'1.5rem'}}/>
              <p style={{color:'var(--text-dim)'}}>Select a task to view<br/>AI diagnostic analysis.</p>
            </div>
          ) : (
            <div>
              <div className="glass-card">
                <h3 style={{fontWeight:800,fontSize:'1.1rem',marginBottom:'1rem'}}>Task Details</h3>
                {[
                  ['Resource', selected.resource?.name||'—'],
                  ['Type', selected.resource?.type||'—'],
                  ['Location', selected.resource?.location||'—'],
                  ['Technician', selected.technician?.name||'—'],
                  ['Purchase Price', selected.resource?.purchasePrice?`$${Number(selected.resource.purchasePrice).toLocaleString()}`:'—'],
                  ['Reported By', selected.request?.user?.name||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:'0.8rem',color:'var(--text-dim)'}}>{k}</span>
                    <span style={{fontSize:'0.8rem',fontWeight:600,maxWidth:180,textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
                  </div>
                ))}
              </div>
              <AiCard task={selected}/>
              {selected.finalDecision && (
                <div className="glass-card" style={{marginTop:'1.5rem',textAlign:'center',padding:'1.5rem',background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.15)'}}>
                  <CheckCircle size={28} style={{color:'var(--accent-emerald)',margin:'0 auto 0.75rem',display:'block'}}/>
                  <p style={{fontWeight:800,fontSize:'1rem'}}>Final Decision: {selected.finalDecision}</p>
                  <p style={{fontSize:'0.8rem',color:'var(--text-dim)',marginTop:'0.4rem'}}>Workflow complete. Resource status updated.</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Assign Technician Modal ── */}
      {assignModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="glass-card animate-in" style={{width:'100%',maxWidth:480,padding:'2.5rem',borderTop:'4px solid var(--accent-blue)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
              <h2 style={{margin:0,fontWeight:800,fontSize:'1.4rem'}}>Assign Technician</h2>
              <button onClick={()=>setAssignModal(false)} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={22}/></button>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Approved Request</label>
              <select className="input-glass" value={assignForm.requestId} onChange={e=>setAssignForm(f=>({...f,requestId:e.target.value}))}>
                <option value="">Select a request...</option>
                {requests.map(r=><option key={r.id} value={r.id}>{r.type.replace('_',' ')} — {r.description?.substring(0,50)}</option>)}
              </select>
            </div>
            <div style={{marginBottom:'2rem'}}>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Technician</label>
              <select className="input-glass" value={assignForm.technicianId} onChange={e=>setAssignForm(f=>({...f,technicianId:e.target.value}))}>
                <option value="">Select a technician...</option>
                {technicians.map(t=><option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <button onClick={()=>setAssignModal(false)} style={{flex:1,background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,padding:'0.875rem',color:'var(--text-muted)',cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={handleAssign} disabled={assigning||!assignForm.requestId||!assignForm.technicianId} className="btn-premium" style={{flex:2,justifyContent:'center',padding:'0.875rem'}}>
                {assigning?<RefreshCw size={16} className="pulse"/>:<User size={16}/>}{assigning?'Assigning...':'Assign & Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Finalize Decision Modal ── */}
      {finalModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="glass-card animate-in" style={{width:'100%',maxWidth:420,padding:'2.5rem',borderTop:'4px solid var(--accent-emerald)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
              <h2 style={{margin:0,fontWeight:800,fontSize:'1.4rem'}}>Final Decision</h2>
              <button onClick={()=>setFinalModal(false)} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={22}/></button>
            </div>
            <p style={{color:'var(--text-dim)',fontSize:'0.875rem',marginBottom:'1.5rem'}}>AI recommended <strong style={{color:selected?.aiDecision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)'}}>{selected?.aiDecision}</strong>. You may override this decision.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'2rem'}}>
              {['REPAIR','REPLACE'].map(d=>(
                <button key={d} onClick={()=>setFinalDecision(d)} style={{padding:'1.25rem',borderRadius:12,fontWeight:800,fontSize:'1.1rem',cursor:'pointer',transition:'all 0.2s',
                  background:finalDecision===d?(d==='REPAIR'?'rgba(52,211,153,0.15)':'rgba(251,113,133,0.15)'):'rgba(255,255,255,0.03)',
                  border:finalDecision===d?`2px solid ${d==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'}`:'1px solid var(--border-glass)',
                  color:finalDecision===d?(d==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'):'var(--text-dim)'}}>
                  {d==='REPAIR'?'🔧':'📦'} {d}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <button onClick={()=>setFinalModal(false)} style={{flex:1,background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,padding:'0.875rem',color:'var(--text-muted)',cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={handleFinalize} disabled={finalizing} className="btn-premium" style={{flex:2,justifyContent:'center',padding:'0.875rem',background:finalDecision==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'}}>
                {finalizing?<RefreshCw size={16} className="pulse"/>:<CheckCircle size={16}/>}{finalizing?'Saving...':'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
