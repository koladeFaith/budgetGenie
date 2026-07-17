import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sparkles, TrendingUp, ShieldCheck, Brain, BarChart3, PiggyBank, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "budgetGenie — AI budgeting in ₦ for urban Nigeria" },
      { name: "description", content: "Track spending, set budgets, and get AI insights tailored to life in urban Nigeria. Built for young adults who want financial clarity in ₦." },
      { property: "og:title", content: "budgetGenie — AI budgeting in ₦" },
      { property: "og:description", content: "Track spending, set budgets, and get AI-driven insights in Naira." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">budgetGenie</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-teal hover:bg-teal/90 text-teal-foreground">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
          Built for urban Nigeria · Naira-first
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Take control of your <span className="text-gradient-brand">Naira</span>.
          <br />Powered by AI.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          budgetGenie tracks your income and spending, flags unusual transactions,
          predicts next month's expenses, and gives you smart insights — all in ₦.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-navy hover:bg-navy/90 text-navy-foreground gap-2">
            <Link to="/signup">Start tracking free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Brain, title: "AI auto-categorization", body: "Type 'Bolt to Lekki' and we categorize it as Transportation instantly." },
            { icon: TrendingUp, title: "Predictive forecast", body: "See where your spending is heading using your last 3 months of history." },
            { icon: BarChart3, title: "Anomaly detection", body: "Get flagged when a transaction is more than 2× your usual spend." },
            { icon: PiggyBank, title: "Budgets that adapt", body: "Set monthly limits per category and watch progress in real time." },
            { icon: ShieldCheck, title: "Bank-grade security", body: "Row-level security means only you can see your data — ever." },
            { icon: Sparkles, title: "Personalized insights", body: "Get sentences like 'You spent 40% more on Food this month.'" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition">
              <div className="h-10 w-10 rounded-lg bg-mint flex items-center justify-center text-teal mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} budgetGenie · Built with care for Nigerian urban life
      </footer>
    </div>
  );
}
