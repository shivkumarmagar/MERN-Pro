import { NextRequest, NextResponse } from 'next/server';
import { createAvailabilitySchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { generateAvailableSlots } from '@/lib/slot-generation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id: doctorId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user owns this doctor profile
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        id: doctorId,
        userId,
      },
    });
    
    if (!doctorProfile) {
      return NextResponse.json(
        { message: 'Doctor profile not found or access denied' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const data = createAvailabilitySchema.parse(body);
    
    // Create availability
    const availability = await prisma.availability.create({
      data: {
        doctorId,
        ...data,
      },
    });
    
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Create availability error:', error);
    
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: doctorId } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      // Return all availability for the doctor
      const availability = await prisma.availability.findMany({
        where: {
          doctorId,
          isActive: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      });
      
      return NextResponse.json(availability);
    }
    
    // Generate available slots for specific date
    const availableSlots = await generateAvailableSlots(doctorId, date);
    
    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Get availability error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
