import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 401 }
      );
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({
      accessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
