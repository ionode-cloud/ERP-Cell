const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    // ── Core / Professional ──────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    employeeId: { type: String, required: true, unique: true }, // Teacher ID
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    subjects: [{ type: String }],
    className: { type: String, default: '' }, // Class
    qualification: { type: String, default: '' },
    experience: { type: String, default: '' }, // Text because it says 'Enter experience'
    salary: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    contractType: { type: String, default: '' }, // Contractual, etc.
    shift: { type: String, default: '' }, // Day Shift, etc.
    workLocation: { type: String, default: '' },
    teacherDetails: { type: String, default: '' }, // Teacher Details Notes

    // ── Personal Info ──────────────────────────────────────
    gender: { type: String, default: 'Male' },
    dob: { type: Date },
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
    maritalStatus: { type: String, default: 'Married' },
    photoUrl: { type: String, default: '' }, // Teacher Photo

    // ── Medical ──────────────────────────────────────────────
    bloodGroup: { type: String, default: '' },
    height: { type: String, default: '' },
    weight: { type: String, default: '' },

    // ── Bank Details ─────────────────────────────────────────
    bankAccountNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    nationalId: { type: String, default: '' },

    // ── Documents ────────────────────────────────────────────
    docName: { type: String, default: '' },
    docUrl: { type: String, default: '' }, // Upload file

    // ── Previous School ──────────────────────────────────────
    prevSchoolName: { type: String, default: '' },
    prevSchoolAddress: { type: String, default: '' },

    // ── Address ──────────────────────────────────────────────
    currentAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    address: { type: String, default: '' }, // Legacy

    // ── Social Links ─────────────────────────────────────────
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },

    // ── System ───────────────────────────────────────────────
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
