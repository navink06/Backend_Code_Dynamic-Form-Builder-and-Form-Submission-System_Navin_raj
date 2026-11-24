const { FIELD_TYPES } = require('../constants');

class FormValidationService {
  /**
   * Validate submission payload against the dynamic form definition
   * @param {Object} form - Mongoose Form document
   * @param {Object} rawData - Incoming request body (key-value pairs)
   * @returns {Object} { isValid, errors, sanitizedData }
   */
  static validateSubmission(form, rawData = {}) {
    const errors = {};
    const sanitizedData = {};
    const fields = form.fields || [];

    // Map for quick field lookup
    const fieldMap = new Map();
    fields.forEach((field) => fieldMap.set(field.key, field));

    for (const field of fields) {
      const key = field.key;
      const label = field.label || key;
      const val = rawData[key];
      const isRequired = !!field.required;
      const validation = field.validation || {};

      // 1. Check Required status
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0);

      if (isRequired && isEmpty) {
        errors[key] = `${label} is required`;
        continue;
      }

      // If field is optional and empty, allow null/empty and skip further validations
      if (isEmpty) {
        sanitizedData[key] = Array.isArray(val) ? [] : null;
        continue;
      }

      // 2. Type-Specific Validation
      switch (field.type) {
        case FIELD_TYPES.TEXT:
        case FIELD_TYPES.TEXTAREA: {
          const strVal = String(val).trim();

          if (validation.minLength && strVal.length < validation.minLength) {
            errors[key] =
              validation.customError ||
              `${label} must be at least ${validation.minLength} characters`;
          } else if (validation.maxLength && strVal.length > validation.maxLength) {
            errors[key] =
              validation.customError ||
              `${label} cannot exceed ${validation.maxLength} characters`;
          } else if (validation.pattern) {
            try {
              const regex = new RegExp(validation.pattern);
              if (!regex.test(strVal)) {
                errors[key] = validation.customError || `${label} format is invalid`;
              }
            } catch (e) {
              console.warn(`Invalid regex pattern configured for field ${key}:`, e.message);
            }
          }

          sanitizedData[key] = strVal;
          break;
        }

        case FIELD_TYPES.EMAIL: {
          const emailVal = String(val).trim().toLowerCase();
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

          if (!emailRegex.test(emailVal)) {
            errors[key] = validation.customError || `${label} must be a valid email address`;
          }

          sanitizedData[key] = emailVal;
          break;
        }

        case FIELD_TYPES.NUMBER: {
          const numVal = Number(val);

          if (isNaN(numVal)) {
            errors[key] = validation.customError || `${label} must be a valid number`;
          } else {
            if (validation.min !== null && validation.min !== undefined && numVal < validation.min) {
              errors[key] =
                validation.customError ||
                `${label} must be greater than or equal to ${validation.min}`;
            } else if (
              validation.max !== null &&
              validation.max !== undefined &&
              numVal > validation.max
            ) {
              errors[key] =
                validation.customError ||
                `${label} must be less than or equal to ${validation.max}`;
            }
          }

          sanitizedData[key] = numVal;
          break;
        }

        case FIELD_TYPES.PHONE: {
          const phoneVal = String(val).trim();
          // E.164 and international phone number pattern support: +1234567890, 123-456-7890, (123) 456-7890
          const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;

          if (!phoneRegex.test(phoneVal)) {
            errors[key] =
              validation.customError ||
              `${label} must be a valid phone number (e.g. +1234567890 or 9876543210)`;
          }

          sanitizedData[key] = phoneVal;
          break;
        }

        case FIELD_TYPES.DATE: {
          const parsedDate = Date.parse(val);

          if (isNaN(parsedDate)) {
            errors[key] = validation.customError || `${label} must be a valid date`;
          }

          sanitizedData[key] = new Date(parsedDate).toISOString();
          break;
        }

        case FIELD_TYPES.SELECT:
        case FIELD_TYPES.RADIO: {
          const selectedVal = String(val).trim();
          const allowedOptions = (field.options || []).map((opt) =>
            typeof opt === 'string' ? opt : opt.value || opt.label
          );

          if (allowedOptions.length > 0 && !allowedOptions.includes(selectedVal)) {
            errors[key] =
              validation.customError ||
              `${label} must be one of the configured options: ${allowedOptions.join(', ')}`;
          }

          sanitizedData[key] = selectedVal;
          break;
        }

        case FIELD_TYPES.CHECKBOX: {
          let selectedArray = [];
          if (Array.isArray(val)) {
            selectedArray = val.map((v) => String(v).trim());
          } else if (typeof val === 'string') {
            selectedArray = [val.trim()];
          } else if (typeof val === 'boolean') {
            selectedArray = val ? ['true'] : [];
          }

          const allowedOptions = (field.options || []).map((opt) =>
            typeof opt === 'string' ? opt : opt.value || opt.label
          );

          if (allowedOptions.length > 0) {
            const invalidSelections = selectedArray.filter(
              (item) => !allowedOptions.includes(item)
            );
            if (invalidSelections.length > 0) {
              errors[key] =
                validation.customError ||
                `Invalid selection(s) for ${label}: ${invalidSelections.join(', ')}`;
            }
          }

          sanitizedData[key] = selectedArray;
          break;
        }

        default:
          sanitizedData[key] = val;
          break;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }
}

module.exports = FormValidationService;
