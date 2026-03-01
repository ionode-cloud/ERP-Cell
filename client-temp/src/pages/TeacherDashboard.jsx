import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import {
    Users, ClipboardCheck, GraduationCap, BookOpen, Mail, Phone, Award,
    Plus, CheckCircle, XCircle, Clock, Send, ChevronRight, PenLine, X,
    Calendar, History, Edit2, Trash2, Save, Key, Copy,
    Heart, Landmark, School, Home, Building2, FileText, Lock, User, Briefcase
} from 'lucide-react';

// ─── Status helpers ───
const STATUSES = ['Present', 'Absent', 'Late'];
const STATUS_COLORS = { Present: '#059669', Absent: '#dc2626', Late: '#d97706' };
const STATUS_BG = { Present: '#d1fae5', Absent: '#fee2e2', Late: '#fef9c3' };
const STATUS_ICONS = {
    Present: <CheckCircle size={16} />,
    Absent: <XCircle size={16} />,
    Late: <Clock size={16} />,
};

function nextStatus(s) { return STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length]; }

// ─── Group flat attendance records into class sessions ───
function buildClassHistory(records) {
    const map = {};
    records.forEach(r => {
        const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        const rawDate = r.date;
        const key = `${r.date ? new Date(r.date).toISOString().split('T')[0] : ''}||${r.subject}`;
        if (!map[key]) {
            map[key] = { date: dateStr, rawDate, isoDate: r.date ? new Date(r.date).toISOString().split('T')[0] : null, subject: r.subject, present: 0, absent: 0, late: 0, total: 0, studentRows: [] };
        }
        map[key].total++;
        if (r.status === 'Present') map[key].present++;
        else if (r.status === 'Absent') map[key].absent++;
        else if (r.status === 'Late') map[key].late++;
        map[key].studentRows.push({ studentId: r.student?._id || r.student, name: r.student?.name || '—', rollNo: r.student?.rollNo || '', status: r.status });
    });
    return Object.values(map).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
}

// ─── Detail UI Helpers ───
function DetailRow({ label, value }) {
    return (
        <div className="detail-row">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value || <span style={{ color: '#94a3b8' }}>—</span>}</span>
        </div>
    );
}

function DetailCard({ icon: Icon, title, color = '#4f46e5', children }) {
    return (
        <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                <h2 className="card-title">
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: color + '18', color, marginRight: 8 }}>
                        <Icon size={16} />
                    </span>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

