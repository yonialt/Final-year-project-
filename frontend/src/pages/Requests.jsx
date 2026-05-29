import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Plus, User, ShieldCheck, Zap, X, RefreshCw, Send, FileText } from 'lucide-react';

const STATUS_ORDER = ['PENDING', 'APPROVED_BY_HEAD', 'APPROVED_BY_DEAN', 'APPROVED_BY_OFFICER', 'PROCURED', 'COMPLETED'];
const WORKFLOW_STEPS = [
  { label: 'Submitted', status: 'PENDING' },
  { label: 'Head Approval', status: 'APPROVED_BY_HEAD' },
  { label: 'Dean Approval', status: 'APPROVED_BY_DEAN' },
  { label: 'Officer Approval', status: 'APPROVED_BY_OFFICER' },
  { label: 'Procured', status: 'PROCURED' },
  { label: 'Complete', status: 'COMPLETED' },
];

const getStepStatus = (reqStatus, stepStatus) => {
  if (reqStatus === 'REJECTED') return 'rejected';
  const ci = STATUS_ORDER.indexOf(reqStatus);
  const si = STATUS_ORDER.indexOf(stepStatus);
  if (ci >= si) return 'completed';
  if (ci === si - 1) return 'current';
  return 'pending';
};

const canApproveMap = {
  DEPARTMENT_HEAD: (r) => r.status === 'PENDING',
  ACADEMIC_DEAN: (r) => r.status === 'APPROVED_BY_HEAD',
  RESOURCE_OFFICER: (r) => r.status === 'APPROVED_BY_DEAN' || r.status === 'APPROVED_BY_OFFICER',
};
const nextStatusMap = {
  DEPARTMENT_HEAD: 'APPROVED_BY_HEAD',
  ACADEMIC_DEAN: 'APPROVED_BY_DEAN',
  RESOURCE_OFFICER: 'APPROVED_BY_OFFICER',
};

