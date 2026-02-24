const express = require('express');
const router = express.Router();
const { getAllFees, getStudentFee, getMyFee, addPayment, addBranchPayment, sendPaymentAlert, getRevenueSummary } = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/summary', protect, allowRoles('admin'), getRevenueSummary);
router.get('/me', protect, allowRoles('student'), getMyFee);
router.get('/', protect, allowRoles('admin'), getAllFees);
router.get('/student/:studentId', protect, allowRoles('admin', 'teacher'), getStudentFee);
router.post('/payment', protect, allowRoles('admin'), addPayment);
router.post('/branch-payment', protect, allowRoles('admin'), addBranchPayment);
router.post('/send-alert', protect, allowRoles('admin'), sendPaymentAlert);

module.exports = router;
