import { NextRequest, NextResponse } from 'next/server';
import { searchDoctorsSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/distance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      specialty: searchParams.get('specialty') || undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      radiusKm: searchParams.get('radiusKm') ? parseFloat(searchParams.get('radiusKm')!) : 50,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
    
    const validatedParams = searchDoctorsSchema.parse(params);
    const { specialty, lat, lng, radiusKm, q, page, limit } = validatedParams;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      role: 'DOCTOR',
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
    
    // Get doctors with their profiles
    const doctors = await prisma.user.findMany({
      where,
      include: {
        doctorProfile: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter by location and calculate distances
    let filteredDoctors = doctors;
    if (lat && lng) {
      filteredDoctors = doctors
        .filter(doctor => {
          if (!doctor.doctorProfile) return false;
          
          const distance = calculateDistance(
            lat,
            lng,
            doctor.doctorProfile.clinicLat,
            doctor.doctorProfile.clinicLng
          );
          
          return distance <= radiusKm;
        })
        .map(doctor => ({
          ...doctor,
          distance: calculateDistance(
            lat,
            lng,
            doctor.doctorProfile!.clinicLat,
            doctor.doctorProfile!.clinicLng
          ),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where });
    
    return NextResponse.json({
      data: filteredDoctors,
      pagination: {
        page,
        limit,
        total: filteredDoctors.length,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search doctors error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid search parameters', errors: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
