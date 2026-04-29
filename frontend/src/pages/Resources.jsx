import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit3, X, Check, Layers, MapPin, Calendar, DollarSign, RefreshCw, Package } from 'lucide-react';

const STATUS_STYLE = {
  AVAILABLE: { color:'var(--accent-emerald)', bg:'rgba(52,211,153,0.1)' },
  IN_USE:    { color:'var(--accent-blue)',    bg:'rgba(56,189,248,0.1)' },
  DAMAGED:   { color:'var(--accent-rose)',    bg:'rgba(251,113,133,0.1)' },
  DISPOSED:  { color:'var(--text-dim)',       bg:'rgba(255,255,255,0.05)' },
};
const BLANK = { name:'', type:'', location:'', purchaseDate:'', purchasePrice:'', status:'AVAILABLE' };

export default function Resources() {
  const { user } = useAuth();
  const canManage = ['RESOURCE_OFFICER','ADMIN'].includes(user?.role);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setLoading(true);
    try { const res = await API.get('/resources'); setResources(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  const openAdd = () => { setForm(BLANK); setEditing(null); setError(''); setModal('add'); };
  const openEdit = (r) => {
    setForm({ name:r.name, type:r.type, location:r.location, purchaseDate:r.purchaseDate?.split('T')[0]||'', purchasePrice:r.purchasePrice, status:r.status });
    setEditing(r); setError(''); setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.name||!form.type||!form.location||!form.purchaseDate||!form.purchasePrice) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, purchasePrice:parseFloat(form.purchasePrice), purchaseDate:new Date(form.purchaseDate).toISOString() };
      modal==='add' ? await API.post('/resources',payload) : await API.put(`/resources/${editing.id}`,payload);
      closeModal(); fetchResources();
    } catch(e) { setError(e.response?.data?.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset permanently?')) return;
    try { await API.delete(`/resources/${id}`); fetchResources(); } catch {}
  };

  const filtered = resources.filter(r => {
    const q = search.toLowerCase();
    return (r.name.toLowerCase().includes(q)||r.type.toLowerCase().includes(q)||r.location.toLowerCase().includes(q))
      && (filterStatus==='ALL'||r.status===filterStatus);
  });

  const Badge = ({status}) => { const s=STATUS_STYLE[status]||STATUS_STYLE.AVAILABLE; return <span style={{padding:'0.25rem 0.75rem',borderRadius:20,fontSize:'0.7rem',fontWeight:700,color:s.color,background:s.bg,border:`1px solid ${s.color}20`}}>{status}</span>; };

  return (
    <div className="animate-in">
      <header style={{marginBottom:'2.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <h1 className="gradient-text">Asset Inventory</h1>
          <p className="text-muted">Comprehensive tracking of all university physical resources.</p>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button className="btn-premium" style={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',boxShadow:'none'}} onClick={fetchResources}>
            <RefreshCw size={16}/><span style={{color:'var(--text-main)'}}>Refresh</span>
          </button>
          {canManage && <button className="btn-premium" onClick={openAdd}><Plus size={18}/><span>New Asset</span></button>}
        </div>
      </header>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'2rem'}}>
        {[{k:'ALL',label:'Total Assets'},{k:'AVAILABLE',label:'Available'},{k:'DAMAGED',label:'Damaged'},{k:'DISPOSED',label:'Disposed'}].map(({k,label}) => {
          const count = k==='ALL'?resources.length:resources.filter(r=>r.status===k).length;
          const c = k==='ALL'?'var(--accent-blue)':(STATUS_STYLE[k]?.color||'var(--text-dim)');
          return (
            <div key={k} className="glass-card" onClick={()=>setFilterStatus(k)} style={{cursor:'pointer',padding:'1.25rem',border:filterStatus===k?`1px solid ${c}`:''}}>
              <p style={{fontSize:'0.7rem',fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.5rem'}}>{label}</p>
              <h2 style={{fontSize:'2rem',fontWeight:900}}>{count}</h2>
            </div>
          );
        })}
      </div>

      <div className="glass-card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1.5rem',borderBottom:'1px solid var(--border-glass)',display:'flex',gap:'1rem'}}>
          <div style={{position:'relative',flexGrow:1}}>
            <Search size={18} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)'}}/>
            <input type="text" className="input-glass" placeholder="Search by name, type or location..." style={{paddingLeft:44}} value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="input-glass" style={{width:160}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            {['ALL','AVAILABLE','IN_USE','DAMAGED','DISPOSED'].map(s=><option key={s} value={s}>{s==='ALL'?'All Statuses':s}</option>)}
          </select>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'1px solid var(--border-glass)'}}>
                {['Asset Identity','Type','Location','Purchased','Value','Status',canManage?'Actions':''].map(h=>(
                  <th key={h} style={{padding:'1rem 1.5rem',fontSize:'0.75rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign:'center',padding:'4rem'}}><div className="pulse text-accent">Loading assets...</div></td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan="7" style={{textAlign:'center',padding:'4rem',color:'var(--text-dim)'}}>
                  <Package size={40} style={{margin:'0 auto 1rem',opacity:0.3,display:'block'}}/>No assets match your criteria.
                </td></tr>
              ) : filtered.map(r=>(
                <tr key={r.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'1.25rem 1.5rem'}}>
                    <div style={{fontWeight:700,fontSize:'0.95rem'}}>{r.name}</div>
                    <div style={{fontSize:'0.7rem',color:'var(--text-dim)',fontFamily:'monospace'}}>#{r.id.substring(0,10)}</div>
                  </td>
                  <td style={{padding:'1.25rem 1.5rem'}}><div style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.875rem'}}><Layers size={14} className="text-accent"/>{r.type}</div></td>
                  <td style={{padding:'1.25rem 1.5rem'}}><div style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.875rem'}}><MapPin size={14} style={{color:'var(--text-dim)'}}/>{r.location}</div></td>
                  <td style={{padding:'1.25rem 1.5rem'}}><div style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.875rem'}}><Calendar size={14} style={{color:'var(--text-dim)'}}/>{new Date(r.purchaseDate).toLocaleDateString()}</div></td>
                  <td style={{padding:'1.25rem 1.5rem'}}><div style={{display:'flex',alignItems:'center',gap:4,fontSize:'0.875rem',fontWeight:700}}><DollarSign size={14} style={{color:'var(--accent-emerald)'}}/>{Number(r.purchasePrice).toLocaleString()}</div></td>
                  <td style={{padding:'1.25rem 1.5rem'}}><Badge status={r.status}/></td>
                  <td style={{padding:'1.25rem 1.5rem',textAlign:'right'}}>
                    {canManage&&<div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                      <button onClick={()=>openEdit(r)} style={{background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:8,padding:'0.4rem 0.7rem',color:'var(--accent-blue)',cursor:'pointer'}}><Edit3 size={15}/></button>
                      <button onClick={()=>handleDelete(r.id)} style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)',borderRadius:8,padding:'0.4rem 0.7rem',color:'var(--accent-rose)',cursor:'pointer'}}><Trash2 size={15}/></button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div className="glass-card animate-in" style={{width:'100%',maxWidth:520,padding:'2.5rem',borderTop:'4px solid var(--accent-blue)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:800,margin:0}}>{modal==='add'?'Register New Asset':'Edit Asset'}</h2>
              <button onClick={closeModal} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={22}/></button>
            </div>
            {error&&<div style={{background:'rgba(251,113,133,0.1)',border:'1px solid rgba(251,113,133,0.3)',borderRadius:10,padding:'0.75rem 1rem',color:'var(--accent-rose)',fontSize:'0.875rem',marginBottom:'1.5rem'}}>{error}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              {[['Asset Name','name'],['Category / Type','type']].map(([l,k])=>(
                <div key={k}>
                  <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>{l}</label>
                  <input className="input-glass" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l}/>
                </div>
              ))}
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Location</label>
                <input className="input-glass" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Building / Room"/>
              </div>
              <div>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Purchase Date</label>
                <input type="date" className="input-glass" value={form.purchaseDate} onChange={e=>setForm(f=>({...f,purchaseDate:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Price ($)</label>
                <input type="number" min="0" className="input-glass" value={form.purchasePrice} onChange={e=>setForm(f=>({...f,purchasePrice:e.target.value}))} placeholder="0.00"/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Status</label>
                <select className="input-glass" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {['AVAILABLE','IN_USE','DAMAGED','DISPOSED'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem',marginTop:'2rem'}}>
              <button onClick={closeModal} style={{flex:1,background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,padding:'0.875rem',color:'var(--text-muted)',cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-premium" style={{flex:2,justifyContent:'center',padding:'0.875rem'}}>
                {saving?<RefreshCw size={18} className="pulse"/>:<Check size={18}/>}{saving?'Saving...':modal==='add'?'Register Asset':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
