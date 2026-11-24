const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: [true, 'Form ID is required'],
      index: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Submission data is required']
    },
    metadata: {
      ip: { type: String, default: 'unknown' },
      userAgent: { type: String, default: 'unknown' },
      submittedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

// High-performance compound index for 10M+ submissions scaling
submissionSchema.index({ formId: 1, createdAt: -1 });
submissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
