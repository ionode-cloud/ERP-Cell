const express = require('express');
const router = express.Router();
const { getAllTeachers, getTeacher, getMyProfile, createTeacher, updateTeacher, deleteTeacher, regenerateCredentials } = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/me', protect, allowRoles('teacher'), getMyProfile);
router.get('/', protect, allowRoles('admin'), getAllTeachers);
router.get('/:id', protect, allowRoles('admin'), getTeacher);
router.post('/', protect, allowRoles('admin'), createTeacher);
router.put('/:id', protect, allowRoles('admin'), updateTeacher);
router.delete('/:id', protect, allowRoles('admin'), deleteTeacher);
router.post('/:id/credentials', protect, allowRoles('admin'), regenerateCredentials);

module.exports = router;
