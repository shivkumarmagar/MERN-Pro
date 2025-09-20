import { NextRequest, NextResponse } from 'next/server';
import { bookAppointmentSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { createPaymentIntent } from '@/lib/stripe';
import { isSlotAvailable } from '@/lib/slot-locking';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { doctorId, startAt, endAt, paymentMethod } = bookAppointmentSchema.parse(body);
    
    const startDateTime = new Date(startAt);
    const endDateTime = new Date(endAt);
    
    // Verify slot is still available
    const isAvailable = await isSlotAvailable(doctorId, startDateTime, endDateTime);
    
    if (!isAvailable) {
      return NextResponse.json(
        { message: 'This time slot is no longer available' },
        { status: 400 }
      );
    }
    
    // Get doctor profile to get consultation fee
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });
    
    if (!doctorProfile) {
      return NextResponse.json(
        { message: 'Doctor not found' },
        { status: 404 }
      );
    }
    
    // Create appointment in database
    const appointment = await prisma.appointment.create({
      data: {
        patientId: userId,
        doctorId,
        startAt: startDateTime,
        endAt: endDateTime,
        amount: doctorProfile.consultationFee,
        currency: 'USD',
      },
    });
    
    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount: doctorProfile.consultationFee,
      currency: 'USD',
      appointmentId: appointment.id,
      patientId: userId,
      doctorId,
    });
    
    // Store payment record
    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        paymentProvider: 'STRIPE',
        providerPaymentId: paymentIntent.id,
        status: 'pending',
        amount: doctorProfile.consultationFee,
        currency: 'USD',
      },
    });
    
    return NextResponse.json({
      appointment,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    // Build where clause based on user role
    let where: any = {};
    
    if (userRole === 'PATIENT') {
      where.patientId = userId;
    } else if (userRole === 'DOCTOR') {
      where.doctorId = userId;
    }
    // Admin can see all appointments
    
    if (status) {
      where.status = status;
    }
    
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          doctor: {
            include: { user: true },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { startAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);
    
    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
