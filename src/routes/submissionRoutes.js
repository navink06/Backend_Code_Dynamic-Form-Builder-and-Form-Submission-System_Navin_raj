const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  submitForm,
  getSubmissions,
  getSubmissionById,
  deleteSubmission,
  exportSubmissions
} = require('../controllers/submissionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { submissionLimiter } = require('../middlewares/rateLimiter');

// Public route for form submission (protected by submission rate limiter)
router.post('/', submissionLimiter, submitForm);

// Protected Admin routes for submissions management
router.get('/export', authenticate, exportSubmissions);
router.get('/', authenticate, getSubmissions);
router.get('/:submissionId', authenticate, getSubmissionById);
router.delete('/:submissionId', authenticate, deleteSubmission);

module.exports = router;
