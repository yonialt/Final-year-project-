import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Users as UsersIcon, Trash2, Edit3, X, Check, Shield, RefreshCw, UserPlus, Search } from 'lucide-react';

const ROLE_COLORS = {
  ADMIN:            { color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  STAFF:            { color:'var(--text-dim)', bg:'rgba(255,255,255,0.05)' },
  DEPARTMENT_HEAD:  { color:'var(--accent-blue)', bg:'rgba(56,189,248,0.1)' },
  ACADEMIC_DEAN:    { color:'var(--accent-purple)', bg:'rgba(129,140,248,0.1)' },
  RESOURCE_OFFICER: { color:'var(--accent-emerald)', bg:'rgba(52,211,153,0.1)' },
  TECHNICIAN:       { color:'var(--accent-rose)', bg:'rgba(251,113,133,0.1)' },
};

const RoleBadge = ({ role }) => {
  const s = ROLE_COLORS[role] || ROLE_COLORS.STAFF;
  return <span style={{padding:'0.2rem 0.65rem',borderRadius:20,fontSize:'0.7rem',fontWeight:700,color:s.color,background:s.bg,border:`1px solid ${s.color}20`,whiteSpace:'nowrap'}}>{role.replace(/_/g,' ')}</span>;
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role:'', department:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/users'); setUsers(res.data.data); }
    catch (e) { setError(e.response?.status===403?'Admin access required.':'Failed to load users.'); }
    finally { setLoading(false); }
  };

  const openEdit = (u) => { setEditForm({ role:u.role, department:u.department||'' }); setEditUser(u); };
  const closeEdit = () => { setEditUser(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch(`/admin/users/${editUser.id}`, editForm);
      closeEdit(); fetchUsers();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try { await API.delete(`/admin/users/${id}`); fetchUsers(); } catch {}
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const byRole = users.reduce((acc, u) => { acc[u.role]=(acc[u.role]||0)+1; return acc; }, {});

  if (error) return (
    <div className="glass-card" style={{textAlign:'center',padding:'4rem',maxWidth:500,margin:'4rem auto'}}>
      <Shield size={48} style={{color:'var(--accent-rose)',margin:'0 auto 1.5rem',display:'block'}}/>
      <h2 style={{fontWeight:800,marginBottom:'0.75rem'}}>Access Denied</h2>
      <p style={{color:'var(--text-dim)'}}>{error}</p>
    </div>
  );

  return (
    <div className="animate-in">
      <header style={{marginBottom:'2.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <h1 className="gradient-text">User Management</h1>
          <p className="text-muted">Manage system users, roles, and department assignments.</p>
        </div>
        <button className="btn-premium" style={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',boxShadow:'none'}} onClick={fetchUsers}>
          <RefreshCw size={16}/><span style={{color:'var(--text-main)'}}>Refresh</span>
        </button>
      </header>

      {/* Role Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        {Object.entries(ROLE_COLORS).map(([role,style]) => (
          <div key={role} className="glass-card" style={{padding:'1rem',textAlign:'center'}}>
            <p style={{fontSize:'0.65rem',fontWeight:700,color:style.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.4rem'}}>{role.replace(/_/g,' ')}</p>
            <h2 style={{fontSize:'1.75rem',fontWeight:900}}>{byRole[role]||0}</h2>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--border-glass)',display:'flex',gap:'1rem'}}>
          <div style={{position:'relative',flexGrow:1}}>
            <Search size={17} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)'}}/>
            <input type="text" className="input-glass" placeholder="Search by name, email or role..." style={{paddingLeft:42}} value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <span style={{display:'flex',alignItems:'center',fontSize:'0.8rem',color:'var(--text-dim)',whiteSpace:'nowrap',padding:'0 0.5rem'}}>
            {filtered.length} of {users.length} users
          </span>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'1px solid var(--border-glass)'}}>
                {['User','Email','Role','Department','Joined','Actions'].map(h=>(
                  <th key={h} style={{padding:'1rem 1.5rem',fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign:'center',padding:'4rem'}}><div className="pulse text-accent">Loading users...</div></td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan="6" style={{textAlign:'center',padding:'4rem',color:'var(--text-dim)'}}>No users found.</td></tr>
              ) : filtered.map(u=>(
                <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'1rem 1.5rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${ROLE_COLORS[u.role]?.color||'var(--accent-blue)'},var(--accent-purple))`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.85rem',fontWeight:800,color:'white'}}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.9rem'}}>{u.name}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--text-dim)',fontFamily:'monospace'}}>#{u.id.substring(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'1rem 1.5rem',fontSize:'0.85rem',color:'var(--text-muted)'}}>{u.email}</td>
                  <td style={{padding:'1rem 1.5rem'}}><RoleBadge role={u.role}/></td>
                  <td style={{padding:'1rem 1.5rem',fontSize:'0.85rem',color:'var(--text-dim)'}}>{u.department||'—'}</td>
                  <td style={{padding:'1rem 1.5rem',fontSize:'0.8rem',color:'var(--text-dim)'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{padding:'1rem 1.5rem',textAlign:'right'}}>
                    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                      <button onClick={()=>openEdit(u)} style={{background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:8,padding:'0.4rem 0.7rem',color:'var(--accent-blue)',cursor:'pointer'}}><Edit3 size={14}/></button>
                      <button onClick={()=>handleDelete(u.id)} style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)',borderRadius:8,padding:'0.4rem 0.7rem',color:'var(--accent-rose)',cursor:'pointer'}}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="glass-card animate-in" style={{width:'100%',maxWidth:420,padding:'2.5rem',borderTop:'4px solid var(--accent-blue)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
              <h2 style={{margin:0,fontWeight:800,fontSize:'1.4rem'}}>Edit User</h2>
              <button onClick={closeEdit} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={22}/></button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'1rem',background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid var(--border-glass)',marginBottom:'1.5rem'}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white'}}>
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{fontWeight:700,margin:0}}>{editUser.name}</p>
                <p style={{fontSize:'0.8rem',color:'var(--text-dim)',margin:0}}>{editUser.email}</p>
              </div>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Role</label>
              <select className="input-glass" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                {Object.keys(ROLE_COLORS).map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div style={{marginBottom:'2rem'}}>
              <label style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',display:'block',marginBottom:'0.5rem'}}>Department</label>
              <input className="input-glass" value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))} placeholder="e.g. Computer Science"/>
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <button onClick={closeEdit} style={{flex:1,background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:12,padding:'0.875rem',color:'var(--text-muted)',cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-premium" style={{flex:2,justifyContent:'center',padding:'0.875rem'}}>
                {saving?<RefreshCw size={16} className="pulse"/>:<Check size={16}/>}{saving?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
