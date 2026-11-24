const Form = require('../models/Form');
const Submission = require('../models/Submission');
const FormValidationService = require('../services/formValidationService');
const ExportService = require('../services/exportService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { FORM_STATUS } = require('../constants');

// Submit Form (User route: POST /api/forms/:formId/submissions)
const submitForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const rawData = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      throw ApiError.notFound('Form does not exist');
    }

    // Ensure form is published before accepting submissions
    if (form.status !== FORM_STATUS.PUBLISHED) {
      throw ApiError.badRequest('This form is not currently accepting submissions (Status: Draft or Archived)');
    }

    // Independent Backend Validation
    const validationResult = FormValidationService.validateSubmission(form, rawData);

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed for one or more fields',
        errors: validationResult.errors
      });
    }

    // Capture client metadata
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Persist submission
    const submission = await Submission.create({
      formId: form._id,
      data: validationResult.sanitizedData,
      metadata: {
        ip: String(ip).split(',')[0].trim(),
        userAgent: String(userAgent),
        submittedAt: new Date()
      }
    });

    // Increment submission count on Form atomically
    await Form.findByIdAndUpdate(form._id, { $inc: { submissionCount: 1 } });

    res.status(201).json(ApiResponse.created(submission, 'Form submitted successfully'));
  } catch (error) {
    next(error);
  }
};

// List submissions for a form (Paginated, Admin route: GET /api/forms/:formId/submissions)
const getSubmissions = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const form = await Form.findById(formId);
    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    const query = { formId };

    const [submissions, totalCount] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(query)
    ]);

    res.status(200).json(
      ApiResponse.paginated(
        submissions,
        page,
        limit,
        totalCount,
        'Submissions retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// View single submission (Admin route: GET /api/forms/:formId/submissions/:submissionId)
const getSubmissionById = async (req, res, next) => {
  try {
    const { formId, submissionId } = req.params;

    const submission = await Submission.findOne({ _id: submissionId, formId }).populate('formId', 'name fields');
    if (!submission) {
      throw ApiError.notFound('Submission not found for this form');
    }

    res.status(200).json(ApiResponse.success(submission, 'Submission details retrieved'));
  } catch (error) {
    next(error);
  }
};

// Delete single submission (Admin route: DELETE /api/forms/:formId/submissions/:submissionId)
const deleteSubmission = async (req, res, next) => {
  try {
    const { formId, submissionId } = req.params;

    const submission = await Submission.findOneAndDelete({ _id: submissionId, formId });
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    // Decrement submission count
    await Form.findByIdAndUpdate(formId, { $inc: { submissionCount: -1 } });

    res.status(200).json(ApiResponse.success({ id: submissionId }, 'Submission deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// Export submissions to CSV (Admin route: GET /api/forms/:formId/submissions/export)
const exportSubmissions = async (req, res, next) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    const submissions = await Submission.find({ formId }).sort({ createdAt: -1 });

    const csvData = await ExportService.exportSubmissionsToCSV(form, submissions);

    const safeFilename = form.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_submissions_${Date.now()}.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitForm,
  getSubmissions,
  getSubmissionById,
  deleteSubmission,
  exportSubmissions
};
