const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc  Mark attendance for multiple students
// @route POST /api/attendance/mark
const markAttendance = async (req, res) => {
    try {
        const { records, subject, date } = req.body;
        // records: [{ studentId, status, marks, branch }]
        const teacher = await Teacher.findOne({ userId: req.user._id });
        const attendanceDate = new Date(date);

        const results = await Promise.all(records.map(async (r) => {
            return Attendance.findOneAndUpdate(
                { student: r.studentId, subject, date: attendanceDate },
                {
                    student: r.studentId, subject, date: attendanceDate,
                    status: r.status, branch: r.branch,
                    marks: r.marks !== undefined ? r.marks : null,
                    markedBy: teacher?._id
                },
                { upsert: true, new: true }
            );
        }));

        res.json({ success: true, message: `Attendance marked for ${results.length} students`, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get attendance for a student
// @route GET /api/attendance/student/:studentId
const getStudentAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({ student: req.params.studentId }).sort({ date: -1 });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        // Group by subject
        const subjectMap = {};
        records.forEach(r => {
            if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, present: 0 };
            subjectMap[r.subject].total++;
            if (r.status === 'Present') subjectMap[r.subject].present++;
        });
        const bySubject = Object.entries(subjectMap).map(([subject, data]) => ({
            subject,
            total: data.total,
            present: data.present,
            percentage: Math.round((data.present / data.total) * 100)
        }));

        res.json({ success: true, data: { records, total, present, percentage, bySubject } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get logged-in student's own attendance
// @route GET /api/attendance/me
const getMyAttendance = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const records = await Attendance.find({ student: student._id }).sort({ date: -1 });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const subjectMap = {};
        records.forEach(r => {
            if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, present: 0 };
            subjectMap[r.subject].total++;
            if (r.status === 'Present') subjectMap[r.subject].present++;
        });
        const bySubject = Object.entries(subjectMap).map(([subject, data]) => ({
            subject,
            total: data.total,
            present: data.present,
            percentage: Math.round((data.present / data.total) * 100)
        }));

        res.json({ success: true, data: { records, total, present, percentage, bySubject } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get attendance for a branch/subject (teacher view)
// @route GET /api/attendance/branch/:branchId
const getBranchAttendance = async (req, res) => {
    try {
        const { branchId } = req.params;
        // Validate branchId
        if (!branchId || branchId === 'undefined') {
            return res.status(400).json({ success: false, message: 'Invalid branchId' });
        }
        const { subject, date } = req.query;
        const query = { branch: branchId };
        if (subject) query.subject = subject;
        if (date) query.date = new Date(date);
        const records = await Attendance.find(query).populate('student', 'name rollNo').sort({ date: -1 });
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete a whole class session (all records for a subject+date+branch)
// @route DELETE /api/attendance/session
const deleteSession = async (req, res) => {
    try {
        const { subject, date, branchId } = req.body;
        if (!subject || !date || !branchId) {
            return res.status(400).json({ success: false, message: 'subject, date, branchId required' });
        }
        const result = await Attendance.deleteMany({
            subject,
            branch: branchId,
            date: new Date(date),
        });
        res.json({ success: true, message: `Deleted ${result.deletedCount} attendance records` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update attendance records for a session (subject+date+branchId)
// @route PUT /api/attendance/session
const updateSession = async (req, res) => {
    try {
        const { subject, date, branchId, records } = req.body;
        // records: [{ studentId, status }]
        if (!subject || !date || !branchId || !records) {
            return res.status(400).json({ success: false, message: 'subject, date, branchId, records required' });
        }
        const attendanceDate = new Date(date);
        const results = await Promise.all(records.map(r =>
            Attendance.findOneAndUpdate(
                { student: r.studentId, subject, date: attendanceDate, branch: branchId },
                { status: r.status },
                { new: true }
            )
        ));
        res.json({ success: true, message: 'Session updated', data: results.filter(Boolean) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { markAttendance, getStudentAttendance, getMyAttendance, getBranchAttendance, deleteSession, updateSession };
