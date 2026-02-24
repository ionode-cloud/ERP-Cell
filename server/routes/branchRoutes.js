const express = require('express');
const router = express.Router();
const { getAllBranches, getBranch, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, getAllBranches);
router.get('/:id', protect, getBranch);
router.post('/', protect, allowRoles('admin'), createBranch);
router.put('/:id', protect, allowRoles('admin'), updateBranch);
router.delete('/:id', protect, allowRoles('admin'), deleteBranch);

module.exports = router;
