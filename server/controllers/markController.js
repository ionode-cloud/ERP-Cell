const Mark = require('../models/Mark');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// @desc  Record marks for a student
// @route POST /api/marks
const recordMark = async (req, res) => {
    try {
        const { studentId, subject, examType, marks, maxMarks, date, remarks } = req.body;
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const mark = await Mark.create({
            student: studentId,
            branch: student.branch,
            subject,
            examType: examType || 'Other',
            marks,
            maxMarks: maxMarks || 100,
            date: date ? new Date(date) : new Date(),
            remarks: remarks || '',
            markedBy: teacher._id,
        });

        res.status(201).json({ success: true, data: mark });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Record marks for multiple students at once
// @route POST /api/marks/bulk
const recordMarksBulk = async (req, res) => {
    try {
        const { records, subject, examType, maxMarks, date } = req.body;
        // records: [{ studentId, marks, remarks }]
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const results = await Promise.all(records.map(async (r) => {
            const student = await Student.findById(r.studentId);
            if (!student) return null;
            return Mark.findOneAndUpdate(
                { student: r.studentId, subject, examType: examType || 'Other', date: date ? new Date(date) : new Date() },
                {
                    student: r.studentId,
                    branch: student.branch,
                    subject,
                    examType: examType || 'Other',
                    marks: r.marks,
                    maxMarks: maxMarks || 100,
                    date: date ? new Date(date) : new Date(),
                    remarks: r.remarks || '',
                    markedBy: teacher._id,
                },
                { upsert: true, new: true }
            );
        }));

        res.json({ success: true, message: `Marks recorded for ${results.filter(Boolean).length} students`, data: results.filter(Boolean) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get marks for a branch (teacher view)
// @route GET /api/marks/branch/:branchId
const getBranchMarks = async (req, res) => {
    try {
        const { subject, examType } = req.query;
        const query = { branch: req.params.branchId };
        if (subject) query.subject = subject;
        if (examType) query.examType = examType;
        const marks = await Mark.find(query)
            .populate('student', 'name rollNo semester')
            .sort({ date: -1 });
        res.json({ success: true, data: marks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get marks for logged-in student
// @route GET /api/marks/me
const getMyMarks = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        const marks = await Mark.find({ student: student._id }).sort({ date: -1 });
        res.json({ success: true, data: marks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { recordMark, recordMarksBulk, getBranchMarks, getMyMarks };
