import { prisma } from './prisma';

const LOCK_DURATION_MINUTES = 10; // Lock slot for 10 minutes during booking process

export interface SlotLock {
  id: string;
  doctorId: string;
  startAt: Date;
  endAt: Date;
  expiresAt: Date;
}

export async function lockSlot(doctorId: string, startAt: Date, endAt: Date): Promise<{ success: boolean; lockId?: string; message: string }> {
  try {
    // Check if slot is already locked
    const existingLock = await prisma.appointmentLock.findFirst({
      where: {
        doctorId,
        startAt,
        endAt,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });
    
    if (existingLock) {
      return {
        success: false,
        message: 'This time slot is currently being booked by another user',
      };
    }
    
    // Check for overlapping confirmed appointments
    const overlappingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: 'CONFIRMED',
        OR: [
          {
            startAt: {
              lt: endAt,
            },
            endAt: {
              gt: startAt,
            },
          },
        ],
      },
    });
    
    if (overlappingAppointment) {
      return {
        success: false,
        message: 'This time slot is no longer available',
      };
    }
    
    // Create lock
    const lock = await prisma.appointmentLock.create({
      data: {
        doctorId,
        startAt,
        endAt,
        expiresAt: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
      },
    });
    
    return {
      success: true,
      lockId: lock.id,
      message: 'Slot locked successfully',
    };
  } catch (error) {
    console.error('Error locking slot:', error);
    return {
      success: false,
      message: 'Failed to lock slot. Please try again.',
    };
  }
}

export async function releaseSlot(lockId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.appointmentLock.delete({
      where: { id: lockId },
    });
    
    return {
      success: true,
      message: 'Slot released successfully',
    };
  } catch (error) {
    console.error('Error releasing slot:', error);
    return {
      success: false,
      message: 'Failed to release slot',
    };
  }
}

export async function cleanupExpiredLocks(): Promise<void> {
  try {
    await prisma.appointmentLock.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired locks:', error);
  }
}

export async function isSlotAvailable(doctorId: string, startAt: Date, endAt: Date): Promise<boolean> {
  try {
    // Check for active locks
    const activeLock = await prisma.appointmentLock.findFirst({
      where: {
        doctorId,
        startAt,
        endAt,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (activeLock) {
      return false;
    }
    
    // Check for confirmed appointments
    const confirmedAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: 'CONFIRMED',
        OR: [
          {
            startAt: {
              lt: endAt,
            },
            endAt: {
              gt: startAt,
            },
          },
        ],
      },
    });
    
    return !confirmedAppointment;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
}
