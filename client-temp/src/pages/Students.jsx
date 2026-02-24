import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Key, X, Copy, CheckCircle } from 'lucide-react';

const emptyForm = { name: '', email: '', phone: '', gender: '', dob: '', branch: '', semester: '', rollNo: '', address: '', guardianName: '', guardianPhone: '' };

export default function Students() {
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [credentials, setCredentials] = useState(null); // shows after create
    const [copied, setCopied] = useState('');

    const fetchStudents = async () => {
        try { const res = await api.get('/students'); setStudents(res.data.data || []); }
        catch { toast.error('Failed to load students'); }
        finally { setLoading(false); }
    };
    const fetchBranches = async () => {
        try { const res = await api.get('/branches'); setBranches(res.data.data || []); }
        catch { }
    };
    useEffect(() => { fetchStudents(); fetchBranches(); }, []);

    const openAdd = () => { setEditId(null); setForm(emptyForm); setModal(true); };
    const openEdit = (s) => { setEditId(s._id); setForm({ ...s, branch: s.branch?._id || s.branch }); setModal(true); };
    const closeModal = () => { setModal(false); setEditId(null); setForm(emptyForm); };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editId) {
                await api.put(`/students/${editId}`, form);
                toast.success('Student updated');
                closeModal(); fetchStudents();
            } else {
                const res = await api.post('/students', form);
                toast.success('Student added successfully!');
                closeModal();
                setCredentials(res.data.credentials);
                fetchStudents();
            }
        } catch (err) { toast.error(err?.response?.data?.message || 'Error saving'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student?')) return;
        try { await api.delete(`/students/${id}`); toast.success('Deleted'); fetchStudents(); }
        catch { toast.error('Delete failed'); }
    };

    const handleRegen = async (id) => {
        try {
            const res = await api.post(`/students/${id}/credentials`);
            setCredentials(res.data.credentials);
        } catch { toast.error('Failed to reset credentials'); }
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Students</h1><p className="page-subtitle">{students.length} total students</p></div>
                <button className="btn-primary" onClick={openAdd}><Plus size={18} />Add Student</button>
            </div>

            <div className="card">
                <div className="table-toolbar">
                    <div className="search-box"><Search size={16} /><input placeholder="Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                {loading ? <div className="table-loading"><div className="spinner-lg" /></div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Roll No</th><th>Branch</th><th>Semester</th><th>Login Email</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? <tr><td colSpan={6} className="empty-row">No students found</td></tr> :
                                    filtered.map(s => (
                                        <tr key={s._id}>
                                            <td><div className="cell-with-avatar"><div className="avatar">{s.name?.charAt(0)}</div>{s.name}</div></td>
                                            <td>{s.rollNo}</td>
                                            <td>{s.branch?.name || s.branch}</td>
                                            <td>Sem {s.semester}</td>
                                            <td className="text-muted-sm">{s.userId?.loginId || s.email}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon btn-edit" title="Edit" onClick={() => openEdit(s)}><Edit2 size={15} /></button>
                                                    <button className="btn-icon btn-key" title="Reset Password" onClick={() => handleRegen(s._id)}><Key size={15} /></button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(s._id)}><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Student' : 'Add New Student'}</h2>
                            <button className="modal-close" onClick={closeModal}><X size={20} /></button>
                        </div>
                        {!editId && (
                            <div className="modal-info-banner">
                                📧 The student's <strong>email</strong> will be their <strong>Login ID</strong>. Password is auto-generated as <code>firstname@rollno</code>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label>Email (Login ID) *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editId} placeholder="e.g. rahul@gmail.com" /></div>
                                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label>Roll No *</label><input value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} required /></div>
                                <div className="form-group"><label>Branch *</label>
                                    <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Semester *</label>
                                    <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required>
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Gender</label>
                                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Date of Birth</label><input type="date" value={form.dob?.split('T')[0] || ''} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                                <div className="form-group"><label>Guardian Name</label><input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} /></div>
                                <div className="form-group"><label>Guardian Phone</label><input value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} /></div>
                                <div className="form-group form-full"><label>Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (editId ? 'Update Student' : 'Add Student')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credential Reveal Modal */}
            {credentials && (
                <div className="modal-overlay" onClick={() => setCredentials(null)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎉 Student Credentials</h2>
                            <button className="modal-close" onClick={() => setCredentials(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p className="cred-note">Share these credentials with the student. Save the password — it won't be shown again.</p>
                            <div className="cred-box">
                                <div className="cred-row">
                                    <div>
                                        <div className="cred-label">Login ID (Email)</div>
                                        <div className="cred-value">{credentials.loginId}</div>
                                    </div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credentials.loginId, 'id')}>
                                        {copied === 'id' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="cred-row">
                                    <div>
                                        <div className="cred-label">Password</div>
                                        <div className="cred-value cred-password">{credentials.password}</div>
                                    </div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credentials.password, 'pw')}>
                                        {copied === 'pw' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCredentials(null)}>Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
