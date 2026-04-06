import Stripe from 'stripe';
import { env } from './env';

if (!env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set — payment features will be unavailable');
}

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;
