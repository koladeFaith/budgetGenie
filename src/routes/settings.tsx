import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Moon, Sun, Bell, Lock, User as UserIcon, Target, Coins } from "lucide-react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CURRENCY_SYMBOLS } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · KoboWise" }] }),
  component: () => <ProtectedLayout><SettingsPage /></ProtectedLayout>,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  avatar_url: z.string().trim().url().or(z.literal("")).optional(),
  currency: z.string().min(2).max(8),
  savings_goal: z.coerce.number().min(0).max(1_000_000_000),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(6, "At least 6 characters").max(72),
  confirm: z.string().min(6).max(72),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
type PasswordForm = z.infer<typeof passwordSchema>;

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", avatar_url: "", currency: "NGN", savings_goal: 0 },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? "",
        avatar_url: profile.avatar_url ?? "",
        currency: profile.currency,
        savings_goal: Number(profile.savings_goal),
      });
    }
  }, [profile, profileForm]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: data.full_name,
      avatar_url: data.avatar_url || null,
      currency: data.currency,
      savings_goal: data.savings_goal,
    }).eq("id", user!.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    await refreshProfile();
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password changed");
    passwordForm.reset({ password: "", confirm: "" });
  };

  const togglePref = async (key: "dark_mode" | "notifications_enabled" | "irregular_income", value: boolean) => {
    setSavingToggle(true);
    const update =
      key === "dark_mode" ? { dark_mode: value } :
      key === "notifications_enabled" ? { notifications_enabled: value } :
      { irregular_income: value };
    const { error } = await supabase.from("profiles").update(update).eq("id", user!.id);
    setSavingToggle(false);
    if (error) { toast.error(error.message); return; }
    if (key === "dark_mode" && typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", value);
    }
    toast.success("Preference updated");
    await refreshProfile();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile, preferences, and security.</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-teal" />
          <h3 className="font-semibold">Profile</h3>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-teal text-teal-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">{user?.email}</div>
            <div className="text-muted-foreground text-xs">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-NG") : "—"}</div>
          </div>
        </div>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...profileForm.register("full_name")} className="mt-1" />
              {profileForm.formState.errors.full_name && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input id="avatar_url" placeholder="https://..." {...profileForm.register("avatar_url")} className="mt-1" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Currency</Label>
              <Select value={profileForm.watch("currency")} onValueChange={(v) => profileForm.setValue("currency", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                    <SelectItem key={code} value={code}>{sym} · {code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="savings_goal" className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Monthly savings goal</Label>
              <Input id="savings_goal" type="number" step="0.01" {...profileForm.register("savings_goal")} className="mt-1" />
            </div>
          </div>
          <Button type="submit" disabled={savingProfile} className="bg-teal hover:bg-teal/90 text-teal-foreground">
            {savingProfile ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </section>

      {/* Preferences */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.dark_mode ? <Moon className="h-4 w-4 text-teal" /> : <Sun className="h-4 w-4 text-warning" />}
              <div>
                <Label className="text-sm">Dark mode</Label>
                <p className="text-xs text-muted-foreground">Easier on the eyes at night.</p>
              </div>
            </div>
            <Switch checked={!!profile?.dark_mode} disabled={savingToggle} onCheckedChange={(v) => togglePref("dark_mode", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-teal" />
              <div>
                <Label className="text-sm">Notifications</Label>
                <p className="text-xs text-muted-foreground">Get alerts for budget overruns and unusual spending.</p>
              </div>
            </div>
            <Switch checked={!!profile?.notifications_enabled} disabled={savingToggle} onCheckedChange={(v) => togglePref("notifications_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-4 w-4 text-teal" />
              <div>
                <Label className="text-sm">Irregular income mode</Label>
                <p className="text-xs text-muted-foreground">For freelancers, gig workers & contract staff. Uses a 3-month income average to compute a safe-to-spend amount instead of fixed monthly budgets.</p>
              </div>
            </div>
            <Switch checked={!!profile?.irregular_income} disabled={savingToggle} onCheckedChange={(v) => togglePref("irregular_income", v)} />
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-teal" />
          <h3 className="font-semibold">Change password</h3>
        </div>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...passwordForm.register("password")} className="mt-1" />
              {passwordForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{passwordForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Confirm</Label>
              <Input id="confirm" type="password" {...passwordForm.register("confirm")} className="mt-1" />
              {passwordForm.formState.errors.confirm && <p className="text-xs text-destructive mt-1">{passwordForm.formState.errors.confirm.message}</p>}
            </div>
          </div>
          <Button type="submit" disabled={savingPwd} variant="outline">
            {savingPwd ? "Updating..." : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
