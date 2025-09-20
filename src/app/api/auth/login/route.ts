import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, createAuthResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIdOrEmail, password } = loginSchema.parse(body);
    
    // Find user by email or userId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userIdOrEmail },
          { userId: userIdOrEmail },
        ],
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate auth response
    const authResponse = createAuthResponse(user);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    
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
