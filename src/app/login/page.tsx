'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { login } from './actions';
import { useSearchParams } from 'next/navigation';

const testimonials = [
  {
    quote: "Velloa has revolutionized how we manage our properties. From rent collection to maintenance tracking, everything is streamlined in one powerful platform.",
    author: "David Thompson",
    title: "Property Manager"
  },
  {
    quote: "The automated payment system and financial reporting have saved us countless hours. It's transformed how we handle our portfolio of properties.",
    author: "Jennifer Martinez",
    title: "Property Management Director"
  },
  {
    quote: "Communication with tenants has never been more efficient. The maintenance request system and automated notifications keep everyone in the loop.",
    author: "Robert Wilson",
    title: "Property Operations Manager"
  }
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  // Check for error message in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Green section */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 text-white p-8 flex-col justify-between">
        <div>
          <div className="relative h-12 w-48">
            <Image 
              src="/FF_VELLOA_white.png"
              alt="Velloa Logo"
              width={500}
              height={500}
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Single Testimonial Section */}
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-lg italic">
              &quot;{testimonials[0].quote}&quot;
            </p>
            <p className="text-sm font-medium">- {testimonials[0].author}, {testimonials[0].title}</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        <Link
          href="/"
          className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-800"
        >
        </Link>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
          <p className="text-gray-600 mb-8">Enter your credentials below to sign in</p>

          <form action={login}>
            {error && (
              <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Sign in
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-green-600 hover:text-green-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}