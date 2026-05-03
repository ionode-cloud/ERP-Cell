import { PacmanLoader } from 'react-spinners';
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

    if (loading) return <div className="page-loading"><PacmanLoader color="#3ecec9" /></div>;
    if (!fee) return <div className="page"><div className="empty-state">No fee record found.</div></div>;

    const paid = fee.paidAmount || 0;
    const total = fee.totalAmount || 0;
    const balance = fee.dueAmount !== undefined ? fee.dueAmount : (total - paid);
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    // Merge payments and charges into a single sorted history
    const payments = (fee.payments || []).map(p => ({
        date: p.date,
        amount: p.amount,
        type: 'payment',
        method: p.method || 'Cash',
        description: p.remarks || p.description || '—',
    }));
    const charges = (fee.charges || []).map(c => ({
        date: c.date,
        amount: c.amount,
        type: 'charge',
        method: 'Branch Fee',
        description: c.description || 'Additional branch fee',
    }));
    const history = [...payments, ...charges].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="page">
            <div className="page-header"><div><h1 className="page-title">My Fees</h1></div></div>

            <div className="fee-summary-grid">
                <div className="fee-card fee-total">
                    <IndianRupee size={24} />
                    <div className="fee-amount">&#8377;{total.toLocaleString()}</div>
                    <div className="fee-label">Total Fee</div>
                </div>
                <div className="fee-card fee-paid">
                    <CheckCircle size={24} />
                    <div className="fee-amount">&#8377;{paid.toLocaleString()}</div>
                    <div className="fee-label">Amount Paid</div>
                </div>
                <div className="fee-card fee-balance">
                    <Clock size={24} />
                    <div className="fee-amount">&#8377;{balance.toLocaleString()}</div>
                    <div className="fee-label">Balance Due</div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Payment Progress</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <p style={{ textAlign: 'right', marginTop: '0.5rem', color: '#6b7280' }}>{pct}% paid</p>
            </div>

            {history.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Fee History</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '.75rem', fontWeight: 700,
                                                padding: '2px 8px', borderRadius: 20,
                                                background: h.type === 'payment' ? '#d1fae5' : '#fee2e2',
                                                color: h.type === 'payment' ? '#065f46' : '#991b1b'
                                            }}>
                                                {h.type === 'payment' ? 'Payment' : 'Charge'}
                                            </span>
                                        </td>
                                        <td>{new Date(h.date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 700, color: h.type === 'payment' ? '#059669' : '#dc2626' }}>
                                            {h.type === 'charge' ? '+' : ''}&#8377;{h.amount.toLocaleString()}
                                        </td>
                                        <td>{h.method}</td>
                                        <td>{h.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {history.length === 0 && (
                <div className="card">
                    <div className="empty-state" style={{ padding: '2rem' }}>No fee transactions recorded yet.</div>
                </div>
            )}
        </div>
    );
}
