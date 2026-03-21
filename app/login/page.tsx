"use client";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 via-blue-50 to-blue-200 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">budgetGenie</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Google Sign In */}
        <button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition mb-5">
          <Image
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
            width={20}
            height={20}
          />
          <span className="text-sm font-medium text-gray-700">
            Continue with Google
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center mb-5">
          <div className="grow border-t"></div>
          <span className="px-3 text-xs text-gray-400">OR</span>
          <div className="grow border-t"></div>
        </div>

        {/* Form */}
        <form className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>

            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link href="#" className="text-xs text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition">
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?
          <Link href="/signup" className="text-blue-600 ml-1 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
