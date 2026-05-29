import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit3, X, Check, Shield, RefreshCw, Search, UserPlus, Eye, EyeOff, Upload } from 'lucide-react';

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
  const { user } = useAuth();
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
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Bulk Upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const canEditOrDelete = (u) => {
    if (user?.role === 'ADMIN') {
      return u.role !== 'STAFF';
    }
    if (user?.role === 'DEPARTMENT_HEAD') {
      return u.role === 'STAFF' && u.department === user.department;
    }
    return false;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/users'); setUsers(res.data.data); }
    catch (e) { setError(e.response?.status===403?'Admin access required.':'Failed to load users.'); }
    finally { setLoading(false); }
  };

  const openEdit = (u) => { setEditForm({ role:u.role, department:u.department||'' }); setEditUser(u); };
  const closeEdit = () => { setEditUser(null); };

  const openRegister = () => {
    const defaultRole = user?.role === 'DEPARTMENT_HEAD' ? 'STAFF' : 'DEPARTMENT_HEAD';
    const defaultDept = user?.role === 'DEPARTMENT_HEAD' ? (user.department || '') : '';
    setRegisterForm({ name:'', email:'', password:'', role:defaultRole, department:defaultDept });
    setRegisterError('');
    setRegisterSuccess('');
    setShowPassword(false);
    setPasswordTouched(false);
    setShowRegister(true);
  };
  const closeRegister = () => { setShowRegister(false); setRegisterError(''); setRegisterSuccess(''); };

  const handleCreate = async () => {
    setRegisterError('');
    setRegisterSuccess('');
    
    const nameTrimmed = registerForm.name.trim();
    if (!nameTrimmed) { setRegisterError('Name is required.'); return; }
    
    const nameParts = nameTrimmed.split(/\s+/);
    if (nameParts.length < 2) {
      setRegisterError('Full name must contain both first and last name.');
      return;
    }
    if (!/^[a-zA-Z.\s-]+$/.test(nameTrimmed)) {
      setRegisterError('Full name can only contain letters, spaces, dots, and hyphens.');
      return;
    }
    
    const emailTrimmed = registerForm.email.trim();
    if (!emailTrimmed) { setRegisterError('Email is required.'); return; }
    if (!emailTrimmed.toLowerCase().endsWith('@uog.edu.et')) {
      setRegisterError('Email must be a university email ending with @uog.edu.et.');
      return;
    }
    
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

  const openBulkUpload = () => {
    setBulkFile(null);
    setBulkUsers([]);
    setBulkError('');
    setBulkSuccess(null);
    setShowBulkUpload(true);
  };

  const closeBulkUpload = () => {
    setShowBulkUpload(false);
    setBulkFile(null);
    setBulkUsers([]);
    setBulkError('');
    setBulkSuccess(null);
  };

  const handleDownloadTemplate = () => {
    const headers = 'name,email,role,department\n';
    const sample = 'John Doe,john@uog.edu.et,STAFF,Computer Science\nAbebe Kebede,abebe@uog.edu.et,DEPARTMENT_HEAD,Information Technology\n';
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "user_registration_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    if (!headers.includes('name') || !headers.includes('email')) {
      throw new Error('CSV must contain "name" and "email" columns in the header row.');
    }
    
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row = {};
      headers.forEach((header, index) => {
        const cleanHeader = header.replace(/^["']|["']$/g, '');
        const cleanValue = (values[index] || '').replace(/^["']|["']$/g, '');
        row[cleanHeader] = cleanValue;
      });
      results.push(row);
    }
    return results;
  };

  const handleFileLoad = (file) => {
    if (!file) return;
    setBulkFile(file);
    setBulkError('');
    setBulkSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setBulkError('The CSV file is empty or could not be parsed.');
          return;
        }

        // Perform frontend validation for each row
        const validated = parsed.map((u, index) => {
          const rowErrors = [];
          
          const name = (u.name || '').trim();
          const email = (u.email || '').trim();
          let role = (u.role || '').trim().toUpperCase();
          let department = (u.department || '').trim();
          if (user?.role === 'DEPARTMENT_HEAD') {
            department = user.department || '';
          }

          // Validate Name
          if (!name) {
            rowErrors.push('Name is required');
          } else {
            const parts = name.split(/\s+/);
            if (parts.length < 2) {
              rowErrors.push('Must contain both first and last name');
            }
            if (!/^[a-zA-Z.\s-]+$/.test(name)) {
              rowErrors.push('Name can only contain letters, spaces, dots, and hyphens');
            }
          }

          // Validate Email
          if (!email) {
            rowErrors.push('Email is required');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            rowErrors.push('Invalid email format');
          } else if (!email.toLowerCase().endsWith('@uog.edu.et')) {
            rowErrors.push('Must be a university email (@uog.edu.et)');
          }

          // Validate Role
          const validRoles = ['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN', 'ADMIN'];
          if (role && !validRoles.includes(role)) {
            rowErrors.push(`Invalid role '${role}'`);
          } else if (!role) {
            role = 'STAFF';
          }

          if (user?.role === 'DEPARTMENT_HEAD') {
            if (role !== 'STAFF') {
              rowErrors.push('Department Heads can only register Staff members');
            }
            role = 'STAFF';
          } else if (user?.role === 'ADMIN') {
            if (role === 'STAFF') {
              rowErrors.push('System Admin cannot register Staff members');
            }
          }

          return {
            name,
            email,
            role,
            department: department || null,
            errors: rowErrors,
            isValid: rowErrors.length === 0
          };
        });

        setBulkUsers(validated);
      } catch (err) {
        setBulkError(err.message || 'Error parsing CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCredentials = () => {
    if (!bulkSuccess) return;
    const headers = 'name,email,role,department,password\n';
    const rows = bulkSuccess.map(u => 
      `"${u.name}","${u.email}","${u.role}","${u.department || ''}","${u.tempPassword}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registered_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async () => {
    setBulkError('');
    setBulkSuccess(null);

    const hasErrors = bulkUsers.some(u => !u.isValid);
    if (hasErrors) {
      setBulkError('Please fix all validation errors before uploading.');
      return;
    }

    if (bulkUsers.length === 0) {
      setBulkError('No users to upload.');
      return;
    }

    setBulkUploading(true);
    try {
      const payload = {
        users: bulkUsers.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department
        }))
      };

      const res = await API.post('/admin/users/bulk', payload);
      setBulkSuccess(res.data.data);
      fetchUsers();
    } catch (e) {
      setBulkError(e.response?.data?.message || 'Failed to complete bulk registration.');
    } finally {
      setBulkUploading(false);
    }
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
          <button className="btn-ghost" onClick={openBulkUpload} style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
            <Upload size={15}/> Bulk Upload
          </button>
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
                    {canEditOrDelete(u) ? (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={()=>openEdit(u)} className="p-1.5 rounded-lg cursor-pointer" style={{background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.15)',color:'var(--accent-blue)'}}><Edit3 size={13}/></button>
                        <button onClick={()=>handleDelete(u.id)} className="p-1.5 rounded-lg cursor-pointer" style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)',color:'var(--accent-rose)'}}><Trash2 size={13}/></button>
                      </div>
                    ) : (
                      <span style={{fontSize:'0.8rem', color:'var(--text-dim)'}}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && createPortal(
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
                {Object.keys(ROLE_COLORS)
                  .filter(r => user?.role === 'DEPARTMENT_HEAD' ? r === 'STAFF' : r !== 'STAFF')
                  .map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Department</label>
              <select className="input-glass" value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))} disabled={user?.role === 'DEPARTMENT_HEAD'}>
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
        </div>,
        document.body
      )}

      {/* Register Modal */}
      {showRegister && createPortal(
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
              <input
                className="input-glass"
                value={registerForm.name}
                autoComplete="off"
                onChange={e => {
                  const val = e.target.value;
                  setRegisterForm(f => {
                    let updatedPassword = f.password;
                    if (!passwordTouched) {
                      const firstWord = val.trim().split(/\s+/)[0] || '';
                      if (firstWord) {
                        updatedPassword = `${firstWord}1234`;
                      } else {
                        updatedPassword = '';
                      }
                    }
                    return { ...f, name: val, password: updatedPassword };
                  });
                }}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Email</label>
              <input
                className="input-glass"
                type="email"
                value={registerForm.email}
                autoComplete="off"
                onChange={e=>setRegisterForm(f=>({...f,email:e.target.value}))}
                placeholder="e.g. john@uog.edu.et"
              />
            </div>
            <div className="mb-3">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Default Password</label>
              <div style={{position:'relative'}}>
                <input
                  className="input-glass"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  autoComplete="new-password"
                  onChange={e => {
                    setPasswordTouched(true);
                    setRegisterForm(f => ({ ...f, password: e.target.value }));
                  }}
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
                {Object.keys(ROLE_COLORS)
                  .filter(r => user?.role === 'DEPARTMENT_HEAD' ? r === 'STAFF' : r !== 'STAFF')
                  .map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="text-[0.7rem] font-bold uppercase block mb-1" style={{color:'var(--text-dim)'}}>Department</label>
              <select className="input-glass" value={registerForm.department} onChange={e=>setRegisterForm(f=>({...f,department:e.target.value}))} disabled={user?.role === 'DEPARTMENT_HEAD'}>
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
        </div>,
        document.body
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && createPortal(
        <div className="modal-overlay">
          <div className="glass-card modal-card animate-in" style={{ maxWidth: 640, width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-extrabold">Bulk User Registration</h2>
              <button onClick={closeBulkUpload} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            {bulkSuccess ? (
              <div className="animate-in overflow-y-auto flex-1 pr-1" style={{ minHeight: 0 }}>
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                    <Check size={24} style={{ color: 'var(--accent-emerald)' }} />
                  </div>
                  <h3 className="font-extrabold text-base">Successfully Created {bulkSuccess.length} Users!</h3>
                  <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-dim)' }}>
                    Their accounts have been initialized. Please download the credentials CSV below to distribute their temporary passwords.
                  </p>
                  
                  <button 
                    onClick={handleDownloadCredentials} 
                    className="btn-success mx-auto py-2 px-4 font-bold text-xs mb-4 flex items-center gap-2"
                    style={{ boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)' }}
                  >
                    <Upload size={14} style={{ transform: 'rotate(180deg)' }} /> Download Credentials CSV
                  </button>
                </div>

                <label className="text-[0.68rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Created Users & Temporary Passwords</label>
                <div className="overflow-x-auto rounded-lg border border-glass mb-5" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0 }}>
                        <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Name</th>
                        <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Email</th>
                        <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Role</th>
                        <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkSuccess.map((u, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td className="p-2 text-xs font-semibold">{u.name}</td>
                          <td className="p-2 text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                          <td className="p-2 text-xs"><RoleBadge role={u.role}/></td>
                          <td className="p-2 text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{u.tempPassword}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t border-glass shrink-0">
                  <button onClick={closeBulkUpload} className="btn-primary py-2 px-5 font-bold text-xs">
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {bulkError && (
                  <div style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
                    ⚠️ {bulkError}
                  </div>
                )}

                {!bulkFile ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <div 
                      className="glass-card text-center cursor-pointer hover:border-accent-blue transition-all"
                      style={{
                        border: '1.5px dashed var(--border-glass)',
                        padding: '2.5rem 1rem',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.01)',
                        position: 'relative'
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileLoad(file);
                      }}
                      onClick={() => document.getElementById('bulk-csv-input').click()}
                    >
                      <input 
                        id="bulk-csv-input" 
                        type="file" 
                        accept=".csv" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileLoad(file);
                        }} 
                      />
                      <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--accent-blue)' }} />
                      <p className="font-bold text-xs">Drag & drop your CSV file here, or <span className="text-accent-blue underline">browse</span></p>
                      <p className="text-[0.65rem] text-muted mt-1" style={{ color: 'var(--text-dim)' }}>Only standard CSV files are accepted</p>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <button 
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-[0.7rem] font-bold text-accent-blue hover:underline bg-none border-none cursor-pointer flex items-center gap-1"
                      >
                        Download CSV Template
                      </button>
                      <p className="text-[0.65rem]" style={{ color: 'var(--text-dim)' }}>
                        Headers: <code>name</code>, <code>email</code>, <code>role</code>, <code>department</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3 p-2 rounded-lg border border-glass shrink-0" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center" style={{ background: 'rgba(26, 86, 219, 0.08)' }}>
                          <Upload size={14} style={{ color: 'var(--accent-blue)' }} />
                        </div>
                        <div>
                          <p className="font-bold text-xs truncate max-w-[240px]">{bulkFile.name}</p>
                          <p className="text-[0.65rem]" style={{ color: 'var(--text-dim)' }}>{(bulkFile.size / 1024).toFixed(1)} KB • {bulkUsers.length} records parsed</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setBulkFile(null); setBulkUsers([]); setBulkError(''); }}
                        className="btn-ghost py-1 px-2.5 text-[0.7rem]"
                      >
                        Change File
                      </button>
                    </div>

                    <label className="text-[0.68rem] font-bold uppercase block mb-1.5" style={{ color: 'var(--text-dim)' }}>Upload Preview & Validation</label>
                    <div className="overflow-x-auto rounded-lg border border-glass mb-4 flex-1 min-h-[140px]" style={{ overflowY: 'auto' }}>
                      <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, zIndex: 1 }}>
                            <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Status</th>
                            <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Name</th>
                            <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Email</th>
                            <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Role</th>
                            <th className="p-2 text-[0.65rem] font-bold uppercase" style={{ color: 'var(--text-dim)' }}>Dept</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkUsers.map((u, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: u.isValid ? 'transparent' : 'rgba(220, 38, 38, 0.02)' }}>
                              <td className="p-2 text-xs">
                                {u.isValid ? (
                                  <span className="badge" style={{ color: 'var(--accent-emerald)', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.12)' }}>Valid</span>
                                ) : (
                                  <span className="badge" style={{ color: 'var(--accent-rose)', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.12)' }} title={u.errors.join(', ')}>Error</span>
                                )}
                              </td>
                              <td className="p-2 text-xs font-semibold">
                                <div>
                                  {u.name || <em className="text-rose-500 font-normal">Empty</em>}
                                  {!u.isValid && u.errors.some(e => e.includes('Name') || e.includes('name')) && (
                                    <div className="text-[0.65rem] font-normal mt-0.5" style={{ color: 'var(--accent-rose)' }}>
                                      {u.errors.find(e => e.includes('Name') || e.includes('name'))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-xs text-muted">
                                <div>
                                  {u.email || <em className="text-rose-500 font-normal">Empty</em>}
                                  {!u.isValid && u.errors.some(e => e.includes('Email') || e.includes('email') || e.includes('domain') || e.includes('format')) && (
                                    <div className="text-[0.65rem] font-normal mt-0.5" style={{ color: 'var(--accent-rose)' }}>
                                      {u.errors.find(e => e.includes('Email') || e.includes('email') || e.includes('domain') || e.includes('format'))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-xs">
                                <div>
                                  <RoleBadge role={u.role}/>
                                  {!u.isValid && u.errors.some(e => e.includes('role')) && (
                                    <div className="text-[0.65rem] font-normal mt-0.5" style={{ color: 'var(--accent-rose)' }}>
                                      {u.errors.find(e => e.includes('role'))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-xs text-dim">{u.department || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {bulkUsers.some(u => !u.isValid) && (
                      <div className="shrink-0" style={{ background: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.12)', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }}>
                        <strong>Crucial Validation Warning:</strong> The CSV contains invalid records (highlighted in red). Since the registration process is atomic, you must correct these rows in your CSV file and re-upload before proceeding.
                      </div>
                    )}

                    <div className="flex gap-3 pt-2 border-t border-glass shrink-0">
                      <button onClick={closeBulkUpload} className="btn-ghost flex-1 justify-center py-2 text-xs">Cancel</button>
                      <button 
                        onClick={handleBulkUpload} 
                        disabled={bulkUploading || bulkUsers.some(u => !u.isValid) || bulkUsers.length === 0} 
                        className="btn-primary flex-[2] justify-center py-2 text-xs"
                      >
                        {bulkUploading ? (
                          <><RefreshCw size={13} className="spin" /> Processing...</>
                        ) : (
                          <><Check size={13} /> Confirm & Register</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
