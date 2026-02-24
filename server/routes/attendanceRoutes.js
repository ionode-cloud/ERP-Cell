const express = require('express');
const router = express.Router();
const { markAttendance, getStudentAttendance, getMyAttendance, getBranchAttendance, deleteSession, updateSession } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/me', protect, allowRoles('student'), getMyAttendance);
router.get('/student/:studentId', protect, allowRoles('admin', 'teacher'), getStudentAttendance);
router.get('/branch/:branchId', protect, allowRoles('admin', 'teacher'), getBranchAttendance);
router.post('/mark', protect, allowRoles('teacher', 'admin'), markAttendance);
router.delete('/session', protect, allowRoles('teacher', 'admin'), deleteSession);
router.put('/session', protect, allowRoles('teacher', 'admin'), updateSession);

module.exports = router;
