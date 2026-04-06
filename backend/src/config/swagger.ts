import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

const apiUrl = `http://localhost:${env.PORT}/api/${env.API_VERSION}`;

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Indu AE — Tutoring Platform API',
    version: '1.0.0',
    description: 'API for the Indu AE online tutoring platform. Parents (UAE) hire tutors (India) for 1:1 and group classes.',
  },
  servers: [{ url: apiUrl }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              statusCode: { type: 'integer' },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication & password management' },
    { name: 'Reference', description: 'Grades, subjects, boards (public)' },
    { name: 'User', description: 'Parent, consultant profiles & admin user management' },
    { name: 'Tutor', description: 'Tutor profile, availability, certifications' },
    { name: 'Course', description: 'Courses, materials, grade tiers' },
    { name: 'Enrollment', description: '1:1 class enrollments & sessions' },
    { name: 'Batch', description: 'Group/batch classes' },
    { name: 'Wallet', description: 'Credit balance, transactions, packages' },
    { name: 'Payment', description: 'Stripe checkout & webhooks' },
    { name: 'Demo Request', description: 'Demo class requests' },
    { name: 'Demo Booking', description: 'Demo class scheduling' },
    { name: 'Assessment', description: 'Student assessment results & documents' },
    { name: 'Review', description: 'Tutor reviews & ratings' },
    { name: 'Earning', description: 'Tutor earnings & admin payouts' },
    { name: 'Recording', description: 'Session recordings (Zoom → S3)' },
    { name: 'Notification', description: 'In-app notifications' },
    { name: 'Analytics', description: 'Admin analytics dashboard' },
    { name: 'Dashboard', description: 'Role-specific dashboard data' },
    { name: 'Application', description: 'Tutor/consultant applications' },
  ],
  paths: {
    // ── Auth ──
    '/auth/signup': {
      post: { tags: ['Auth'], summary: 'Register a new user', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'firstName', 'lastName'], properties: { email: { type: 'string' }, password: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, role: { type: 'string', enum: ['PARENT', 'TUTOR', 'CONSULTANT'] } } } } } }, responses: { '201': { description: 'Account created' }, '409': { description: 'Email already exists' } } },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Login', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { '200': { description: 'Returns access token + user' } } },
    },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token (uses httpOnly cookie)', responses: { '200': { description: 'New access token' } } } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Logged out' } } } },
    '/auth/verify-email': { get: { tags: ['Auth'], summary: 'Verify email with token', parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Email verified' } } } },
    '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Request password reset email', responses: { '200': { description: 'Reset email sent (if exists)' } } } },
    '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password with token', responses: { '200': { description: 'Password reset' } } } },
    '/auth/change-password': { post: { tags: ['Auth'], summary: 'Change password (authenticated)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Password changed' } } } },

    // ── Reference ──
    '/grades': { get: { tags: ['Reference'], summary: 'List all grade levels', responses: { '200': { description: 'Array of grades' } } } },
    '/subjects': { get: { tags: ['Reference'], summary: 'List all active subjects', responses: { '200': { description: 'Array of subjects' } } } },

    // ── User ──
    '/parents/profile': {
      get: { tags: ['User'], summary: 'Get parent profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Parent profile' } } },
      patch: { tags: ['User'], summary: 'Update parent profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Updated profile' } } },
    },
    '/parents/children': { get: { tags: ['User'], summary: "List parent's children", security: [{ bearerAuth: [] }], responses: { '200': { description: 'Array of children' } } } },
    '/consultants/profile': {
      get: { tags: ['User'], summary: 'Get consultant profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Consultant profile' } } },
      patch: { tags: ['User'], summary: 'Update consultant profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Updated profile' } } },
    },
    '/admin/users': {
      get: { tags: ['User'], summary: 'List all users (admin)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Paginated users' } } },
      post: { tags: ['User'], summary: 'Create user (super admin)', security: [{ bearerAuth: [] }], responses: { '201': { description: 'User created' } } },
    },
    '/admin/users/{id}': {
      get: { tags: ['User'], summary: 'Get user details (admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'User details' } } },
      delete: { tags: ['User'], summary: 'Soft delete user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Deleted' } } },
    },

    // ── Tutor ──
    '/tutors': { get: { tags: ['Tutor'], summary: 'Search tutors (public)', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'subjectId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Paginated tutors' } } } },
    '/tutors/{id}': { get: { tags: ['Tutor'], summary: 'Get tutor public profile', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Tutor profile' } } } },
    '/tutors/profile': {
      get: { tags: ['Tutor'], summary: 'Get own profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Profile' } } },
      patch: { tags: ['Tutor'], summary: 'Update own profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Updated' } } },
    },

    // ── Course ──
    '/courses': { get: { tags: ['Course'], summary: 'List active courses (public)', responses: { '200': { description: 'Courses' } } } },
    '/courses/{id}': { get: { tags: ['Course'], summary: 'Get course with materials (public)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Course details with materials' } } } },
    '/admin/courses': {
      get: { tags: ['Course'], summary: 'List all courses (admin)', security: [{ bearerAuth: [] }], responses: { '200': { description: 'All courses' } } },
      post: { tags: ['Course'], summary: 'Create course', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } },
    },

    // ── Enrollment ──
    '/enrollments/available-slots': { get: { tags: ['Enrollment'], summary: 'Get available slots for enrollment', security: [{ bearerAuth: [] }], parameters: [{ name: 'subjectId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'gradeId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'duration', in: 'query', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Available slots' } } } },
    '/enrollments': { post: { tags: ['Enrollment'], summary: 'Create enrollment', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Enrollment created with Zoom link' } } } },
    '/enrollments/my': { get: { tags: ['Enrollment'], summary: "List parent's enrollments", security: [{ bearerAuth: [] }], responses: { '200': { description: 'Paginated enrollments' } } } },
    '/enrollments/{id}': { get: { tags: ['Enrollment'], summary: 'Get enrollment details', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Enrollment' } } } },
    '/enrollments/{id}/sessions': { get: { tags: ['Enrollment'], summary: 'List enrollment sessions', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Sessions' } } } },
    '/enrollments/{id}/materials': { get: { tags: ['Enrollment'], summary: 'Get course materials for enrollment', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Course materials' } } } },
    '/enrollments/{id}/pause': { patch: { tags: ['Enrollment'], summary: 'Pause enrollment', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Paused' } } } },
    '/enrollments/{id}/resume': { patch: { tags: ['Enrollment'], summary: 'Resume enrollment', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Resumed' } } } },
    '/enrollments/{id}/cancel': { patch: { tags: ['Enrollment'], summary: 'Cancel enrollment', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Cancelled' } } } },

    // ── Batch ──
    '/batches/available': { get: { tags: ['Batch'], summary: 'List available batches', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Batches' } } } },
    '/batches/my': { get: { tags: ['Batch'], summary: 'List joined batches', security: [{ bearerAuth: [] }], responses: { '200': { description: 'My batches' } } } },
    '/batches/{id}': { get: { tags: ['Batch'], summary: 'Get batch details', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Batch' } } } },
    '/batches/{id}/join': { post: { tags: ['Batch'], summary: 'Join a batch', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Joined' } } } },
    '/batches/{id}/leave': { post: { tags: ['Batch'], summary: 'Leave a batch', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Left' } } } },
    '/batches/{id}/materials': { get: { tags: ['Batch'], summary: 'Get batch course materials', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Materials' } } } },

    // ── Wallet ──
    '/wallet/balance': { get: { tags: ['Wallet'], summary: 'Get credit balance', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Balance' } } } },
    '/wallet/transactions': { get: { tags: ['Wallet'], summary: 'List transactions', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Transactions' } } } },
    '/credit-packages': { get: { tags: ['Wallet'], summary: 'List credit packages (public)', responses: { '200': { description: 'Packages' } } } },

    // ── Payment ──
    '/payments/checkout': { post: { tags: ['Payment'], summary: 'Create Stripe checkout session', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Checkout URL' } } } },
    '/payments/my': { get: { tags: ['Payment'], summary: 'List own payments', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Payments' } } } },

    // ── Demo Request ──
    '/demo-requests/public': { post: { tags: ['Demo Request'], summary: 'Submit demo request (public)', responses: { '201': { description: 'Created' } } } },
    '/demo-requests': { post: { tags: ['Demo Request'], summary: 'Submit demo request (authenticated)', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } } },
    '/demo-requests/my': { get: { tags: ['Demo Request'], summary: 'List own requests', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Requests' } } } },

    // ── Assessment ──
    '/assessment-results': {
      post: { tags: ['Assessment'], summary: 'Create assessment result', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } },
      get: { tags: ['Assessment'], summary: 'List assessment results', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Results' } } },
    },

    // ── Review ──
    '/reviews': { post: { tags: ['Review'], summary: 'Create review', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } } },
    '/reviews/my-reviews': { get: { tags: ['Review'], summary: "List parent's reviews", security: [{ bearerAuth: [] }], responses: { '200': { description: 'Reviews' } } } },
    '/tutors/{id}/reviews': { get: { tags: ['Review'], summary: 'List tutor reviews (public)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Reviews with distribution' } } } },

    // ── Earning ──
    '/tutors/earnings': { get: { tags: ['Earning'], summary: 'List tutor earnings', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Earnings' } } } },
    '/tutors/earnings/summary': { get: { tags: ['Earning'], summary: 'Get earnings summary', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Summary' } } } },

    // ── Recording ──
    '/recordings/my': { get: { tags: ['Recording'], summary: 'List own recordings', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Recordings' } } } },
    '/recordings/session/{sessionId}/url': { get: { tags: ['Recording'], summary: 'Get recording playback URL', security: [{ bearerAuth: [] }], parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Presigned URL' } } } },

    // ── Notification ──
    '/notifications/my': { get: { tags: ['Notification'], summary: 'List notifications', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Notifications' } } } },
    '/notifications/unread-count': { get: { tags: ['Notification'], summary: 'Get unread count', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Count' } } } },
    '/notifications/read-all': { patch: { tags: ['Notification'], summary: 'Mark all as read', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Done' } } } },

    // ── Analytics ──
    '/admin/analytics/dashboard': { get: { tags: ['Analytics'], summary: 'Get admin analytics', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard stats' } } } },

    // ── Dashboard ──
    '/dashboard/parent': { get: { tags: ['Dashboard'], summary: 'Get parent dashboard', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard data' } } } },
    '/dashboard/tutor': { get: { tags: ['Dashboard'], summary: 'Get tutor dashboard', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard data' } } } },
    '/dashboard/consultant': { get: { tags: ['Dashboard'], summary: 'Get consultant dashboard', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard data' } } } },

    // ── Application ──
    '/applications': { post: { tags: ['Application'], summary: 'Submit tutor/consultant application (public)', responses: { '201': { description: 'Application submitted' } } } },
    '/admin/applications': { get: { tags: ['Application'], summary: 'List all applications', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Applications' } } } },
  },
};

const router = Router();
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, { customSiteTitle: 'Indu AE API Docs' }));

export default router;
