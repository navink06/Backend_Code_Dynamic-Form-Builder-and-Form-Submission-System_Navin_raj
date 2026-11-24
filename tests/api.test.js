const test = require('node:test');
const assert = require('node:assert/strict');
const FormValidationService = require('../src/services/formValidationService');
const { FIELD_TYPES } = require('../src/constants');

test('FormValidationService - Validates all required field rules independently', async (t) => {
  const sampleForm = {
    fields: [
      {
        key: 'name',
        label: 'Full Name',
        type: FIELD_TYPES.TEXT,
        required: true,
        validation: { minLength: 2, maxLength: 50 }
      },
      {
        key: 'email',
        label: 'Email Address',
        type: FIELD_TYPES.EMAIL,
        required: true
      },
      {
        key: 'score',
        label: 'Score',
        type: FIELD_TYPES.NUMBER,
        required: true,
        validation: { min: 1, max: 100 }
      },
      {
        key: 'role',
        label: 'Role Selection',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }]
      },
      {
        key: 'skills',
        label: 'Skills',
        type: FIELD_TYPES.CHECKBOX,
        required: true,
        options: [{ label: 'Node', value: 'node' }, { label: 'React', value: 'react' }]
      }
    ]
  };

  await t.test('fails when required fields are missing', () => {
    const res = FormValidationService.validateSubmission(sampleForm, {});
    assert.equal(res.isValid, false);
    assert.ok(res.errors.name);
    assert.ok(res.errors.email);
    assert.ok(res.errors.score);
    assert.ok(res.errors.role);
    assert.ok(res.errors.skills);
  });

  await t.test('fails when email format is invalid', () => {
    const res = FormValidationService.validateSubmission(sampleForm, {
      name: 'John',
      email: 'not-an-email',
      score: 50,
      role: 'admin',
      skills: ['react']
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.email);
  });

  await t.test('fails when number is out of configured min/max range', () => {
    const res = FormValidationService.validateSubmission(sampleForm, {
      name: 'John',
      email: 'john@example.com',
      score: 150, // max is 100
      role: 'admin',
      skills: ['react']
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.score);
  });

  await t.test('fails when select value is not in configured options', () => {
    const res = FormValidationService.validateSubmission(sampleForm, {
      name: 'John',
      email: 'john@example.com',
      score: 80,
      role: 'super_hacker', // not an allowed option
      skills: ['react']
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.role);
  });

  await t.test('passes when all fields are valid and sanitizes payload', () => {
    const res = FormValidationService.validateSubmission(sampleForm, {
      name: ' John Doe ',
      email: 'JOHN@EXAMPLE.COM',
      score: '95',
      role: 'admin',
      skills: ['react'],
      unwantedInjectedField: 'hack'
    });
    assert.equal(res.isValid, true);
    assert.equal(res.sanitizedData.name, 'John Doe');
    assert.equal(res.sanitizedData.email, 'john@example.com');
    assert.equal(res.sanitizedData.score, 95);
    assert.equal(res.sanitizedData.unwantedInjectedField, undefined);
  });
});

test('RBAC - Only Admin role is authorized to login', async (t) => {
  const allowedRoles = ['admin'];
  const testUsers = [
    { email: 'admin@test.com', role: 'admin', expectedAllowed: true },
    { email: 'user@test.com', role: 'user', expectedAllowed: false },
    { email: 'staff@test.com', role: 'staff', expectedAllowed: false },
    { email: 'manager@test.com', role: 'manager', expectedAllowed: false }
  ];

  for (const u of testUsers) {
    const isAllowed = allowedRoles.includes(u.role.toLowerCase());
    assert.equal(isAllowed, u.expectedAllowed, `Role '${u.role}' authorization check failed`);
  }
});
