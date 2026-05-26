import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit3, X, Check, Layers, MapPin, Calendar, DollarSign, RefreshCw, Package, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  AVAILABLE: { color: 'var(--accent-emerald)', bg: 'rgba(52,211,153,0.1)' },
  IN_USE: { color: 'var(--accent-blue)', bg: 'rgba(56,189,248,0.1)' },
  DAMAGED: { color: 'var(--accent-rose)', bg: 'rgba(251,113,133,0.1)' },
  DISPOSED: { color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)' },
};
const BLANK = { name: '', type: '', location: '', ownerDepartment: '', purchaseDate: '', purchasePrice: '', status: 'AVAILABLE' };

export default function Resources() {
  const { user } = useAuth();
  const canManage = ['RESOURCE_OFFICER', 'ADMIN'].includes(user?.role);
  const isAdmin  = user?.role === 'ADMIN';
  const isStaff  = user?.role === 'STAFF';
  // All non-admin roles are department-scoped
  const isDeptScoped = !isAdmin;
  const userDept = user?.department || '';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setLoading(true);
    try { const res = await API.get('/resources'); setResources(res.data.data); }
    catch { } finally { setLoading(false); }
  };

  const openAdd = () => { setForm(BLANK); setEditing(null); setError(''); setModal('add'); };
  const openEdit = (r) => {
    setForm({ name: r.name, type: r.type, location: r.location, ownerDepartment: r.ownerDepartment || '', purchaseDate: r.purchaseDate?.split('T')[0] || '', purchasePrice: r.purchasePrice, status: r.status });
    setEditing(r); setError(''); setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.location || !form.purchaseDate || !form.purchasePrice) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, purchasePrice: parseFloat(form.purchasePrice), purchaseDate: new Date(form.purchaseDate).toISOString() };
      modal === 'add' ? await API.post('/resources', payload) : await API.put(`/resources/${editing.id}`, payload);
      closeModal(); fetchResources();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset permanently?')) return;
    try { await API.delete(`/resources/${id}`); fetchResources(); } catch { }
  };

  // Base pool:
  //   ADMIN           → all assets, all statuses
  //   STAFF           → same department, AVAILABLE + DAMAGED only
  //   All other roles → same department, all statuses
  const baseResources = (() => {
    if (isAdmin) return resources;
    const deptFiltered = resources.filter(
      r => (r.ownerDepartment || '').toLowerCase() === userDept.toLowerCase()
    );
    if (isStaff) return deptFiltered.filter(r => ['AVAILABLE', 'DAMAGED'].includes(r.status));
    return deptFiltered;
  })();

  const filtered = baseResources.filter(r => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      (r.ownerDepartment || '').toLowerCase().includes(q)
    ) && (filterStatus === 'ALL' || r.status === filterStatus);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 whenever search/filter changes
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const Badge = ({ status }) => {
    const s = STATUS_STYLE[status] || STATUS_STYLE.AVAILABLE;
    return <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>{status}</span>;
  };

  return (
    <div className="animate-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="gradient-text text-3xl font-extrabold tracking-tight">Asset Inventory</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'Comprehensive tracking of all university physical resources.'
              : isStaff
                ? `Showing available and damaged assets in your department${userDept ? ` (${userDept})` : ''}.`
                : `Showing assets in your department${userDept ? ` (${userDept})` : ''}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchResources}><RefreshCw size={15} /> Refresh</button>
          {canManage && <button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Asset</button>}
        </div>
      </header>

      {/* Stat cards */}
      <div className={`grid gap-3 mb-6 ${isStaff ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {(
          isStaff
            ? [{ k: 'ALL', label: 'My Dept Assets' }, { k: 'AVAILABLE', label: 'Available' }, { k: 'DAMAGED', label: 'Damaged' }]
            : isAdmin
              ? [{ k: 'ALL', label: 'Total Assets' }, { k: 'AVAILABLE', label: 'Available' }, { k: 'DAMAGED', label: 'Damaged' }, { k: 'DISPOSED', label: 'Disposed' }]
              : [{ k: 'ALL', label: 'Dept Assets' }, { k: 'AVAILABLE', label: 'Available' }, { k: 'DAMAGED', label: 'Damaged' }, { k: 'DISPOSED', label: 'Disposed' }]
        ).map(({ k, label }) => {
          const count = k === 'ALL' ? baseResources.length : baseResources.filter(r => r.status === k).length;
          const c = k === 'ALL' ? 'var(--accent-blue)' : (STATUS_STYLE[k]?.color || 'var(--text-dim)');
          return (
            <div key={k} className="glass-card cursor-pointer" onClick={() => setFilterStatus(k)}
              style={{ padding: '1rem', border: filterStatus === k ? `1px solid ${c}` : '' }}>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-1" style={{ color: c }}>{label}</p>
              <h2 className="text-2xl font-black">{count}</h2>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden" style={{ padding: 0, marginTop: '1.5rem' }}>
        <div className="table-search-bar">
          <div className="search-wrap">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input className="input-glass" style={{ paddingLeft: '2.25rem' }} placeholder="Search by name, type or location..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-wrap">
            <select className="input-glass" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {(isStaff
                ? ['ALL', 'AVAILABLE', 'DAMAGED']
                : ['ALL', 'AVAILABLE', 'IN_USE', 'DAMAGED', 'DISPOSED']
              ).map(s => <option key={s} value={s}>{s === 'ALL' ? (isAdmin ? 'All Statuses' : 'All (Dept)') : s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                {['Asset Identity', 'Type', 'Location', 'Ownership', 'Purchased', 'Value', 'Status', canManage ? 'Actions' : ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-12"><div className="pulse" style={{ color: 'var(--accent-blue)' }}>Loading assets...</div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12" style={{ color: 'var(--text-dim)' }}>
                  <Package size={36} className="mx-auto mb-3" style={{ opacity: 0.2 }} />No assets match your criteria.
                </td></tr>
              ) : paginated.map(r => (
                <tr key={r.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm">{r.name}</div>
                    <div className="text-[0.65rem] font-mono" style={{ color: 'var(--text-dim)' }}>#{r.id.substring(0, 10)}</div>
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-sm"><Layers size={13} style={{ color: 'var(--accent-blue)' }} />{r.type}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-sm"><MapPin size={13} style={{ color: 'var(--text-dim)' }} />{r.location}</div></td>
                  <td style={{padding:'0.6rem 1rem'}}>
                     {r.ownerDepartment ? (
                       <div style={{display:'flex', alignItems:'center', gap:'0.35rem'}}>
                         <Building2 size={13} style={{color:'var(--accent-purple)', flexShrink:0}}/>
                         <span style={{fontSize:'0.8rem', fontWeight:600, color:'var(--accent-purple)', background:'rgba(124,58,237,0.07)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:6, padding:'0.15rem 0.5rem', whiteSpace:'nowrap'}}>{r.ownerDepartment}</span>
                       </div>
                     ) : (
                       <span style={{fontSize:'0.8rem', color:'var(--text-dim)'}}>—</span>
                     )}
                   </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-sm"><Calendar size={13} style={{ color: 'var(--text-dim)' }} />{new Date(r.purchaseDate).toLocaleDateString()}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-sm font-bold"><DollarSign size={13} style={{ color: 'var(--accent-emerald)' }} />{Number(r.purchasePrice).toLocaleString()}</div></td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {canManage && (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg cursor-pointer" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', color: 'var(--accent-blue)' }}><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg cursor-pointer" style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.15)', color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination bar ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-glass)',
            background: 'var(--bg-subtle)',
          }}>
            {/* row count */}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} assets
            </span>

            {/* page buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-glass)',
                  background: safePage === 1 ? 'transparent' : '#fff',
                  color: safePage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  opacity: safePage === 1 ? 0.45 : 1,
                  transition: 'all 0.18s',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ fontSize: '0.8rem', color: 'var(--text-dim)', padding: '0 0.25rem' }}>…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      style={{
                        width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
                        border: safePage === item ? 'none' : '1px solid var(--border-glass)',
                        background: safePage === item ? 'var(--accent-blue)' : '#fff',
                        color: safePage === item ? '#fff' : 'var(--text-main)',
                        fontWeight: safePage === item ? 700 : 400,
                        fontSize: '0.8rem',
                        transition: 'all 0.18s',
                        boxShadow: safePage === item ? '0 2px 8px rgba(26,86,219,0.28)' : 'none',
                      }}
                    >{item}</button>
                  )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-glass)',
                  background: safePage === totalPages ? 'transparent' : '#fff',
                  color: safePage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                  opacity: safePage === totalPages ? 0.45 : 1,
                  transition: 'all 0.18s',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && createPortal(
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{ maxWidth: 520 }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">{modal === 'add' ? 'Register New Asset' : 'Edit Asset'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', color: 'var(--accent-rose)' }}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {[['Asset Name', 'name'], ['Category / Type', 'type']].map(([l, k]) => (
                <div key={k}>
                  <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>{l}</label>
                  <input className="input-glass" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={l} />
                </div>
              ))}
              <div>
                <label style={{fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:'0.25rem', color:'var(--text-dim)'}}>Location</label>
                <input className="input-glass" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Building / Room" />
              </div>
              <div>
                <label style={{fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:'0.25rem', color:'var(--text-dim)'}}>Owner Department</label>
                <input className="input-glass" value={form.ownerDepartment} onChange={e => setForm(f => ({ ...f, ownerDepartment: e.target.value }))} placeholder="e.g. Computer Science" />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>Purchase Date</label>
                <input type="date" className="input-glass" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>Price ($)</label>
                <input type="number" min="0" className="input-glass" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="col-span-2">
                <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{ color: 'var(--text-dim)' }}>Status</label>
                <select className="input-glass" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['AVAILABLE', 'IN_USE', 'DAMAGED', 'DISPOSED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-[2] justify-center py-2.5">
                {saving ? <><RefreshCw size={15} className="spin" /> Saving...</> : <><Check size={15} /> {modal === 'add' ? 'Register Asset' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}