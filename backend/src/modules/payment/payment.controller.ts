import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new PaymentService();

export class PaymentController {
  // Parent: create checkout session
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createCheckoutSession(req.user!.id, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Stripe webhook (no auth — signature verified in service)
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await service.handleWebhook(req.body as Buffer, signature);
      // Always return 200 to Stripe
      res.status(200).json({ received: true });
    } catch (error) {
      // Still return 200 to avoid Stripe retries on our errors
      console.error('Webhook error:', error);
      res.status(200).json({ received: true });
    }
  }

  // Parent: payment history
  async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMyPayments(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // Admin: all payments
  async listAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAllPayments(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
