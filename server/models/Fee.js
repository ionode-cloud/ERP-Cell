const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['Cash', 'Online', 'Cheque', 'Bank Transfer'], default: 'Cash' },
    transactionId: { type: String, default: '' },
    remarks: { type: String, default: '' }
}, { _id: true });

const feeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    payments: [paymentSchema],
    academicYear: { type: String, default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` }
}, { timestamps: true });

// Auto-calculate dueAmount
feeSchema.pre('save', function (next) {
    this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
    this.dueAmount = this.totalAmount - this.paidAmount;
    next();
});

module.exports = mongoose.model('Fee', feeSchema);
