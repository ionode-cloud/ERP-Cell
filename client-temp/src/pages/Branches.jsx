import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const emptyForm = { name: '', code: '', description: '', totalFee: '' };

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchBranches = async () => {
        try { const res = await api.get('/branches'); setBranches(res.data.data || []); }
        catch { toast.error('Failed to load branches'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBranches(); }, []);

    const openAdd = () => { setEditId(null); setForm(emptyForm); setModal(true); };
    const openEdit = (b) => { setEditId(b._id); setForm(b); setModal(true); };
    const closeModal = () => { setModal(false); setForm(emptyForm); setEditId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editId) { await api.put(`/branches/${editId}`, form); toast.success('Branch updated'); }
            else { await api.post('/branches', form); toast.success('Branch added'); }
            closeModal(); fetchBranches();
        } catch (err) { toast.error(err?.response?.data?.message || 'Error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this branch?')) return;
        try { await api.delete(`/branches/${id}`); toast.success('Deleted'); fetchBranches(); }
        catch { toast.error('Delete failed'); }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Branches</h1><p className="page-subtitle">{branches.length} total branches</p></div>
                <button className="btn-primary" onClick={openAdd}><Plus size={18} />Add Branch</button>
            </div>

            {loading ? <div className="page-loading"><div className="spinner-lg" /></div> : (
                <div className="branch-grid">
                    {branches.length === 0 && <div className="empty-state">No branches yet. Add one!</div>}
                    {branches.map(b => (
                        <div key={b._id} className="branch-card">
                            <div className="branch-icon">{b.code || b.name?.charAt(0)}</div>
                            <div className="branch-info">
                                <h3>{b.name}</h3>
                                {b.code && <span className="badge">{b.code}</span>}
                                {b.description && <p>{b.description}</p>}
                                {b.totalFee && <p className="branch-fee">Total Fee: ₹{Number(b.totalFee).toLocaleString()}</p>}
                            </div>
                            <div className="branch-actions">
                                <button className="btn-icon btn-edit" onClick={() => openEdit(b)}><Edit2 size={15} /></button>
                                <button className="btn-icon btn-delete" onClick={() => handleDelete(b._id)}><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editId ? 'Edit Branch' : 'Add Branch'}</h2>
                            <button className="modal-close" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group"><label>Branch Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="form-group"><label>Code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS, IT" /></div>
                            <div className="form-group"><label>Total Fee (₹)</label><input type="number" value={form.totalFee} onChange={e => setForm({ ...form, totalFee: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (editId ? 'Update' : 'Add Branch')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
