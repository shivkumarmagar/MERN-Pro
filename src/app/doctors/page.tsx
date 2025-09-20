'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DoctorSearchResult } from '@/types';
import { addToast } from '@/components/ui/Toaster';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    specialty: '',
    q: '',
    lat: '',
    lng: '',
    radiusKm: '50',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchDoctors();
  }, [searchParams, pagination.page]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...searchParams,
      });

      const response = await fetch(`/api/doctors/search?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDoctors(data.data);
        setPagination(data.pagination);
      } else {
        addToast({
          message: data.message || 'Failed to fetch doctors',
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDoctors();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchParams(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchParams(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          addToast({
            message: 'Unable to get your location',
            type: 'error',
          });
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="q" className="form-label">
                  Search
                </label>
                <input
                  type="text"
                  name="q"
                  id="q"
                  className="input"
                  placeholder="Doctor name or specialty"
                  value={searchParams.q}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="specialty" className="form-label">
                  Specialty
                </label>
                <select
                  name="specialty"
                  id="specialty"
                  className="input"
                  value={searchParams.specialty}
                  onChange={handleInputChange}
                >
                  <option value="">All Specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="General Practice">General Practice</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="radiusKm" className="form-label">
                  Radius (km)
                </label>
                <select
                  name="radiusKm"
                  id="radiusKm"
                  className="input"
                  value={searchParams.radiusKm}
                  onChange={handleInputChange}
                >
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn btn-outline w-full"
                >
                  Use My Location
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-500">Searching for doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No doctors found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {pagination.total} doctors found
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: DoctorSearchResult }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {doctor.user.name}
          </h3>
          <p className="text-sm text-gray-600">
            {doctor.specialties.join(', ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary-600">
            ${doctor.consultationFee}
          </p>
              {doctor.distance && (
                <p className="text-sm text-gray-500">
                  {doctor.distance.distance.toFixed(1)} km away
                </p>
              )}
        </div>
      </div>
      
      {doctor.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {doctor.bio}
        </p>
      )}
      
      <div className="text-sm text-gray-500 mb-4">
        <p className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {doctor.clinicAddress}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <a
          href={`/doctors/${doctor.id}`}
          className="flex-1 btn btn-outline text-center"
        >
          View Profile
        </a>
        <a
          href={`/doctors/${doctor.id}/book`}
          className="flex-1 btn btn-primary text-center"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}
