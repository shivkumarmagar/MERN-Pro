import { prisma } from './prisma';
import { TimeSlot, AvailableSlots } from '@/types';
import { DayOfWeek } from '@prisma/client';

export async function generateAvailableSlots(
  doctorId: string,
  date: string, // YYYY-MM-DD format
  timezone: string = 'UTC'
): Promise<AvailableSlots> {
  try {
    const targetDate = new Date(date);
    const dayOfWeek = getDayOfWeek(targetDate);
    
    // Get doctor's availability for this day
    const availability = await prisma.availability.findMany({
      where: {
        doctorId,
        isActive: true,
        OR: [
          { dayOfWeek },
          { date: targetDate }, // Specific date exceptions
        ],
      },
    });
    
    if (availability.length === 0) {
      return { date, slots: [] };
    }
    
    // Get existing appointments for this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'CONFIRMED',
        startAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    // Generate all possible slots
    const allSlots: TimeSlot[] = [];
    
    for (const avail of availability) {
      const slots = generateSlotsForAvailability(
        avail.startTime,
        avail.endTime,
        avail.slotDurationMins,
        targetDate,
        existingAppointments
      );
      allSlots.push(...slots);
    }
    
    // Remove duplicates and sort by time
    const uniqueSlots = allSlots
      .filter((slot, index, self) => 
        index === self.findIndex(s => s.start === slot.start)
      )
      .sort((a, b) => a.start.localeCompare(b.start));
    
    return {
      date,
      slots: uniqueSlots,
    };
  } catch (error) {
    console.error('Error generating available slots:', error);
    return { date, slots: [] };
  }
}

function generateSlotsForAvailability(
  startTime: string,
  endTime: string,
  slotDurationMins: number,
  date: Date,
  existingAppointments: any[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  let currentTime = start;
  
  while (currentTime < end) {
    const slotStart = formatTime(currentTime);
    const slotEnd = formatTime(addMinutes(currentTime, slotDurationMins));
    
    // Check if this slot conflicts with existing appointments
    const slotStartDateTime = new Date(date);
    slotStartDateTime.setHours(currentTime.hours, currentTime.minutes, 0, 0);
    
    const slotEndDateTime = new Date(date);
    slotEndDateTime.setHours(
      addMinutes(currentTime, slotDurationMins).hours,
      addMinutes(currentTime, slotDurationMins).minutes,
      0,
      0
    );
    
    const isBooked = existingAppointments.some(appointment => {
      return (
        (slotStartDateTime >= appointment.startAt && slotStartDateTime < appointment.endAt) ||
        (slotEndDateTime > appointment.startAt && slotEndDateTime <= appointment.endAt) ||
        (slotStartDateTime <= appointment.startAt && slotEndDateTime >= appointment.endAt)
      );
    });
    
    slots.push({
      start: slotStart,
      end: slotEnd,
      available: !isBooked,
    });
    
    currentTime = addMinutes(currentTime, slotDurationMins);
  }
  
  return slots;
}

function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return days[date.getDay()];
}

function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

function formatTime(time: { hours: number; minutes: number }): string {
  return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
}

function addMinutes(time: { hours: number; minutes: number }, minutes: number): { hours: number; minutes: number } {
  const totalMinutes = time.hours * 60 + time.minutes + minutes;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export async function getDoctorAvailability(
  doctorId: string,
  startDate: string,
  endDate: string
): Promise<AvailableSlots[]> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const results: AvailableSlots[] = [];
    
    // Generate slots for each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      const slots = await generateAvailableSlots(doctorId, dateString);
      results.push(slots);
    }
    
    return results;
  } catch (error) {
    console.error('Error getting doctor availability:', error);
    return [];
  }
}
