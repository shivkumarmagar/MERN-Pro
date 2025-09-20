import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmation, sendPaymentSuccessNotification, sendPaymentFailedNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { message: 'Missing stripe signature' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook error' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const { appointmentId, patientId, doctorId } = paymentIntent.metadata;
    
    if (!appointmentId) {
      console.error('No appointment ID in payment intent metadata');
      return;
    }
    
    // Update appointment status
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      include: {
        patient: true,
        doctor: {
          include: { user: true },
        },
      },
    });
    
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        appointmentId,
        providerPaymentId: paymentIntent.id,
      },
      data: {
        status: 'succeeded',
      },
    });
    
    // Send confirmation notifications
    await sendBookingConfirmation({
      type: 'booking_confirmation',
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentTime: appointment.startAt.toLocaleString(),
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.user.name,
      clinicAddress: appointment.doctor.clinicAddress,
    });
    
    await sendPaymentSuccessNotification({
      type: 'payment_success',
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentTime: appointment.startAt.toLocaleString(),
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.user.name,
      clinicAddress: appointment.doctor.clinicAddress,
    });
    
    console.log(`Payment succeeded for appointment ${appointmentId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const { appointmentId, patientId, doctorId } = paymentIntent.metadata;
    
    if (!appointmentId) {
      console.error('No appointment ID in payment intent metadata');
      return;
    }
    
    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
        cancelledAt: new Date(),
        cancellationReason: 'Payment failed',
      },
    });
    
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        appointmentId,
        providerPaymentId: paymentIntent.id,
      },
      data: {
        status: 'failed',
      },
    });
    
    // Get appointment details for notification
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: {
          include: { user: true },
        },
      },
    });
    
    if (appointment) {
      await sendPaymentFailedNotification({
        type: 'payment_failed',
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: appointment.startAt.toLocaleString(),
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.user.name,
        clinicAddress: appointment.doctor.clinicAddress,
      });
    }
    
    console.log(`Payment failed for appointment ${appointmentId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: any) {
  try {
    const { appointmentId } = paymentIntent.metadata;
    
    if (!appointmentId) {
      console.error('No appointment ID in payment intent metadata');
      return;
    }
    
    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
        cancelledAt: new Date(),
        cancellationReason: 'Payment canceled',
      },
    });
    
    // Update payment record
    await prisma.payment.updateMany({
      where: {
        appointmentId,
        providerPaymentId: paymentIntent.id,
      },
      data: {
        status: 'canceled',
      },
    });
    
    console.log(`Payment canceled for appointment ${appointmentId}`);
  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}
