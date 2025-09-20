import { NextRequest, NextResponse } from 'next/server';
import { cancelAppointmentSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { createRefund } from '@/lib/stripe';
import { sendCancellationNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const { id: appointmentId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { reason } = cancelAppointmentSchema.parse(body);
    
    // Get appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: {
          include: { user: true },
        },
        payments: true,
      },
    });
    
    if (!appointment) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    if (userRole === 'PATIENT' && appointment.patientId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (userRole === 'DOCTOR' && appointment.doctorId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Check if appointment can be cancelled
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { message: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }
    
    if (appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Cannot cancel completed appointment' },
        { status: 400 }
      );
    }
    
    // Calculate refund amount based on cancellation policy
    const hoursUntilAppointment = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    let refundAmount = 0;
    
    if (hoursUntilAppointment >= 24) {
      // Full refund if cancelled 24+ hours in advance
      refundAmount = appointment.amount;
    } else if (hoursUntilAppointment >= 2) {
      // 50% refund if cancelled 2-24 hours in advance
      refundAmount = appointment.amount * 0.5;
    }
    // No refund if cancelled less than 2 hours in advance
    
    // Process refund if applicable
    let refundId: string | null = null;
    if (refundAmount > 0 && appointment.paymentStatus === 'PAID') {
      try {
        const payment = appointment.payments.find(p => p.status === 'succeeded');
        if (payment) {
          const refund = await createRefund(payment.providerPaymentId, refundAmount);
          refundId = refund.id;
          
          // Create refund payment record
          await prisma.payment.create({
            data: {
              appointmentId: appointment.id,
              paymentProvider: 'STRIPE',
              providerPaymentId: refund.id,
              status: 'refunded',
              amount: refundAmount,
              currency: 'USD',
            },
          });
        }
      } catch (error) {
        console.error('Refund processing error:', error);
        // Continue with cancellation even if refund fails
      }
    }
    
    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        paymentStatus: refundAmount > 0 ? 'REFUNDED' : appointment.paymentStatus,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
    
    // Send cancellation notification
    await sendCancellationNotification(
      {
        type: 'booking_cancellation',
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: appointment.startAt.toLocaleString(),
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.user.name,
        clinicAddress: appointment.doctor.clinicAddress,
      },
      refundAmount
    );
    
    return NextResponse.json({
      appointment: updatedAppointment,
      refund: refundAmount > 0 ? {
        amount: refundAmount,
        refundId,
      } : null,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
