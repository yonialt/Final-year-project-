import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, Brain, CheckCircle, Info, DollarSign, Activity, X, User, RefreshCw, Zap, TrendingUp, AlertTriangle, Clock, Send } from 'lucide-react';

const DAMAGE_LABELS = { 1:'Minor (Cosmetic)', 2:'Moderate (Functional)', 3:'Severe (Terminal)' };
const STATUS_LABELS = {
  PENDING_INSPECTION: { label:'Awaiting Inspection', color:'var(--accent-amber)' },
  INSPECTED:          { label:'Inspected', color:'var(--accent-blue)' },
  AI_DECIDED:         { label:'AI Decision Ready', color:'var(--accent-purple)' },
  FINALIZED:          { label:'Finalized', color:'var(--accent-emerald)' },
  REPAIR_IN_PROGRESS: { label:'Repair In Progress', color:'var(--accent-rose)' },
  COMPLETED:          { label:'Completed', color:'var(--accent-emerald)' },
};

const AiCard = ({ task }) => {
  if (!task?.aiDecision) return null;
  const isReplace = task.aiDecision === 'REPLACE';
  const pct = Math.round((task.aiConfidence||0)*100);
  const ratio = task.repairCost && task.newPrice ? ((task.repairCost/task.newPrice)*100).toFixed(1) : null;
  return (
    <div className="glass-card animate-in mt-4" style={{borderLeft:`3px solid ${isReplace?'var(--accent-rose)':'var(--accent-emerald)'}`}}>
      <div className="flex items-center gap-2 mb-4">
        <Brain size={18} style={{color:'var(--accent-blue)'}} className="pulse"/>
        <h3 className="font-extrabold text-sm">AI Recommendation</h3>
        <span className="badge-ai ml-auto"><Zap size={11}/>Live</span>
      </div>
      <div className="text-center p-4 rounded-xl mb-4"
           style={{background:isReplace?'rgba(251,113,133,0.05)':'rgba(52,211,153,0.05)',border:`1px solid ${isReplace?'rgba(251,113,133,0.15)':'rgba(52,211,153,0.15)'}`}}>
        <p className="text-[0.6rem] font-extrabold uppercase tracking-widest mb-1" style={{color:'var(--text-dim)'}}>Decision</p>
        <h1 className="text-3xl font-black" style={{color:isReplace?'var(--accent-rose)':'var(--accent-emerald)'}}>{task.aiDecision}</h1>
        <div className="flex items-center justify-center gap-1.5 mt-1" style={{color:'var(--text-muted)'}}>
          <TrendingUp size={13}/><span className="text-sm font-semibold">{pct}% Confidence</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-lg" style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--border-glass)'}}>
          <p className="text-[0.6rem] font-bold uppercase mb-0.5" style={{color:'var(--text-dim)'}}>Asset Age</p>
          <p className="font-extrabold">{task.age} <span className="text-xs font-medium" style={{color:'var(--text-dim)'}}>yrs</span></p>
        </div>
        <div className="p-3 rounded-lg" style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--border-glass)'}}>
          <p className="text-[0.6rem] font-bold uppercase mb-0.5" style={{color:'var(--text-dim)'}}>Damage</p>
          <p className="font-extrabold">{task.damageLevel}<span style={{color:'var(--text-dim)'}}>/3</span></p>
        </div>
      </div>
      {ratio && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span style={{color:'var(--text-dim)'}}>Repair / New Price Ratio</span>
            <span className="font-bold">{ratio}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full" style={{width:`${Math.min(parseFloat(ratio),100)}%`,background:'var(--accent-blue)'}}/>
          </div>
        </div>
      )}
      {task.aiMethod && (
        <p className="text-[0.65rem]" style={{color:'var(--text-dim)'}}>Method: <strong>{task.aiMethod}</strong></p>
      )}
    </div>
  );
};

