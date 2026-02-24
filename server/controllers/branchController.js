const Branch = require('../models/Branch');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc  Get all branches
const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
        // Add student/teacher counts
        const enriched = await Promise.all(branches.map(async (b) => {
            const studentCount = await Student.countDocuments({ branch: b._id, isActive: true });
            const teacherCount = await Teacher.countDocuments({ branch: b._id, isActive: true });
            return { ...b.toObject(), studentCount, teacherCount };
        }));
        res.json({ success: true, data: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single branch
const getBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        const students = await Student.find({ branch: req.params.id, isActive: true }).select('name rollNo semester');
        const teachers = await Teacher.find({ branch: req.params.id, isActive: true }).select('name employeeId subjects');
        res.json({ success: true, data: { ...branch.toObject(), students, teachers } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Create branch
const createBranch = async (req, res) => {
    try {
        const existing = await Branch.findOne({ code: req.body.code?.toUpperCase() });
        if (existing) return res.status(400).json({ success: false, message: 'Branch code already exists' });
        const branch = await Branch.create(req.body);
        res.status(201).json({ success: true, data: branch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update branch
const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.json({ success: true, data: branch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete branch
const deleteBranch = async (req, res) => {
    try {
        const studentCount = await Student.countDocuments({ branch: req.params.id, isActive: true });
        if (studentCount > 0) return res.status(400).json({ success: false, message: `Cannot delete branch with ${studentCount} active students` });
        await Branch.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBranches, getBranch, createBranch, updateBranch, deleteBranch };
