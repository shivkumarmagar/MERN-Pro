import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRefund } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;
    
    // Get refunded payments
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: 'refunded',
        },
        include: {
          appointment: {
            include: {
              patient: true,
              doctor: {
                include: { user: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: {
          status: 'refunded',
        },
      }),
    ]);
    
    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { appointmentId, amount, reason } = body;
    
    if (!appointmentId) {
      return NextResponse.json(
        { message: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Get appointment and payment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payments: {
          where: {
            status: 'succeeded',
          },
        },
      },
    });
    
    if (!appointment) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    if (appointment.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Appointment is not paid' },
        { status: 400 }
      );
    }
    
    const payment = appointment.payments[0];
    if (!payment) {
      return NextResponse.json(
        { message: 'No successful payment found' },
        { status: 400 }
      );
    }
    
    // Process refund with Stripe
    const refundAmount = amount || appointment.amount;
    const refund = await createRefund(payment.providerPaymentId, refundAmount);
    
    // Create refund payment record
    const refundPayment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        paymentProvider: 'STRIPE',
        providerPaymentId: refund.id,
        status: 'refunded',
        amount: refundAmount,
        currency: 'USD',
      },
    });
    
    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: refundAmount >= appointment.amount ? 'REFUNDED' : 'PAID',
        status: refundAmount >= appointment.amount ? 'CANCELLED' : appointment.status,
        cancelledAt: refundAmount >= appointment.amount ? new Date() : appointment.cancelledAt,
        cancellationReason: reason || 'Admin refund',
      },
    });
    
    return NextResponse.json({
      refund: refundPayment,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
