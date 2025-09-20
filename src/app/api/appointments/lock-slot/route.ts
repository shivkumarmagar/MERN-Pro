import { NextRequest, NextResponse } from 'next/server';
import { lockSlotSchema } from '@/lib/validation';
import { lockSlot } from '@/lib/slot-locking';

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
    const { doctorId, startAt, endAt } = lockSlotSchema.parse(body);
    
    const startDateTime = new Date(startAt);
    const endDateTime = new Date(endAt);
    
    // Lock the slot
    const lockResult = await lockSlot(doctorId, startDateTime, endDateTime);
    
    if (!lockResult.success) {
      return NextResponse.json(
        { message: lockResult.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Slot locked successfully',
      lockId: lockResult.lockId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });
  } catch (error) {
    console.error('Lock slot error:', error);
    
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
