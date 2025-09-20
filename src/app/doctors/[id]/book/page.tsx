'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { DoctorWithProfile, AvailableSlots } from '@/types';
import { addToast } from '@/components/ui/Toaster';

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const doctorId = params.id as string;
  
  const [doctor, setDoctor] = useState<DoctorWithProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availability, setAvailability] = useState<AvailableSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId, user, router]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchAvailability();
    }
  }, [doctorId, selectedDate]);

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data = await response.json();

      if (response.ok) {
        setDoctor(data);
      } else {
        addToast({
          message: data.message || 'Failed to fetch doctor profile',
          type: 'error',
        });
        router.push('/doctors');
      }
    } catch (error) {
      addToast({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/availability?date=${selectedDate}`);
      const data = await response.json();

      if (response.ok) {
        setAvailability([data]);
      } else {
        addToast({
          message: data.message || 'Failed to fetch availability',
          type: 'error',
        });
      }
    } catch (error) {
      addToast({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !doctor) {
      addToast({
        message: 'Please select a date and time slot',
        type: 'error',
      });
      return;
    }

    setBooking(true);

    try {
      // Parse the selected slot time
      const [startTime] = selectedSlot.split(' - ');
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes

      // Lock the slot first
      const lockResponse = await fetch('/api/appointments/lock-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          doctorId,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
        }),
      });

      if (!lockResponse.ok) {
        const lockData = await lockResponse.json();
        addToast({
          message: lockData.message || 'Failed to lock slot',
          type: 'error',
        });
        return;
      }

      // Book the appointment
      const bookResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          doctorId,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          paymentMethod: 'card',
        }),
      });

      const bookData = await bookResponse.json();

      if (bookResponse.ok) {
        addToast({
          message: 'Appointment booked successfully! Redirecting to payment...',
          type: 'success',
        });
        
        // In a real app, you would redirect to Stripe Checkout or handle payment
        // For now, we'll just redirect to appointments page
        router.push('/appointments');
      } else {
        addToast({
          message: bookData.message || 'Failed to book appointment',
          type: 'error',
        });
      }
    } catch (error) {
      addToast({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor || !doctor.doctorProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Doctor not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>
          
          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{doctor.name}</h2>
            <p className="text-gray-600">{doctor.doctorProfile.specialties.join(', ')}</p>
            <p className="text-primary-600 font-semibold">${doctor.doctorProfile.consultationFee}</p>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label htmlFor="date" className="form-label">
              Select Date
            </label>
            <input
              type="date"
              id="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && availability.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Time Slots
              </h3>
              
              {availability[0].slots.length === 0 ? (
                <p className="text-gray-500">No available slots for this date</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availability[0].slots.map((slot, index) => (
                    <button
                      key={index}
                      disabled={!slot.available}
                      onClick={() => handleSlotSelect(slot.start + ' - ' + slot.end)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        slot.available
                          ? selectedSlot === slot.start + ' - ' + slot.end
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedSlot}</p>
              <p><strong>Duration:</strong> 30 minutes</p>
              <p><strong>Fee:</strong> ${doctor.doctorProfile.consultationFee}</p>
            </div>
          )}

          {/* Book Button */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.back()}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleBooking}
              disabled={!selectedDate || !selectedSlot || booking}
              className="btn btn-primary flex-1"
            >
              {booking ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
