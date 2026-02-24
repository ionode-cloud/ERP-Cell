const express = require('express');
const router = express.Router();
const { recordMark, recordMarksBulk, getBranchMarks, getMyMarks } = require('../controllers/markController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/me', protect, allowRoles('student'), getMyMarks);
router.get('/branch/:branchId', protect, allowRoles('admin', 'teacher'), getBranchMarks);
router.post('/bulk', protect, allowRoles('teacher', 'admin'), recordMarksBulk);
router.post('/', protect, allowRoles('teacher', 'admin'), recordMark);

module.exports = router;
