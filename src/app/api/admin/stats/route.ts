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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.startAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    // Get various statistics
    const [
      totalAppointments,
      confirmedAppointments,
      cancelledAppointments,
      completedAppointments,
      totalRevenue,
      totalRefunds,
      totalPatients,
      totalDoctors,
      appointmentsByStatus,
      revenueByMonth,
    ] = await Promise.all([
      // Total appointments
      prisma.appointment.count({ where: dateFilter }),
      
      // Confirmed appointments
      prisma.appointment.count({
        where: {
          ...dateFilter,
          status: 'CONFIRMED',
        },
      }),
      
      // Cancelled appointments
      prisma.appointment.count({
        where: {
          ...dateFilter,
          status: 'CANCELLED',
        },
      }),
      
      // Completed appointments
      prisma.appointment.count({
        where: {
          ...dateFilter,
          status: 'COMPLETED',
        },
      }),
      
      // Total revenue
      prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          ...(startDate && endDate ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          } : {}),
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Total refunds
      prisma.payment.aggregate({
        where: {
          status: 'refunded',
          ...(startDate && endDate ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          } : {}),
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Total patients
      prisma.user.count({
        where: {
          role: 'PATIENT',
        },
      }),
      
      // Total doctors
      prisma.user.count({
        where: {
          role: 'DOCTOR',
        },
      }),
      
      // Appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: {
          id: true,
        },
      }),
      
      // Revenue by month (last 12 months)
      prisma.payment.groupBy({
        by: ['createdAt'],
        where: {
          status: 'succeeded',
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // Last 12 months
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);
    
    // Calculate net revenue
    const netRevenue = (totalRevenue._sum.amount || 0) - (totalRefunds._sum.amount || 0);
    
    // Calculate conversion rates
    const confirmationRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
    
    return NextResponse.json({
      overview: {
        totalAppointments,
        confirmedAppointments,
        cancelledAppointments,
        completedAppointments,
        totalPatients,
        totalDoctors,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalRefunds: totalRefunds._sum.amount || 0,
        netRevenue,
        confirmationRate: Math.round(confirmationRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
      appointmentsByStatus: appointmentsByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
      revenueByMonth: revenueByMonth.map(item => ({
        month: item.createdAt.toISOString().substring(0, 7), // YYYY-MM format
        revenue: item._sum.amount || 0,
        transactions: item._count.id,
      })),
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
