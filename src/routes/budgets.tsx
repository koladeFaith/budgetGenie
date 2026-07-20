import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useTransactions, useCategories, useBudgets } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { categoryTotals, inMonth } from "@/lib/analytics";
import { formatMoney, monthLabel } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Budgets · budgetGenie" }] }),
  component: () => (
    <ProtectedLayout>
      <BudgetsPage />
    </ProtectedLayout>
  ),
});

const schema = z.object({
  category_id: z.string().min(1, "Pick a category"),
  monthly_limit: z.coerce.number().positive("Must be positive").max(1_000_000_000),
});
type FormData = z.infer<typeof schema>;

function BudgetsPage() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? "NGN";
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets(year, month);
  const { data: txns = [] } = useTransactions();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    category_id: string;
    monthly_limit: number;
  } | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const monthExpenseTotals = useMemo(() => {
    const monthTxns = txns.filter((t) => inMonth(t, year, month));
    return categoryTotals(monthTxns, "expense");
  }, [txns, year, month]);

  const expenseCats = categories.filter((c) => c.name !== "Income");
  const usedCatIds = new Set(budgets.map((b) => b.category_id));
  const availableCats = expenseCats.filter((c) => !usedCatIds.has(c.id));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category_id: "", monthly_limit: 0 },
  });
  const watchedCat = watch("category_id");

  const handleAdd = () => {
    setEditing(null);
    reset({ category_id: "", monthly_limit: 0 });
    setOpen(true);
  };

  const handleEdit = (b: { id: string; category_id: string; monthly_limit: number }) => {
    setEditing(b);
    reset({ category_id: b.category_id, monthly_limit: Number(b.monthly_limit) });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      user_id: user!.id,
      category_id: data.category_id,
      monthly_limit: data.monthly_limit,
      month,
      year,
    };
    const op = editing
      ? supabase.from("budgets").update(payload).eq("id", editing.id)
      : supabase.from("budgets").upsert(payload, { onConflict: "user_id,category_id,month,year" });
    const { error } = await op;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Budget saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["budgets", user!.id, year, month] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Budget removed");
    qc.invalidateQueries({ queryKey: ["budgets", user!.id, year, month] });
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + (monthExpenseTotals[b.category_id] ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Set monthly spending limits and stay in control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {new Date(2000, i, 1).toLocaleDateString("en-NG", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={availableCats.length === 0 && !editing}
            className="bg-teal hover:bg-teal/90 text-teal-foreground"
          >
            <Plus className="h-4 w-4 mr-1" /> New budget
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-navy to-teal text-white p-6">
        <div className="text-sm opacity-80 mb-1">{monthLabel(year, month)} · Total budget</div>
        <div className="text-3xl font-bold">{formatMoney(totalBudget, currency)}</div>
        <div className="mt-3 text-sm opacity-80">
          Spent {formatMoney(totalSpent, currency)} so far
          {totalBudget > 0 && ` · ${Math.round((totalSpent / totalBudget) * 100)}% used`}
        </div>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No budgets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first budget to start tracking spending limits.
          </p>
          <Button onClick={handleAdd} className="bg-teal hover:bg-teal/90 text-teal-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add budget
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const cat = catMap.get(b.category_id);
            const spent = monthExpenseTotals[b.category_id] ?? 0;
            const limit = Number(b.monthly_limit);
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const status =
              pct >= 100 ? "exceeded" : pct >= 90 ? "danger" : pct >= 70 ? "warning" : "safe";
            return (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-card p-5 group hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${cat?.color ?? "#028090"}20`,
                        color: cat?.color ?? "#028090",
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{cat?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{monthLabel(year, month)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 border border-border bg-background/90 text-foreground shadow-sm hover:bg-muted"
                      onClick={() =>
                        handleEdit({ id: b.id, category_id: b.category_id, monthly_limit: limit })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 border border-border bg-background/90 text-destructive shadow-sm hover:bg-muted"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                  <span>{formatMoney(spent, currency)} spent</span>
                  <span>{formatMoney(limit, currency)} limit</span>
                </div>
                <Progress
                  value={Math.min(100, pct)}
                  className={cn(
                    "h-2.5",
                    status === "exceeded" || status === "danger"
                      ? "[&>div]:bg-destructive"
                      : status === "warning"
                        ? "[&>div]:bg-warning"
                        : "[&>div]:bg-success",
                  )}
                />
                <div className="mt-2 flex justify-between items-center text-xs">
                  <span
                    className={cn(
                      "font-semibold",
                      status === "exceeded" || status === "danger"
                        ? "text-destructive"
                        : status === "warning"
                          ? "text-warning"
                          : "text-success",
                    )}
                  >
                    {Math.round(pct)}% used
                  </span>
                  <span className="text-muted-foreground">
                    {limit - spent > 0
                      ? `${formatMoney(limit - spent, currency)} left`
                      : `${formatMoney(spent - limit, currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit budget" : "New monthly budget"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select
                value={watchedCat}
                onValueChange={(v) => setValue("category_id", v)}
                disabled={!!editing}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(editing ? expenseCats : availableCats).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs text-destructive mt-1">{errors.category_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="monthly_limit">Monthly limit</Label>
              <Input
                id="monthly_limit"
                type="number"
                step="0.01"
                {...register("monthly_limit")}
                className="mt-1"
                placeholder="0.00"
              />
              {errors.monthly_limit && (
                <p className="text-xs text-destructive mt-1">{errors.monthly_limit.message}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">For {monthLabel(year, month)}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal hover:bg-teal/90 text-teal-foreground">
                Save budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
