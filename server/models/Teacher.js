const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    employeeId: { type: String, required: true, unique: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    subjects: [{ type: String }],
    qualification: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    salary: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    address: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
