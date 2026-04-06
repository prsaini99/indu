import Stripe from 'stripe';
import { stripe } from '../../config/stripe';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/apiError';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateCheckoutDTO, PaymentQueryDTO } from './payment.types';

export class PaymentService {
  // ==========================================
  // PARENT: CREATE CHECKOUT SESSION
  // ==========================================

  async createCheckoutSession(userId: string, data: CreateCheckoutDTO) {
    if (!stripe) {
      throw ApiError.internal('Payment gateway is not configured');
    }

    // Find parent profile
    const parent = await prisma.parentProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    // Find active credit package
    const pkg = await prisma.creditPackage.findUnique({
      where: { id: data.packageId },
    });
    if (!pkg || !pkg.isActive || pkg.deletedAt) {
      throw ApiError.notFound('Credit package not found or inactive');
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'aed',
      customer_email: parent.user.email,
      line_items: [
        {
          price_data: {
            currency: 'aed',
            unit_amount: pkg.priceInFils, // Stripe uses smallest currency unit (fils for AED)
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        parentId: parent.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
      },
      success_url: `${env.FRONTEND_URL}/parent-dashboard/credits?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/parent-dashboard/credits?payment=cancelled`,
    });

    // Create Payment record (PENDING)
    await prisma.payment.create({
      data: {
        parentId: parent.id,
        creditPackageId: pkg.id,
        stripeSessionId: session.id,
        amountInFils: pkg.priceInFils,
        credits: pkg.credits,
        currency: 'aed',
        status: 'PENDING',
      },
    });

    return { checkoutUrl: session.url };
  }

  // ==========================================
  // WEBHOOK: HANDLE STRIPE EVENTS
  // ==========================================

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw ApiError.internal('Stripe webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw ApiError.badRequest('INVALID_SIGNATURE', 'Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutExpired(session);
        break;
      }
      default:
        // Ignore unhandled events
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (!payment) return; // Unknown session — ignore

    // Idempotency: already processed
    if (payment.status === 'COMPLETED') return;

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        stripePaymentIntentId: session.payment_intent as string | null,
        completedAt: new Date(),
      },
    });

    // Add credits to wallet
    const { WalletService } = await import('../wallet/wallet.service');
    const walletService = new WalletService();
    await walletService.addCreditsFromPayment(
      payment.parentId,
      payment.credits,
      `Purchased ${payment.credits} credits (${payment.currency.toUpperCase()} ${(payment.amountInFils / 100).toFixed(2)})`,
      payment.id
    );

    // Notify parent (non-blocking)
    try {
      const { NotificationService } = await import('../notification/notification.service');
      const { paymentConfirmedParent } = await import('../notification/templates/event-templates');
      const parent = await prisma.parentProfile.findUnique({
        where: { id: payment.parentId },
        include: { user: { select: { id: true, email: true } } },
      });
      if (parent) {
        const ns = new NotificationService();
        const template = paymentConfirmedParent(payment.credits, (payment.amountInFils / 100).toFixed(2));
        await ns.send({
          userId: parent.user.id,
          userEmail: parent.user.email,
          type: 'PAYMENT_CONFIRMED',
          ...template,
          emailHtml: template.html,
        });
      }
    } catch (err) {
      console.error('Payment notification failed (non-blocking):', err);
    }
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (!payment) return;

    // Don't downgrade a completed payment
    if (payment.status === 'COMPLETED') return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'EXPIRED' },
    });
  }

  // ==========================================
  // PARENT: PAYMENT HISTORY
  // ==========================================

  async getMyPayments(userId: string, query: PaymentQueryDTO) {
    const parent = await prisma.parentProfile.findUnique({ where: { userId } });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = { parentId: parent.id };
    if (query.status) where.status = query.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creditPackage: { select: { name: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const formatted = payments.map((p) => ({
      id: p.id,
      packageName: p.creditPackage.name,
      credits: p.credits,
      amountInFils: p.amountInFils,
      currency: p.currency,
      status: p.status,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }

  // ==========================================
  // ADMIN: ALL PAYMENTS
  // ==========================================

  async listAllPayments(query: PaymentQueryDTO) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creditPackage: { select: { name: true } },
          parent: {
            select: {
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const formatted = payments.map((p) => ({
      id: p.id,
      parentName: `${p.parent.firstName} ${p.parent.lastName}`,
      parentEmail: p.parent.user.email,
      packageName: p.creditPackage.name,
      credits: p.credits,
      amountInFils: p.amountInFils,
      currency: p.currency,
      status: p.status,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    }));

    return { data: formatted, meta: buildPaginationMeta(page, limit, total) };
  }
}
