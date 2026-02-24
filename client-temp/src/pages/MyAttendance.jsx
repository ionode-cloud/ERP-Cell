import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function MyAttendance() {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/attendance/me')
            .then(res => {
                const data = res.data.data;
                if (Array.isArray(data)) {
                    setRecords(data);
                } else {
                    setRecords(data?.records || []);
                    setStats({
                        total: data?.total || 0,
                        present: data?.present || 0,
                        absent: (data?.total || 0) - (data?.present || 0),
                        late: 0,
                        percentage: data?.percentage || 0,
                    });
                }
            })
            .catch(() => toast.error('Failed to load attendance'))
            .finally(() => setLoading(false));
    }, []);

    const total = stats.total || records.length;
    const present = stats.present;
    const absent = stats.absent;
    const late = stats.late;
    const pct = stats.percentage;

    const statusIcon = (s) => {
        if (s === 'present') return <CheckCircle size={18} color="#059669" />;
        if (s === 'absent') return <XCircle size={18} color="#dc2626" />;
        return <Clock size={18} color="#d97706" />;
    };

    if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

    return (
        <div className="page">
            <div className="page-header"><div><h1 className="page-title">My Attendance</h1></div></div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon" style={{ background: '#4f46e5' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{total}</span></div><div><div className="stat-value">Total</div><div className="stat-label">Classes</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: '#059669' }}><CheckCircle size={24} color="#fff" /></div><div><div className="stat-value">{present}</div><div className="stat-label">Present</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: '#dc2626' }}><XCircle size={24} color="#fff" /></div><div><div className="stat-value">{absent}</div><div className="stat-label">Absent</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{ background: '#d97706' }}><Clock size={24} color="#fff" /></div><div><div className="stat-value">{pct}%</div><div className="stat-label">Attendance</div></div></div>
            </div>

            {records.length > 0 ? (
                <div className="card">
                    <div className="progress-bar-container" style={{ marginBottom: '1.5rem' }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, background: pct >= 75 ? '#059669' : '#dc2626' }} />
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Status</th></tr></thead>
                            <tbody>
                                {records.map((r, i) => (
                                    <tr key={i}>
                                        <td>{new Date(r.date).toLocaleDateString()}</td>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{statusIcon(r.status)}{r.status}</div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state">No attendance records yet.</div>
            )}
        </div>
    );
}
