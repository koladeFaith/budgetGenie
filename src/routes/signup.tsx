import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account · budgetGenie" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => { if (!authLoading && user) navigate({ to: "/dashboard" }); }, [authLoading, user, navigate]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: data.full_name },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Welcome to budgetGenie.");
    navigate({ to: "/dashboard" });
  };

  const signUpWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.redirected) return;
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-brand items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,_white,_transparent_50%)]" />
        <div className="relative max-w-md text-white">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-8 w-8" />
            <span className="text-2xl font-bold">budgetGenie</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight">Start your journey to financial clarity.</h2>
          <ul className="mt-6 space-y-2 text-white/80 text-sm">
            <li>✓ Auto-categorized transactions</li>
            <li>✓ Real-time budget tracking</li>
            <li>✓ AI insights & forecasts</li>
            <li>✓ Free forever — Naira-first</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">budgetGenie</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Free to start. No credit card required.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} className="mt-1" />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} className="mt-1" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} className="mt-1" />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-navy hover:bg-navy/90 text-navy-foreground">
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>


          <p className="text-sm text-center mt-6 text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-teal font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
