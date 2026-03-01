import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    Plus, Search, Edit2, Trash2, Key, X, Copy, CheckCircle,
    User, Users, Heart, Landmark, School, Home, Building2,
    FileText, Lock, Upload, ArrowLeft, Save, Briefcase
} from 'lucide-react';

/* ─── Default form state ────────────────────────────────────── */
const emptyForm = {
    employeeId: '', name: '', branch: '', subjects: '', className: '',
    gender: '', dob: '', fatherName: '', motherName: '', maritalStatus: '',
    contractType: '', shift: '', workLocation: '', joiningDate: '',
    phone: '', email: '', experience: '', qualification: '', photoUrl: '',
    bloodGroup: '', height: '', weight: '',
    bankAccountNo: '', bankName: '', ifscCode: '', nationalId: '',
    docName: '', docUrl: '',
    prevSchoolName: '', prevSchoolAddress: '',
    currentAddress: '', permanentAddress: '', address: '',
    teacherDetails: '', facebook: '', linkedin: '', instagram: '', youtube: '',
    salary: ''
};

const teacherToForm = (t) => ({
    employeeId: t.employeeId || '', name: t.name || '', branch: t.branch?._id || t.branch || '',
    subjects: Array.isArray(t.subjects) ? t.subjects[0] || '' : t.subjects || '',
    className: t.className || '',
    gender: t.gender || '', dob: t.dob ? t.dob.split('T')[0] : '',
    fatherName: t.fatherName || '', motherName: t.motherName || '', maritalStatus: t.maritalStatus || '',
    contractType: t.contractType || '', shift: t.shift || '', workLocation: t.workLocation || '',
    joiningDate: t.joiningDate ? t.joiningDate.split('T')[0] : '',
    phone: t.phone || '', email: t.email || '', experience: t.experience || '',
    qualification: t.qualification || '', photoUrl: t.photoUrl || '',
    bloodGroup: t.bloodGroup || '', height: t.height || '', weight: t.weight || '',
    bankAccountNo: t.bankAccountNo || '', bankName: t.bankName || '', ifscCode: t.ifscCode || '', nationalId: t.nationalId || '',
    docName: t.docName || '', docUrl: t.docUrl || '',
    prevSchoolName: t.prevSchoolName || '', prevSchoolAddress: t.prevSchoolAddress || '',
    currentAddress: t.currentAddress || '', permanentAddress: t.permanentAddress || '', address: t.address || '',
    teacherDetails: t.teacherDetails || '', facebook: t.facebook || '', linkedin: t.linkedin || '', instagram: t.instagram || '', youtube: t.youtube || '',
    salary: t.salary || ''
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
/*            SHARED TEACHER FULL FORM (Add + Edit)            */
/* ═══════════════════════════════════════════════════════════ */
function TeacherFullForm({ branches, initialForm = emptyForm, isEdit = false, onSuccess, onCancel }) {
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const selectedBranch = branches.find(b => b._id === form.branch);
    const branchSubjects = selectedBranch?.subjects || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, subjects: form.subjects ? [form.subjects] : [] };
            if (isEdit) {
                await api.put(`/teachers/${isEdit}`, payload);
                toast.success('Teacher updated successfully!');
                onSuccess(null);
            } else {
                const res = await api.post('/teachers', payload);
                toast.success('Teacher added successfully!');
                onSuccess(res.data.credentials);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Error saving teacher');
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
                    {isEdit ? 'Edit Teacher Details' : 'Add New Teacher'}
                </h2>
                <div />
            </div>

            <form onSubmit={handleSubmit} className="add-student-form">
                {/* ── 1. Professional & Personal Info ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Briefcase} title="Professional & Personal Info" color="#4f46e5" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Teacher ID *</label><input type="text" placeholder="Enter Teacher ID" value={form.employeeId} onChange={set('employeeId')} required /></div>
                        <div className="form-group"><label>Full Name *</label><input type="text" placeholder="Enter your Full Name" value={form.name} onChange={set('name')} required /></div>

                        <div className="form-group">
                            <label>Branch</label>
                            <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value, subjects: '' })}>
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <select value={form.subjects} onChange={set('subjects')}>
                                <option value="">Select Subject</option>
                                {branchSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="form-group"><label>Class</label><input type="text" placeholder="Enter Class (e.g. 1 (A))" value={form.className} onChange={set('className')} /></div>
                        <div className="form-group"><label>Gender</label><input type="text" placeholder="Enter gender" value={form.gender} onChange={set('gender')} /></div>
                        <div className="form-group"><label>Date Of Birth *</label><input type="date" value={form.dob} onChange={set('dob')} required /></div>

                        <div className="form-group"><label>Fathers Name</label><input type="text" placeholder="Enter Fathers Name" value={form.fatherName} onChange={set('fatherName')} /></div>
                        <div className="form-group"><label>Mothers Name</label><input type="text" placeholder="Enter mothers Name" value={form.motherName} onChange={set('motherName')} /></div>
                        <div className="form-group"><label>Marital Status</label><input type="text" placeholder="Enter marital status" value={form.maritalStatus} onChange={set('maritalStatus')} /></div>

                        <div className="form-group"><label>Contract Type</label><input type="text" placeholder="Enter contract type" value={form.contractType} onChange={set('contractType')} /></div>
                        <div className="form-group"><label>Shift</label><input type="text" placeholder="Enter shift" value={form.shift} onChange={set('shift')} /></div>
                        <div className="form-group"><label>Work Location</label><input type="text" placeholder="Enter work location" value={form.workLocation} onChange={set('workLocation')} /></div>
                        <div className="form-group"><label>Join Date</label><input type="date" value={form.joiningDate} onChange={set('joiningDate')} /></div>

                        <div className="form-group"><label>Phone Number *</label><input type="text" placeholder="Enter your Phone Number" value={form.phone} onChange={set('phone')} required /></div>
                        <div className="form-group"><label>Email *</label><input type="email" placeholder="Enter your Email" value={form.email} onChange={set('email')} required disabled={!!isEdit} /></div>

                        <div className="form-group"><label>Experience *</label><input type="text" placeholder="Enter experience" value={form.experience} onChange={set('experience')} required /></div>
                        <div className="form-group"><label>Qualification</label><input type="text" placeholder="Enter Qualification" value={form.qualification} onChange={set('qualification')} /></div>

                        <div className="form-group"><label>Salary (₹)</label><input type="number" placeholder="Enter salary" value={form.salary} onChange={set('salary')} /></div>

                        <div className="form-group form-col-span-2">
                            <label>Teacher Photo *</label>
                            <FileDropZone label="teacher-photo" current={form.photoUrl} onChange={v => setForm({ ...form, photoUrl: v })} />
                        </div>
                    </div>
                </div>

                {/* ── 2. Medical Details ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Heart} title="Medical Details" color="#dc2626" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Blood Group</label><input type="text" placeholder="Enter blood group" value={form.bloodGroup} onChange={set('bloodGroup')} /></div>
                        <div className="form-group"><label>Height</label><input type="text" placeholder="Enter height" value={form.height} onChange={set('height')} /></div>
                        <div className="form-group"><label>Weight</label><input type="text" placeholder="Enter Weight" value={form.weight} onChange={set('weight')} /></div>
                    </div>
                </div>

                {/* ── 3. Bank Details ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Landmark} title="Bank Details" color="#059669" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>Bank Account Number</label><input type="text" placeholder="Enter bank account number" value={form.bankAccountNo} onChange={set('bankAccountNo')} /></div>
                        <div className="form-group"><label>Bank Name</label><input type="text" placeholder="Enter bank name" value={form.bankName} onChange={set('bankName')} /></div>
                        <div className="form-group"><label>IFSC Code</label><input type="text" placeholder="Enter IFSC Code" value={form.ifscCode} onChange={set('ifscCode')} /></div>
                        <div className="form-group"><label>National Identification Number</label><input type="text" placeholder="Enter national identification number" value={form.nationalId} onChange={set('nationalId')} /></div>
                    </div>
                </div>

                {/* ── 4. Upload Documents ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={FileText} title="Upload Documents" color="#d97706" />
                    <div className="form-grid-2">
                        <div className="form-group"><label>Doc Name</label><input type="text" placeholder="Enter Doc Name" value={form.docName} onChange={set('docName')} /></div>
                        <div className="form-group">
                            <label>Upload File</label>
                            <FileDropZone label="doc-file" current={form.docUrl} onChange={v => setForm({ ...form, docUrl: v })} />
                        </div>
                    </div>
                </div>

                {/* ── 5. Previous School Details ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={School} title="Previous School Details" color="#7c3aed" />
                    <div className="form-grid-3">
                        <div className="form-group"><label>School Name</label><input type="text" placeholder="Enter School Name" value={form.prevSchoolName} onChange={set('prevSchoolName')} /></div>
                        <div className="form-group form-col-span-2"><label>Address</label><textarea placeholder="Enter Address" value={form.prevSchoolAddress} onChange={set('prevSchoolAddress')} rows={2} /></div>
                    </div>
                </div>

                {/* ── 6. Address ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={Home} title="Address" color="#0891b2" />
                    <div className="form-grid-2">
                        <div className="form-group"><label>Current Address</label><textarea placeholder="Enter Current Address" value={form.currentAddress} onChange={set('currentAddress')} rows={3} /></div>
                        <div className="form-group"><label>Permanent Address</label><textarea placeholder="Enter Permanent Address" value={form.permanentAddress} onChange={set('permanentAddress')} rows={3} /></div>
                    </div>
                </div>

                {/* ── 7. Teacher Details & Socials ─── */}
                <div className="add-student-card">
                    <SectionHeader icon={User} title="Teacher Details" color="#3b82f6" />
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Teacher Details</label>
                        <textarea placeholder="Enter details" value={form.teacherDetails} onChange={set('teacherDetails')} rows={3} />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group"><label>Facebook</label><input type="text" placeholder="Enter your facebook link" value={form.facebook} onChange={set('facebook')} /></div>
                        <div className="form-group"><label>LinkedIn</label><input type="text" placeholder="Enter your LinkedIn link" value={form.linkedin} onChange={set('linkedin')} /></div>
                        <div className="form-group"><label>Instagram</label><input type="text" placeholder="Enter your Instagram link" value={form.instagram} onChange={set('instagram')} /></div>
                        <div className="form-group"><label>YouTube</label><input type="text" placeholder="Enter your YouTube link" value={form.youtube} onChange={set('youtube')} /></div>
                    </div>
                </div>

                {/* ── 8. Login Details (add only) ─── */}
                {!isEdit && (
                    <div className="add-student-card">
                        <SectionHeader icon={Lock} title="Login Details" color="#1d4ed8" />
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" placeholder="Enter Email" value={form.email} onChange={set('email')} required disabled={!!isEdit} />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input type="text" value={form.name && form.employeeId ? `${form.name.split(' ')[0].toLowerCase()}@${form.employeeId}` : ''} readOnly placeholder="Auto-generated" style={{ background: '#f8fafc', color: '#64748b' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="add-student-submit-bar">
                    <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? <><span className="spinner" /> Saving...</> : isEdit ? <><Save size={18} /> Update Teacher</> : <><Plus size={18} /> Add Teacher</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/*                  MAIN TEACHERS PAGE                         */
/* ═══════════════════════════════════════════════════════════ */
export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [view, setView] = useState('list');
    const [editTeacher, setEditTeacher] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [copied, setCopied] = useState('');

    const fetchAll = async () => {
        try {
            const [tRes, bRes] = await Promise.all([api.get('/teachers'), api.get('/branches')]);
            setTeachers(tRes.data.data || []);
            setBranches(bRes.data.data || []);
        } catch { toast.error('Failed to load teachers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const openAdd = () => { setEditTeacher(null); setView('add'); };
    const openEdit = (t) => { setEditTeacher(t); setView('edit'); };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this teacher?')) return;
        try { await api.delete(`/teachers/${id}`); toast.success('Deleted'); fetchAll(); }
        catch { toast.error('Delete failed'); }
    };

    const handleRegen = async (id) => {
        try {
            const res = await api.post(`/teachers/${id}/credentials`);
            setCredentials(res.data.credentials);
        } catch { toast.error('Failed to reset credentials'); }
    };

    const filtered = teachers.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Add teacher view ─── */
    if (view === 'add') {
        return (
            <TeacherFullForm
                branches={branches}
                initialForm={emptyForm}
                isEdit={false}
                onSuccess={(creds) => { setView('list'); if (creds) setCredentials(creds); fetchAll(); }}
                onCancel={() => setView('list')}
            />
        );
    }

    /* ── Edit teacher view ─── */
    if (view === 'edit' && editTeacher) {
        return (
            <TeacherFullForm
                branches={branches}
                initialForm={teacherToForm(editTeacher)}
                isEdit={editTeacher._id}
                onSuccess={() => { setView('list'); fetchAll(); }}
                onCancel={() => setView('list')}
            />
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Teachers</h1><p className="page-subtitle">{teachers.length} total teachers</p></div>
                <button className="btn-primary" onClick={openAdd}><Plus size={18} />Add Teacher</button>
            </div>

            <div className="card">
                <div className="table-toolbar">
                    <div className="search-box"><Search size={16} /><input placeholder="Search by name, email, employee ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                {loading ? <div className="table-loading"><div className="spinner-lg" /></div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Employee ID</th><th>Branch</th><th>Qualification</th><th>Login Email</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? <tr><td colSpan={6} className="empty-row">No teachers found</td></tr> :
                                    filtered.map(t => (
                                        <tr key={t._id}>
                                            <td><div className="cell-with-avatar"><div className="avatar avatar-green">{t.name?.charAt(0)}</div>{t.name}</div></td>
                                            <td>{t.employeeId}</td>
                                            <td>{t.branch?.name || t.branch}</td>
                                            <td>{t.qualification}</td>
                                            <td className="text-muted-sm">{t.userId?.loginId || t.email}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon btn-edit" title="Edit" onClick={() => openEdit(t)}><Edit2 size={15} /></button>
                                                    <button className="btn-icon btn-key" title="Reset Password" onClick={() => handleRegen(t._id)}><Key size={15} /></button>
                                                    <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(t._id)}><Trash2 size={15} /></button>
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
                            <h2>🎉 Teacher Credentials</h2>
                            <button className="modal-close" onClick={() => setCredentials(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-form">
                            <p className="cred-note">Share these credentials with the teacher. Save the password — it won't be shown again.</p>
                            <div className="cred-box">
                                <div className="cred-row">
                                    <div>
                                        <div className="cred-label">Login ID (Email)</div>
                                        <div className="cred-value">{credentials.loginId}</div>
                                    </div>
                                    <button className="btn-icon btn-edit" onClick={() => copyText(credentials.loginId, 'id')}>
                                        {copied === 'id' ? <CheckCircle size={16} color="#059669" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="cred-row">
                                    <div>
                                        <div className="cred-label">Password</div>
                                        <div className="cred-value cred-password">{credentials.password}</div>
                                    </div>
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
