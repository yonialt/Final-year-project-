import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Plus, Clock, MapPin, User, ArrowRight, CheckCircle, Send, X, RefreshCw } from 'lucide-react';

const STATUS_STYLE = {
  PENDING: { color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.1)', label: 'Pending' },
  FORWARDED_TO_OFFICER: { color: 'var(--accent-blue)', bg: 'rgba(56,189,248,0.1)', label: 'Forwarded to Officer' },
  INSPECTION_ASSIGNED: { color: 'var(--accent-purple)', bg: 'rgba(129,140,248,0.1)', label: 'Inspection Assigned' },
  INSPECTED: { color: 'var(--accent-blue)', bg: 'rgba(56,189,248,0.1)', label: 'Inspected' },
  AI_RECOMMENDED: { color: 'var(--accent-purple)', bg: 'rgba(129,140,248,0.1)', label: 'AI Recommended' },
  REPAIR_ASSIGNED: { color: 'var(--accent-rose)', bg: 'rgba(251,113,133,0.1)', label: 'Repair Assigned' },
  REPAIR_COMPLETED: { color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.1)', label: 'Repair Complete' },
  REPLACED: { color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.1)', label: 'Replaced' },
  CLOSED: { color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)', label: 'Closed' },
};

const Badge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>{s.label}</span>;
};

export default function DamageReports() {
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';
  const isDeptHead = user?.role === 'DEPARTMENT_HEAD';
  const isOfficer = ['RESOURCE_OFFICER', 'ADMIN'].includes(user?.role);

  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resourceId: '', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, resRes] = await Promise.all([
        API.get('/damage-reports'),
        API.get('/resources')
      ]);
      setReports(rRes.data.data);
      setResources(resRes.data.data);
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.resourceId || !form.description || !form.location) return;
    setSubmitting(true);
    try {
      await API.post('/damage-reports', form);
      setForm({ resourceId: '', description: '', location: '' });
      setShowForm(false);
      fetchData();
    } catch { } finally { setSubmitting(false); }
  };

  const handleForward = async (id) => {
    try { await API.patch(`/damage-reports/${id}/forward`); fetchData(); } catch { }
  };

  const getSelectedResource = () => resources.find(r => r.id === form.resourceId);

  return (
    <div className="animate-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="gradient-text text-3xl font-extrabold tracking-tight">Damage Reports</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {isStaff ? 'Report damaged resources and track repair status.' :
              isDeptHead ? 'Review and forward damage reports to the Resource Officer.' :
                isOfficer ? 'Manage damage reports and assign technicians for inspection.' :
                  'View damage reports across the university.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchData}><RefreshCw size={15} /> Refresh</button>
          {isStaff && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Report Damage
            </button>
          )}
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: reports.length, color: 'var(--accent-blue)' },
          { label: 'Pending', count: reports.filter(r => r.status === 'PENDING').length, color: 'var(--accent-amber)' },
          { label: 'In Progress', count: reports.filter(r => ['FORWARDED_TO_OFFICER', 'INSPECTION_ASSIGNED', 'AI_RECOMMENDED', 'REPAIR_ASSIGNED'].includes(r.status)).length, color: 'var(--accent-purple)' },
          { label: 'Resolved', count: reports.filter(r => ['REPAIR_COMPLETED', 'REPLACED', 'CLOSED'].includes(r.status)).length, color: 'var(--accent-emerald)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1rem' }}>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
            <h3 className="text-2xl font-black">{s.count}</h3>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-12 pulse" style={{ color: 'var(--accent-blue)' }}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="glass-card text-center py-12">
            <AlertTriangle size={40} className="mx-auto mb-4" style={{ opacity: 0.2 }} />
            <p style={{ color: 'var(--text-dim)' }}>No damage reports found.</p>
          </div>
        ) : reports.map(report => (
          <div key={report.id} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="font-extrabold text-sm">{report.resource?.name || 'Unknown Resource'}</h3>
                  <Badge status={report.status} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{report.description}</p>
                {report.aiRecommendation && (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)' }}>
                    <span className="text-[0.7rem] pulse" style={{ color: 'var(--accent-blue)' }}>🤖 AI:</span>
                    <span className="text-xs font-black"
                      style={{ color: report.aiRecommendation.decision === 'REPLACE' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {report.aiRecommendation.decision}
                    </span>
                    <span className="text-[0.7rem]" style={{ color: 'var(--text-dim)' }}>
                      ({Math.round(report.aiRecommendation.confidence * 100)}%)
                    </span>
                  </div>
                )}
              </div>
              {isDeptHead && report.status === 'PENDING' && (
                <button onClick={() => handleForward(report.id)} className="btn-primary ml-4 shrink-0">
                  <Send size={14} /> Forward to Officer
                </button>
              )}
            </div>
            <div className="flex gap-4 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border-glass)' }}>
              <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                <User size={12} /> <strong style={{ color: 'var(--text-main)' }}>{report.user?.name || 'Staff'}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                <MapPin size={12} /> {report.location}
              </div>
              <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                <Clock size={12} /> {new Date(report.createdAt).toLocaleDateString()}
              </div>
              {report.resource?.type && (
                <div className="text-[0.75rem]" style={{ color: 'var(--text-dim)' }}>
                  Type: <strong style={{ color: 'var(--text-main)' }}>{report.resource.type}</strong>
                </div>
              )}
              {report.maintenance && (
                <div className="text-[0.75rem]" style={{ color: 'var(--accent-blue)' }}>
                  Technician: <strong>{report.maintenance.technician?.name || 'Assigned'}</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Submit Damage Report Modal ── */}
      {showForm && createPortal(
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">Report Damaged Resource</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Damaged Resource</label>
                <select className="input-glass" value={form.resourceId} onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}>
                  <option value="">Select the damaged asset...</option>
                  {resources.filter(r => r.status !== 'DISPOSED').map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {r.location}</option>
                  ))}
                </select>
              </div>
              {form.resourceId && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Selected: <strong style={{ color: 'var(--text-main)' }}>{getSelectedResource()?.name}</strong> — {getSelectedResource()?.type} at {getSelectedResource()?.location}
                  </p>
                </div>
              )}
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Location of Damage</label>
                <input className="input-glass" placeholder="e.g. Computer Lab 101, Building A"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Description of Issue</label>
                <textarea className="input-glass" rows="3" placeholder="Describe what's broken, symptoms, when it started..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center py-3">Cancel</button>
              <button onClick={handleSubmit}
                disabled={submitting || !form.resourceId || !form.description || !form.location}
                className="btn-primary flex-[2] justify-center py-3">
                {submitting ? <><RefreshCw size={15} className="spin" /> Submitting...</> : <><AlertTriangle size={15} /> Submit Report</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}