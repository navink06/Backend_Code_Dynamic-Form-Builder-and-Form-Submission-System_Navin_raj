const Form = require('../models/Form');
const Submission = require('../models/Submission');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { FORM_STATUS } = require('../constants');

// Validate uniqueness of field keys in a form
const validateFieldKeys = (fields = []) => {
  const seenKeys = new Set();
  for (const field of fields) {
    if (!field.key || field.key.trim() === '') {
      throw ApiError.badRequest('Every field must have a non-empty key');
    }
    const cleanKey = field.key.trim();
    if (seenKeys.has(cleanKey)) {
      throw ApiError.badRequest(`Duplicate field key detected: "${cleanKey}". Field keys must be unique.`);
    }
    seenKeys.add(cleanKey);
  }
};

// Create Form
const createForm = async (req, res, next) => {
  try {
    const {
      name,
      description,
      department,
      designation,
      role,
      creatorMail,
      creatorMobile,
      creatorGender,
      status,
      fields
    } = req.body;

    if (!name || name.trim() === '') {
      throw ApiError.badRequest('Form name is required');
    }

    if (fields && Array.isArray(fields)) {
      validateFieldKeys(fields);
      // Ensure ordering index is set
      fields.forEach((f, idx) => {
        if (f.order === undefined) f.order = idx;
        if (!f.id) f.id = `fld_${Date.now()}_${idx}`;
      });
    }

    const form = await Form.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      department: department || 'General',
      designation: designation || 'Staff',
      role: role || 'User',
      creatorMail: creatorMail || req.user?.email || '',
      creatorMobile: creatorMobile || '',
      creatorGender: creatorGender || 'Not Specified',
      status: status || FORM_STATUS.DRAFT,
      fields: fields || [],
      createdBy: req.user?._id
    });

    res.status(201).json(ApiResponse.created(form, 'Form created successfully'));
  } catch (error) {
    next(error);
  }
};

// List Forms with pagination, search, status filter
const getForms = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && Object.values(FORM_STATUS).includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.department) {
      query.department = req.query.department;
    }

    if (req.query.search && req.query.search.trim() !== '') {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { department: searchRegex }];
    }

    const [forms, totalCount] = await Promise.all([
      Form.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Form.countDocuments(query)
    ]);

    res.status(200).json(ApiResponse.paginated(forms, page, limit, totalCount, 'Forms fetched successfully'));
  } catch (error) {
    next(error);
  }
};

// Get Form by ID (supports public rendering and admin view)
const getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id).populate('createdBy', 'name email');

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    // Sort fields by order
    if (form.fields && form.fields.length > 0) {
      form.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // If request is from public user and form is draft, deny access
    const isPublicUser = !req.user || req.user.role !== 'admin';
    const isPreview = req.query.preview === 'true';

    if (isPublicUser && form.status !== FORM_STATUS.PUBLISHED && !isPreview) {
      throw ApiError.forbidden('This form is currently in Draft mode and is not accepting responses.');
    }

    res.status(200).json(ApiResponse.success(form, 'Form retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// Update Form
const updateForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      department,
      designation,
      role,
      creatorMail,
      creatorMobile,
      creatorGender,
      status,
      fields
    } = req.body;

    const form = await Form.findById(id);
    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        throw ApiError.badRequest('Form name cannot be empty');
      }
      form.name = name.trim();
    }

    if (description !== undefined) form.description = description.trim();
    if (department !== undefined) form.department = department;
    if (designation !== undefined) form.designation = designation;
    if (role !== undefined) form.role = role;
    if (creatorMail !== undefined) form.creatorMail = creatorMail;
    if (creatorMobile !== undefined) form.creatorMobile = creatorMobile;
    if (creatorGender !== undefined) form.creatorGender = creatorGender;

    if (status !== undefined) {
      if (!Object.values(FORM_STATUS).includes(status)) {
        throw ApiError.badRequest(`Invalid form status: ${status}`);
      }
      form.status = status;
    }

    if (fields !== undefined && Array.isArray(fields)) {
      validateFieldKeys(fields);
      // Maintain order index
      fields.forEach((f, idx) => {
        if (f.order === undefined) f.order = idx;
        if (!f.id) f.id = `fld_${Date.now()}_${idx}`;
      });
      form.fields = fields;
    }

    await form.save();

    res.status(200).json(ApiResponse.success(form, 'Form updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete Form (and cascade-delete associated submissions)
const deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    await Promise.all([
      Form.findByIdAndDelete(id),
      Submission.deleteMany({ formId: id })
    ]);

    res.status(200).json(ApiResponse.success({ id }, 'Form and associated submissions deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// Form Analytics & Submission Stats
const getFormStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      throw ApiError.notFound('Form not found');
    }

    const totalSubmissions = await Submission.countDocuments({ formId: id });
    const latestSubmission = await Submission.findOne({ formId: id }).sort({ createdAt: -1 });
    const firstSubmission = await Submission.findOne({ formId: id }).sort({ createdAt: 1 });

    res.status(200).json(
      ApiResponse.success(
        {
          formId: id,
          formName: form.name,
          status: form.status,
          totalSubmissions,
          totalFields: form.fields.length,
          firstSubmissionAt: firstSubmission ? firstSubmission.createdAt : null,
          latestSubmissionAt: latestSubmission ? latestSubmission.createdAt : null
        },
        'Form stats fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  getFormStats
};
