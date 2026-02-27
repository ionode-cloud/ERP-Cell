import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import {
    GraduationCap, IndianRupee, ClipboardCheck, AlertTriangle,
    BookOpen, User, Calendar, Award, Users, Heart, Landmark,
    School, Home, Building2, FileText, Phone, Mail, MapPin, Hash,
    Lock, Eye, EyeOff, Copy, CheckCircle
} from 'lucide-react';

const STATUS_COLORS = { Present: '#059669', Absent: '#dc2626', Late: '#d97706' };
const STATUS_BG = { Present: '#d1fae5', Absent: '#fee2e2', Late: '#fef9c3' };

/* small detail row helper — always renders, shows '—' when empty */
function DetailRow({ label, value }) {
    return (
        <div className="detail-row">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value || <span style={{ color: '#94a3b8' }}>—</span>}</span>
        </div>
    );
}

/* section card with icon header */
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

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [fees, setFees] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [attStats, setAttStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showPw, setShowPw] = useState(false);
    const [copied, setCopied] = useState('');

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [profRes, feeRes, attRes, markRes] = await Promise.all([
                    api.get('/students/me'),
                    api.get('/fees/me'),
                    api.get('/attendance/me'),
                    api.get('/marks/me'),
                ]);
                setProfile(profRes.data.data);
                setFees(feeRes.data.data);
                const attData = attRes.data.data;
                const records = Array.isArray(attData) ? attData : (attData?.records || []);
                setAttendance(records);
                if (attData && !Array.isArray(attData)) {
                    const late = records.filter(r => r.status === 'Late').length;
                    setAttStats({
                        total: attData.total || 0,
                        present: attData.present || 0,
                        absent: (attData.total || 0) - (attData.present || 0) - late,
                        late,
                        percentage: attData.percentage || 0,
                    });
                }
                setMarks(markRes.data.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    if (loading) return <div className="page-loader"><div className="spinner-lg" /><p>Loading your dashboard...</p></div>;
    if (!profile) return <div className="page"><p style={{ padding: '2rem' }}>Profile not found. Please contact admin.</p></div>;

    const totalFee = fees?.totalAmount || 0;
    const paidFee = fees?.paidAmount || 0;
    const balanceFee = totalFee - paidFee;
    const feePercent = totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 0;

    const safeAttendance = Array.isArray(attendance) ? attendance : [];
    const { total: totalClasses, present: presentCount, absent: absentCount, late: lateCount, percentage: attendancePercent } = attStats;
    const isLowAttendance = attendancePercent < 75 && totalClasses > 0;
    const recentAttendance = [...safeAttendance].slice(0, 6);

    const marksBySubject = {};
    marks.forEach(m => {
        if (!marksBySubject[m.subject]) marksBySubject[m.subject] = [];
        marksBySubject[m.subject].push(m);
    });
    const recentMarks = [...marks].slice(0, 8);

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'details', label: 'My Details' },
        { id: 'academic', label: 'Academic' },
    ];

    return (
        <div className="page">
            {/* ── Profile Header ── */}
            <div className="std-profile-header">
                <div className="std-avatar">{profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div className="std-profile-info">
                    <h1>{profile.name}</h1>
                    <p className="std-profile-sub">
                        <span># Roll: {profile.rollNo}</span>
                        {profile.admissionNo && <><span className="divider">|</span><span>Adm: {profile.admissionNo}</span></>}
                        <span className="divider">|</span><span>{profile.branch?.name}</span>
                        <span className="divider">|</span><span>Semester {profile.semester}</span>
                        {profile.gender && <><span className="divider">|</span><span>{profile.gender}</span></>}
                        {profile.category && <><span className="divider">|</span><span>{profile.category}</span></>}
                    </p>
                </div>
                <div className="std-profile-meta">
                    <div className="meta-item"><span className="meta-label">Login Email</span><span className="meta-value">{profile.userId?.loginId || user?.loginId}</span></div>
                    <div className="meta-item"><span className="meta-label">Branch Code</span><span className="meta-value">{profile.branch?.code}</span></div>
                    {profile.academicYear && <div className="meta-item"><span className="meta-label">Academic Year</span><span className="meta-value">{profile.academicYear}</span></div>}
                </div>
            </div>

            {/* ── Low Attendance Warning ── */}
            {isLowAttendance && (
                <div className="alert-banner alert-warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Attendance Shortage Warning</strong>
                        <p>Your overall attendance is <strong>{attendancePercent}%</strong>. You need at least <strong>75%</strong> to be eligible for exams.</p>
                    </div>
                </div>
            )}

            {/* ── Tab Nav ── */}
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
                    {/* Stat Cards */}
                    <div className="std-stats-grid">
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: isLowAttendance ? '#fee2e2' : '#dbeafe' }}>
                                <ClipboardCheck size={22} color={isLowAttendance ? '#dc2626' : '#2563eb'} />
                            </div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: isLowAttendance ? '#dc2626' : '#1e40af' }}>{attendancePercent}%</div>
                                <div className="std-stat-label">Attendance</div>
                                <div className="std-stat-sub">{presentCount} present / {totalClasses} classes</div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: balanceFee > 0 ? '#fef3c7' : '#d1fae5' }}>
                                <IndianRupee size={22} color={balanceFee > 0 ? '#d97706' : '#059669'} />
                            </div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: balanceFee > 0 ? '#d97706' : '#059669' }}>₹{balanceFee.toLocaleString()}</div>
                                <div className="std-stat-label">Fee Balance</div>
                                <div className="std-stat-sub">{balanceFee > 0 ? 'Amount due' : '✓ Fully Paid'}</div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#ede9fe' }}><GraduationCap size={22} color="#7c3aed" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#7c3aed' }}>Sem {profile.semester}</div>
                                <div className="std-stat-label">Current Semester</div>
                                <div className="std-stat-sub">{profile.branch?.name?.split(' ').slice(0, 2).join(' ')}</div>
                            </div>
                        </div>
                        <div className="std-stat-card">
                            <div className="std-stat-icon" style={{ background: '#fce7f3' }}><Award size={22} color="#db2777" /></div>
                            <div className="std-stat-body">
                                <div className="std-stat-value" style={{ color: '#db2777', fontSize: '1rem' }}>{marks.length}</div>
                                <div className="std-stat-label">Exam Records</div>
                                <div className="std-stat-sub">{Object.keys(marksBySubject).length} subjects</div>
                            </div>
                        </div>
                    </div>

                    <div className="std-two-col">
                        {/* Fees */}
                        <div className="card">
                            <div className="card-header-row">
                                <h2 className="card-title"><IndianRupee size={18} />Fee Details</h2>
                                <span className={`badge ${balanceFee > 0 ? 'badge-warning' : 'badge-success'}`}>{balanceFee > 0 ? 'Pending' : 'Paid'}</span>
                            </div>
                            <div className="fee-summary-grid">
                                <div className="fee-card fee-total"><div className="fee-card-label">Total Fee</div><div className="fee-card-amount">₹{totalFee.toLocaleString()}</div></div>
                                <div className="fee-card fee-paid"><div className="fee-card-label">Paid</div><div className="fee-card-amount">₹{paidFee.toLocaleString()}</div></div>
                                <div className="fee-card fee-balance"><div className="fee-card-label">Balance</div><div className="fee-card-amount">₹{balanceFee.toLocaleString()}</div></div>
                            </div>
                            <div className="progress-section">
                                <div className="progress-label"><span>Payment Progress</span><span>{feePercent}%</span></div>
                                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${feePercent}%`, background: feePercent === 100 ? '#059669' : '#2563eb' }} /></div>
                            </div>
                            {fees?.payments?.length > 0 && (
                                <div className="payment-history">
                                    <div className="payment-history-title">Payment History</div>
                                    <table className="mini-table">
                                        <thead><tr><th>#</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {fees.payments.map((p, i) => (
                                                <tr key={i}><td>{i + 1}</td><td>₹{p.amount?.toLocaleString()}</td><td>{p.method || '—'}</td><td>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Attendance */}
                        <div className="card">
                            <div className="card-header-row">
                                <h2 className="card-title"><ClipboardCheck size={18} />Attendance</h2>
                                <span className={`badge ${attendancePercent >= 75 ? 'badge-success' : 'badge-error'}`}>{attendancePercent}%</span>
                            </div>
                            <div className="att-summary-grid">
                                <div className="att-pill att-present"><div className="att-count">{presentCount}</div><div className="att-label">Present</div></div>
                                <div className="att-pill att-absent"><div className="att-count">{absentCount}</div><div className="att-label">Absent</div></div>
                                <div className="att-pill att-late"><div className="att-count">{lateCount}</div><div className="att-label">Late</div></div>
                            </div>
                            {recentAttendance.length > 0 ? (
                                <div className="att-recent">
                                    <div className="payment-history-title">Recent Records</div>
                                    {recentAttendance.map((a, i) => (
                                        <div key={i} className="att-row">
                                            <div className="att-row-left">
                                                <Calendar size={14} />
                                                <span>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</span>
                                                {a.subject && <span className="att-subject">{a.subject}</span>}
                                            </div>
                                            <span className="badge badge-sm" style={{ background: STATUS_BG[a.status] || '#f3f4f6', color: STATUS_COLORS[a.status] || '#374151' }}>{a.status}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="empty-state-sm">No attendance records yet</div>}
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ MY DETAILS TAB ═══════════ */}
            {activeTab === 'details' && (
                <div className="std-details-grid">

                    {/* 👤 Personal Info */}
                    <DetailCard icon={User} title="Personal Information" color="#4f46e5">
                        <div className="detail-grid">
                            <DetailRow label="Full Name" value={profile.name} />
                            <DetailRow label="Email" value={profile.email} />
                            <DetailRow label="Phone" value={profile.phone} />
                            <DetailRow label="Gender" value={profile.gender} />
                            <DetailRow label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
                            <DetailRow label="Category" value={profile.category} />
                        </div>
                    </DetailCard>

                    {/* 🎓 Academic Info */}
                    <DetailCard icon={GraduationCap} title="Academic Information" color="#7c3aed">
                        <div className="detail-grid">
                            <DetailRow label="Academic Year" value={profile.academicYear} />
                            <DetailRow label="Class" value={profile.className} />
                            <DetailRow label="Section" value={profile.section} />
                            <DetailRow label="Branch" value={profile.branch?.name} />
                            <DetailRow label="Branch Code" value={profile.branch?.code} />
                            <DetailRow label="Semester" value={profile.semester ? 'Semester ' + profile.semester : null} />
                            <DetailRow label="Roll Number" value={profile.rollNo} />
                            <DetailRow label="Admission No" value={profile.admissionNo} />
                        </div>
                    </DetailCard>

                    {/* 👨 Father's Details */}
                    <DetailCard icon={Users} title="Father's Details" color="#0891b2">
                        <div className="detail-grid">
                            <DetailRow label="Name" value={profile.fatherName} />
                            <DetailRow label="Phone" value={profile.fatherPhone} />
                            <DetailRow label="Occupation" value={profile.fatherOccupation} />
                        </div>
                    </DetailCard>

                    {/* 👩 Mother's Details */}
                    <DetailCard icon={Users} title="Mother's Details" color="#db2777">
                        <div className="detail-grid">
                            <DetailRow label="Name" value={profile.motherName} />
                            <DetailRow label="Phone" value={profile.motherPhone} />
                            <DetailRow label="Occupation" value={profile.motherOccupation} />
                        </div>
                    </DetailCard>

                    {/* 🧑 Guardian Details */}
                    <DetailCard icon={Users} title="Guardian Details" color="#059669">
                        <div className="detail-grid">
                            <DetailRow label="Guardian Type" value={profile.guardianType} />
                            <DetailRow label="Name" value={profile.guardianName} />
                            <DetailRow label="Email" value={profile.guardianEmail} />
                            <DetailRow label="Phone" value={profile.guardianPhone} />
                            <DetailRow label="Occupation" value={profile.guardianOccupation} />
                            <DetailRow label="Address" value={profile.guardianAddress} />
                        </div>
                    </DetailCard>

                    {/* 🏠 Address */}
                    <DetailCard icon={Home} title="Address" color="#7c3aed">
                        <div className="detail-grid">
                            <DetailRow label="Current Address" value={profile.currentAddress || profile.address} />
                            <DetailRow label="Permanent Address" value={profile.permanentAddress} />
                        </div>
                    </DetailCard>

                    {/* 🏢 Hostel Details */}
                    <DetailCard icon={Building2} title="Hostel Details" color="#0891b2">
                        <div className="detail-grid">
                            <DetailRow label="Hostel" value={profile.hostelName} />
                            <DetailRow label="Room No" value={profile.roomNo} />
                        </div>
                    </DetailCard>

                    {/* ❤️ Medical Details */}
                    <DetailCard icon={Heart} title="Medical Details" color="#dc2626">
                        <div className="detail-grid">
                            <DetailRow label="Blood Group" value={profile.bloodGroup} />
                            <DetailRow label="Height" value={profile.height ? profile.height + ' cm' : null} />
                            <DetailRow label="Weight" value={profile.weight ? profile.weight + ' kg' : null} />
                        </div>
                    </DetailCard>

                    {/* 🏦 Bank Details */}
                    <DetailCard icon={Landmark} title="Bank Details" color="#059669">
                        <div className="detail-grid">
                            <DetailRow label="Bank Name" value={profile.bankName} />
                            <DetailRow label="Account Number" value={profile.bankAccountNo} />
                            <DetailRow label="IFSC Code" value={profile.ifscCode} />
                            <DetailRow label="National ID" value={profile.nationalId} />
                        </div>
                    </DetailCard>

                    {/* 🏫 Previous School */}
                    <DetailCard icon={School} title="Previous School" color="#d97706">
                        <div className="detail-grid">
                            <DetailRow label="School Name" value={profile.prevSchoolName} />
                            <DetailRow label="Address" value={profile.prevSchoolAddress} />
                        </div>
                    </DetailCard>

                    {/* 📄 Documents & Notes */}
                    <DetailCard icon={FileText} title="Documents & Notes" color="#374151">
                        <div className="detail-grid">
                            <DetailRow label="Document Name" value={profile.docName} />
                            <DetailRow label="Notes" value={profile.studentDetails} />
                        </div>
                    </DetailCard>

                    {/* 🔐 Login Details */}
                    <DetailCard icon={Lock} title="Login Details" color="#1d4ed8">
                        <div className="login-detail-box">
                            <div className="login-detail-row">
                                <div className="login-detail-label">Login ID (Email)</div>
                                <div className="login-detail-value-row">
                                    <span className="login-detail-value">{profile.userId?.loginId || profile.email}</span>
                                    <button className="btn-icon btn-edit" title="Copy" onClick={() => copyText(profile.userId?.loginId || profile.email, 'lid')}>
                                        {copied === 'lid' ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="login-detail-row">
                                <div className="login-detail-label">Password</div>
                                <div className="login-detail-value-row">
                                    <span className="login-detail-value login-pw">
                                        {showPw
                                            ? `${profile.name?.split(' ')[0]?.toLowerCase()}@${profile.rollNo}`
                                            : '••••••••••••'}
                                    </span>
                                    <button className="btn-icon btn-edit" title={showPw ? 'Hide' : 'Show'} onClick={() => setShowPw(v => !v)}>
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    {showPw && (
                                        <button className="btn-icon btn-edit" title="Copy" onClick={() => copyText(`${profile.name?.split(' ')[0]?.toLowerCase()}@${profile.rollNo}`, 'pw')}>
                                            {copied === 'pw' ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="login-detail-hint">💡 Password format: <code>firstname@rollno</code>. Contact admin to reset.</p>
                        </div>
                    </DetailCard>

                </div>
            )}

            {/* ═══════════ ACADEMIC TAB ═══════════ */}
            {activeTab === 'academic' && (
                <>
                    {/* Marks Section */}
                    <div className="card" style={{ marginBottom: '1.25rem' }}>
                        <div className="card-header-row" style={{ marginBottom: '1rem' }}>
                            <h2 className="card-title"><Award size={18} />My Marks</h2>
                            <span className="text-muted-sm">{marks.length} records · {Object.keys(marksBySubject).length} subjects</span>
                        </div>
                        {marks.length === 0 ? <div className="empty-state-sm">No exam marks recorded yet</div> : (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '1.25rem' }}>
                                    {Object.entries(marksBySubject).map(([subj, mlist], i) => {
                                        const avg = Math.round(mlist.reduce((s, m) => s + m.marks, 0) / mlist.length);
                                        const maxM = mlist[0]?.maxMarks || 100;
                                        const pct = Math.round((avg / maxM) * 100);
                                        return (
                                            <div key={i} style={{ padding: '.6rem .9rem', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', minWidth: 130 }}>
                                                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '.2rem' }}>{subj}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: pct >= 60 ? '#059669' : '#dc2626' }}>{avg}/{maxM}</div>
                                                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{mlist.length} exam{mlist.length > 1 ? 's' : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="table-wrapper">
                                    <table className="mini-table">
                                        <thead><tr><th>Subject</th><th>Type</th><th>Marks</th><th>Date</th>{recentMarks.some(m => m.remarks) && <th>Remarks</th>}</tr></thead>
                                        <tbody>
                                            {recentMarks.map((m, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{m.subject}</td>
                                                    <td><span className="marks-chip">{m.examType}</span></td>
                                                    <td><span style={{ fontWeight: 700, color: m.marks >= (m.maxMarks * 0.6) ? '#059669' : '#dc2626' }}>{m.marks}</span><span className="text-muted-sm">/{m.maxMarks}</span></td>
                                                    <td className="text-muted-sm">{m.date ? new Date(m.date).toLocaleDateString() : '—'}</td>
                                                    {recentMarks.some(m => m.remarks) && <td className="text-muted-sm">{m.remarks || '—'}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Branch Subjects */}
                    {profile.branch?.subjects?.length > 0 && (
                        <div className="card">
                            <h2 className="card-title" style={{ marginBottom: '1rem' }}><BookOpen size={18} />Branch Subjects</h2>
                            <div className="subjects-grid">
                                {profile.branch.subjects.map((s, i) => <div key={i} className="subject-chip">{s}</div>)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
