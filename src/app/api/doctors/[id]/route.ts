import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const doctor = await prisma.user.findUnique({
      where: { id },
      include: {
        doctorProfile: true,
      },
    });
    
    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json(
        { message: 'Doctor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = params;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user owns this doctor profile
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        id,
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
    const { bio, specialties, clinicAddress, clinicLat, clinicLng, consultationFee, timezone } = body;
    
    // Update doctor profile
    const updatedProfile = await prisma.doctorProfile.update({
      where: { id },
      data: {
        bio,
        specialties,
        clinicAddress,
        clinicLat,
        clinicLng,
        consultationFee,
        timezone,
      },
      include: {
        user: true,
      },
    });
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Update doctor profile error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
