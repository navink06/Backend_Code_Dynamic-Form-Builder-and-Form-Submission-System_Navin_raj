const User = require('../models/User');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const { FIELD_TYPES, FORM_STATUS, USER_ROLES } = require('../constants');

const seedDatabase = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@formbuilder.com' });
    let adminUser = existingAdmin;

    if (!existingAdmin) {
      adminUser = await User.create({
        name: 'Chief Admin',
        email: 'admin@formbuilder.com',
        password: 'Admin@12345',
        role: USER_ROLES.ADMIN,
        department: 'Technology',
        designation: 'Principal Architect'
      });
      console.log('🌱 Seeded default admin user: admin@formbuilder.com / Admin@12345');
    }

    const formCount = await Form.countDocuments();
    if (formCount === 0) {
      // 1. Published Form showcasing all 9 field types
      const publishedForm = await Form.create({
        name: 'Customer Onboarding & Feedback',
        description: 'Complete registration and technical feedback for enterprise platform onboarding.',
        department: 'Customer Success',
        designation: 'Operations Specialist',
        role: 'Client Manager',
        creatorMail: 'admin@formbuilder.com',
        creatorMobile: '+1 800 555 0199',
        creatorGender: 'Not Specified',
        status: FORM_STATUS.PUBLISHED,
        createdBy: adminUser._id,
        submissionCount: 2,
        fields: [
          {
            id: 'fld_fname_01',
            key: 'firstName',
            label: 'First Name',
            type: FIELD_TYPES.TEXT,
            placeholder: 'e.g. John',
            required: true,
            order: 0,
            validation: { minLength: 2, maxLength: 50 }
          },
          {
            id: 'fld_lname_02',
            key: 'lastName',
            label: 'Last Name',
            type: FIELD_TYPES.TEXT,
            placeholder: 'e.g. Doe',
            required: true,
            order: 1,
            validation: { minLength: 2, maxLength: 50 }
          },
          {
            id: 'fld_email_03',
            key: 'email',
            label: 'Work Email Address',
            type: FIELD_TYPES.EMAIL,
            placeholder: 'john.doe@company.com',
            required: true,
            order: 2
          },
          {
            id: 'fld_phone_04',
            key: 'phone',
            label: 'Contact Number',
            type: FIELD_TYPES.PHONE,
            placeholder: '+1 234 567 8900',
            required: true,
            order: 3
          },
          {
            id: 'fld_num_05',
            key: 'teamSize',
            label: 'Expected Team Size',
            type: FIELD_TYPES.NUMBER,
            placeholder: '10',
            defaultValue: 5,
            required: false,
            order: 4,
            validation: { min: 1, max: 10000 }
          },
          {
            id: 'fld_date_06',
            key: 'startDate',
            label: 'Target Go-Live Date',
            type: FIELD_TYPES.DATE,
            placeholder: 'YYYY-MM-DD',
            required: true,
            order: 5
          },
          {
            id: 'fld_sel_07',
            key: 'industry',
            label: 'Primary Industry',
            type: FIELD_TYPES.SELECT,
            placeholder: 'Select your industry...',
            required: true,
            order: 6,
            options: [
              { label: 'Technology & SaaS', value: 'tech' },
              { label: 'Financial Services & Banking', value: 'finance' },
              { label: 'Healthcare & Life Sciences', value: 'healthcare' },
              { label: 'E-commerce & Retail', value: 'ecommerce' },
              { label: 'Other', value: 'other' }
            ]
          },
          {
            id: 'fld_rad_08',
            key: 'deploymentMode',
            label: 'Deployment Preference',
            type: FIELD_TYPES.RADIO,
            required: true,
            order: 7,
            options: [
              { label: 'Cloud Hosted (SaaS)', value: 'cloud' },
              { label: 'Self-Hosted Private VPC', value: 'vpc' },
              { label: 'Hybrid On-Premises', value: 'hybrid' }
            ]
          },
          {
            id: 'fld_chk_09',
            key: 'featuresNeeded',
            label: 'Key Features Needed',
            type: FIELD_TYPES.CHECKBOX,
            required: false,
            order: 8,
            options: [
              { label: 'Real-time Analytics', value: 'analytics' },
              { label: 'Single Sign-On (SSO / SAML)', value: 'sso' },
              { label: 'Custom Domain & Branding', value: 'custom_domain' },
              { label: 'Automated Webhooks & Integrations', value: 'webhooks' },
              { label: 'Audit Logging & Compliance', value: 'audit_logs' }
            ]
          },
          {
            id: 'fld_txta_10',
            key: 'projectNotes',
            label: 'Additional Project Notes or Requirements',
            type: FIELD_TYPES.TEXTAREA,
            placeholder: 'Tell us more about your use case and timeline...',
            required: false,
            order: 9,
            validation: { maxLength: 1000 }
          }
        ]
      });

      // Seed 2 sample submissions for this form
      await Submission.create([
        {
          formId: publishedForm._id,
          data: {
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'sarah.connor@cyberdyne.io',
            phone: '+1 415 889 1234',
            teamSize: 25,
            startDate: '2026-12-01T00:00:00.000Z',
            industry: 'tech',
            deploymentMode: 'cloud',
            featuresNeeded: ['analytics', 'sso', 'webhooks'],
            projectNotes: 'Looking to migrate 40 forms to the dynamic form builder next month.'
          },
          metadata: {
            ip: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
            submittedAt: new Date(Date.now() - 3600000 * 24)
          }
        },
        {
          formId: publishedForm._id,
          data: {
            firstName: 'Alex',
            lastName: 'Mercer',
            email: 'alex.m@gentek.org',
            phone: '+1 212 555 7788',
            teamSize: 50,
            startDate: '2026-12-15T00:00:00.000Z',
            industry: 'healthcare',
            deploymentMode: 'vpc',
            featuresNeeded: ['sso', 'audit_logs'],
            projectNotes: 'Strict HIPAA compliance required for internal clinical evaluations.'
          },
          metadata: {
            ip: '192.168.1.105',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
            submittedAt: new Date()
          }
        }
      ]);

      // 2. Draft Form demonstrating Form Builder editing state
      await Form.create({
        name: 'Internal Department Survey (Draft)',
        description: 'Employee satisfaction and quarterly review draft questionnaire.',
        department: 'Human Resources',
        designation: 'People Partner',
        role: 'Internal Evaluator',
        creatorMail: 'hr@formbuilder.com',
        creatorMobile: '+1 800 555 0122',
        creatorGender: 'Female',
        status: FORM_STATUS.DRAFT,
        createdBy: adminUser._id,
        fields: [
          {
            id: 'fld_d1',
            key: 'employeeName',
            label: 'Employee Full Name',
            type: FIELD_TYPES.TEXT,
            placeholder: 'Jane Doe',
            required: true,
            order: 0
          },
          {
            id: 'fld_d2',
            key: 'satisfactionScore',
            label: 'Department Satisfaction (1-10)',
            type: FIELD_TYPES.NUMBER,
            placeholder: '8',
            required: true,
            order: 1,
            validation: { min: 1, max: 10 }
          }
        ]
      });

      console.log('🌱 Seeded sample published form with submissions and draft form');
    }
  } catch (error) {
    console.error('Error during database seeding:', error.message);
  }
};

module.exports = seedDatabase;
