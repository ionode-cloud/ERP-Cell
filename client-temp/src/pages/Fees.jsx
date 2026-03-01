import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Plus, X, Bell, AlertTriangle, IndianRupee, CheckCircle, CreditCard, Users } from 'lucide-react';

export default function Fees() {
    const [fees, setFees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    // Branch payment modal
    const [payModal, setPayModal] = useState(false);
    const [payForm, setPayForm] = useState({ branchId: '', amount: '', method: 'Cash', remarks: '' });
    const [saving, setSaving] = useState(false);

    // Student payment modal
    const [studentPayModal, setStudentPayModal] = useState(false);
    const [studentPayForm, setStudentPayForm] = useState({ rollNo: '', name: '', amount: '', method: 'Cash', remarks: '' });

    // Alert modal
    const [alertModal, setAlertModal] = useState(false);
    const [alertBranch, setAlertBranch] = useState('');
    const [alertResult, setAlertResult] = useState(null);
    const [alerting, setAlerting] = useState(false);

    const fetchFees = async () => {
        try {
            const params = filterBranch ? `?branch=${filterBranch}` : '';
            const res = await api.get(`/fees${params}`);
            setFees(res.data.data || []);
        } catch { toast.error('Failed to load fees'); }
        finally { setLoading(false); }
    };

    const fetchBranches = async () => {
        try { const res = await api.get('/branches'); setBranches(res.data.data || []); }
        catch { }
    };

    useEffect(() => { fetchBranches(); }, []);
    useEffect(() => { setLoading(true); fetchFees(); }, [filterBranch]);

    // ── Branch-level payment ──
    const handleBranchPayment = async (e) => {
        e.preventDefault();
        if (!payForm.branchId) return toast.error('Select a branch');
        if (!payForm.amount || Number(payForm.amount) <= 0) return toast.error('Enter a valid amount');
        setSaving(true);
        try {
            const res = await api.post('/fees/branch-payment', {
                branchId: payForm.branchId,
                amount: payForm.amount,
                method: payForm.method,
                remarks: payForm.remarks,
            });
            toast.success(res.data.message || 'Payment applied');
            setPayModal(false);
            setPayForm({ branchId: '', amount: '', method: 'Cash', remarks: '' });
            fetchFees();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment failed');
        } finally { setSaving(false); }
    };

    // ── Student-level payment ──
    const handleStudentPayment = async (e) => {
        e.preventDefault();
        if (!studentPayForm.rollNo) return toast.error('Enter Student Roll No');
        if (!studentPayForm.amount || Number(studentPayForm.amount) <= 0) return toast.error('Enter a valid amount');
        setSaving(true);
        try {
            const res = await api.post('/fees/payment', {
                rollNo: studentPayForm.rollNo,
                amount: studentPayForm.amount,
                method: studentPayForm.method,
                remarks: studentPayForm.remarks,
            });
            toast.success(res.data.message || 'Payment applied');
            setStudentPayModal(false);
            setStudentPayForm({ rollNo: '', name: '', amount: '', method: 'Cash', remarks: '' });
            fetchFees();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment failed');
        } finally { setSaving(false); }
    };

    // ── Send alert ──
    const handleSendAlert = async () => {
        setAlerting(true);
        try {
            const body = alertBranch ? { branchId: alertBranch } : {};
            const res = await api.post('/fees/send-alert', body);
            setAlertResult(res.data);
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Alert failed');
        } finally { setAlerting(false); }
    };

    const filtered = fees.filter(f =>
        f.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.student?.rollNo?.toLowerCase().includes(search.toLowerCase())
    );

    const statusColor = (paid, total) => {
        const pct = total > 0 ? (paid / total) * 100 : 0;
        return pct >= 100 ? 'status-paid' : pct > 0 ? 'status-partial' : 'status-unpaid';
    };
    const statusLabel = (paid, total) => {
        const pct = total > 0 ? (paid / total) * 100 : 0;
        return pct >= 100 ? 'Paid' : pct > 0 ? 'Partial' : 'Unpaid';
    };

    // Summary stats
    const totalFees = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
    const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    const totalDue = fees.reduce((s, f) => s + (f.dueAmount || 0), 0);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fee Management</h1>
                    <p className="page-subtitle">{fees.length} fee records</p>
                </div>
                <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ borderColor: '#f59e0b', color: '#d97706' }} onClick={() => { setAlertModal(true); setAlertResult(null); }}>
                        <Bell size={16} />Send Alert
                    </button>
                    <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => setStudentPayModal(true)}>
                        <IndianRupee size={16} />Submit Student Fee
                    </button>
                    <button className="btn-primary" onClick={() => setPayModal(true)}>
                        <Plus size={16} />Add Branch Payment
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eef2ff' }}><IndianRupee size={22} color="#4f46e5" /></div>
                    <div><div className="stat-value">₹{totalFees.toLocaleString()}</div><div className="stat-label">Total Fees</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7' }}><CheckCircle size={22} color="#059669" /></div>
                    <div><div className="stat-value" style={{ color: '#059669' }}>₹{totalPaid.toLocaleString()}</div><div className="stat-label">Collected</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fee2e2' }}><AlertTriangle size={22} color="#dc2626" /></div>
                    <div><div className="stat-value" style={{ color: '#dc2626' }}>₹{totalDue.toLocaleString()}</div><div className="stat-label">Pending</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef9c3' }}><Users size={22} color="#d97706" /></div>
                    <div>
                        <div className="stat-value" style={{ color: '#d97706' }}>
                            {fees.length > 0 ? Math.round((totalPaid / totalFees) * 100) : 0}%
                        </div>
                        <div className="stat-label">Collection Rate</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '.75rem' }}>
                    <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
                        <Search size={16} />
                        <input placeholder="Search by student name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select
                        value={filterBranch}
                        onChange={e => setFilterBranch(e.target.value)}
                        style={{ minWidth: 180, height: 38, borderRadius: 8, border: '1.5px solid var(--border)', padding: '0 .75rem', fontSize: '.875rem' }}
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                </div>

                {loading ? <div className="table-loading"><div className="spinner-lg" /></div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>Branch</th>
                                    <th>Total Fee</th>
                                    <th>Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0
                                    ? <tr><td colSpan={7} className="empty-row">No fee records found</td></tr>
                                    : filtered.map(f => {
                                        const total = f.totalAmount || 0;
                                        const paid = f.paidAmount || 0;
                                        const balance = f.dueAmount ?? (total - paid);
                                        return (
                                            <tr key={f._id}>
                                                <td><div className="cell-with-avatar"><div className="avatar avatar-orange">{f.student?.name?.charAt(0)}</div>{f.student?.name}</div></td>
                                                <td>{f.student?.rollNo}</td>
                                                <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{f.branch?.name || '—'}</td>
                                                <td style={{ fontWeight: 600 }}>₹{total.toLocaleString()}</td>
                                                <td style={{ color: '#059669', fontWeight: 600 }}>₹{paid.toLocaleString()}</td>
                                                <td style={{ color: balance > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>₹{balance.toLocaleString()}</td>
                                                <td><span className={`status-badge ${statusColor(paid, total)}`}>{statusLabel(paid, total)}</span></td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Branch Payment Modal ── */}
            {payModal && (
                <div className="modal-overlay" onClick={() => setPayModal(false)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><CreditCard size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />Branch Payment</h2>
                            <button className="modal-close" onClick={() => setPayModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                This will record the same payment amount for <strong>all students</strong> in the selected branch.
                            </p>
                            <form onSubmit={handleBranchPayment} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                                <div className="form-group">
                                    <label>Branch *</label>
                                    <select value={payForm.branchId} onChange={e => setPayForm({ ...payForm, branchId: e.target.value })} required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount per Student (₹) *</label>
                                    <input type="number" min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required placeholder="e.g. 25000" />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                                        {['Cash', 'Online', 'Cheque', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Remarks</label>
                                    <input value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="e.g. Semester 1 fee payment" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Applying...' : 'Apply to Branch'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Student Payment Modal ── */}
            {studentPayModal && (
                <div className="modal-overlay" onClick={() => setStudentPayModal(false)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><IndianRupee size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />Submit Student Fee</h2>
                            <button className="modal-close" onClick={() => setStudentPayModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Record a fee payment for an individual student.
                            </p>
                            <form onSubmit={handleStudentPayment} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                                <div className="form-group">
                                    <label>Student Name (Optional)</label>
                                    <input value={studentPayForm.name} onChange={e => setStudentPayForm({ ...studentPayForm, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="form-group">
                                    <label>Roll No *</label>
                                    <input value={studentPayForm.rollNo} onChange={e => setStudentPayForm({ ...studentPayForm, rollNo: e.target.value })} required placeholder="e.g. CSE001" />
                                </div>
                                <div className="form-group">
                                    <label>Amount (₹) *</label>
                                    <input type="number" min="1" value={studentPayForm.amount} onChange={e => setStudentPayForm({ ...studentPayForm, amount: e.target.value })} required placeholder="e.g. 5000" />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select value={studentPayForm.method} onChange={e => setStudentPayForm({ ...studentPayForm, method: e.target.value })}>
                                        {['Cash', 'Online', 'Cheque', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Remarks</label>
                                    <input value={studentPayForm.remarks} onChange={e => setStudentPayForm({ ...studentPayForm, remarks: e.target.value })} placeholder="e.g. Semester 2 fees" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setStudentPayModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ background: '#10b981' }} disabled={saving}>{saving ? 'Applying...' : 'Submit Fee'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Alert Modal ── */}
            {alertModal && (
                <div className="modal-overlay" onClick={() => { setAlertModal(false); setAlertResult(null); }}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Bell size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />Send Payment Alert</h2>
                            <button className="modal-close" onClick={() => { setAlertModal(false); setAlertResult(null); }}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            {!alertResult ? (
                                <>
                                    <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Send payment reminder alerts to students with pending dues.
                                    </p>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label>Filter by Branch (optional)</label>
                                        <select value={alertBranch} onChange={e => setAlertBranch(e.target.value)}>
                                            <option value="">All Branches</option>
                                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setAlertModal(false)}>Cancel</button>
                                        <button
                                            className="btn-primary"
                                            style={{ background: '#d97706' }}
                                            disabled={alerting}
                                            onClick={handleSendAlert}
                                        >
                                            <Bell size={15} />{alerting ? 'Sending...' : 'Send Alerts'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ background: '#d1fae5', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem', color: '#065f46', fontWeight: 600, fontSize: '.9rem' }}>
                                        ✓ {alertResult.message}
                                    </div>
                                    {alertResult.data?.length > 0 && (
                                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                                            <table className="mini-table">
                                                <thead><tr><th>Name</th><th>Roll No</th><th>Due (₹)</th></tr></thead>
                                                <tbody>
                                                    {alertResult.data.map((s, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{s.name}</td>
                                                            <td style={{ fontSize: '.8rem' }}>{s.rollNo}</td>
                                                            <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{s.dueAmount?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setAlertModal(false); setAlertResult(null); }}>Done</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
