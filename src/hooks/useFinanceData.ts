import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Transaction, Category, Budget, CategoryCorrection } from "@/lib/types";

export function useCorrections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["corrections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_corrections")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as CategoryCorrection[];
    },
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useBudgets(year?: number, month?: number) {
  const { user } = useAuth();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  return useQuery({
    queryKey: ["budgets", user?.id, y, m],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("year", y)
        .eq("month", m);
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });
}
