const Teacher = require('../models/Teacher');
const User = require('../models/User');

const generatePassword = (name, id) => {
    return `${name.split(' ')[0].toLowerCase()}@${id}`;
};

// @desc  Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const { branch, search, page = 1, limit = 10 } = req.query;
        const query = { isActive: true };
        if (branch) query.branch = branch;
        if (search) query.name = { $regex: search, $options: 'i' };

        const total = await Teacher.countDocuments(query);
        const teachers = await Teacher.find(query)
            .populate('branch', 'name code')
            .populate('userId', 'loginId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ success: true, data: teachers, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single teacher
const getTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate('branch', 'name code').populate('userId', 'loginId');
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
        res.json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get teacher's own profile
const getMyProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id })
            .populate('branch', 'name code subjects')
            .populate('userId', 'loginId');
        if (!teacher) return res.status(404).json({ success: false, message: 'Profile not found' });
        res.json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Create teacher — email becomes loginId
const createTeacher = async (req, res) => {
    try {
        const { name, email, phone, employeeId, branch, subjects, qualification, experience, gender, salary, address } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required (used as login ID)' });

        const existing = await Teacher.findOne({ $or: [{ email }, { employeeId }] });
        if (existing) return res.status(400).json({ success: false, message: 'Email or Employee ID already exists' });
        const userExists = await User.findOne({ loginId: email });
        if (userExists) return res.status(400).json({ success: false, message: 'A user with this email already exists' });

        // Email = loginId, auto-generate password as firstname@employeeId
        const plainPassword = generatePassword(name, employeeId || name.split(' ')[0].toLowerCase());
        const user = await User.create({ name, loginId: email, password: plainPassword, role: 'teacher' });

        const teacher = await Teacher.create({ name, email, phone, employeeId, branch, subjects, qualification, experience, gender, salary, address, userId: user._id });
        user.refId = teacher._id;
        await user.save();

        const populated = await Teacher.findById(teacher._id).populate('branch', 'name code').populate('userId', 'loginId');
        res.status(201).json({
            success: true,
            data: populated,
            credentials: { loginId: email, password: plainPassword }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update teacher
const updateTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('branch', 'name code').populate('userId', 'loginId');
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
        res.json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete teacher
const deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
        await User.findByIdAndUpdate(teacher.userId, { isActive: false });
        await Teacher.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Reset teacher password (keep email loginId)
const regenerateCredentials = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
        const newPassword = generatePassword(teacher.name, teacher.employeeId || teacher.name.split(' ')[0].toLowerCase());
        const user = await User.findById(teacher.userId);
        user.password = newPassword;
        await user.save();
        res.json({ success: true, credentials: { loginId: user.loginId, password: newPassword } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllTeachers, getTeacher, getMyProfile, createTeacher, updateTeacher, deleteTeacher, regenerateCredentials };
