import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    Plus, Search, Edit2, Trash2, Key, X, Copy, CheckCircle,
    User, Users, Heart, Landmark, School, Home, Building2,
    FileText, Lock, Upload, ArrowLeft, Save
} from 'lucide-react';

/* ─── Default form state ────────────────────────────────────── */
const emptyForm = {
    name: '', email: '', phone: '', rollNo: '', admissionNo: '',
    branch: '', semester: '', academicYear: '', className: '', section: '',
    gender: '', dob: '', category: '', photoUrl: '',
    fatherName: '', fatherPhone: '', fatherOccupation: '', fatherPhotoUrl: '',
    motherName: '', motherPhone: '', motherOccupation: '', motherPhotoUrl: '',
    guardianType: 'Father',
    guardianName: '', guardianEmail: '', guardianPhone: '',
    guardianOccupation: '', guardianAddress: '', guardianPhotoUrl: '',
    bloodGroup: '', height: '', weight: '',
    bankAccountNo: '', bankName: '', ifscCode: '', nationalId: '',
    prevSchoolName: '', prevSchoolAddress: '',
    currentAddress: '', permanentAddress: '',
    hostelName: '', roomNo: '',
    docName: '', docUrl: '',
    studentDetails: '',
};

/* map a saved student record → form fields */
const studentToForm = (s) => ({
    name: s.name || '',
    email: s.email || '',
    phone: s.phone || '',
    rollNo: s.rollNo || '',
    admissionNo: s.admissionNo || '',
    branch: s.branch?._id || s.branch || '',
    semester: s.semester || '',
    academicYear: s.academicYear || '',
    className: s.className || '',
    section: s.section || '',
    gender: s.gender || '',
    dob: s.dob ? s.dob.split('T')[0] : '',
    category: s.category || '',
    photoUrl: s.photoUrl || '',
    fatherName: s.fatherName || '',
    fatherPhone: s.fatherPhone || '',
    fatherOccupation: s.fatherOccupation || '',
    fatherPhotoUrl: s.fatherPhotoUrl || '',
    motherName: s.motherName || '',
    motherPhone: s.motherPhone || '',
    motherOccupation: s.motherOccupation || '',
    motherPhotoUrl: s.motherPhotoUrl || '',
    guardianType: s.guardianType || 'Father',
    guardianName: s.guardianName || '',
    guardianEmail: s.guardianEmail || '',
    guardianPhone: s.guardianPhone || '',
    guardianOccupation: s.guardianOccupation || '',
    guardianAddress: s.guardianAddress || '',
    guardianPhotoUrl: s.guardianPhotoUrl || '',
    bloodGroup: s.bloodGroup || '',
    height: s.height || '',
    weight: s.weight || '',
    bankAccountNo: s.bankAccountNo || '',
    bankName: s.bankName || '',
    ifscCode: s.ifscCode || '',
    nationalId: s.nationalId || '',
    prevSchoolName: s.prevSchoolName || '',
    prevSchoolAddress: s.prevSchoolAddress || '',
    currentAddress: s.currentAddress || s.address || '',
    permanentAddress: s.permanentAddress || '',
    hostelName: s.hostelName || '',
    roomNo: s.roomNo || '',
    docName: s.docName || '',
    docUrl: s.docUrl || '',
    studentDetails: s.studentDetails || '',
});

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, color = '#4f46e5' }) {
    return (
        <div className="add-student-section-header">
            <div className="add-student-section-icon" style={{ background: color + '18', color }}>
                <Icon size={18} />
            </div>
            <h3 className="add-student-section-title">{title}</h3>
        </div>
    );
}

