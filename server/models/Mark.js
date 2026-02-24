const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    subject: { type: String, required: true },
    examType: { type: String, enum: ['Assignment', 'Mid-Term', 'Final', 'Quiz', 'Practical', 'Other'], default: 'Other' },
    marks: { type: Number, required: true, min: 0, max: 100 },
    maxMarks: { type: Number, default: 100 },
    date: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: true });

module.exports = mongoose.model('Mark', markSchema);
