const express = require('express');
const router = express.Router();
const { getAllLogs, getLogDetails } = require('../controllers/auditLogController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authorizeMiddleware');

router.get('/', protect, authorize('Audit Log'), getAllLogs);
router.get('/:id', protect, authorize('Audit Log'), getLogDetails);

module.exports = router;