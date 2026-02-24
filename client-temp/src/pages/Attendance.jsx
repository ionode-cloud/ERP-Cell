import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Calendar, Users, BarChart2, History, CheckCircle, XCircle, Clock, Edit2, Trash2, Save, X } from 'lucide-react';

const STATUS_COLOR = { Present: '#059669', Absent: '#dc2626', Late: '#d97706' };
const STATUS_BG = { Present: '#d1fae5', Absent: '#fee2e2', Late: '#fef9c3' };
const STATUSES = ['Present', 'Absent', 'Late'];
const STATUS_ICONS = {
    Present: <CheckCircle size={14} />,
    Absent: <XCircle size={14} />,
    Late: <Clock size={14} />,
};
function nextStatus(s) { return STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length]; }

// ── Group flat attendance records → sessions ──
function groupSessions(records) {
    const map = {};
    records.forEach(r => {
        const isoDate = r.date ? new Date(r.date).toISOString().split('T')[0] : 'unknown';
        const key = `${isoDate}||${r.subject}||${r.branch?._id || r.branch || ''}`;
        if (!map[key]) {
            map[key] = {
                isoDate,
                subject: r.subject,
                branchId: r.branch?._id || r.branch || '',
                branchName: r.branch?.name || '—',
                dateLabel: r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                present: 0, absent: 0, late: 0, total: 0,
                studentRows: [],
            };
        }
        map[key].total++;
        if (r.status === 'Present') map[key].present++;
        else if (r.status === 'Absent') map[key].absent++;
        else if (r.status === 'Late') map[key].late++;
        map[key].studentRows.push({
            studentId: r.student?._id || r.student,
            name: r.student?.name || '—',
            rollNo: r.student?.rollNo || '',
            status: r.status,
        });
    });
    return Object.values(map).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}

