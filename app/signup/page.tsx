"use client";
import Link from "next/link";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-brand items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,_white,_transparent_50%)]" />
        <div className="relative max-w-md text-white">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">KoboWise</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Start your journey to financial clarity.
          </h2>
          <ul className="mt-6 space-y-2 text-white/80 text-sm">
            <li>✓ Auto-categorized transactions</li>
            <li>✓ Real-time budget tracking</li>
            <li>✓ AI insights & forecasts</li>
            <li>✓ Free forever — Naira-first</li>
          </ul>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">KoboWise</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Free to start. No credit card required.
          </p>

          <form className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm text-muted-foreground mb-1">Full name</label>
              <Input id="full_name" placeholder="Enter your full name" className="mt-1" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm text-muted-foreground mb-1">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-muted-foreground mb-1">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold transition">
              Create account
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR{" "}
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>
          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <Link
              href="/login"
              className="text-teal-600 ml-1 cursor-pointer hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
