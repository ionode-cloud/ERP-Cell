const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    totalFee: { type: Number, default: 0 },
    tuitionFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    labFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 }
}, { _id: false });

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    duration: { type: String, default: '4 Years' },
    totalSeats: { type: Number, default: 60 },
    feeStructure: { type: feeStructureSchema, default: () => ({}) },
    subjects: [{ type: String }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
