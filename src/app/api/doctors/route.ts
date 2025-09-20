import { NextRequest, NextResponse } from 'next/server';
import { createDoctorProfileSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

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
    const data = createDoctorProfileSchema.parse(body);
    
    // Check if user already has a doctor profile
    const existingProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });
    
    if (existingProfile) {
      return NextResponse.json(
        { message: 'Doctor profile already exists' },
        { status: 400 }
      );
    }
    
    // Create doctor profile
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId,
        ...data,
      },
      include: {
        user: true,
      },
    });
    
    return NextResponse.json(doctorProfile);
  } catch (error) {
    console.error('Create doctor profile error:', error);
    
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
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusKm = searchParams.get('radiusKm');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      doctorProfile: {
        isNot: null,
      },
    };
    
    if (specialty) {
      where.doctorProfile = {
        ...where.doctorProfile,
        specialties: {
          has: specialty,
        },
      };
    }
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { doctorProfile: { bio: { contains: q, mode: 'insensitive' } } },
      ];
    }
    
    // Get doctors
    const [doctors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          doctorProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    
    // Filter by location if provided
    let filteredDoctors = doctors;
    if (lat && lng && radiusKm) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radius = parseFloat(radiusKm);
      
      filteredDoctors = doctors.filter(doctor => {
        if (!doctor.doctorProfile) return false;
        
        const distance = calculateDistance(
          userLat,
          userLng,
          doctor.doctorProfile.clinicLat,
          doctor.doctorProfile.clinicLng
        );
        
        return distance <= radius;
      });
    }
    
    return NextResponse.json({
      data: filteredDoctors,
      pagination: {
        page,
        limit,
        total: filteredDoctors.length,
        totalPages: Math.ceil(filteredDoctors.length / limit),
      },
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance (moved from distance.ts for this context)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
