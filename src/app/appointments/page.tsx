'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppointmentWithDetails } from '@/types';
import { addToast } from '@/components/ui/Toaster';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, filter]);

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/appointments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAppointments(data.data);
      } else {
        addToast({
          message: data.message || 'Failed to fetch appointments',
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

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          reason: 'Patient request',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast({
          message: 'Appointment cancelled successfully',
          type: 'success',
        });
        fetchAppointments();
      } else {
        addToast({
          message: data.message || 'Failed to cancel appointment',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Please log in to view your appointments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="mt-2 text-gray-600">Manage your upcoming and past appointments</p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'CONFIRMED'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'PENDING'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'CANCELLED'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.role === 'PATIENT' 
                            ? appointment.doctor.user.name 
                            : appointment.patient.name
                          }
                        </h3>
                        <p className="text-gray-600">
                          {user.role === 'PATIENT' 
                            ? appointment.doctor.specialties.join(', ')
                            : appointment.doctor.specialties.join(', ')
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">
                          {new Date(appointment.startAt).toLocaleDateString()} at{' '}
                          {new Date(appointment.startAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">30 minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{appointment.doctor.clinicAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fee</p>
                        <p className="font-medium">${appointment.amount}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                        {appointment.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {appointment.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="btn btn-danger text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <a
                      href={`/doctors/${appointment.doctorId}`}
                      className="btn btn-outline text-sm"
                    >
                      View Doctor
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
