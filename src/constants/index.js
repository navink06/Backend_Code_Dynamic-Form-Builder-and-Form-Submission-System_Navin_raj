const FIELD_TYPES = Object.freeze({
  TEXT: 'TEXT',
  EMAIL: 'EMAIL',
  NUMBER: 'NUMBER',
  PHONE: 'PHONE',
  TEXTAREA: 'TEXTAREA',
  DATE: 'DATE',
  SELECT: 'SELECT',
  RADIO: 'RADIO',
  CHECKBOX: 'CHECKBOX'
});

const FORM_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
});

const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  STAFF: 'staff',
  MANAGER: 'manager',
  EDITOR: 'editor'
});

module.exports = {
  FIELD_TYPES,
  FORM_STATUS,
  USER_ROLES,
  SUPPORTED_FIELD_TYPES: Object.values(FIELD_TYPES)
};
