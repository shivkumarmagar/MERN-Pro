'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppointmentWithDetails } from '@/types';
import { addToast } from '@/components/ui/Toaster';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchStats();
      fetchAppointments();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        addToast({
          message: data.message || 'Failed to fetch stats',
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

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/admin/appointments', {
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

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Access denied. Admin privileges required.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage appointments, users, and system statistics</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Appointments
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Total Appointments</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.overview.totalAppointments}</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Confirmed</h3>
                <p className="text-3xl font-bold text-green-600">{stats.overview.confirmedAppointments}</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-primary-600">${stats.overview.totalRevenue}</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900">Total Patients</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.overview.totalPatients}</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Status</h3>
                <div className="space-y-2">
                  {stats.appointmentsByStatus.map((item: any) => (
                    <div key={item.status} className="flex justify-between">
                      <span className="text-gray-600">{item.status}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
                <div className="space-y-2">
                  {stats.revenueByMonth.slice(-6).map((item: any) => (
                    <div key={item.month} className="flex justify-between">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-semibold">${item.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
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
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.patient.name} → {appointment.doctor.user.name}
                            </h3>
                            <p className="text-gray-600">{appointment.doctor.specialties.join(', ')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium">${appointment.amount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
