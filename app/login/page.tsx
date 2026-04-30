"use client";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-100 via-teal-50 to-teal-200 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-teal-600">budgetGenie</h1>
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
            <Input
              type="email"
              placeholder="example@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>

            <div className="relative w-full">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="pr-10"
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
            <Link href="#" className="text-xs text-teal-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <Button
            type="button"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold transition">
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?
          <Link href="/signup" className="text-blue-600 ml-1 hover:underline">
            Sign Upteal
          </Link>
        </div>
      </div>
    </div>
  );
}