const URGENCY_STYLE = {
  HIGH: { color: 'var(--accent-rose)', bg: 'rgba(251,113,133,0.1)' },
  MEDIUM: { color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.1)' },
  LOW: { color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)' },
};

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resourceName: '', resourceType: '', description: '', urgency: 'MEDIUM', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try { const res = await API.get('/requests'); setRequests(res.data.data); }
    catch { } finally { setLoading(false); }
  };

  // Filter the list that gets rendered based on role:
  // Heads see only PENDING (what they can act on)
  // Deans see only APPROVED_BY_HEAD (what they can act on)
  // Once actioned the item is gone from their view
  const visibleRequests = (() => {
    if (user?.role === 'DEPARTMENT_HEAD') {
      return requests.filter(r => r.status === 'PENDING' || r.userId === user.id);
    }
    if (user?.role === 'ACADEMIC_DEAN') {
      return requests.filter(r => r.status === 'APPROVED_BY_HEAD' || r.userId === user.id);
    }
    return requests;
  })();

  const handleApprove = async (id) => {
    const nextStatus = user.role === 'RESOURCE_OFFICER'
      ? (requests.find(r => r.id === id)?.status === 'APPROVED_BY_OFFICER' ? 'PROCURED' : 'APPROVED_BY_OFFICER')
      : nextStatusMap[user.role];
    if (!nextStatus) return;
    try { await API.patch(`/requests/${id}/status`, { status: nextStatus }); fetchRequests(); } catch { }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await API.patch(`/requests/${rejectModal}/status`, { status: 'REJECTED', rejectionReason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch { }
  };

  const handleSubmit = async () => {
    if (!form.description || !form.resourceName) return;
    setSubmitting(true);
    try {
      await API.post('/requests', { ...form, type: 'NEW_RESOURCE' });
      setForm({ resourceName: '', resourceType: '', description: '', urgency: 'MEDIUM', reason: '' });
      setShowForm(false);
      fetchRequests();
    } catch { } finally { setSubmitting(false); }
  };

  return (
    <div className="animate-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="gradient-text text-3xl font-extrabold tracking-tight">Resource Requests</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN'].includes(user?.role)
              ? 'Submit and track new resource procurement requests.'
              : 'Manage procurement and execute approved requests.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchRequests}><RefreshCw size={15} /> Refresh</button>
          {['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN'].includes(user?.role) && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </header>

      {/* Request Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-12 pulse" style={{ color: 'var(--accent-blue)' }}>Loading requests...</div>
        ) : visibleRequests.length === 0 ? (
          <div className="glass-card text-center py-12">
            <FileText size={40} className="mx-auto mb-4" style={{ opacity: 0.2 }} />
            <p style={{ color: 'var(--text-dim)' }}>No pending requests to action.</p>
          </div>
        ) : visibleRequests.map(req => {
          const canApprove = canApproveMap[user?.role]?.(req) || false;
          const urgStyle = URGENCY_STYLE[req.urgency] || URGENCY_STYLE.MEDIUM;
          return (
            <div key={req.id} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-sm">{req.resourceName || req.description?.substring(0, 50)}</h3>
                    <span className="badge" style={{ color: urgStyle.color, background: urgStyle.bg, border: `1px solid ${urgStyle.color}30` }}>
                      {req.urgency}
                    </span>
                    {req.status === 'REJECTED' && (
                      <span className="badge" style={{ color: 'var(--accent-rose)', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)' }}>Rejected</span>
                    )}
                    {req.status === 'COMPLETED' && (
                      <span className="badge" style={{ color: 'var(--accent-emerald)', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <CheckCircle size={10} className="inline mr-0.5" /> Complete
                      </span>
                    )}
                    {req.status === 'PROCURED' && (
                      <span className="badge" style={{ color: 'var(--accent-blue)', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>Procured</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{req.description}</p>
                  {req.reason && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      <strong>Reason:</strong> {req.reason}
                    </p>
                  )}
                  {(req.rejectionReason || req.rejectedBy) && (
                    <div className="mt-2 px-3 py-1.5 rounded-lg text-xs animate-in" style={{ background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.12)', color: 'var(--accent-rose)' }}>
                      {req.rejectedBy && <div className="mb-1 font-extrabold text-[0.7rem] uppercase tracking-wider">Rejected by: {req.rejectedBy}</div>}
                      {req.rejectionReason && <p style={{ margin: 0 }}><strong>Reason:</strong> {req.rejectionReason}</p>}
                    </div>
                  )}
                </div>

                {canApprove && (
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => handleApprove(req.id)} className="btn-success">
                      <CheckCircle size={14} /> {req.status === 'APPROVED_BY_OFFICER' ? 'Mark Procured' : 'Approve'}
                    </button>
                    {req.status !== 'APPROVED_BY_OFFICER' && (
                      <button onClick={() => { setRejectModal(req.id); setRejectReason(''); }} className="btn-danger">
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-3 flex-wrap gap-3" style={{ borderTop: '1px solid var(--border-glass)' }}>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                    <User size={12} /> <strong style={{ color: 'var(--text-main)' }}>{req.user?.name || 'Staff'}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                    <Clock size={12} /> {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                  {req.resourceType && (
                    <div className="text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                      Category: <strong style={{ color: 'var(--text-main)' }}>{req.resourceType}</strong>
                    </div>
                  )}
                </div>

                {/* Workflow Stepper */}
                <div className="flex items-center gap-1">
                  {WORKFLOW_STEPS.map((step, i) => {
                    const ss = getStepStatus(req.status, step.status);
                    const color = ss === 'completed' ? 'var(--accent-emerald)' : ss === 'current' ? 'var(--accent-blue)' : ss === 'rejected' ? 'var(--accent-rose)' : 'rgba(255,255,255,0.08)';
                    return (
                      <React.Fragment key={step.status}>
                        <div title={step.label}
                          className="flex items-center justify-center shrink-0 transition-all"
                          style={{
                            width: 22, height: 22, borderRadius: '50%', background: color, color: 'white', fontSize: '0.6rem', fontWeight: 700,
                            border: ss === 'current' ? '2px solid white' : 'none'
                          }}>
                          {ss === 'completed' ? <ShieldCheck size={11} /> : <span>{i + 1}</span>}
                        </div>
                        {i < WORKFLOW_STEPS.length - 1 && (
                          <div className="shrink-0" style={{ width: 16, height: 2, background: ss === 'completed' ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.06)' }} />
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

      {/* ── New Request Modal ── */}
      {showForm && createPortal(
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{ maxWidth: 520 }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">New Resource Request</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Resource Name</label>
                  <input className="input-glass" placeholder="e.g. Dell Workstation" value={form.resourceName} onChange={e => setForm(f => ({ ...f, resourceName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Category</label>
                  <select className="input-glass" value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="LAB_EQUIPMENT">Lab Equipment</option>
                    <option value="PRINTING">Printing</option>
                    <option value="NETWORKING">Networking</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Urgency</label>
                <select className="input-glass" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Description</label>
                <textarea className="input-glass" rows="2" placeholder="What do you need?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Reason / Justification</label>
                <textarea className="input-glass" rows="2" placeholder="Why is this resource needed?" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center py-3">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.description || !form.resourceName}
                className="btn-primary flex-[2] justify-center py-3">
                {submitting ? <><RefreshCw size={15} className="spin" /> Submitting...</> : <><Send size={15} /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && createPortal(
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{ maxWidth: 420, borderTopColor: 'var(--accent-rose)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">Reject Request</h2>
              <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>Please provide a reason for rejecting this request.</p>
            <textarea className="input-glass mb-4" rows="3" placeholder="Reason for rejection..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleReject} className="btn-danger flex-[2] justify-center py-2.5">
                <XCircle size={15} /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}