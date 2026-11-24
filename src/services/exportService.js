const { AsyncParser } = require('json2csv');

class ExportService {
  /**
   * Convert submissions into formatted CSV string
   * @param {Object} form - Form definition
   * @param {Array} submissions - List of submissions
   * @returns {Promise<string>} CSV string
   */
  static async exportSubmissionsToCSV(form, submissions) {
    const fields = [
      { label: 'Submission ID', value: '_id' },
      { label: 'Submitted At', value: 'createdAtFormatted' },
      { label: 'IP Address', value: 'metadata.ip' }
    ];

    // Add each form field as a column with human-readable label
    (form.fields || []).forEach((field) => {
      fields.push({
        label: field.label,
        value: (row) => {
          const val = row.data ? row.data[field.key] : '';
          if (val === undefined || val === null) return '';
          if (Array.isArray(val)) return val.join('; ');
          return String(val);
        }
      });
    });

    const transformedData = submissions.map((sub) => {
      const doc = sub.toObject ? sub.toObject() : sub;
      return {
        ...doc,
        createdAtFormatted: new Date(doc.createdAt).toISOString()
      };
    });

    const parser = new AsyncParser({ fields });
    return parser.parse(transformedData).promise();
  }
}

module.exports = ExportService;