/* ─── File drop zone ────────────────────────────────────────── */
function FileDropZone({ label, current, onChange }) {
    const [file, setFile] = useState(current || null);
    const handleFile = (f) => {
        if (!f) return;
        setFile(f.name);
        if (onChange) onChange(f.name);
    };
    return (
        <div
            className="file-dropzone"
            onClick={() => document.getElementById('fz-' + label)?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        >
            <input id={'fz-' + label} type="file" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
                <div className="file-dropzone-selected"><CheckCircle size={18} color="#059669" /><span>{file}</span></div>
            ) : (
                <><Upload size={22} /><p>Drag &amp; drop a file here or <span>click</span></p></>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/*            SHARED STUDENT FULL FORM (Add + Edit)            */
/* ═══════════════════════════════════════════════════════════ */
function StudentFullForm({ branches, initialForm = emptyForm, isEdit = false, onSuccess, onCancel }) {
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await api.put(`/students/${isEdit}`, form);
                toast.success('Student updated successfully!');
                onSuccess(null);
            } else {
                const res = await api.post('/students', form);
                toast.success('Student added successfully!');
                onSuccess(res.data.credentials);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Error saving student');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-student-page">
            <div className="add-student-topbar">
                <button className="btn-secondary btn-sm" onClick={onCancel} type="button">
                    <ArrowLeft size={16} /> Back
                </button>
                <h2 className="add-student-topbar-title">
                    {isEdit ? 'Edit Student Details' : 'Add New Student'}
                </h2>
                <div />
            </div>

            <form onSubmit={handleSubmit} className="add-student-form">
                {/* ── 1. Personal Info ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={User} title="Personal Info" color="#4f46e5" />
                    <div className="form-grid-3">
                        <div className="form-group">
                            <label>Academic Year</label>
                            <select value={form.academicYear} onChange={set('academicYear')}>
                                <option value="">Select Year</option>
                                {['2023/2024', '2024/2025', '2025/2026', '2026/2027'].map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Class</label>
                            <select value={form.className} onChange={set('className')}>
                                <option value="">Select Class</option>
                                {['Primary', 'Secondary', 'Higher Secondary', 'UG', 'PG'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Section</label>
                            <select value={form.section} onChange={set('section')}>
                                <option value="">Select Section</option>
                                {['Science', 'Commerce', 'Arts', 'A', 'B', 'C', 'D'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Branch *</label>
                            <select value={form.branch} onChange={set('branch')} required>
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Semester *</label>
                            <select value={form.semester} onChange={set('semester')} required>
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Roll Number</label>
                            <input placeholder="Enter roll number" value={form.rollNo} onChange={set('rollNo')} required />
                        </div>
                        <div className="form-group">
                            <label>Admission No</label>
                            <input placeholder="Enter admission number" value={form.admissionNo} onChange={set('admissionNo')} />
                        </div>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input placeholder="Enter full name" value={form.name} onChange={set('name')} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select value={form.category} onChange={set('category')}>
                                <option value="">Select a Category</option>
                                {['General', 'OBC', 'SC', 'ST', 'EWS'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select value={form.gender} onChange={set('gender')}>
                                <option value="">Select</option>
                                <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" value={form.dob} onChange={set('dob')} />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input placeholder="Enter phone number" value={form.phone} onChange={set('phone')} />
                        </div>
                        <div className="form-group">
                            <label>Email {!isEdit && '*'}</label>
                            <input type="email" placeholder="Enter email (Login ID)" value={form.email} onChange={set('email')} required={!isEdit} disabled={!!isEdit} />
                        </div>
                        <div className="form-group form-col-span-2">
                            <label>Student Photo</label>
                            <FileDropZone label="student-photo" current={form.photoUrl} onChange={v => setForm(f => ({ ...f, photoUrl: v }))} />
                        </div>
                    </div>
                </div>

                {/* ── 2. Parent & Guardian ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Users} title="Parent & Guardian Info" color="#0891b2" />
                    <p className="parent-section-label">Father's Details</p>
                    <div className="form-grid-3">
                        <div className="form-group"><label>Father's Name</label><input placeholder="Enter father's name" value={form.fatherName} onChange={set('fatherName')} /></div>
                        <div className="form-group"><label>Phone Number</label><input placeholder="Enter father's phone" value={form.fatherPhone} onChange={set('fatherPhone')} /></div>
                        <div className="form-group"><label>Occupation</label><input placeholder="Enter occupation" value={form.fatherOccupation} onChange={set('fatherOccupation')} /></div>
                        <div className="form-group form-col-span-2"><label>Father's Photo</label><FileDropZone label="father-photo" current={form.fatherPhotoUrl} onChange={v => setForm(f => ({ ...f, fatherPhotoUrl: v }))} /></div>
                    </div>
                    <p className="parent-section-label" style={{ marginTop: '1.25rem' }}>Mother's Details</p>
                    <div className="form-grid-3">
                        <div className="form-group"><label>Mother's Name</label><input placeholder="Enter mother's name" value={form.motherName} onChange={set('motherName')} /></div>
                        <div className="form-group"><label>Phone Number</label><input placeholder="Enter mother's phone" value={form.motherPhone} onChange={set('motherPhone')} /></div>
                        <div className="form-group"><label>Occupation</label><input placeholder="Enter occupation" value={form.motherOccupation} onChange={set('motherOccupation')} /></div>
                        <div className="form-group form-col-span-2"><label>Mother's Photo</label><FileDropZone label="mother-photo" current={form.motherPhotoUrl} onChange={v => setForm(f => ({ ...f, motherPhotoUrl: v }))} /></div>
                    </div>
                    <p className="parent-section-label" style={{ marginTop: '1.25rem' }}>Guardian Details</p>
                    <div className="guardian-type-row">
                        {['Father', 'Mother', 'Others'].map(t => (
                            <label key={t} className={`guardian-type-btn ${form.guardianType === t ? 'active' : ''}`}>
                                <input type="radio" name="guardianType" value={t} checked={form.guardianType === t} onChange={set('guardianType')} hidden />
                                {t}
                            </label>
                        ))}
                    </div>
                    <div className="form-grid-3" style={{ marginTop: '1rem' }}>
                        <div className="form-group"><label>Guardian Name</label><input placeholder="Enter guardian name" value={form.guardianName} onChange={set('guardianName')} /></div>
                        <div className="form-group"><label>Guardian Email</label><input type="email" placeholder="Enter guardian email" value={form.guardianEmail} onChange={set('guardianEmail')} /></div>
                        <div className="form-group"><label>Phone Number</label><input placeholder="Enter guardian phone" value={form.guardianPhone} onChange={set('guardianPhone')} /></div>
                        <div className="form-group"><label>Occupation</label><input placeholder="Enter occupation" value={form.guardianOccupation} onChange={set('guardianOccupation')} /></div>
                        <div className="form-group form-col-span-2"><label>Guardian Address</label><textarea placeholder="Enter guardian address" value={form.guardianAddress} onChange={set('guardianAddress')} rows={2} /></div>
                        <div className="form-group form-col-span-2"><label>Guardian Photo</label><FileDropZone label="guardian-photo" current={form.guardianPhotoUrl} onChange={v => setForm(f => ({ ...f, guardianPhotoUrl: v }))} /></div>
                    </div>
                </div>

                {/* ── 3. Medical ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Heart} title="Medical Details" color="#dc2626" />
                    <div className="form-grid-3">
                        <div className="form-group">
                            <label>Blood Group</label>
                            <select value={form.bloodGroup} onChange={set('bloodGroup')}>
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Height (cm)</label><input placeholder="Enter height" value={form.height} onChange={set('height')} /></div>
                        <div className="form-group"><label>Weight (kg)</label><input placeholder="Enter weight" value={form.weight} onChange={set('weight')} /></div>
                    </div>
                </div>

                {/* ── 4. Bank ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Landmark} title="Bank Details" color="#059669" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Bank Account Number</label><input placeholder="Enter bank account number" value={form.bankAccountNo} onChange={set('bankAccountNo')} /></div>
                        <div className="form-group"><label>Bank Name</label><input placeholder="Enter bank name" value={form.bankName} onChange={set('bankName')} /></div>
                        <div className="form-group"><label>IFSC Code</label><input placeholder="Enter IFSC code" value={form.ifscCode} onChange={set('ifscCode')} /></div>
                        <div className="form-group"><label>National Identification Number</label><input placeholder="Enter national ID" value={form.nationalId} onChange={set('nationalId')} /></div>
                    </div>
                </div>

                {/* ── 5. Previous School ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={School} title="Previous School Details" color="#d97706" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>School Name</label><input placeholder="Enter school name" value={form.prevSchoolName} onChange={set('prevSchoolName')} /></div>
                        <div className="form-group form-col-span-2"><label>Address</label><textarea placeholder="Enter address" value={form.prevSchoolAddress} onChange={set('prevSchoolAddress')} rows={2} /></div>
                    </div>
                </div>

                {/* ── 6. Address ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Home} title="Address" color="#7c3aed" />
                    <div className="form-grid-2">
                        <div className="form-group"><label>Current Address</label><textarea placeholder="Enter current address" value={form.currentAddress} onChange={set('currentAddress')} rows={3} /></div>
                        <div className="form-group"><label>Permanent Address</label><textarea placeholder="Enter permanent address" value={form.permanentAddress} onChange={set('permanentAddress')} rows={3} /></div>
                    </div>
                </div>

                {/* ── 7. Hostel ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Building2} title="Hostel Details" color="#0891b2" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Hostel</label><input placeholder="Enter hostel name" value={form.hostelName} onChange={set('hostelName')} /></div>
                        <div className="form-group"><label>Room No</label><input placeholder="Enter room number" value={form.roomNo} onChange={set('roomNo')} /></div>
                    </div>
                </div>

                {/* ── 8. Documents ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={FileText} title="Upload Documents" color="#059669" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Document Name</label><input placeholder="Enter document name" value={form.docName} onChange={set('docName')} /></div>
                        <div className="form-group form-col-span-2"><label>Document File</label><FileDropZone label="doc-file" current={form.docUrl} onChange={v => setForm(f => ({ ...f, docUrl: v }))} /></div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Student Details / Notes</label>
                        <textarea placeholder="Enter additional student details" value={form.studentDetails} onChange={set('studentDetails')} rows={3} />
                    </div>
                </div>

                {/* ── 9. Login (add only) ─── */}
                {!isEdit && (
                    <div className="add-student-card">
                        <SectionHeader icon={Lock} title="Login Details" color="#1d4ed8" />
                        <div className="modal-info-banner" style={{ margin: '0 0 1rem 0' }}>
                            📧 The student's <strong>email</strong> is used as their <strong>Login ID</strong>.
                            Password is auto-generated as <code>firstname@rollno</code>
                        </div>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" placeholder="Enter email" value={form.email} onChange={set('email')} required />
                            </div>
                            <div className="form-group">
                                <label>Password (auto-generated)</label>
                                <input type="text" value={form.name && form.rollNo ? `${form.name.split(' ')[0].toLowerCase()}@${form.rollNo}` : ''} readOnly placeholder="Auto-generated" style={{ background: '#f8fafc', color: '#64748b' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="add-student-submit-bar">
                    <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? <><span className="spinner" /> Saving...</> : isEdit ? <><Save size={18} /> Save Changes</> : <><Plus size={18} /> Add Student</>}
                    </button>
                </div>
            </form>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════ */
/*                  MAIN STUDENTS PAGE                         */
/* ═══════════════════════════════════════════════════════════ */
export default function Students() {
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // 'list' | 'add' | 'edit'
    const [view, setView] = useState('list');
    const [editStudent, setEditStudent] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [copied, setCopied] = useState('');

    const fetchStudents = async () => {
        try { const res = await api.get('/students'); setStudents(res.data.data || []); }
        catch { toast.error('Failed to load students'); }
        finally { setLoading(false); }
    };
    const fetchBranches = async () => {
        try { const res = await api.get('/branches'); setBranches(res.data.data || []); }
        catch { }
    };
    useEffect(() => { fetchStudents(); fetchBranches(); }, []);

    const openEdit = (s) => { setEditStudent(s); setView('edit'); };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student?')) return;
        try { await api.delete(`/students/${id}`); toast.success('Deleted'); fetchStudents(); }
        catch { toast.error('Delete failed'); }
    };

    const handleRegen = async (id) => {
        try { const res = await api.post(`/students/${id}/credentials`); setCredentials(res.data.credentials); }
        catch { toast.error('Failed to reset credentials'); }
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Add student view ─── */
    if (view === 'add') {
        return (
            <StudentFullForm
                branches={branches}
                initialForm={emptyForm}
                isEdit={false}
                onSuccess={(creds) => { setView('list'); if (creds) setCredentials(creds); fetchStudents(); }}
                onCancel={() => setView('list')}
            />
        );
    }

    /* ── Edit student view ─── */
    if (view === 'edit' && editStudent) {
        return (
            <StudentFullForm
                branches={branches}
                initialForm={studentToForm(editStudent)}
                isEdit={editStudent._id}
                onSuccess={() => { setView('list'); fetchStudents(); }}
                onCancel={() => setView('list')}
            />
        );
    }

    /* ── List view ─── */
    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Students</h1><p className="page-subtitle">{students.length} total students</p></div>
                <button className="btn-primary" onClick={() => setView('add')}><Plus size={18} />Add Student</button>
            </div>

            <div className="card">
                <div className="table-toolbar">
                    <div className="search-box"><Search size={16} /><input placeholder="Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                {loading ? <div className="table-loading"><div className="spinner-lg" /></div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th><th>Roll No</th><th>Branch</th><th>Semester</th>
                                    <th>Gender</th><th>Login Email</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0
                                    ? <tr><td colSpan={7} className="empty-row">No students found</td></tr>
                                    : filtered.map(s => (
                                        <tr key={s._id}>
                                            <td><div className="cell-with-avatar"><div className="avatar">{s.name?.charAt(0)}</div>{s.name}</div></td>
                                            <td>{s.rollNo}</td>
                                            <td>{s.branch?.name || '—'}</td>
                                            <td>Sem {s.semester}</td>
                                            <td>{s.gender || '—'}</td>
                                            <td className="text-muted-sm">{s.userId?.loginId || s.email}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon btn-edit" title="Edit All Details" onClick={() => openEdit(s)}><Edit2 size={15} /></button>
                                                    <button className="btn-icon btn-key" title="Reset Password" onClick={() => handleRegen(s._id)}><Key size={15} /></button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(s._id)}><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Credential Reveal Modal */}
            {credentials && (
                <div className="modal-overlay" onClick={() => setCredentials(null)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎉 Student Credentials</h2>
                            <button className="modal-close" onClick={() => setCredentials(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p className="cred-note">Share these credentials with the student. Save the password — it won't be shown again.</p>
                            <div className="cred-box">
                                <div className="cred-row">
                                    <div><div className="cred-label">Login ID (Email)</div><div className="cred-value">{credentials.loginId}</div></div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credentials.loginId, 'id')}>
                                        {copied === 'id' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="cred-row">
                                    <div><div className="cred-label">Password</div><div className="cred-value cred-password">{credentials.password}</div></div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credentials.password, 'pw')}>
                                        {copied === 'pw' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCredentials(null)}>Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