// ── Edit Session Modal ──
function EditSessionModal({ session, onClose, onSaved }) {
    const [rows, setRows] = useState(session.studentRows.map(r => ({ ...r })));
    const [saving, setSaving] = useState(false);

    const toggle = idx => setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: nextStatus(r.status) } : r));

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/attendance/session', {
                subject: session.subject,
                date: session.isoDate,
                branchId: session.branchId,
                records: rows.map(r => ({ studentId: r.studentId, status: r.status })),
            });
            toast.success('Session updated!');
            onSaved();
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Update failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1rem' }}>
                        <Edit2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Edit — {session.subject} · {session.dateLabel}
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-form">
                    <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        {rows.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '.5rem .75rem', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.name}</div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{r.rollNo}</div>
                                </div>
                                <button
                                    onClick={() => toggle(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 5, padding: '.3rem .7rem',
                                        borderRadius: 8, border: `1.5px solid ${STATUS_COLOR[r.status]}55`,
                                        background: STATUS_BG[r.status], color: STATUS_COLOR[r.status],
                                        fontWeight: 700, fontSize: '.8rem', cursor: 'pointer'
                                    }}
                                >
                                    {STATUS_ICONS[r.status]}{r.status}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            <Save size={15} />{saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ──
export default function Attendance() {
    const [tab, setTab] = useState('mark'); // 'mark' | 'history' | 'report'
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mark tab
    const [students, setStudents] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({});
    const [saving, setSaving] = useState(false);

    // History tab
    const [histBranch, setHistBranch] = useState('');
    const [histRecords, setHistRecords] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [editSession, setEditSession] = useState(null);

    // Report tab
    const [reportBranch, setReportBranch] = useState('');
    const [reportStudents, setReportStudents] = useState([]);
    const [reportRecords, setReportRecords] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);

    // Load branches once
    useEffect(() => {
        api.get('/branches')
            .then(r => setBranches(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Mark tab — students
    useEffect(() => {
        if (!selectedBranch) { setStudents([]); return; }
        api.get(`/students?branch=${selectedBranch}&limit=200`)
            .then(r => {
                const list = r.data.data || [];
                setStudents(list);
                const init = {};
                list.forEach(s => init[s._id] = 'Present');
                setAttendance(init);
            })
            .catch(() => { });
    }, [selectedBranch]);

    // History tab — fetch when tab active or branch changes
    const fetchHistory = async () => {
        setHistLoading(true);
        try {
            if (histBranch) {
                const r = await api.get(`/attendance/branch/${histBranch}`);
                setHistRecords(r.data.data || []);
            } else {
                const recs = await Promise.all(
                    branches.map(b => api.get(`/attendance/branch/${b._id}`).then(r => r.data.data || []).catch(() => []))
                );
                setHistRecords(recs.flat());
            }
        } catch { toast.error('Failed to load class history'); }
        finally { setHistLoading(false); }
    };

    useEffect(() => {
        if (tab === 'history' && branches.length > 0) fetchHistory();
    }, [tab, histBranch, branches]);

    // Report tab
    useEffect(() => {
        if (tab !== 'report' || branches.length === 0) return;
        setReportLoading(true);
        const stuParam = reportBranch ? `?branch=${reportBranch}&limit=500` : '?limit=500';
        Promise.all([
            api.get(`/students${stuParam}`),
            reportBranch
                ? api.get(`/attendance/branch/${reportBranch}`).then(r => r.data.data || [])
                : Promise.all(branches.map(b => api.get(`/attendance/branch/${b._id}`).then(r => r.data.data || []).catch(() => []))).then(a => a.flat()),
        ])
            .then(([stuRes, recs]) => {
                setReportStudents(stuRes.data.data || []);
                setReportRecords(recs);
            })
            .catch(() => toast.error('Failed to load report'))
            .finally(() => setReportLoading(false));
    }, [tab, reportBranch, branches]);

    // Mark submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBranch) return toast.error('Select a branch');
        if (students.length === 0) return toast.error('No students in this branch');
        setSaving(true);
        try {
            const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'Absent', branch: selectedBranch }));
            await api.post('/attendance/mark', { branchId: selectedBranch, date, records });
            toast.success(`Attendance marked for ${students.length} students!`);
            if (tab === 'history') fetchHistory();
        } catch (err) { toast.error(err?.response?.data?.message || 'Error marking attendance'); }
        finally { setSaving(false); }
    };

    // Delete session
    const handleDeleteSession = async (cls) => {
        if (!window.confirm(`Delete session: ${cls.subject} on ${cls.dateLabel}?`)) return;
        try {
            await api.delete('/attendance/session', { data: { subject: cls.subject, date: cls.isoDate, branchId: cls.branchId } });
            toast.success('Session deleted');
            fetchHistory();
        } catch (e) { toast.error(e?.response?.data?.message || 'Delete failed'); }
    };

    // Report stats
    const studentStats = reportStudents.map(s => {
        const recs = reportRecords.filter(r => (r.student?._id || r.student) === s._id);
        const total = recs.length;
        const present = recs.filter(r => r.status === 'Present').length;
        const absent = recs.filter(r => r.status === 'Absent').length;
        const late = recs.filter(r => r.status === 'Late').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : null;
        return { ...s, total, present, absent, late, pct };
    }).sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1));

    const sessions = groupSessions(histRecords);

    const TABS = [
        { key: 'mark', label: '✏️ Mark Attendance' },
        { key: 'history', label: '📋 Class History' },
        { key: 'report', label: '📊 Report' },
    ];

    if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Mark, review, and analyse student attendance</p>
                </div>
            </div>

            {/* Tab Toggle */}
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '.55rem 1.25rem', borderRadius: 10, fontWeight: 600,
                        cursor: 'pointer', fontSize: '.875rem',
                        background: tab === t.key ? 'var(--primary)' : 'var(--surface)',
                        color: tab === t.key ? '#fff' : 'var(--text-muted)',
                        border: tab === t.key ? 'none' : '1.5px solid var(--border)',
                        boxShadow: tab === t.key ? '0 2px 8px rgba(79,70,229,.3)' : '0 1px 3px rgba(0,0,0,.07)',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* ── MARK ATTENDANCE ── */}
            {tab === 'mark' && (
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label><Calendar size={14} /> Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                            </div>
                            <div className="form-group">
                                <label><Users size={14} /> Branch</label>
                                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {students.length > 0 && (
                            <>
                                <div className="attendance-header">
                                    <span style={{ fontWeight: 600, fontSize: '.875rem' }}>
                                        {students.length} students — {branches.find(b => b._id === selectedBranch)?.name}
                                    </span>
                                    <div className="attendance-quick">
                                        <button type="button" className="btn-xs btn-success" onClick={() => { const a = {}; students.forEach(s => a[s._id] = 'Present'); setAttendance(a); }}>All Present</button>
                                        <button type="button" className="btn-xs btn-danger" onClick={() => { const a = {}; students.forEach(s => a[s._id] = 'Absent'); setAttendance(a); }}>All Absent</button>
                                    </div>
                                </div>
                                <div className="attendance-list">
                                    {students.map(s => (
                                        <div key={s._id} className="attendance-row">
                                            <div className="cell-with-avatar">
                                                <div className="avatar">{s.name?.charAt(0)}</div>
                                                <div>
                                                    <div className="student-name">{s.name}</div>
                                                    <div className="student-roll">{s.rollNo} · Sem {s.semester}</div>
                                                </div>
                                            </div>
                                            <div className="attendance-toggle">
                                                {STATUSES.map(st => (
                                                    <button
                                                        type="button" key={st}
                                                        className={`att-btn att-${st.toLowerCase()} ${attendance[s._id] === st ? 'att-active' : ''}`}
                                                        onClick={() => setAttendance({ ...attendance, [s._id]: st })}
                                                    >{st}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                                        <span style={{ color: STATUS_COLOR.Present, fontWeight: 600 }}>✓ {Object.values(attendance).filter(v => v === 'Present').length} Present</span>
                                        {' · '}
                                        <span style={{ color: STATUS_COLOR.Absent, fontWeight: 600 }}>✗ {Object.values(attendance).filter(v => v === 'Absent').length} Absent</span>
                                        {' · '}
                                        <span style={{ color: STATUS_COLOR.Late, fontWeight: 600 }}>⏱ {Object.values(attendance).filter(v => v === 'Late').length} Late</span>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Attendance'}</button>
                                </div>
                            </>
                        )}
                        {selectedBranch && students.length === 0 && <div className="empty-state">No students found in this branch.</div>}
                    </form>
                </div>
            )}

            {/* ── CLASS HISTORY ── */}
            {tab === 'history' && (
                <div className="card">
                    {editSession && (
                        <EditSessionModal
                            session={editSession}
                            onClose={() => setEditSession(null)}
                            onSaved={fetchHistory}
                        />
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h2 className="card-title" style={{ margin: 0 }}><History size={18} />Class History</h2>
                        <select
                            value={histBranch}
                            onChange={e => setHistBranch(e.target.value)}
                            style={{ marginLeft: 'auto', minWidth: 200, height: 36, borderRadius: 8, border: '1.5px solid var(--border)', padding: '0 .75rem', fontSize: '.875rem' }}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>

                    {histLoading ? <div className="table-loading"><div className="spinner-lg" /></div>
                        : sessions.length === 0 ? <div className="empty-state-sm">No class sessions found.</div>
                            : (
                                <>
                                    {/* Summary chips */}
                                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                        {[
                                            { label: 'Total Sessions', value: sessions.length, color: '#4f46e5', bg: '#eef2ff' },
                                            { label: 'Total Present', value: sessions.reduce((s, c) => s + c.present, 0), color: '#059669', bg: '#d1fae5' },
                                            { label: 'Total Absent', value: sessions.reduce((s, c) => s + c.absent, 0), color: '#dc2626', bg: '#fee2e2' },
                                        ].map((c, i) => (
                                            <div key={i} style={{ padding: '.45rem 1rem', borderRadius: 10, background: c.bg, display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: c.color }}>{c.value}</span>
                                                <span style={{ fontSize: '.78rem', color: c.color }}>{c.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                                        {sessions.map((cls, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '.7rem 1rem', borderRadius: 12,
                                                background: 'var(--bg)', border: '1px solid var(--border)',
                                                flexWrap: 'wrap', gap: '.5rem',
                                            }}>
                                                {/* Left: date icon + info */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Calendar size={18} color="#2563eb" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{cls.subject}</div>
                                                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>
                                                            {cls.dateLabel}
                                                            {cls.branchName !== '—' && <> · {cls.branchName}</>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: counts + actions */}
                                                <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: 99, background: '#d1fae5', color: '#059669', fontWeight: 700, fontSize: '.78rem' }}>✓ {cls.present} Present</span>
                                                    <span style={{ padding: '3px 10px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '.78rem' }}>✗ {cls.absent} Absent</span>
                                                    {cls.late > 0 && <span style={{ padding: '3px 10px', borderRadius: 99, background: '#fef9c3', color: '#d97706', fontWeight: 700, fontSize: '.78rem' }}>⏱ {cls.late} Late</span>}
                                                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: '.1rem' }}>{cls.total} students</span>

                                                    <button
                                                        onClick={() => setEditSession(cls)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#eff6ff', color: '#2563eb', fontWeight: 600, fontSize: '.78rem' }}
                                                    >
                                                        <Edit2 size={13} />Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSession(cls)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: '.78rem' }}
                                                    >
                                                        <Trash2 size={13} />Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                </div>
            )}

            {/* ── REPORT ── */}
            {tab === 'report' && (
                <div className="card">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h2 className="card-title" style={{ margin: 0 }}><BarChart2 size={18} />Attendance Report</h2>
                        <select
                            value={reportBranch} onChange={e => setReportBranch(e.target.value)}
                            style={{ marginLeft: 'auto', minWidth: 200, height: 36, borderRadius: 8, border: '1.5px solid var(--border)', padding: '0 .75rem', fontSize: '.875rem' }}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>

                    {reportLoading ? <div className="table-loading"><div className="spinner-lg" /></div>
                        : studentStats.length === 0 ? <div className="empty-state-sm">No data found.</div>
                            : (
                                <>
                                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                        {[
                                            { label: 'Total Students', value: studentStats.length, color: '#4f46e5', bg: '#eef2ff' },
                                            { label: 'Below 75%', value: studentStats.filter(s => s.pct !== null && s.pct < 75).length, color: '#dc2626', bg: '#fee2e2' },
                                            { label: 'Above 90%', value: studentStats.filter(s => s.pct !== null && s.pct >= 90).length, color: '#059669', bg: '#d1fae5' },
                                            { label: 'No Records', value: studentStats.filter(s => s.pct === null).length, color: '#d97706', bg: '#fef9c3' },
                                        ].map((c, i) => (
                                            <div key={i} style={{ padding: '.5rem 1rem', borderRadius: 10, background: c.bg, display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: c.color }}>{c.value}</span>
                                                <span style={{ fontSize: '.78rem', color: c.color }}>{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="table-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr><th>Student</th><th>Roll No</th><th>Branch</th><th>Classes</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr>
                                            </thead>
                                            <tbody>
                                                {studentStats.map(s => (
                                                    <tr key={s._id}>
                                                        <td><div className="cell-with-avatar"><div className="avatar avatar-sm">{s.name?.charAt(0)}</div>{s.name}</div></td>
                                                        <td>{s.rollNo}</td>
                                                        <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{s.branch?.name || '—'}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.total}</td>
                                                        <td style={{ textAlign: 'center' }}><span style={{ color: STATUS_COLOR.Present, fontWeight: 700 }}>{s.present}</span></td>
                                                        <td style={{ textAlign: 'center' }}><span style={{ color: STATUS_COLOR.Absent, fontWeight: 700 }}>{s.absent}</span></td>
                                                        <td style={{ textAlign: 'center' }}><span style={{ color: STATUS_COLOR.Late, fontWeight: 700 }}>{s.late}</span></td>
                                                        <td>
                                                            {s.pct === null
                                                                ? <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>No data</span>
                                                                : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                                                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                                                                            <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 3, background: s.pct >= 75 ? STATUS_COLOR.Present : STATUS_COLOR.Absent }} />
                                                                        </div>
                                                                        <span style={{ fontWeight: 700, fontSize: '.85rem', minWidth: 38, color: s.pct >= 75 ? STATUS_COLOR.Present : STATUS_COLOR.Absent }}>{s.pct}%</span>
                                                                    </div>
                                                                )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                </div>
            )}
        </div>
    );
}
