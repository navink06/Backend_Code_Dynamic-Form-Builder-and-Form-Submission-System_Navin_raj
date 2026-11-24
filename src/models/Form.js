const mongoose = require('mongoose');
const { SUPPORTED_FIELD_TYPES, FORM_STATUS } = require('../constants');

const fieldOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const fieldValidationSchema = new mongoose.Schema(
  {
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    pattern: { type: String, default: null },
    customError: { type: String, default: null }
  },
  { _id: false }
);

const formFieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true,
      trim: true,
      match: [/^[a-zA-Z0-9_]+$/, 'Field key must be alphanumeric and underscore only']
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: SUPPORTED_FIELD_TYPES
    },
    placeholder: {
      type: String,
      default: ''
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    required: {
      type: Boolean,
      default: false
    },
    options: {
      type: [fieldOptionSchema],
      default: []
    },
    validation: {
      type: fieldValidationSchema,
      default: () => ({})
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Form name is required'],
      trim: true,
      maxlength: [150, 'Form name cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      trim: true,
      default: 'General'
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff'
    },
    role: {
      type: String,
      trim: true,
      default: 'User'
    },
    creatorMail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    creatorMobile: {
      type: String,
      trim: true,
      default: ''
    },
    creatorGender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Not Specified'],
      default: 'Not Specified'
    },
    status: {
      type: String,
      enum: Object.values(FORM_STATUS),
      default: FORM_STATUS.DRAFT,
      index: true
    },
    fields: {
      type: [formFieldSchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    submissionCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high performance query resolution
formSchema.index({ status: 1, createdAt: -1 });
formSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Form', formSchema);
