import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Key, X, Copy, CheckCircle } from 'lucide-react';

const emptyForm = { name: '', email: '', phone: '', gender: '', employeeId: '', branch: '', subjects: '', qualification: '', experience: '', salary: '', address: '' };

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [copied, setCopied] = useState('');

    const fetchAll = async () => {
        try {
            const [tRes, bRes] = await Promise.all([api.get('/teachers'), api.get('/branches')]);
            setTeachers(tRes.data.data || []);
            setBranches(bRes.data.data || []);
        } catch { toast.error('Failed to load teachers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const openAdd = () => { setEditId(null); setForm(emptyForm); setModal(true); };
    const openEdit = (t) => { setEditId(t._id); setForm({ ...t, branch: t.branch?._id || t.branch, subjects: Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects }); setModal(true); };
    const closeModal = () => { setModal(false); setEditId(null); setForm(emptyForm); };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form, subjects: form.subjects ? form.subjects.split(',').map(s => s.trim()) : [] };
            if (editId) {
                await api.put(`/teachers/${editId}`, payload);
                toast.success('Teacher updated');
                closeModal(); fetchAll();
            } else {
                const res = await api.post('/teachers', payload);
                toast.success('Teacher added!');
                closeModal();
                setCredentials(res.data.credentials);
                fetchAll();
            }
        } catch (err) { toast.error(err?.response?.data?.message || 'Error saving'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this teacher?')) return;
        try { await api.delete(`/teachers/${id}`); toast.success('Deleted'); fetchAll(); }
        catch { toast.error('Delete failed'); }
    };

    const handleRegen = async (id) => {
        try {
            const res = await api.post(`/teachers/${id}/credentials`);
            setCredentials(res.data.credentials);
        } catch { toast.error('Failed to reset credentials'); }
    };

    const filtered = teachers.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Teachers</h1><p className="page-subtitle">{teachers.length} total teachers</p></div>
                <button className="btn-primary" onClick={openAdd}><Plus size={18} />Add Teacher</button>
            </div>

            <div className="card">
                <div className="table-toolbar">
                    <div className="search-box"><Search size={16} /><input placeholder="Search by name, email, employee ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                {loading ? <div className="table-loading"><div className="spinner-lg" /></div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Employee ID</th><th>Branch</th><th>Qualification</th><th>Login Email</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? <tr><td colSpan={6} className="empty-row">No teachers found</td></tr> :
                                    filtered.map(t => (
                                        <tr key={t._id}>
                                            <td><div className="cell-with-avatar"><div className="avatar avatar-green">{t.name?.charAt(0)}</div>{t.name}</div></td>
                                            <td>{t.employeeId}</td>
                                            <td>{t.branch?.name || t.branch}</td>
                                            <td>{t.qualification}</td>
                                            <td className="text-muted-sm">{t.userId?.loginId || t.email}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon btn-edit" title="Edit" onClick={() => openEdit(t)}><Edit2 size={15} /></button>
                                                    <button className="btn-icon btn-key" title="Reset Password" onClick={() => handleRegen(t._id)}><Key size={15} /></button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(t._id)}><Trash2 size={15} /></button>
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
                            <h2>{editId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button className="modal-close" onClick={closeModal}><X size={20} /></button>
                        </div>
                        {!editId && (
                            <div className="modal-info-banner">
                                📧 The teacher's <strong>email</strong> will be their <strong>Login ID</strong>. Password is auto-generated as <code>firstname@employeeId</code>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label>Email (Login ID) *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editId} placeholder="e.g. suresh@gmail.com" /></div>
                                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label>Employee ID *</label><input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required /></div>
                                <div className="form-group"><label>Branch</label>
                                    <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Subjects (comma separated)</label><input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} placeholder="e.g. Maths, Physics" /></div>
                                <div className="form-group"><label>Qualification</label><input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                                <div className="form-group"><label>Experience (years)</label><input type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></div>
                                <div className="form-group"><label>Gender</label>
                                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Salary (₹)</label><input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                                <div className="form-group form-full"><label>Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (editId ? 'Update Teacher' : 'Add Teacher')}</button>
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
                            <h2>🎉 Teacher Credentials</h2>
                            <button className="modal-close" onClick={() => setCredentials(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p className="cred-note">Share these credentials with the teacher. Save the password — it won't be shown again.</p>
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