export default function Maintenance() {
  const { user } = useAuth();
  const isTech = user?.role === 'TECHNICIAN';
  const isOfficer = ['RESOURCE_OFFICER','ADMIN'].includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ damageLevel:1, repairCost:'', inspectionNotes:'' });
  const [saving, setSaving] = useState(false);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [damageReports, setDamageReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignForm, setAssignForm] = useState({ damageReportId:'', technicianId:'' });
  const [assigning, setAssigning] = useState(false);

  // Finalize modal
  const [finalModal, setFinalModal] = useState(false);
  const [finalDecision, setFinalDecision] = useState('REPAIR');
  const [officerNotes, setOfficerNotes] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  // Repair completion
  const [repairNotes, setRepairNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try { const res = await API.get('/maintenance'); setTasks(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  const openAssignModal = async () => {
    try {
      const [drRes, uRes] = await Promise.all([
        API.get('/damage-reports'),
        API.get('/admin/users')
      ]);
      setDamageReports(drRes.data.data.filter(r => r.status === 'FORWARDED_TO_OFFICER'));
      setTechnicians(uRes.data.data.filter(u => u.role === 'TECHNICIAN'));
      setAssignForm({ damageReportId:'', technicianId:'' });
      setAssignModal(true);
    } catch { alert('Failed to load data'); }
  };

  const handleAssign = async () => {
    if (!assignForm.damageReportId || !assignForm.technicianId) return;
    setAssigning(true);
    try {
      await API.post('/maintenance/assign', assignForm);
      setAssignModal(false);
      fetchTasks();
    } catch {} finally { setAssigning(false); }
  };

  const handleInspect = async () => {
    if (!form.repairCost) return;
    setSaving(true);
    try {
      const res = await API.patch(`/maintenance/${selected.id}/inspect`, {
        damageLevel: parseInt(form.damageLevel),
        repairCost: parseFloat(form.repairCost),
        inspectionNotes: form.inspectionNotes
      });
      setSelected(res.data.data);
      fetchTasks();
    } catch {} finally { setSaving(false); }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await API.patch(`/maintenance/${selected.id}/finalize`, { finalDecision, officerNotes });
      setFinalModal(false);
      fetchTasks();
      setSelected(null);
    } catch {} finally { setFinalizing(false); }
  };

  const handleCompleteRepair = async () => {
    setCompleting(true);
    try {
      await API.patch(`/maintenance/${selected.id}/complete-repair`, { repairNotes });
      fetchTasks();
      setSelected(null);
    } catch {} finally { setCompleting(false); }
  };

  const StatusChip = ({ task }) => {
    const s = STATUS_LABELS[task.status] || { label: task.status, color:'var(--text-dim)' };
    return <span className="badge" style={{color:s.color, background:`${s.color}15`, border:`1px solid ${s.color}30`}}>{s.label}</span>;
  };

  return (
    <div className="animate-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="gradient-text text-3xl font-extrabold tracking-tight">
            {isTech ? 'My Repair Tasks' : 'Maintenance Control'}
          </h1>
          <p className="mt-1 text-sm" style={{color:'var(--text-muted)'}}>
            {isTech ? 'Inspect assets and submit damage assessments for AI analysis.' :
             'AI-assisted diagnostics, technician assignment, and repair workflow.'}
          </p>
        </div>
        {isOfficer && (
          <button className="btn-primary" onClick={openAssignModal}>
            <User size={16}/> Assign Technician
          </button>
        )}
      </header>

      <div className="grid gap-5" style={{gridTemplateColumns:'1fr 360px', alignItems:'start'}}>
        {/* Task List */}
        <div>
          <div className="glass-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} style={{color:'var(--accent-blue)'}}/>
              <h2 className="font-bold text-sm">{isTech ? 'Assigned Tasks' : 'All Tasks'}</h2>
              <span className="ml-auto text-xs font-semibold" style={{color:'var(--text-dim)'}}>{tasks.length} tasks</span>
            </div>
            {loading ? (
              <div className="text-center py-10 pulse" style={{color:'var(--accent-blue)'}}>Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10" style={{color:'var(--text-dim)'}}>
                <Wrench size={36} className="mx-auto mb-3" style={{opacity:0.2}}/>
                No maintenance tasks yet.
              </div>
            ) : tasks.map(t => (
              <div key={t.id}
                onClick={()=>{ setSelected(t); setForm({damageLevel:t.damageLevel||1,repairCost:t.repairCost||'',inspectionNotes:t.inspectionNotes||''}); setRepairNotes(''); }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-all"
                style={{
                  background:selected?.id===t.id?'rgba(56,189,248,0.05)':'rgba(255,255,255,0.02)',
                  border:selected?.id===t.id?'1px solid var(--accent-blue)':'1px solid rgba(255,255,255,0.05)'
                }}>
                <div className="p-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)', color:'var(--text-dim)'}}>
                  <Wrench size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{t.resource?.name||'Unknown'}</p>
                  <p className="text-xs mt-0.5" style={{color:'var(--text-dim)'}}>
                    Tech: {t.technician?.name||'—'} • {t.resource?.type||'—'}
                  </p>
                </div>
                <StatusChip task={t}/>
              </div>
            ))}
          </div>

          {/* Technician: Inspection Form */}
          {selected && isTech && selected.status === 'PENDING_INSPECTION' && (
            <div className="glass-card animate-in" style={{borderTop:'3px solid var(--accent-blue)', padding:'1.5rem'}}>
              <h2 className="font-extrabold text-base mb-1">Submit Inspection</h2>
              <p className="text-xs mb-4" style={{color:'var(--text-dim)'}}>
                Asset: <strong style={{color:'var(--text-main)'}}>{selected.resource?.name}</strong>
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[0.65rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Damage Level</label>
                  <select className="input-glass" value={form.damageLevel} onChange={e=>setForm(f=>({...f,damageLevel:e.target.value}))}>
                    <option value="1">Level 1 — Minor / Cosmetic</option>
                    <option value="2">Level 2 — Functional Impairment</option>
                    <option value="3">Level 3 — Terminal Failure</option>
                  </select>
                </div>
                <div>
                  <label className="text-[0.65rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Est. Repair Cost ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-dim)'}}/>
                    <input type="number" className="input-glass pl-8" value={form.repairCost} onChange={e=>setForm(f=>({...f,repairCost:e.target.value}))} placeholder="0.00"/>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[0.65rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Inspection Notes</label>
                <textarea className="input-glass" rows="3" value={form.inspectionNotes} onChange={e=>setForm(f=>({...f,inspectionNotes:e.target.value}))}
                  placeholder="Detail issues, part availability, structural concerns..."/>
              </div>
              <button onClick={handleInspect} disabled={saving||!form.repairCost} className="btn-primary w-full justify-center py-3">
                {saving ? <><RefreshCw size={16} className="spin"/> Running AI Analysis...</> : <><Brain size={16}/> Submit & Run AI Analysis</>}
              </button>
            </div>
          )}

          {/* Technician: Repair Completion Form */}
          {selected && isTech && selected.status === 'REPAIR_IN_PROGRESS' && (
            <div className="glass-card animate-in" style={{borderTop:'3px solid var(--accent-emerald)', padding:'1.5rem'}}>
              <h2 className="font-extrabold text-base mb-1">Complete Repair</h2>
              <p className="text-xs mb-4" style={{color:'var(--text-dim)'}}>
                Submit completion report for: <strong style={{color:'var(--text-main)'}}>{selected.resource?.name}</strong>
              </p>
              <div className="mb-4">
                <label className="text-[0.65rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Repair Notes</label>
                <textarea className="input-glass" rows="3" value={repairNotes} onChange={e=>setRepairNotes(e.target.value)}
                  placeholder="What was repaired, parts replaced, testing results..."/>
              </div>
              <button onClick={handleCompleteRepair} disabled={completing} className="btn-primary w-full justify-center py-3"
                      style={{background:'var(--accent-emerald)'}}>
                {completing ? <><RefreshCw size={16} className="spin"/> Submitting...</> : <><CheckCircle size={16}/> Mark Repair Complete</>}
              </button>
            </div>
          )}

          {/* Officer: Finalize Button */}
          {selected && isOfficer && selected.aiDecision && !selected.finalDecision && (
            <div className="glass-card animate-in mt-4" style={{background:'rgba(56,189,248,0.03)', border:'1px solid rgba(56,189,248,0.1)', padding:'1.25rem'}}>
              <h3 className="font-extrabold mb-1 flex items-center gap-2">
                <CheckCircle size={16} style={{color:'var(--accent-emerald)'}}/> Make Final Decision
              </h3>
              <p className="text-sm mb-3" style={{color:'var(--text-dim)'}}>
                AI recommends <strong style={{color:selected.aiDecision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)'}}>{selected.aiDecision}</strong>. Confirm or override.
              </p>
              <button onClick={()=>{ setFinalDecision(selected.aiDecision); setOfficerNotes(''); setFinalModal(true); }}
                className="btn-primary w-full justify-center py-2.5">
                <CheckCircle size={16}/> Finalize Decision
              </button>
            </div>
          )}
        </div>

        {/* Detail Sidebar */}
        <aside>
          {!selected ? (
            <div className="glass-card text-center py-12 flex flex-col items-center justify-center" style={{minHeight:300}}>
              <Brain size={40} className="mb-4" style={{opacity:0.2}}/>
              <p className="text-sm" style={{color:'var(--text-dim)'}}>Select a task to view<br/>AI diagnostic analysis.</p>
            </div>
          ) : (
            <div>
              <div className="glass-card">
                <h3 className="font-extrabold text-sm mb-3">Task Details</h3>
                {[
                  ['Resource', selected.resource?.name||'—'],
                  ['Type', selected.resource?.type||'—'],
                  ['Location', selected.resource?.location||'—'],
                  ['Technician', selected.technician?.name||'—'],
                  ['Purchase Price', selected.resource?.purchasePrice?`$${Number(selected.resource.purchasePrice).toLocaleString()}`:'—'],
                  ['Reported By', selected.damageReport?.user?.name||'—'],
                  ['Status', selected.status?.replace(/_/g,' ') || '—'],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span className="text-xs" style={{color:'var(--text-dim)'}}>{k}</span>
                    <span className="text-xs font-semibold max-w-[160px] text-right truncate">{v}</span>
                  </div>
                ))}
              </div>
              <AiCard task={selected}/>
              {selected.finalDecision && (
                <div className="glass-card mt-4 text-center p-4"
                     style={{background:'rgba(52,211,153,0.04)', border:'1px solid rgba(52,211,153,0.15)'}}>
                  <CheckCircle size={24} className="mx-auto mb-2" style={{color:'var(--accent-emerald)'}}/>
                  <p className="font-extrabold">Final: {selected.finalDecision}</p>
                  <p className="text-xs mt-1" style={{color:'var(--text-dim)'}}>
                    {selected.status === 'COMPLETED' ? 'Workflow complete.' : 
                     selected.finalDecision === 'REPAIR' ? 'Repair in progress.' : 'Resource disposed.'}
                  </p>
                  {selected.officerNotes && (
                    <p className="text-xs mt-2" style={{color:'var(--text-muted)'}}>Note: {selected.officerNotes}</p>
                  )}
                </div>
              )}
              {selected.repairedAt && (
                <div className="glass-card mt-4 p-4" style={{background:'rgba(52,211,153,0.04)', border:'1px solid rgba(52,211,153,0.15)'}}>
                  <p className="text-xs font-bold mb-1" style={{color:'var(--accent-emerald)'}}>✅ Repair Completed</p>
                  <p className="text-xs" style={{color:'var(--text-dim)'}}>{new Date(selected.repairedAt).toLocaleString()}</p>
                  {selected.repairNotes && <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>{selected.repairNotes}</p>}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Assign Technician Modal ── */}
      {assignModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">Assign Technician</h2>
              <button onClick={()=>setAssignModal(false)} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{color:'var(--text-dim)'}}>Damage Report</label>
              <select className="input-glass" value={assignForm.damageReportId} onChange={e=>setAssignForm(f=>({...f,damageReportId:e.target.value}))}>
                <option value="">Select a forwarded damage report...</option>
                {damageReports.map(r=><option key={r.id} value={r.id}>{r.resource?.name} — {r.description?.substring(0,50)}</option>)}
              </select>
              {damageReports.length === 0 && (
                <p className="text-xs mt-1" style={{color:'var(--accent-amber)'}}>No damage reports awaiting assignment. Reports must be forwarded by a Department Head first.</p>
              )}
            </div>
            <div className="mb-5">
              <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{color:'var(--text-dim)'}}>Technician</label>
              <select className="input-glass" value={assignForm.technicianId} onChange={e=>setAssignForm(f=>({...f,technicianId:e.target.value}))}>
                <option value="">Select a technician...</option>
                {technicians.map(t=><option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setAssignModal(false)} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleAssign} disabled={assigning||!assignForm.damageReportId||!assignForm.technicianId}
                className="btn-primary flex-[2] justify-center py-2.5">
                {assigning?<><RefreshCw size={15} className="spin"/> Assigning...</>:<><User size={15}/> Assign & Create Task</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Finalize Decision Modal ── */}
      {finalModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{borderTopColor:'var(--accent-emerald)'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold">Final Decision</h2>
              <button onClick={()=>setFinalModal(false)} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <p className="text-sm mb-4" style={{color:'var(--text-dim)'}}>
              AI recommended <strong style={{color:selected?.aiDecision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)'}}>{selected?.aiDecision}</strong>. You may override.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['REPAIR','REPLACE'].map(d=>(
                <button key={d} onClick={()=>setFinalDecision(d)}
                  className="p-4 rounded-xl font-extrabold text-lg cursor-pointer transition-all text-center"
                  style={{
                    background:finalDecision===d?(d==='REPAIR'?'rgba(52,211,153,0.12)':'rgba(251,113,133,0.12)'):'rgba(255,255,255,0.03)',
                    border:finalDecision===d?`2px solid ${d==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'}`:'1px solid var(--border-glass)',
                    color:finalDecision===d?(d==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'):'var(--text-dim)'
                  }}>
                  {d==='REPAIR'?'🔧':'📦'} {d}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{color:'var(--text-dim)'}}>Notes (optional)</label>
              <textarea className="input-glass" rows="2" value={officerNotes} onChange={e=>setOfficerNotes(e.target.value)} placeholder="Any additional notes..."/>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setFinalModal(false)} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleFinalize} disabled={finalizing} className="btn-primary flex-[2] justify-center py-2.5"
                      style={{background:finalDecision==='REPAIR'?'var(--accent-emerald)':'var(--accent-rose)'}}>
                {finalizing?<><RefreshCw size={15} className="spin"/> Saving...</>:<><CheckCircle size={15}/> Confirm {finalDecision}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
