"use client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen  text-gray-900">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 border-b border-border ${
          scrolled ? "backdrop-blur-md bg-teal/70 shadow-md" : "bg-teal/90"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm-px-8 lg:px-16">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2 ">
              <Sparkles className="h-8 w-8 bg-teal-700 p-2 text-white  rounded-lg" />
              <span className="text-2xl font-bold">budgetGenie</span>
            </div>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis animi porro molestias qui, nihil consequuntur impedit iure vitae in! Illo ex magni nihil culpa eius sequi consequuntur sint qui blanditiis?
            <div className="hidden lg:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-teal-600">
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-teal-600">
                How It Works
              </a>
            </div>

            <div className="hidden lg:flex space-x-4">
              <Link
                href="/login"
                className="text-teal-600 border border-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 cursor-pointer">
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 cursor-pointer">
                Sign Up
              </Link>
            </div>

            <Button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}>
              {isMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </Button>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md">
              <div className="px-4 py-8 space-y-4">
                <a
                  href="#features"
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-teal-50 rounded-lg hover:bg-teal-100 hover:text-teal-600 transition-all duration-200 cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}>
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-teal-50 rounded-lg hover:bg-teal-100 hover:text-teal-600 transition-all duration-200 cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}>
                  How It Works
                </a>

                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="w-full text-teal-600 border border-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Hero Section */}
      <section className="bg-linear-to-br from-teal-50 to-white pt-22 lg:pt-35 pb-20">
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-gray-600 mb-6 ">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            Built for urban Nigeria · Naira-first
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm-px-8 lg:px-16 lg:pt-10 ">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 ">
                Take Control of Your Naira with Smart AI Budgeting
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                budgetGenie tracks your income and spending, flags unusual
                transactions, predicts next month&apos;s expenses, and gives you
                smart insights — all in ₦.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-teal-700 transition-colors cursor-pointer">
                  Get Started. It&apos;s free
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                {/* Mockup Dashboard */}
                <Image
                  src="/Screenshot 2026-03-18 130118.png"
                  alt="Dashboard Preview"
                  width={450}
                  height={240}
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className=" py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm-px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Smart Budgeting
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage your finances effectively
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Expense Tracking
              </h3>
              <p className="text-gray-600">
                Automatically categorize and track your expenses with AI-powered
                recognition.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Budget Suggestions
              </h3>
              <p className="text-gray-600">
                Get personalized budget recommendations based on your spending
                patterns and goals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600">
                View detailed charts and insights about your financial health in
                real-time.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your financial data is encrypted and protected with bank-level
                security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-15 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm-px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sign Up
              </h3>
              <p className="text-gray-600">
                Create your free account and connect your financial accounts
                securely.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Add Income & Expenses
              </h3>
              <p className="text-gray-600">
                Input your income sources and track your daily expenses
                automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get AI Insights
              </h3>
              <p className="text-gray-600">
                Receive personalized recommendations and track your financial
                progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm-px-8 lg:px-16">
          <div className="border-t border-gray-800 mt-6 pt-8 text-center text-sm text-muted-foreground ">
            © {new Date().getFullYear()} budgetGenie · Built with care for
            Nigerian urban life
          </div>
        </div>
      </footer>
    </div>
  );
}
