const express = require('express');
const router = express.Router();
const { getAllStudents, getStudent, getMyProfile, createStudent, updateStudent, deleteStudent, regenerateCredentials, getStats } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/stats', protect, allowRoles('admin'), getStats);
router.get('/me', protect, allowRoles('student'), getMyProfile);
router.get('/', protect, allowRoles('admin', 'teacher'), getAllStudents);
router.get('/:id', protect, allowRoles('admin', 'teacher'), getStudent);
router.post('/', protect, allowRoles('admin'), createStudent);
router.put('/:id', protect, allowRoles('admin'), updateStudent);
router.delete('/:id', protect, allowRoles('admin'), deleteStudent);
router.post('/:id/credentials', protect, allowRoles('admin'), regenerateCredentials);

module.exports = router;
