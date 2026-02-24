import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import { Award, Send, CheckCircle, Filter, Users, History, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const EXAM_TYPES = ['Assignment', 'Mid-Term', 'Final', 'Quiz', 'Practical', 'Other'];

// ── Helper: group marks into exam sessions ──
function buildMarksHistory(marks) {
    const map = {};
    marks.forEach(m => {
        const dateStr = m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        const key = `${dateStr}||${m.subject}||${m.examType}`;
        if (!map[key]) {
            map[key] = {
                date: dateStr, rawDate: m.date, subject: m.subject,
                examType: m.examType, maxMarks: m.maxMarks,
                count: 0, totalMarks: 0, passed: 0,
            };
        }
        map[key].count++;
        map[key].totalMarks += m.marks || 0;
        if (m.marks >= m.maxMarks * 0.4) map[key].passed++;
    });
    return Object.values(map).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
}

const EXAM_COLORS = {
    'Final': '#dc2626',
    'Mid-Term': '#d97706',
    'Assignment': '#2563eb',
    'Quiz': '#7c3aed',
    'Practical': '#059669',
    'Other': '#6b7280',
};

export default function Marks() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [students, setStudents] = useState([]);
    const [existingMarks, setExistingMarks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [subject, setSubject] = useState('');
    const [examType, setExamType] = useState('Assignment');
    const [maxMarks, setMaxMarks] = useState(100);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Branch / semester filter
    const [filterSemester, setFilterSemester] = useState('');

    // Marks log filters
    const [filterSubject, setFilterSubject] = useState('');
    const [filterExamType, setFilterExamType] = useState('');

    // History accordion
    const [showHistory, setShowHistory] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const profRes = await api.get('/teachers/me');
                setProfile(profRes.data.data);
                const branchId = profRes.data.data?.branch?._id || profRes.data.data?.branch;
                if (branchId) {
                    const [stuRes, markRes] = await Promise.all([
                        api.get(`/students?branch=${branchId}&limit=200`),
                        api.get(`/marks/branch/${branchId}`),
                    ]);
                    const stuList = stuRes.data.data || [];
                    setAllStudents(stuList);
                    setStudents(stuList);
                    setExistingMarks(markRes.data.data || []);
                    setRows(stuList.map(s => ({ studentId: s._id, name: s.name, rollNo: s.rollNo, semester: s.semester, marks: '', remarks: '' })));
                }
            } catch (e) { toast.error('Failed to load data'); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    // Re-filter on semester change
    useEffect(() => {
        const filtered = filterSemester
            ? allStudents.filter(s => String(s.semester) === filterSemester)
            : allStudents;
        setStudents(filtered);
        setRows(filtered.map(s => ({ studentId: s._id, name: s.name, rollNo: s.rollNo, semester: s.semester, marks: '', remarks: '' })));
        setDone(false);
    }, [filterSemester, allStudents]);

    const subjects = Array.isArray(profile?.subjects) ? profile.subjects : profile?.subjects ? [profile.subjects] : [];
    const branchId = profile?.branch?._id || profile?.branch;
    const semesters = [...new Set(allStudents.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);

    const setRowMarks = (idx, val) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, marks: val } : r));
    const setRowRemarks = (idx, val) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, remarks: val } : r));

    const handleSubmit = async () => {
        if (!subject) { toast.error('Select a subject'); return; }
        const validRows = rows.filter(r => r.marks !== '' && r.marks !== null);
        if (validRows.length === 0) { toast.error('Enter marks for at least one student'); return; }
        setSubmitting(true);
        try {
            await api.post('/marks/bulk', {
                records: validRows.map(r => ({ studentId: r.studentId, marks: Number(r.marks), remarks: r.remarks })),
                subject, examType, maxMarks: Number(maxMarks), date,
            });
            toast.success(`Marks saved for ${validRows.length} students!`);
            setDone(true);
            const markRes = await api.get(`/marks/branch/${branchId}`);
            setExistingMarks(markRes.data.data || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to submit');
        } finally { setSubmitting(false); }
    };

    const resetForm = () => {
        setDone(false);
        setRows(students.map(s => ({ studentId: s._id, name: s.name, rollNo: s.rollNo, semester: s.semester, marks: '', remarks: '' })));
        setSubject(subjects[0] || '');
    };

    const filteredMarks = existingMarks.filter(m => {
        if (filterSubject && m.subject !== filterSubject) return false;
        if (filterExamType && m.examType !== filterExamType) return false;
        return true;
    });

    const uniqueSubjects = [...new Set(existingMarks.map(m => m.subject))];
    const marksHistory = buildMarksHistory(existingMarks);

    if (loading) return <div className="page-loader"><div className="spinner-lg" /><p>Loading...</p></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Marks</h1>
                    <p className="page-subtitle">{profile?.branch?.name} · Assign marks anytime, any exam type</p>
                </div>
            </div>

            {/* ── Marks History (same style as Class History) ── */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div
                    className="card-header-row"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setShowHistory(h => !h)}
                >
                    <h2 className="card-title">
                        <History size={18} />Exam History
                        <span className="badge badge-sm" style={{ marginLeft: '.4rem', background: '#dbeafe', color: '#1e40af' }}>
                            {marksHistory.length} sessions
                        </span>
                    </h2>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--text-muted)', fontSize: '.82rem' }}>
                        {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showHistory ? 'Hide' : 'Show'}
                    </span>
                </div>

                {showHistory && (
                    marksHistory.length === 0 ? (
                        <div className="empty-state-sm" style={{ marginTop: '.75rem' }}>No exams conducted yet</div>
                    ) : (
                        <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {marksHistory.map((session, i) => {
                                const avg = session.count > 0 ? Math.round(session.totalMarks / session.count) : 0;
                                const pct = Math.round((avg / session.maxMarks) * 100);
                                const col = EXAM_COLORS[session.examType] || '#6b7280';
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '.65rem 1rem', borderRadius: 10,
                                        background: 'var(--bg-soft, #f8fafc)', border: '1px solid var(--border)',
                                        gap: '1rem',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${col}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Award size={16} color={col} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {session.subject}
                                                </div>
                                                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', display: 'flex', gap: '.4rem' }}>
                                                    <span>{session.date}</span>
                                                    <span>·</span>
                                                    <span style={{ color: col, fontWeight: 600 }}>{session.examType}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#7c3aed' }}>
                                                ⌀ {avg}/{session.maxMarks}
                                            </span>
                                            <span style={{ fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#d1fae5', color: '#059669' }}>
                                                ✓ {session.passed}/{session.count}
                                            </span>
                                            <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{session.count} students</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            <div className="std-two-col" style={{ alignItems: 'flex-start' }}>

                {/* ── LEFT: Mark Entry Form ── */}
                <div>
                    {done ? (
                        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                            <CheckCircle size={52} color="#059669" style={{ margin: '0 auto 1rem' }} />
                            <h2 style={{ marginBottom: '.35rem' }}>Marks Saved!</h2>
                            <p className="text-muted-sm"><strong>{subject}</strong> · {examType} · /{maxMarks}</p>
                            {filterSemester && <p className="text-muted-sm">Semester {filterSemester}</p>}
                            <button className="btn-primary" style={{ margin: '1.25rem auto 0', justifyContent: 'center' }} onClick={resetForm}>
                                <Award size={16} /> Enter More Marks
                            </button>
                        </div>
                    ) : (
                        <div className="card">
                            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}><Award size={18} />Enter Marks</h2>

                            {/* Semester filter */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '.75rem',
                                padding: '.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
                                background: 'var(--bg-soft, #f8fafc)', border: '1px solid var(--border)',
                            }}>
                                <Users size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.25rem' }}>
                                        FILTER BY SEMESTER — {profile?.branch?.name}
                                    </div>
                                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                                        {[{ label: `All (${allStudents.length})`, val: '' }, ...semesters.map(sem => ({
                                            label: `Sem ${sem} (${allStudents.filter(s => String(s.semester) === String(sem)).length})`,
                                            val: String(sem),
                                        }))].map(({ label, val }) => (
                                            <button key={val} onClick={() => setFilterSemester(val)} style={{
                                                padding: '3px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                                                border: '1.5px solid #2563eb', transition: 'all .15s',
                                                background: filterSemester === val ? '#2563eb' : 'transparent',
                                                color: filterSemester === val ? '#fff' : '#2563eb',
                                            }}>{label}</button>
                                        ))}
                                    </div>
                                </div>
                                <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                                    {students.length} students
                                </span>
                            </div>

                            {/* Config row */}
                            <div className="form-grid" style={{ marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label>Subject *</label>
                                    {subjects.length > 0
                                        ? <select value={subject} onChange={e => setSubject(e.target.value)}>
                                            <option value="">— Select —</option>
                                            {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                        </select>
                                        : <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject name" />}
                                </div>
                                <div className="form-group">
                                    <label>Exam Type</label>
                                    <select value={examType} onChange={e => setExamType(e.target.value)}>
                                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Max Marks</label>
                                    <input type="number" min="1" max="1000" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                                </div>
                            </div>

                            {students.length === 0 ? (
                                <div className="empty-state-sm">No students match the selected semester</div>
                            ) : (
                                <div className="marks-entry-list">
                                    <div className="marks-entry-header">
                                        <span>Student</span>
                                        <span style={{ textAlign: 'center' }}>Marks /{maxMarks}</span>
                                        <span>Remarks</span>
                                    </div>
                                    {rows.map((r, idx) => (
                                        <div key={r.studentId} className="marks-entry-row">
                                            <div className="att-student-info">
                                                <div className="avatar avatar-sm">{r.name?.charAt(0)}</div>
                                                <div>
                                                    <div className="att-student-name">{r.name}</div>
                                                    <div className="att-student-roll">{r.rollNo}{r.semester ? ` · Sem ${r.semester}` : ''}</div>
                                                </div>
                                            </div>
                                            <input className="marks-input" type="number" min="0" max={maxMarks}
                                                placeholder="—" value={r.marks} onChange={e => setRowMarks(idx, e.target.value)} />
                                            <input className="remarks-input" type="text" placeholder="Optional note"
                                                value={r.remarks} onChange={e => setRowRemarks(idx, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="att-submit-bar">
                                <span className="text-muted-sm">{rows.filter(r => r.marks !== '').length} of {rows.length} filled</span>
                                <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                                    <Send size={15} /> {submitting ? 'Saving...' : 'Save Marks'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Marks Log ── */}
                <div className="card">
                    <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                        <h2 className="card-title"><Filter size={16} />Marks History</h2>
                        <span className="text-muted-sm">{filteredMarks.length} records</span>
                    </div>
                    <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <select style={{ flex: 1, minWidth: 120 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                            <option value="">All Subjects</option>
                            {uniqueSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                        </select>
                        <select style={{ flex: 1, minWidth: 120 }} value={filterExamType} onChange={e => setFilterExamType(e.target.value)}>
                            <option value="">All Exam Types</option>
                            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {filteredMarks.length === 0 ? (
                        <div className="empty-state-sm">No marks recorded yet</div>
                    ) : (
                        <div className="table-wrapper" style={{ maxHeight: 480, overflowY: 'auto' }}>
                            <table className="mini-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Subject</th>
                                        <th>Type</th>
                                        <th>Marks</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMarks.map((m, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div className="cell-with-avatar">
                                                    <div className="avatar avatar-sm">{m.student?.name?.charAt(0)}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{m.student?.name}</div>
                                                        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                                                            {m.student?.rollNo}{m.student?.semester ? ` · Sem ${m.student.semester}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '.85rem' }}>{m.subject}</td>
                                            <td>
                                                <span className="marks-chip" style={{ background: `${EXAM_COLORS[m.examType] || '#6b7280'}15`, color: EXAM_COLORS[m.examType] || '#6b7280' }}>
                                                    {m.examType}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, fontSize: '.9rem', color: m.marks >= (m.maxMarks * 0.6) ? '#059669' : '#dc2626' }}>
                                                    {m.marks}
                                                </span>
                                                <span className="text-muted-sm">/{m.maxMarks}</span>
                                            </td>
                                            <td className="text-muted-sm">{m.date ? new Date(m.date).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
