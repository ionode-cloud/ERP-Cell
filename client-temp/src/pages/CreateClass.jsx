import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import { PenLine, CheckCircle, XCircle, Clock, Send, ChevronRight, Users } from 'lucide-react';

const STATUSES = ['Present', 'Absent', 'Late'];
const STATUS_COLORS = { Present: '#059669', Absent: '#dc2626', Late: '#d97706' };
const STATUS_BG = { Present: '#d1fae5', Absent: '#fee2e2', Late: '#fef9c3' };
const STATUS_ICONS = {
    Present: <CheckCircle size={15} />,
    Absent: <XCircle size={15} />,
    Late: <Clock size={15} />,
};
function nextStatus(s) { return STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length]; }

export default function CreateClass() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Step 1 fields
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [step, setStep] = useState('form'); // 'form' | 'attendance'

    // Step 2
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const profRes = await api.get('/teachers/me');
                setProfile(profRes.data.data);
                const branchId = profRes.data.data?.branch?._id || profRes.data.data?.branch;
                if (branchId) {
                    const stuRes = await api.get(`/students?branch=${branchId}&limit=200`);
                    setStudents(stuRes.data.data || []);
                }
            } catch (e) { toast.error('Failed to load data'); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const subjects = Array.isArray(profile?.subjects) ? profile.subjects : profile?.subjects ? [profile.subjects] : [];
    const branchId = profile?.branch?._id || profile?.branch;

    const startClass = () => {
        if (!subject) { toast.error('Select a subject'); return; }
        if (!date) { toast.error('Select a date'); return; }
        setRows(students.map(s => ({ studentId: s._id, name: s.name, rollNo: s.rollNo, status: 'Present' })));
        setStep('attendance');
    };

    const toggleStatus = (idx) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: nextStatus(r.status) } : r));
    const markAll = (status) => setRows(prev => prev.map(r => ({ ...r, status })));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const records = rows.map(r => ({ studentId: r.studentId, status: r.status, branch: branchId }));
            await api.post('/attendance/mark', { records, subject, date });
            const summary = {
                present: rows.filter(r => r.status === 'Present').length,
                absent: rows.filter(r => r.status === 'Absent').length,
                late: rows.filter(r => r.status === 'Late').length,
            };
            setResult(summary);
            setDone(true);
            toast.success('Attendance saved!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to submit');
        } finally { setSubmitting(false); }
    };

    const resetAll = () => { setStep('form'); setDone(false); setRows([]); setResult(null); setSubject(subjects[0] || ''); };

    if (loading) return <div className="page-loader"><div className="spinner-lg" /><p>Loading...</p></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create Class</h1>
                    <p className="page-subtitle">{profile?.branch?.name} · {students.length} students</p>
                </div>
            </div>

            {done ? (
                /* ── Success Screen ── */
                <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
                    <CheckCircle size={52} color="#059669" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ marginBottom: '.5rem' }}>Class Recorded!</h2>
                    <p className="text-muted-sm"><strong>{subject}</strong> · {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="att-submit-summary" style={{ justifyContent: 'center', margin: '1.25rem 0' }}>
                        <span style={{ color: '#059669' }}>✓ {result.present} Present</span>
                        <span style={{ color: '#dc2626' }}>✗ {result.absent} Absent</span>
                        <span style={{ color: '#d97706' }}>⏱ {result.late} Late</span>
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
                        <button className="btn-primary" onClick={resetAll}><PenLine size={16} /> New Class</button>
                    </div>
                </div>
            ) : step === 'form' ? (
                /* ── Step 1: Subject + Date ── */
                <div className="card" style={{ maxWidth: 520 }}>
                    <h2 className="card-title" style={{ marginBottom: '1.25rem' }}><PenLine size={18} />Class Details</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Subject *</label>
                            {subjects.length > 0
                                ? <select value={subject} onChange={e => setSubject(e.target.value)}>
                                    <option value="">— Select Subject —</option>
                                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                </select>
                                : <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter subject name" />}
                        </div>
                        <div className="form-group">
                            <label>Date *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                        </div>
                        <button className="btn-primary" onClick={startClass} style={{ marginTop: '.25rem', justifyContent: 'center' }}>
                            <Users size={16} /> Start Attendance ({students.length} students) <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Step 2: Attendance Marking ── */
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
                        <div>
                            <h2 className="card-title"><PenLine size={18} />Mark Attendance — {subject}</h2>
                            <p className="text-muted-sm">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="att-quick-actions" style={{ margin: 0 }}>
                            <span className="text-muted-sm">All:</span>
                            <button className="att-quick-btn att-q-present" onClick={() => markAll('Present')}>✓ Present</button>
                            <button className="att-quick-btn att-q-absent" onClick={() => markAll('Absent')}>✗ Absent</button>
                        </div>
                    </div>

                    <div className="att-mark-list">
                        <div className="att-mark-header" style={{ gridTemplateColumns: '1fr 140px' }}>
                            <span>Student</span><span style={{ textAlign: 'center' }}>Status (tap to change)</span>
                        </div>
                        {rows.map((r, idx) => (
                            <div key={r.studentId} className="att-mark-row" style={{ gridTemplateColumns: '1fr 140px' }}>
                                <div className="att-student-info">
                                    <div className="avatar avatar-sm" style={{ background: STATUS_BG[r.status], color: STATUS_COLORS[r.status] }}>{r.name?.charAt(0)}</div>
                                    <div><div className="att-student-name">{r.name}</div><div className="att-student-roll">{r.rollNo}</div></div>
                                </div>
                                <button
                                    className="att-status-btn"
                                    style={{ background: STATUS_BG[r.status], color: STATUS_COLORS[r.status], borderColor: STATUS_COLORS[r.status] }}
                                    onClick={() => toggleStatus(idx)}
                                >
                                    {STATUS_ICONS[r.status]} {r.status}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="att-submit-bar">
                        <div className="att-submit-summary">
                            <span style={{ color: '#059669' }}>✓ {rows.filter(r => r.status === 'Present').length}</span>
                            <span style={{ color: '#dc2626' }}>✗ {rows.filter(r => r.status === 'Absent').length}</span>
                            <span style={{ color: '#d97706' }}>⏱ {rows.filter(r => r.status === 'Late').length}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '.75rem' }}>
                            <button className="btn-secondary" onClick={() => setStep('form')}>← Back</button>
                            <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                                <Send size={15} /> {submitting ? 'Saving...' : 'Submit Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
