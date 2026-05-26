import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Trash2, Edit3, X, Check, Shield, RefreshCw, Search, UserPlus, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Public Health',
  'Law',
  'Economics',
  'Business Administration',
  'Accounting & Finance',
  'Management',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Language & Literature',
  'History',
  'Geography',
  'Psychology',
  'Social Work',
  'Agriculture',
  'Veterinary Medicine',
  'Architecture',
  'Environmental Science',
  'Library & Information Science',
  'Journalism & Communication',
];

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
  return <span className="badge" style={{color:s.color, background:s.bg, border:`1px solid ${s.color}20`}}>{role.replace(/_/g,' ')}</span>;
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role:'', department:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Register user state
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name:'', email:'', password:'', role:'STAFF', department:'' });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/users'); setUsers(res.data.data); }
    catch (e) { setError(e.response?.status===403?'Admin access required.':'Failed to load users.'); }
    finally { setLoading(false); }
  };

  const openEdit = (u) => { setEditForm({ role:u.role, department:u.department||'' }); setEditUser(u); };
  const closeEdit = () => { setEditUser(null); };

  const openRegister = () => {
    setRegisterForm({ name:'', email:'', password:'', role:'STAFF', department:'' });
    setRegisterError('');
    setRegisterSuccess('');
    setShowPassword(false);
    setShowRegister(true);
  };
  const closeRegister = () => { setShowRegister(false); setRegisterError(''); setRegisterSuccess(''); };

  const handleCreate = async () => {
    setRegisterError('');
    setRegisterSuccess('');
    if (!registerForm.name.trim()) { setRegisterError('Name is required.'); return; }
    if (!registerForm.email.trim()) { setRegisterError('Email is required.'); return; }
    if (registerForm.password.length < 6) { setRegisterError('Password must be at least 6 characters.'); return; }
    setRegistering(true);
    try {
      await API.post('/admin/users', registerForm);
      setRegisterSuccess('User created successfully! They must change their password on first login.');
      fetchUsers();
      setTimeout(() => closeRegister(), 2000);
    } catch (e) {
      setRegisterError(e.response?.data?.message || 'Failed to create user.');
    } finally { setRegistering(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await API.patch(`/admin/users/${editUser.id}`, editForm); closeEdit(); fetchUsers(); }
    catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await API.delete(`/admin/users/${id}`); fetchUsers(); } catch {}
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const byRole = users.reduce((acc, u) => { acc[u.role]=(acc[u.role]||0)+1; return acc; }, {});

  if (error) return (
    <div className="glass-card text-center py-12 max-w-md mx-auto mt-16">
      <Shield size={40} className="mx-auto mb-4" style={{color:'var(--accent-rose)'}}/>
      <h2 className="font-extrabold text-lg mb-2">Access Denied</h2>
      <p className="text-sm" style={{color:'var(--text-dim)'}}>{error}</p>
    </div>
  );

  return (
    <div className="animate-in">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="gradient-text text-3xl font-extrabold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm" style={{color:'var(--text-muted)'}}>Manage system users, roles, and department assignments.</p>
        </div>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <button className="btn-primary" onClick={openRegister} style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
            <UserPlus size={15}/> Register User
          </button>
          <button className="btn-ghost" onClick={fetchUsers}><RefreshCw size={15}/> Refresh</button>
        </div>
      </header>

      {/* Role Summary */}
      <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))'}}>
        {Object.entries(ROLE_COLORS).map(([role,style]) => (
          <div key={role} className="glass-card text-center" style={{padding:'0.75rem'}}>
            <p className="text-[0.6rem] font-bold uppercase tracking-wider mb-1" style={{color:style.color}}>{role.replace(/_/g,' ')}</p>
            <h2 className="text-xl font-black">{byRole[role]||0}</h2>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden" style={{padding:0}}>
        <div className="table-search-bar">
          <div className="search-wrap">
            <Search size={16} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)'}}/>
            <input className="input-glass" style={{paddingLeft:'2.25rem'}} placeholder="Search by name, email or role..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <span style={{flex:'0 0 auto', fontSize:'0.8rem', fontWeight:600, color:'var(--text-dim)', whiteSpace:'nowrap'}}>
            {filtered.length} of {users.length} users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border-glass)'}}>
                {['User','Email','Role','Department','Joined','Actions'].map(h=>(
                  <th key={h} style={{textAlign:'left', padding:'0.7rem 1rem', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-dim)', whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12"><div className="pulse" style={{color:'var(--accent-blue)'}}>Loading users...</div></td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan="6" className="text-center py-12" style={{color:'var(--text-dim)'}}>No users found.</td></tr>
              ) : filtered.map(u=>(
                <tr key={u.id} className="table-row-hover" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-extrabold text-white"
                           style={{background:`linear-gradient(135deg,${ROLE_COLORS[u.role]?.color||'var(--accent-blue)'},var(--accent-purple))`}}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{u.name}</div>
                        <div className="text-[0.6rem] font-mono" style={{color:'var(--text-dim)'}}>#{u.id.substring(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{color:'var(--text-muted)'}}>{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role}/></td>
                  <td className="px-4 py-3 text-sm" style={{color:'var(--text-dim)'}}>{u.department||'—'}</td>
                  <td className="px-4 py-3 text-xs" style={{color:'var(--text-dim)'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={()=>openEdit(u)} className="p-1.5 rounded-lg cursor-pointer" style={{background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.15)',color:'var(--accent-blue)'}}><Edit3 size={13}/></button>
                      <button onClick={()=>handleDelete(u.id)} className="p-1.5 rounded-lg cursor-pointer" style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)',color:'var(--accent-rose)'}}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{maxWidth:420}}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">Edit User</h2>
              <button onClick={closeEdit} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-glass)'}}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white"
                   style={{background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))'}}>
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{editUser.name}</p>
                <p className="text-xs" style={{color:'var(--text-dim)'}}>{editUser.email}</p>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Role</label>
              <select className="input-glass" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                {Object.keys(ROLE_COLORS).map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Department</label>
              <select className="input-glass" value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}>
                <option value="">— Select Department —</option>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={closeEdit} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-[2] justify-center py-2.5">
                {saving?<><RefreshCw size={15} className="spin"/> Saving...</>:<><Check size={15}/> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{maxWidth:440}}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold">Register New User</h2>
              <button onClick={closeRegister} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={20}/></button>
            </div>

            {registerError && (
              <div style={{background:'rgba(251,113,133,0.1)',border:'1px solid rgba(251,113,133,0.25)',borderRadius:8,padding:'0.6rem 0.85rem',marginBottom:'0.85rem',fontSize:'0.82rem',color:'var(--accent-rose)'}}>
                {registerError}
              </div>
            )}
            {registerSuccess && (
              <div style={{background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:8,padding:'0.6rem 0.85rem',marginBottom:'0.85rem',fontSize:'0.82rem',color:'var(--accent-emerald)'}}>
                ✅ {registerSuccess}
              </div>
            )}

            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Full Name</label>
              <input className="input-glass" value={registerForm.name} onChange={e=>setRegisterForm(f=>({...f,name:e.target.value}))} placeholder="e.g. John Doe"/>
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Email</label>
              <input className="input-glass" type="email" value={registerForm.email} onChange={e=>setRegisterForm(f=>({...f,email:e.target.value}))} placeholder="e.g. john@uog.edu.et"/>
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Default Password</label>
              <div style={{position:'relative'}}>
                <input
                  className="input-glass"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={e=>setRegisterForm(f=>({...f,password:e.target.value}))}
                  placeholder="Min 6 characters"
                  style={{paddingRight:'2.5rem'}}
                />
                <button
                  type="button"
                  onClick={()=>setShowPassword(!showPassword)}
                  style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-dim)',padding:2}}
                >
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <p style={{fontSize:'0.68rem',color:'var(--text-dim)',marginTop:4}}>User will be required to change this on first login.</p>
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Role</label>
              <select className="input-glass" value={registerForm.role} onChange={e=>setRegisterForm(f=>({...f,role:e.target.value}))}>
                {Object.keys(ROLE_COLORS).map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Department</label>
              <select className="input-glass" value={registerForm.department} onChange={e=>setRegisterForm(f=>({...f,department:e.target.value}))}>
                <option value="">— Select Department —</option>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={closeRegister} className="btn-ghost flex-1 justify-center py-2.5">Cancel</button>
              <button onClick={handleCreate} disabled={registering} className="btn-primary flex-[2] justify-center py-2.5">
                {registering?<><RefreshCw size={15} className="spin"/> Creating...</>:<><UserPlus size={15}/> Create User</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