// ─── EDIT SESSION PANEL ───
function EditSessionPanel({ session, branchId, onClose, onSaved }) {
    const [rows, setRows] = useState(session.studentRows.map(r => ({ ...r })));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = rows.map(r => ({ studentId: r.studentId, status: r.status }));
            await api.put('/attendance/session', {
                subject: session.subject,
                date: session.isoDate,
                branchId,
                records,
            });
            toast.success('Session updated!');
            onSaved();
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Update failed');
        } finally { setSaving(false); }
    };

    const toggle = (idx) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: nextStatus(r.status) } : r));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1rem' }}><Edit2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Edit — {session.subject} · {session.date}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-form">
                    <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        {rows.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .75rem', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.name}</div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{r.rollNo}</div>
                                </div>
                                <button
                                    className="att-status-btn"
                                    style={{ background: STATUS_BG[r.status], color: STATUS_COLORS[r.status], borderColor: STATUS_COLORS[r.status] + '55' }}
                                    onClick={() => toggle(i)}
                                >
                                    {STATUS_ICONS[r.status]}{r.status}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="modal-actions" style={{ marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}><Save size={15} />{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── CREATE CLASS PANEL ───
function CreateClassPanel({ profile, students, attendance, onClose, onSubmitted }) {
    const [subject, setSubject] = useState(profile.subjects?.[0] || '');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [step, setStep] = useState('form');
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const [editSession, setEditSession] = useState(null);

    const subjects = Array.isArray(profile.subjects) ? profile.subjects : profile.subjects ? [profile.subjects] : [];
    const branchId = profile.branch?._id || profile.branch;
    const classHistory = buildClassHistory(attendance || []);

    const startClass = () => {
        if (!subject || !date) { toast.error('Select subject and date'); return; }
        setRows(students.map(s => ({ studentId: s._id, name: s.name, rollNo: s.rollNo, status: 'Present', marks: '' })));
        setStep('attendance');
    };

    const toggleStatus = (idx) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: nextStatus(r.status) } : r));
    const setMarks = (idx, val) => setRows(prev => prev.map((r, i) => i === idx ? { ...r, marks: val } : r));
    const markAll = (status) => setRows(prev => prev.map(r => ({ ...r, status })));

    const handleSubmit = async () => {
        if (rows.length === 0) { toast.error('No students to mark'); return; }
        setSubmitting(true);
        try {
            const records = rows.map(r => ({
                studentId: r.studentId,
                status: r.status,
                branch: branchId,
                marks: r.marks !== '' ? Number(r.marks) : null,
            }));
            await api.post('/attendance/mark', { records, subject, date });
            toast.success(`Class recorded for ${rows.length} students!`);
            setDone(true);
            onSubmitted?.();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to submit');
        } finally { setSubmitting(false); }
    };

    const handleDeleteSession = async (cls) => {
        if (!window.confirm(`Delete session: ${cls.subject} on ${cls.date}?`)) return;
        try {
            await api.delete('/attendance/session', { data: { subject: cls.subject, date: cls.isoDate, branchId } });
            toast.success('Session deleted');
            onSubmitted?.();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Delete failed');
        }
    };

    if (done) return (
        <div className="create-class-success">
            <CheckCircle size={48} color="#059669" />
            <h3>Class Recorded!</h3>
            <p><strong>{subject}</strong> · {new Date(date).toLocaleDateString()}</p>
            <p className="success-sub">{rows.filter(r => r.status === 'Present').length} Present · {rows.filter(r => r.status === 'Absent').length} Absent · {rows.filter(r => r.status === 'Late').length} Late</p>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={onClose}>Close</button>
                <button className="btn-primary" onClick={() => { setStep('form'); setDone(false); setRows([]); }}>New Class</button>
            </div>
        </div>
    );

    return (
        <div className="create-class-panel">
            {editSession && (
                <EditSessionPanel
                    session={editSession}
                    branchId={branchId}
                    onClose={() => setEditSession(null)}
                    onSaved={() => { setEditSession(null); onSubmitted?.(); }}
                />
            )}

            {/* Header */}
            <div className="create-class-header">
                <div>
                    <h2 className="card-title"><PenLine size={18} />{step === 'form' ? 'Create New Class' : `Marking: ${subject}`}</h2>
                    {step === 'attendance' && <p className="text-muted-sm" style={{ marginTop: '.25rem' }}>{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                </div>
                <button className="modal-close" onClick={onClose}><X size={20} /></button>
            </div>

            {step === 'form' ? (
                <div>
                    <div className="create-class-form">
                        <div className="form-group">
                            <label>Subject</label>
                            {subjects.length > 0
                                ? <select value={subject} onChange={e => setSubject(e.target.value)}>
                                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                </select>
                                : <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" />}
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                        </div>
                        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={startClass} style={{ flex: 1, justifyContent: 'center' }}>
                                <Users size={16} />Start Class ({students.length} students) <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ── Class History with Edit + Delete ── */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <div
                            className="card-header-row"
                            style={{ cursor: 'pointer', userSelect: 'none', padding: '.5rem 0', borderTop: '1px solid var(--border)' }}
                            onClick={() => setShowHistory(h => !h)}
                        >
                            <h3 className="card-title" style={{ fontSize: '.9rem' }}>
                                <History size={16} />Class History
                                <span className="badge badge-sm" style={{ marginLeft: '.4rem', background: '#dbeafe', color: '#1e40af' }}>
                                    {classHistory.length}
                                </span>
                            </h3>
                            <span className="text-muted-sm">{showHistory ? '▲ Hide' : '▼ Show'}</span>
                        </div>

                        {showHistory && (
                            classHistory.length === 0 ? (
                                <div className="empty-state-sm" style={{ marginTop: '.75rem' }}>No classes conducted yet</div>
                            ) : (
                                <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                                    {classHistory.map((cls, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '.6rem .9rem', borderRadius: 10,
                                            background: 'var(--bg-soft, #f8fafc)', border: '1px solid var(--border)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Calendar size={16} color="#2563eb" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)' }}>{cls.subject}</div>
                                                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{cls.date}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#d1fae5', color: '#059669' }}>✓ {cls.present}</span>
                                                <span style={{ fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#fee2e2', color: '#dc2626' }}>✗ {cls.absent}</span>
                                                {cls.late > 0 && <span style={{ fontSize: '.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#d97706' }}>⏱ {cls.late}</span>}
                                                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginLeft: '.2rem' }}>{cls.total} total</span>
                                                {/* Edit button */}
                                                <button
                                                    title="Edit session"
                                                    onClick={() => setEditSession(cls)}
                                                    style={{ marginLeft: '.35rem', padding: '4px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.75rem', fontWeight: 600 }}
                                                >
                                                    <Edit2 size={13} />Edit
                                                </button>
                                                {/* Delete button */}
                                                <button
                                                    title="Delete session"
                                                    onClick={() => handleDeleteSession(cls)}
                                                    style={{ padding: '4px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.75rem', fontWeight: 600 }}
                                                >
                                                    <Trash2 size={13} />Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {/* Quick actions */}
                    <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
                        {['Present', 'Absent', 'Late'].map(st => (
                            <button key={st} className="btn-xs" style={{ background: STATUS_BG[st], color: STATUS_COLORS[st], border: `1px solid ${STATUS_COLORS[st]}44`, padding: '.35rem .75rem', borderRadius: 7 }}
                                onClick={() => markAll(st)}>All {st}</button>
                        ))}
                    </div>

                    <div className="att-mark-list">
                        <div className="att-mark-header"><span>Student</span><span>Status</span><span>Marks /100</span></div>
                        {rows.map((r, idx) => (
                            <div key={idx} className="att-mark-row">
                                <div className="att-student-info">
                                    <div className="avatar avatar-sm">{r.name?.charAt(0)}</div>
                                    <div>
                                        <div className="att-student-name">{r.name}</div>
                                        <div className="att-student-roll">{r.rollNo}</div>
                                    </div>
                                </div>
                                <button
                                    className="att-status-btn"
                                    style={{ background: STATUS_BG[r.status], color: STATUS_COLORS[r.status], borderColor: STATUS_COLORS[r.status] + '55' }}
                                    onClick={() => toggleStatus(idx)}
                                >
                                    {STATUS_ICONS[r.status]}{r.status}
                                </button>
                                <input
                                    type="number"
                                    min="0" max="100"
                                    className="marks-input"
                                    placeholder="—"
                                    value={r.marks}
                                    onChange={e => setMarks(idx, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="att-submit-bar">
                        <div className="att-submit-summary">
                            <span style={{ color: '#059669' }}>✓ {rows.filter(r => r.status === 'Present').length} Present</span>
                            <span style={{ color: '#dc2626' }}>✗ {rows.filter(r => r.status === 'Absent').length} Absent</span>
                            <span style={{ color: '#d97706' }}>⏱ {rows.filter(r => r.status === 'Late').length} Late</span>
                        </div>
                        <div style={{ display: 'flex', gap: '.75rem' }}>
                            <button className="btn-secondary" onClick={() => setStep('form')}>← Back</button>
                            <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                                <Send size={16} />{submitting ? 'Saving...' : 'Submit Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── MAIN TEACHER DASHBOARD ───
export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [credModal, setCredModal] = useState(null); // { name, loginId, password }
    const [copied, setCopied] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'details', label: 'My Details' },
    ];

    const fetchAll = async () => {
        try {
            const profRes = await api.get('/teachers/me');
            const prof = profRes.data.data;
            setProfile(prof);
            const branchId = prof?.branch?._id || prof?.branch;
            if (branchId) {
                const stuRes = await api.get(`/students?branch=${branchId}&limit=200`);
                setStudents(stuRes.data.data || []);
                try {
                    const attRes = await api.get(`/attendance/branch/${branchId}`);
                    setAttendance(attRes.data.data || []);
                } catch (attErr) {
                    // skip error toast for attendance if user has no class created yet
                }
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load profile');
        } finally { setLoading(false); }
    };

    const refreshAttendance = async () => {
        if (!profile) return;
        const branchId = profile.branch?._id || profile.branch;
        if (!branchId) return;
        try {
            const res = await api.get(`/attendance/branch/${branchId}`);
            setAttendance(res.data.data || []);
        } catch { }
    };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleRegenCred = async (studentId, studentName) => {
        try {
            const res = await api.post(`/students/${studentId}/credentials`);
            setCredModal({ name: studentName, ...res.data.credentials });
        } catch { toast.error('Failed to reset credentials'); }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return <div className="page-loader"><div className="spinner-lg" /><p>Loading your dashboard...</p></div>;
    if (!profile) return <div className="page"><p style={{ padding: '2rem' }}>Profile not found. Please contact admin.</p></div>;

    const recentAtt = [...attendance].slice(0, 8);
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const totalAtt = attendance.length;
    const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

    return (
        <div className="page">
            {/* Credential Modal */}
            {credModal && (
                <div className="modal-overlay" onClick={() => setCredModal(null)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔑 {credModal.name}'s Credentials</h2>
                            <button className="modal-close" onClick={() => setCredModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p className="cred-note">New credentials generated. Save these — password won't be shown again.</p>
                            <div className="cred-box">
                                <div className="cred-row">
                                    <div><div className="cred-label">Login ID</div><div className="cred-value">{credModal.loginId}</div></div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credModal.loginId, 'id')}>
                                        {copied === 'id' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="cred-row">
                                    <div><div className="cred-label">Password</div><div className="cred-value cred-password">{credModal.password}</div></div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credModal.password, 'pw')}>
                                        {copied === 'pw' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCredModal(null)}>Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header */}
            <div className="std-profile-header" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                <div className="std-avatar" style={{ background: '#d1fae5', color: '#065f46' }}>
                    {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="std-profile-info">
                    <h1>{profile.name}</h1>
                    <p className="std-profile-sub">
                        <span>ID: {profile.employeeId}</span>
                        <span className="divider">|</span>
                        <span>{profile.branch?.name}</span>
                        {profile.qualification && <><span className="divider">|</span><span>{profile.qualification}</span></>}
                    </p>
                </div>
                <div className="std-profile-meta">
                    <div className="meta-item"><Mail size={14} /><span className="meta-value">{user?.loginId}</span></div>
                    {profile.phone && <div className="meta-item"><Phone size={14} /><span className="meta-value">{profile.phone}</span></div>}
                    {profile.experience && <div className="meta-item"><Award size={14} /><span className="meta-value">{profile.experience} exp</span></div>}
                </div>
            </div>

            {/* Tab Nav */}
            <div className="std-tab-nav">
                {TABS.map(t => (
                    <button key={t.id} className={`std-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ OVERVIEW TAB ═══════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats */}
                    <div className="std-stats-grid">
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#dbeafe' }}><Users size={22} color="#2563eb" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#1e40af' }}>{students.length}</div>
                                <div className="std-stat-label">My Students</div>
                                <div className="std-stat-sub">{profile.branch?.name?.split(' ').slice(0, 2).join(' ')}</div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#d1fae5' }}><ClipboardCheck size={22} color="#059669" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#059669' }}>{totalAtt}</div>
                                <div className="std-stat-label">Records Logged</div>
                                <div className="std-stat-sub">{attPct}% overall present</div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#ede9fe' }}><BookOpen size={22} color="#7c3aed" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#7c3aed', fontSize: '1rem' }}>
                                    {Array.isArray(profile.subjects) ? profile.subjects.length : 1}
                                </div>
                                <div className="std-stat-label">Subjects</div>
                                <div className="std-stat-sub">
                                    {Array.isArray(profile.subjects) ? profile.subjects.slice(0, 2).join(', ') : (profile.subjects || '—')}
                                </div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#fce7f3' }}><GraduationCap size={22} color="#db2777" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#db2777', fontSize: '1rem' }}>{profile.branch?.code || '—'}</div>
                                <div className="std-stat-label">Department</div>
                                <div className="std-stat-sub">{profile.branch?.duration || '4 Years'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Create Class / Conduct Section */}
                    {showCreateClass ? (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <CreateClassPanel
                                profile={profile}
                                students={students}
                                attendance={attendance}
                                onClose={() => { setShowCreateClass(false); refreshAttendance(); }}
                                onSubmitted={refreshAttendance}
                            />
                        </div>
                    ) : (
                        <div className="create-class-cta card">
                            <div className="cta-left">
                                <div className="cta-icon"><PenLine size={28} color="#2563eb" /></div>
                                <div>
                                    <div className="cta-title">Conduct a Class</div>
                                    <div className="cta-sub">Select a subject &amp; date, mark attendance and assign marks for all students in one go</div>
                                </div>
                            </div>
                            <button className="btn-primary" onClick={() => setShowCreateClass(true)}>
                                <Plus size={16} /> Create Class
                            </button>
                        </div>
                    )}

                    <div className="std-two-col">
                        {/* Students List — with credentials button */}
                        <div className="card">
                            <div className="card-header-row">
                                <h2 className="card-title"><Users size={18} />My Students — {profile.branch?.name}</h2>
                            </div>
                            {students.length === 0 ? (
                                <div className="empty-state-sm">No students in your branch</div>
                            ) : (
                                <div className="table-wrapper" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                    <table className="mini-table">
                                        <thead><tr><th>Name</th><th>Roll No</th><th>Sem</th><th>Login ID</th><th>Creds</th></tr></thead>
                                        <tbody>
                                            {students.map(s => (
                                                <tr key={s._id}>
                                                    <td><div className="cell-with-avatar"><div className="avatar avatar-sm">{s.name?.charAt(0)}</div>{s.name}</div></td>
                                                    <td>{s.rollNo}</td>
                                                    <td>Sem {s.semester}</td>
                                                    <td style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{s.userId?.loginId || s.email || '—'}</td>
                                                    <td>
                                                        <button
                                                            title="View/Reset Student Credentials"
                                                            onClick={() => handleRegenCred(s._id, s.name)}
                                                            style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#fef9c3', color: '#d97706', display: 'flex', alignItems: 'center', gap: 3, fontSize: '.72rem', fontWeight: 600 }}
                                                        >
                                                            <Key size={12} />Reset
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Recent Attendance Log + Subjects */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="card">
                                <div className="card-header-row">
                                    <h2 className="card-title"><ClipboardCheck size={18} />Recent Attendance Log</h2>
                                    <span className="text-muted-sm">{totalAtt} total</span>
                                </div>
                                {recentAtt.length === 0 ? (
                                    <div className="empty-state-sm">No records yet — create a class above</div>
                                ) : (
                                    recentAtt.map((a, i) => (
                                        <div key={i} className="att-row">
                                            <div className="att-row-left">
                                                <Calendar size={13} />
                                                <span className="att-subject">{a.subject}</span>
                                                <span className="text-muted-sm">{a.student?.name || '—'}</span>
                                            </div>
                                            <span
                                                className="badge badge-sm"
                                                style={{ background: STATUS_BG[a.status], color: STATUS_COLORS[a.status] }}
                                            >{a.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {Array.isArray(profile.subjects) && profile.subjects.length > 0 && (
                                <div className="card">
                                    <h2 className="card-title"><BookOpen size={18} />My Subjects</h2>
                                    <div className="subjects-grid">
                                        {profile.subjects.map((s, i) => <div key={i} className="subject-chip subject-chip-green">{s}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ MY DETAILS TAB ═══════════ */}
            {activeTab === 'details' && (
                <div className="std-details-grid">

                    {/* 👤 Base Info */}
                    <DetailCard icon={User} title="Professional & Personal Info" color="#4f46e5">
                        <div className="detail-grid">
                            <DetailRow label="Full Name" value={profile.name} />
                            <DetailRow label="Teacher ID" value={profile.employeeId} />
                            <DetailRow label="Branch" value={profile.branch?.name} />
                            <DetailRow label="Subject" value={profile.subjects?.join(', ')} />
                            <DetailRow label="Class" value={profile.className} />
                            <DetailRow label="Gender" value={profile.gender} />
                            <DetailRow label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : null} />
                            <DetailRow label="Father's Name" value={profile.fatherName} />
                            <DetailRow label="Mother's Name" value={profile.motherName} />
                            <DetailRow label="Marital Status" value={profile.maritalStatus} />
                            <DetailRow label="Contract Type" value={profile.contractType} />
                            <DetailRow label="Shift" value={profile.shift} />
                            <DetailRow label="Work Location" value={profile.workLocation} />
                            <DetailRow label="Join Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : null} />
                            <DetailRow label="Phone Number" value={profile.phone} />
                            <DetailRow label="Email" value={profile.email} />
                            <DetailRow label="Experience" value={profile.experience} />
                            <DetailRow label="Qualification" value={profile.qualification} />
                            <DetailRow label="Salary" value={profile.salary != null && profile.salary !== 0 ? `₹${profile.salary}` : null} />
                        </div>
                    </DetailCard>

                    {/* ❤️ Medical Details */}
                    <DetailCard icon={Heart} title="Medical Details" color="#dc2626">
                        <div className="detail-grid">
                            <DetailRow label="Blood Group" value={profile.bloodGroup} />
                            <DetailRow label="Height" value={profile.height} />
                            <DetailRow label="Weight" value={profile.weight} />
                        </div>
                    </DetailCard>

                    {/* 🏦 Bank Details */}
                    <DetailCard icon={Landmark} title="Bank Details" color="#059669">
                        <div className="detail-grid">
                            <DetailRow label="Bank Account Number" value={profile.bankAccountNo} />
                            <DetailRow label="Bank Name" value={profile.bankName} />
                            <DetailRow label="IFSC Code" value={profile.ifscCode} />
                            <DetailRow label="National ID" value={profile.nationalId} />
                        </div>
                    </DetailCard>

                    {/* 📄 Documents */}
                    <DetailCard icon={FileText} title="Documents" color="#d97706">
                        <div className="detail-grid">
                            <DetailRow label="Document Name" value={profile.docName} />
                        </div>
                    </DetailCard>

                    {/* 🏫 Previous School Details */}
                    <DetailCard icon={School} title="Previous School" color="#7c3aed">
                        <div className="detail-grid">
                            <DetailRow label="School Name" value={profile.prevSchoolName} />
                            <DetailRow label="Address" value={profile.prevSchoolAddress} />
                        </div>
                    </DetailCard>

                    {/* 🏠 Address */}
                    <DetailCard icon={Home} title="Address" color="#0891b2">
                        <div className="detail-grid">
                            <DetailRow label="Current Address" value={profile.currentAddress} />
                            <DetailRow label="Permanent Address" value={profile.permanentAddress} />
                        </div>
                    </DetailCard>

                    {/* 💬 Teacher Details & Socials */}
                    <DetailCard icon={Briefcase} title="Teacher Details" color="#4f46e5">
                        <div className="detail-grid">
                            <DetailRow label="Teacher Details" value={profile.teacherDetails} />
                            <DetailRow label="Facebook" value={profile.facebook} />
                            <DetailRow label="LinkedIn" value={profile.linkedin} />
                            <DetailRow label="Instagram" value={profile.instagram} />
                            <DetailRow label="YouTube" value={profile.youtube} />
                        </div>
                    </DetailCard>
                </div>
            )}
        </div>
    );
}
