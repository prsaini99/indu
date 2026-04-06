import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './shared/middlewares/errorHandler';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import referenceRoutes from './modules/reference/reference.routes';
import tutorRoutes from './modules/tutor/tutor.routes';
import demoRequestRoutes from './modules/demo-request/demo-request.routes';
import courseRoutes from './modules/course/course.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import demoBookingRoutes from './modules/demo-booking/demo-booking.routes';
import applicationRoutes from './modules/application/application.routes';
import earningRoutes from './modules/earning/earning.routes';
import reviewRoutes from './modules/review/review.routes';
import assessmentRoutes from './modules/assessment/assessment.routes';
import enrollmentRoutes from './modules/enrollment/enrollment.routes';
import paymentRoutes from './modules/payment/payment.routes';
import recordingRoutes from './modules/recording/recording.routes';
import batchRoutes from './modules/batch/batch.routes';
import notificationRoutes from './modules/notification/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import swaggerRouter from './config/swagger';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,  // Allow cookies (refresh token)
}));

// Webhook endpoints need raw body for signature verification — must come BEFORE express.json()
app.use(`/api/${env.API_VERSION}/payments/webhook`, express.raw({ type: 'application/json' }));
app.use(`/api/${env.API_VERSION}/recordings/webhook`, express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation
app.use('/api/docs', swaggerRouter);

// API Routes
const apiPrefix = `/api/${env.API_VERSION}`;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}`, userRoutes);
app.use(`${apiPrefix}`, referenceRoutes);
app.use(`${apiPrefix}`, courseRoutes);  // Must come before tutorRoutes so /tutors/my-courses matches here first
app.use(`${apiPrefix}`, earningRoutes);  // Must come before tutorRoutes so /tutors/earnings is not captured by /tutors/:id
app.use(`${apiPrefix}`, reviewRoutes);  // Must come before tutorRoutes so /tutors/reviews is not captured by /tutors/:id
app.use(`${apiPrefix}`, tutorRoutes);
app.use(`${apiPrefix}`, demoRequestRoutes);
app.use(`${apiPrefix}`, walletRoutes);
app.use(`${apiPrefix}`, demoBookingRoutes);
app.use(`${apiPrefix}`, applicationRoutes);
app.use(`${apiPrefix}`, enrollmentRoutes);
app.use(`${apiPrefix}`, assessmentRoutes);
app.use(`${apiPrefix}`, paymentRoutes);
app.use(`${apiPrefix}`, recordingRoutes);
app.use(`${apiPrefix}`, batchRoutes);
app.use(`${apiPrefix}`, notificationRoutes);
app.use(`${apiPrefix}`, analyticsRoutes);
app.use(`${apiPrefix}`, dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found', statusCode: 404 },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
