'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { User } from '@/types';

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              DoctorApp
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/doctors" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
              Find Doctors
            </Link>
            {user && (
              <>
                <Link href="/appointments" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  My Appointments
                </Link>
                {user.role === 'DOCTOR' && (
                  <Link href="/doctor/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/doctors"
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Doctors
              </Link>
              {user && (
                <>
                  <Link
                    href="/appointments"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Appointments
                  </Link>
                  {user.role === 'DOCTOR' && (
                    <Link
                      href="/doctor/dashboard"
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
