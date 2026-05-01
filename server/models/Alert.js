const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['fee', 'attendance', 'general'], default: 'general' },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Index for automatic deletion after 1 week (using expiresAt)
// Actually, I'll just filter them in the query, but an index helps.
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Alert', alertSchema);
