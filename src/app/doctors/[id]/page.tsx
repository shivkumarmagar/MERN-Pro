'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DoctorWithProfile, AvailableSlots } from '@/types';
import { addToast } from '@/components/ui/Toaster';

export default function DoctorProfilePage() {
  const params = useParams();
  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<DoctorWithProfile | null>(null);
  const [availability, setAvailability] = useState<AvailableSlots[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading doctor profile...</p>
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
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Info */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary-600">
                    {doctor.name.charAt(0)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{doctor.name}</h1>
                <p className="text-gray-600">{doctor.doctorProfile.specialties.join(', ')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Consultation Fee</h3>
                  <p className="text-2xl font-bold text-primary-600">
                    ${doctor.doctorProfile.consultationFee}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600">{doctor.doctorProfile.clinicAddress}</p>
                </div>

                {doctor.doctorProfile.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600">{doctor.doctorProfile.bio}</p>
                  </div>
                )}

                <a
                  href={`/doctors/${doctorId}/book`}
                  className="w-full btn btn-primary text-center block"
                >
                  Book Appointment
                </a>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Available Times</h2>
              
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

              {selectedDate && availability.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Available slots for {new Date(selectedDate).toLocaleDateString()}
                  </h3>
                  
                  {availability[0].slots.length === 0 ? (
                    <p className="text-gray-500">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availability[0].slots.map((slot, index) => (
                        <button
                          key={index}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                            slot.available
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
