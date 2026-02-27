const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // ── Core / Academic ──────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    rollNo: { type: String, required: true, unique: true },
    admissionNo: { type: String, default: '' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    semester: { type: Number, default: 1, min: 1, max: 8 },
    academicYear: { type: String, default: '' },   // e.g. "2025/2026"
    className: { type: String, default: '' },   // e.g. "Primary"
    section: { type: String, default: '' },   // e.g. "Science"
    admissionYear: { type: Number, default: new Date().getFullYear() },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dob: { type: Date },
    category: { type: String, default: '' },   // General / OBC / SC / ST
    photoUrl: { type: String, default: '' },

    // ── Parent & Guardian ────────────────────────────────────
    fatherName: { type: String, default: '' },
    fatherPhone: { type: String, default: '' },
    fatherOccupation: { type: String, default: '' },
    fatherPhotoUrl: { type: String, default: '' },

    motherName: { type: String, default: '' },
    motherPhone: { type: String, default: '' },
    motherOccupation: { type: String, default: '' },
    motherPhotoUrl: { type: String, default: '' },

    guardianType: { type: String, enum: ['Father', 'Mother', 'Others'], default: 'Father' },
    guardianName: { type: String, default: '' },
    guardianEmail: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    guardianOccupation: { type: String, default: '' },
    guardianAddress: { type: String, default: '' },
    guardianPhotoUrl: { type: String, default: '' },

    // ── Medical ──────────────────────────────────────────────
    bloodGroup: { type: String, default: '' },
    height: { type: String, default: '' },
    weight: { type: String, default: '' },

    // ── Bank Details ─────────────────────────────────────────
    bankAccountNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    nationalId: { type: String, default: '' },

    // ── Previous School ──────────────────────────────────────
    prevSchoolName: { type: String, default: '' },
    prevSchoolAddress: { type: String, default: '' },

    // ── Address ──────────────────────────────────────────────
    currentAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    address: { type: String, default: '' }, // legacy

    // ── Hostel ───────────────────────────────────────────────
    hostelName: { type: String, default: '' },
    roomNo: { type: String, default: '' },

    // ── Documents ────────────────────────────────────────────
    docName: { type: String, default: '' },
    docUrl: { type: String, default: '' },

    // ── Extra ────────────────────────────────────────────────
    studentDetails: { type: String, default: '' },
    subjects: [{ type: String }],

    // ── System ───────────────────────────────────────────────
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
