const express = require('express');
const router = express.Router();
const { 
  getVisitors,
  getVisitorStats,
  recordVisit
} = require('../controllers/visitors');

const { protect, checkPermission } = require('../middleware/auth');

// Public route to record visits
router.post('/', recordVisit);

// Protected routes require authentication
router.use(protect);

// Stats permission required for these routes
router.get('/', checkPermission('stats'), getVisitors);
router.get('/stats', checkPermission('stats'), getVisitorStats);

module.exports = router; 