import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (startDate && endDate) {
      where.startAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
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
    console.error('Get admin appointments error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
