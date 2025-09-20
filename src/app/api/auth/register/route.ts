import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, password } = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { userId },
        ],
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or user ID already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        userId,
        name,
        email,
        passwordHash,
      },
    });
    
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
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
