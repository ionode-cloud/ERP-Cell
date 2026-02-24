const Student = require('../models/Student');
const User = require('../models/User');
const Fee = require('../models/Fee');
const Branch = require('../models/Branch');

// Generate password from name + rollNo/employeeId
const generatePassword = (name, id) => {
    return `${name.split(' ')[0].toLowerCase()}@${id}`;
};


// @desc  Get all students
// @route GET /api/students
const getAllStudents = async (req, res) => {
    try {
        const { branch, search, page = 1, limit = 10 } = req.query;
        const query = { isActive: true };
        if (branch) query.branch = branch;
        if (search) query.name = { $regex: search, $options: 'i' };

        const total = await Student.countDocuments(query);
        const students = await Student.find(query)
            .populate('branch', 'name code')
            .populate('userId', 'loginId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single student
// @route GET /api/students/:id
const getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('branch', 'name code feeStructure subjects')
            .populate('userId', 'loginId');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get logged-in student's profile
// @route GET /api/students/me
const getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate('branch', 'name code feeStructure subjects')
            .populate('userId', 'loginId');
        if (!student) return res.status(404).json({ success: false, message: 'Profile not found' });
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Create student
// @route POST /api/students
const createStudent = async (req, res) => {
    try {
        const { name, email, phone, rollNo, branch, semester, gender, dob, address, guardianName, guardianPhone } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required (used as login ID)' });

        // Check duplicate
        const existing = await Student.findOne({ $or: [{ email }, { rollNo }] });
        if (existing) return res.status(400).json({ success: false, message: 'Email or Roll No already exists' });
        const userExists = await User.findOne({ loginId: email });
        if (userExists) return res.status(400).json({ success: false, message: 'A user with this email already exists' });

        // Email = loginId, auto-generate password
        const plainPassword = generatePassword(name, rollNo);
        const user = await User.create({ name, loginId: email, password: plainPassword, role: 'student' });

        const student = await Student.create({
            name, email, phone, rollNo, branch, semester, gender, dob, address, guardianName, guardianPhone, userId: user._id
        });
        user.refId = student._id;
        await user.save();

        // Create fee record
        const branchData = await Branch.findById(branch);
        if (branchData) {
            await Fee.create({
                student: student._id,
                branch: branch,
                totalAmount: branchData.feeStructure?.totalFee || 0,
                paidAmount: 0
            });
        }

        const populated = await Student.findById(student._id).populate('branch', 'name code').populate('userId', 'loginId');
        res.status(201).json({
            success: true,
            data: populated,
            credentials: { loginId: email, password: plainPassword }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update student
// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('branch', 'name code').populate('userId', 'loginId');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete student
// @route DELETE /api/students/:id
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        // Deactivate user account
        await User.findByIdAndUpdate(student.userId, { isActive: false });
        await Student.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Reset password for student (keep email loginId)
// @route POST /api/students/:id/credentials
const regenerateCredentials = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate('userId');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        const newPassword = generatePassword(student.name, student.rollNo);
        const user = await User.findById(student.userId._id);
        user.password = newPassword;
        await user.save();
        res.json({ success: true, credentials: { loginId: user.loginId, password: newPassword } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get dashboard stats
// @route GET /api/students/stats
const getStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ isActive: true });
        const byBranch = await Student.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$branch', count: { $sum: 1 } } },
            { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
            { $unwind: '$branch' },
            { $project: { name: '$branch.name', count: 1 } }
        ]);
        res.json({ success: true, data: { totalStudents, byBranch } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllStudents, getStudent, getMyProfile, createStudent, updateStudent, deleteStudent, regenerateCredentials, getStats };
