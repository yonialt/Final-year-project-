import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Plus, ArrowRight, User, ShieldCheck, Send, Zap } from 'lucide-react';

const STATUS_ORDER = ['PENDING','APPROVED_BY_HEAD','APPROVED_BY_DEAN','APPROVED_BY_OFFICER','COMPLETED'];

const getStepStatus = (reqStatus, stepStatus) => {
  if (reqStatus === 'REJECTED') return 'rejected';
  const ci = STATUS_ORDER.indexOf(reqStatus);
  const si = STATUS_ORDER.indexOf(stepStatus);
  if (ci >= si) return 'completed';
  if (ci === si - 1) return 'current';
  return 'pending';
};

const canApproveMap = {
  DEPARTMENT_HEAD:  (r) => r.status === 'PENDING',
  ACADEMIC_DEAN:    (r) => r.status === 'APPROVED_BY_HEAD',
  RESOURCE_OFFICER: (r) => r.status === 'APPROVED_BY_DEAN',
};
const nextStatusMap = {
  DEPARTMENT_HEAD:  'APPROVED_BY_HEAD',
  ACADEMIC_DEAN:    'APPROVED_BY_DEAN',
  RESOURCE_OFFICER: 'APPROVED_BY_OFFICER',
};

const WORKFLOW_STEPS = [
  { label:'Submitted',     status:'PENDING' },
  { label:'Head Approv.',  status:'APPROVED_BY_HEAD' },
  { label:'Dean Approv.',  status:'APPROVED_BY_DEAN' },
  { label:'Officer Approv.',status:'APPROVED_BY_OFFICER' },
  { label:'Complete',      status:'COMPLETED' },
];

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [formType, setFormType] = useState('DAMAGE_REPORT');
  const [formDesc, setFormDesc] = useState('');
  const [formResourceId, setFormResourceId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    fetchRequests(); 
    if (user?.role === 'STAFF') fetchResources();
  }, [user]);

  const fetchResources = async () => {
    try { const res = await API.get('/resources'); setResources(res.data.data); } catch {}
  };

  const fetchRequests = async () => {
    setLoading(true);
    try { const res = await API.get('/requests'); setRequests(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id, status) => {
    try { await API.patch(`/requests/${id}/status`, { status }); fetchRequests(); } catch {}
  };

  const handleSubmit = async () => {
    if (!formDesc.trim()) return;
    if (formType === 'DAMAGE_REPORT' && !formResourceId) return; // Must select resource
    setSubmitting(true);
    try {
      await API.post('/requests', { 
        type: formType, 
        description: formDesc, 
        priority: 'MEDIUM',
        resourceId: formType === 'DAMAGE_REPORT' ? formResourceId : undefined
      });
      setFormDesc(''); 
      setFormResourceId('');
      fetchRequests();
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="animate-in">
      <header style={{marginBottom:'2.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <h1 className="gradient-text">Procurement & Maintenance</h1>
          <p className="text-muted">Lifecycle management for university resource requests.</p>
        </div>
        <span style={{fontSize:'0.8rem',color:'var(--text-dim)',fontWeight:600}}>{requests.length} total requests</span>
      </header>

      {/* Staff submission form */}
      {user?.role === 'STAFF' && (
        <div className="glass-card" style={{marginBottom:'2rem',padding:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1.5rem'}}>
            <Send size={20} style={{color:'var(--accent-blue)'}}/>
            <h2 style={{fontWeight:700,fontSize:'1.15rem',margin:0}}>Submit a New Request</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns: formType === 'DAMAGE_REPORT' ? '1fr 1fr 2fr auto' : '1fr 2fr auto',gap:'1rem',alignItems:'flex-end'}}>
            <div>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Type</label>
              <select className="input-glass" value={formType} onChange={e=>setFormType(e.target.value)}>
                <option value="DAMAGE_REPORT">Damage Report</option>
                <option value="NEW_RESOURCE">New Resource Request</option>
              </select>
            </div>
            {formType === 'DAMAGE_REPORT' && (
              <div>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Asset</label>
                <select className="input-glass" value={formResourceId} onChange={e=>setFormResourceId(e.target.value)}>
                  <option value="">Select Asset...</option>
                  {resources.filter(r => r.status !== 'DISPOSED').map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Description</label>
              <input type="text" className="input-glass" placeholder="Describe the issue or resource needed..."
                value={formDesc} onChange={e=>setFormDesc(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            </div>
            <button className="btn-premium" onClick={handleSubmit} disabled={!formDesc.trim()||submitting||(formType==='DAMAGE_REPORT'&&!formResourceId)}>
              <Plus size={18}/><span>{submitting?'Submitting...':'Submit'}</span>
            </button>
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'4rem'}} className="pulse text-accent">Synchronising requests...</div>
        ) : requests.length===0 ? (
          <div className="glass-card" style={{textAlign:'center',padding:'4rem'}}>
            <Clock size={48} style={{margin:'0 auto 1.5rem',opacity:0.2,display:'block'}}/>
            <p style={{color:'var(--text-dim)'}}>No active requests found.</p>
          </div>
        ) : requests.map(req => {
          const canApprove = canApproveMap[user?.role]?.(req) || false;
          return (
            <div key={req.id} className="glass-card" style={{padding:'1.5rem 2rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'0.5rem',flexWrap:'wrap'}}>
                    <h3 style={{fontSize:'1rem',fontWeight:800,margin:0}}>{req.type.replace('_',' ')}</h3>
                    {req.priority==='HIGH'&&<span className="badge-ai" style={{color:'var(--accent-rose)',borderColor:'rgba(251,113,133,0.3)'}}><AlertCircle size={12}/>HIGH</span>}
                    {req.status==='REJECTED'&&<span className="badge-ai" style={{color:'var(--text-dim)',borderColor:'var(--border-glass)'}}>Rejected</span>}
                    {req.status==='COMPLETED'&&<span className="badge-ai" style={{color:'var(--accent-emerald)',borderColor:'rgba(52,211,153,0.3)'}}><CheckCircle size={12}/>Done</span>}
                    {req.status==='IN_MAINTENANCE'&&<span className="badge-ai" style={{color:'var(--accent-blue)',borderColor:'rgba(56,189,248,0.3)'}}>In Maintenance</span>}
                  </div>
                  <p style={{color:'var(--text-muted)',fontSize:'0.9rem',margin:0}}>{req.description}</p>

                  {/* AI recommendation inline */}
                  {req.maintenance?.aiDecision&&(
                    <div style={{marginTop:'0.75rem',display:'inline-flex',alignItems:'center',gap:10,padding:'0.5rem 1rem',background:'rgba(56,189,248,0.04)',borderRadius:10,border:'1px solid rgba(56,189,248,0.1)'}}>
                      <Zap size={13} style={{color:'var(--accent-blue)'}} className="pulse"/>
                      <span style={{fontSize:'0.75rem',color:'var(--text-dim)'}}>AI Recommendation:</span>
                      <span style={{fontWeight:900,color:req.maintenance.aiDecision==='REPLACE'?'var(--accent-rose)':'var(--accent-emerald)'}}>{req.maintenance.aiDecision}</span>
                      <span style={{fontSize:'0.75rem',color:'var(--text-dim)'}}>{Math.round(req.maintenance.aiConfidence*100)}% confidence</span>
                    </div>
                  )}
                </div>

                {canApprove&&(
                  <div style={{display:'flex',gap:8,flexShrink:0,marginLeft:'1rem'}}>
                    <button onClick={()=>handleUpdateStatus(req.id,nextStatusMap[user.role])} className="btn-premium" style={{padding:'0.5rem 1rem'}}>
                      <CheckCircle size={15}/><span>Approve</span>
                    </button>
                    <button onClick={()=>handleUpdateStatus(req.id,'REJECTED')} className="btn-premium"
                      style={{background:'rgba(255,255,255,0.05)',color:'var(--accent-rose)',border:'1px solid rgba(251,113,133,0.2)',boxShadow:'none',padding:'0.5rem 1rem'}}>
                      <XCircle size={15}/><span>Reject</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer: meta + stepper */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'1rem',borderTop:'1px solid var(--border-glass)',flexWrap:'wrap',gap:'1rem'}}>
                <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.75rem',color:'var(--text-dim)'}}>
                    <User size={13}/><span>By: <strong style={{color:'var(--text-main)'}}>{req.user?.name||'Staff'}</strong></span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.75rem',color:'var(--text-dim)'}}>
                    <Clock size={13}/><span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.resource&&(
                    <div style={{fontSize:'0.75rem',color:'var(--text-dim)'}}>
                      Asset: <strong style={{color:'var(--text-main)'}}>{req.resource.name}</strong>
                    </div>
                  )}
                </div>

                {/* Workflow Stepper */}
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  {WORKFLOW_STEPS.map((step,i) => {
                    const ss = getStepStatus(req.status,step.status);
                    const color = ss==='completed'?'var(--accent-emerald)':ss==='current'?'var(--accent-blue)':ss==='rejected'?'var(--accent-rose)':'rgba(255,255,255,0.08)';
                    return (
                      <React.Fragment key={step.status}>
                        <div title={step.label} style={{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:color,color:'white',fontSize:'0.65rem',fontWeight:700,flexShrink:0,transition:'all 0.3s',border:ss==='current'?'2px solid white':'none'}}>
                          {ss==='completed'?<ShieldCheck size={13}/>:<span>{i+1}</span>}
                        </div>
                        {i<WORKFLOW_STEPS.length-1&&(
                          <div style={{width:24,height:2,background:ss==='completed'?'var(--accent-emerald)':'rgba(255,255,255,0.06)',flexShrink:0}}/>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
