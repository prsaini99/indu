import nodemailer from 'nodemailer';
import { env } from './env';

const isSesConfigured = !!(
  env.AWS_SES_ACCESS_KEY_ID &&
  env.AWS_SES_SECRET_ACCESS_KEY &&
  env.AWS_SES_REGION &&
  env.AWS_SES_ACCESS_KEY_ID !== 'placeholder'
);

if (!isSesConfigured) {
  console.warn('AWS SES not configured — emails will be logged to console (dev mode)');
}

export const emailTransporter = isSesConfigured
  ? nodemailer.createTransport({
      host: `email-smtp.${env.AWS_SES_REGION}.amazonaws.com`,
      port: 465,
      secure: true,
      auth: {
        user: env.AWS_SES_ACCESS_KEY_ID!,
        pass: env.AWS_SES_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const isEmailConfigured = isSesConfigured;
export const emailFrom = env.EMAIL_FROM;
