const express = require('express');
const router = express.Router();
const {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  getFormStats
} = require('../controllers/formController');
const { authenticate, optionalAuthenticate } = require('../middlewares/authMiddleware');
const submissionRoutes = require('./submissionRoutes');

// Mount submissions routes under /api/forms/:formId/submissions
router.use('/:formId/submissions', submissionRoutes);

// Forms CRUD endpoints
router.post('/', authenticate, createForm);
router.get('/', optionalAuthenticate, getForms);
router.get('/:id', optionalAuthenticate, getFormById);
router.put('/:id', authenticate, updateForm);
router.delete('/:id', authenticate, deleteForm);
router.get('/:id/stats', authenticate, getFormStats);

module.exports = router;
