import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export { stripe };

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  const { amount, currency, appointmentId, patientId, doctorId, metadata = {} } = params;
  
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata: {
      appointmentId,
      patientId,
      doctorId,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };
  
  if (amount) {
    refundParams.amount = Math.round(amount * 100); // Convert to cents
  }
  
  return await stripe.refunds.create(refundParams);
}

export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  try {
    constructWebhookEvent(payload, signature);
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
