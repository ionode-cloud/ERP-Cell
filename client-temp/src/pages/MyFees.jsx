import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';

export default function MyFees() {
    const [fee, setFee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/fees/me')
            .then(res => setFee(res.data.data))
            .catch(() => toast.error('Failed to load fee info'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;
    if (!fee) return <div className="page"><div className="empty-state">No fee record found.</div></div>;

    const paid = fee.paidAmount || 0;
    const total = fee.totalFee || 0;
    const balance = total - paid;
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return (
        <div className="page">
            <div className="page-header"><div><h1 className="page-title">My Fees</h1></div></div>

            <div className="fee-summary-grid">
                <div className="fee-card fee-total"><IndianRupee size={24} /><div className="fee-amount">₹{total.toLocaleString()}</div><div className="fee-label">Total Fee</div></div>
                <div className="fee-card fee-paid"><CheckCircle size={24} /><div className="fee-amount">₹{paid.toLocaleString()}</div><div className="fee-label">Amount Paid</div></div>
                <div className="fee-card fee-balance"><Clock size={24} /><div className="fee-amount">₹{balance.toLocaleString()}</div><div className="fee-label">Balance Due</div></div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Payment Progress</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <p style={{ textAlign: 'right', marginTop: '0.5rem', color: '#6b7280' }}>{pct}% paid</p>
            </div>

            {fee.payments?.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Payment History</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Amount</th><th>Description</th></tr></thead>
                            <tbody>
                                {fee.payments.map((p, i) => (
                                    <tr key={i}>
                                        <td>{new Date(p.date).toLocaleDateString()}</td>
                                        <td>₹{p.amount.toLocaleString()}</td>
                                        <td>{p.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
