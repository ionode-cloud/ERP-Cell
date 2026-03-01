const Fee = require('../models/Fee');
const Branch = require('../models/Branch');
const Student = require('../models/Student');

// @desc  Get all fees (admin)
const getAllFees = async (req, res) => {
    try {
        const { branch, search } = req.query;
        let query = {};
        if (branch) query.branch = branch;
        const fees = await Fee.find(query)
            .populate({ path: 'student', match: search ? { name: { $regex: search, $options: 'i' } } : {}, select: 'name rollNo email' })
            .populate('branch', 'name code');
        const filtered = fees.filter(f => f.student !== null);
        res.json({ success: true, data: filtered });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single student's fee
const getStudentFee = async (req, res) => {
    try {
        const fee = await Fee.findOne({ student: req.params.studentId })
            .populate('student', 'name rollNo email branch')
            .populate('branch', 'name code feeStructure');
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
        res.json({ success: true, data: fee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get logged-in student's fee
const getMyFee = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        const fee = await Fee.findOne({ student: student._id })
            .populate('student', 'name rollNo email')
            .populate('branch', 'name code feeStructure');
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
        res.json({ success: true, data: fee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Record a payment for a single student
const addPayment = async (req, res) => {
    try {
        const { studentId, rollNo, amount, method, transactionId, remarks } = req.body;

        let targetStudentId = studentId;
        if (rollNo) {
            const student = await Student.findOne({ rollNo });
            if (!student) return res.status(404).json({ success: false, message: 'Student not found with this Roll No' });
            targetStudentId = student._id;
        }

        const fee = await Fee.findOne({ student: targetStudentId });
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found for this student' });

        fee.payments.push({ amount: Number(amount), method: method || 'Cash', transactionId, remarks });
        await fee.save();
        res.json({ success: true, data: fee, message: 'Payment recorded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Record a payment for ALL students in a branch
// @route POST /api/fees/branch-payment
const addBranchPayment = async (req, res) => {
    try {
        const { branchId, amount, method, remarks, description } = req.body;
        if (!branchId || !amount) return res.status(400).json({ success: false, message: 'branchId and amount are required' });

        // Get all fee records for this branch
        const fees = await Fee.find({ branch: branchId });
        if (fees.length === 0) return res.status(404).json({ success: false, message: 'No fee records found for this branch' });

        const results = [];
        for (const fee of fees) {
            fee.payments.push({
                amount: Number(amount),
                method: method || 'Cash',
                remarks: remarks || description || 'Branch payment',
            });
            const saved = await fee.save();
            results.push(saved);
        }

        res.json({ success: true, message: `Payment of ₹${amount} applied to ${results.length} students`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Send payment alert to all unpaid/partial students in a branch (or all)
// @route POST /api/fees/send-alert
const sendPaymentAlert = async (req, res) => {
    try {
        const { branchId, studentId } = req.body;

        let query = {};
        if (branchId) query.branch = branchId;
        if (studentId) query.student = studentId;

        const fees = await Fee.find(query).populate('student', 'name rollNo email');
        const unpaid = fees.filter(f => (f.dueAmount > 0) && f.student);

        // In a real system you'd send email/SMS. Here we simulate and return who was alerted.
        const alerted = unpaid.map(f => ({
            name: f.student.name,
            rollNo: f.student.rollNo,
            email: f.student.email,
            dueAmount: f.dueAmount,
            totalAmount: f.totalAmount,
        }));

        res.json({
            success: true,
            message: `Alert simulated for ${alerted.length} student(s) with pending dues`,
            data: alerted,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get revenue summary (admin)
const getRevenueSummary = async (req, res) => {
    try {
        const fees = await Fee.find().populate('branch', 'name code');
        const totalRevenue = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const totalPending = fees.reduce((sum, f) => sum + ((f.totalAmount || 0) - (f.paidAmount || 0)), 0);
        const totalFees = fees.reduce((sum, f) => sum + (f.totalAmount || 0), 0);

        // Monthly breakdown from payment sub-documents
        const monthMap = {};
        fees.forEach(f => {
            (f.payments || []).forEach(p => {
                const d = new Date(p.date || Date.now());
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
                if (!monthMap[key]) monthMap[key] = { month: label, amount: 0 };
                monthMap[key].amount += p.amount || 0;
            });
        });
        const monthly = Object.keys(monthMap).sort().map(k => monthMap[k]);

        // Per-branch fee totals
        const branchMap = {};
        fees.forEach(f => {
            const bId = f.branch?._id?.toString() || 'unknown';
            const bName = f.branch?.name || 'Unknown';
            if (!branchMap[bId]) branchMap[bId] = { name: bName, totalFees: 0, collected: 0, pending: 0 };
            branchMap[bId].totalFees += f.totalAmount || 0;
            branchMap[bId].collected += f.paidAmount || 0;
            branchMap[bId].pending += (f.totalAmount || 0) - (f.paidAmount || 0);
        });
        const byBranch = Object.values(branchMap);

        res.json({ success: true, totalRevenue, totalPending, totalFees, monthly, byBranch, totalStudents: fees.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllFees, getStudentFee, getMyFee, addPayment, addBranchPayment, sendPaymentAlert, getRevenueSummary };
