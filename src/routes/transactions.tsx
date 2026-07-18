import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Filter, Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, Sparkles,
} from "lucide-react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useTransactions, useCategories, useBudgets, useCorrections } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { suggestCategory, detectType, extractKeywords, suggestFromCorrections } from "@/lib/nlp";
import { isAnomalous, inMonth, categoryTotals } from "@/lib/analytics";
import { formatMoney, formatDate } from "@/lib/format";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions · " }] }),
  component: () => <ProtectedLayout><TransactionsPage /></ProtectedLayout>,
});

const schema = z.object({
  amount: z.coerce.number().positive("Must be positive").max(1_000_000_000),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, "Pick a category"),
  description: z.string().trim().max(500).optional(),
  date: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const PAGE_SIZE = 10;

function TransactionsPage() {
  const { user, profile } = useAuth();
  const currency = profile?.currency ?? "NGN";
  const qc = useQueryClient();
  const { data: txns = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();
  const { data: corrections = [] } = useCorrections();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [page, setPage] = useState(1);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const catByName = useMemo(() => new Map(categories.map((c) => [c.name.toLowerCase(), c])), [categories]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCat !== "all" && t.category_id !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        const cat = catMap.get(t.category_id ?? "")?.name.toLowerCase() ?? "";
        const desc = (t.description ?? "").toLowerCase();
        if (!desc.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [txns, filterType, filterCat, search, catMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, filterType, filterCat]);

  const handleAdd = () => { setEditing(null); setOpen(true); };
  const handleEdit = (t: Transaction) => { setEditing(t); setOpen(true); };

  const handleDelete = async (t: Transaction) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaction deleted");
    qc.invalidateQueries({ queryKey: ["transactions", user!.id] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-sm text-muted-foreground">Track every Naira in and out.</p>
        </div>
        <Button onClick={handleAdd} className="bg-teal hover:bg-teal/90 text-teal-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search description or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger><Filter className="h-4 w-4 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income only</SelectItem>
            <SelectItem value="expense">Expense only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))}
              {!isLoading && pageItems.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No transactions match your filters.
                </TableCell></TableRow>
              )}
              {!isLoading && pageItems.map((t) => {
                const cat = catMap.get(t.category_id ?? "");
                return (
                  <TableRow key={t.id} className="group">
                    <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm">{t.description ?? "—"}</span>
                        {t.is_anomaly && (
                          <Badge variant="destructive" className="text-[10px] gap-1 shrink-0">
                            <AlertTriangle className="h-3 w-3" /> Unusual
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: `${cat?.color ?? "#64748B"}20`, color: cat?.color ?? "#64748B" }}>
                        {cat?.name ?? "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.type === "income"
                        ? <span className="inline-flex items-center gap-1 text-success text-xs font-medium"><TrendingUp className="h-3 w-3" /> Income</span>
                        : <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium"><TrendingDown className="h-3 w-3" /> Expense</span>}
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold text-sm", t.type === "income" ? "text-success" : "")}>
                      {t.type === "income" ? "+" : "−"}{formatMoney(Number(t.amount), currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-3 border-t border-border text-xs">
            <span className="text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        categories={categories}
        catByName={catByName}
        userId={user!.id}
        budgets={budgets}
        txns={txns}
        currency={currency}
        corrections={corrections}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["transactions", user!.id] });
          qc.invalidateQueries({ queryKey: ["alerts", user!.id] });
          qc.invalidateQueries({ queryKey: ["corrections", user!.id] });
        }}
      />
    </div>
  );
}

function TransactionDialog({
  open, onOpenChange, editing, categories, catByName, userId, budgets, txns, currency, corrections, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Transaction | null;
  categories: Awaited<ReturnType<typeof useCategories>>["data"] extends infer T ? T extends undefined ? never : T : never;
  catByName: Map<string, { id: string; name: string }>;
  userId: string;
  budgets: Awaited<ReturnType<typeof useBudgets>>["data"] extends infer T ? T extends undefined ? never : T : never;
  txns: Transaction[];
  currency: string;
  corrections: { keyword: string; category_id: string }[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ catId: string; name: string } | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0, type: "expense", category_id: "",
      description: "", date: new Date().toISOString().slice(0, 10),
    },
  });

  const watchedDesc = watch("description");
  const watchedType = watch("type");
  const watchedCat = watch("category_id");

  useEffect(() => {
    if (open) {
      setAiSuggestion(null);
      if (editing) {
        reset({
          amount: Number(editing.amount),
          type: editing.type,
          category_id: editing.category_id ?? "",
          description: editing.description ?? "",
          date: editing.date,
        });
      } else {
        reset({
          amount: 0, type: "expense", category_id: "",
          description: "", date: new Date().toISOString().slice(0, 10),
        });
      }
    }
  }, [open, editing, reset]);

  // NLP suggestion as user types — checks user's learned corrections first, then rules
  useEffect(() => {
    if (!watchedDesc || watchedDesc.length < 3) { setAiSuggestion(null); return; }
    const detectedType = detectType(watchedDesc);
    if (detectedType && !editing) setValue("type", detectedType);

    // 1) Per-user correction match (learned)
    const learnedCatId = suggestFromCorrections(watchedDesc, corrections);
    if (learnedCatId) {
      const cat = categories.find((c) => c.id === learnedCatId);
      if (cat && cat.id !== watchedCat) {
        setAiSuggestion({ catId: cat.id, name: `${cat.name} (learned)` });
        return;
      }
    }
    // 2) Rule-based fallback
    const suggested = suggestCategory(watchedDesc);
    if (suggested) {
      const cat = catByName.get(suggested.toLowerCase());
      if (cat && cat.id !== watchedCat) {
        setAiSuggestion({ catId: cat.id, name: cat.name });
        return;
      }
    }
    setAiSuggestion(null);
  }, [watchedDesc, catByName, setValue, editing, watchedCat, corrections, categories]);

  const applySuggestion = () => {
    if (aiSuggestion) {
      setValue("category_id", aiSuggestion.catId);
      setAiSuggestion(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    // Anomaly check (only for new expenses)
    let isAnomaly = false;
    if (!editing && data.type === "expense") {
      const recent = txns
        .filter((t) => t.type === "expense" && t.category_id === data.category_id)
        .slice(0, 10)
        .map((t) => Number(t.amount));
      isAnomaly = isAnomalous(data.amount, recent);
    }

    const payload = {
      user_id: userId,
      amount: data.amount,
      type: data.type,
      category_id: data.category_id,
      description: data.description?.trim() || null,
      date: data.date,
      is_anomaly: isAnomaly,
    };

    const op = editing
      ? supabase.from("transactions").update(payload).eq("id", editing.id)
      : supabase.from("transactions").insert(payload);

    const { error } = await op;
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // Anomaly alert
    if (isAnomaly) {
      toast.warning("Unusual transaction detected — much higher than usual!");
      await supabase.from("alerts").insert({
        user_id: userId,
        message: `Unusual ${categories.find((c) => c.id === data.category_id)?.name} expense of ${formatMoney(data.amount, currency)}.`,
        alert_type: "anomaly",
      });
    }

    // Budget exceeded check
    if (data.type === "expense") {
      const now = new Date(data.date);
      const y = now.getFullYear(); const m = now.getMonth() + 1;
      const budget = budgets.find((b) => b.category_id === data.category_id && b.year === y && b.month === m);
      if (budget) {
        const monthExpenses = [...txns, { ...payload, id: editing?.id ?? "tmp", is_anomaly: false, created_at: "" } as Transaction]
          .filter((t) => t.id !== editing?.id || true)
          .filter((t) => t.type === "expense" && t.category_id === data.category_id && inMonth(t, y, m));
        const totals = monthExpenses.reduce((s, t) => s + Number(t.amount), 0);
        if (totals > Number(budget.monthly_limit)) {
          const overBy = totals - Number(budget.monthly_limit);
          toast.error(`Budget exceeded by ${formatMoney(overBy, currency)}!`);
          await supabase.from("alerts").insert({
            user_id: userId,
            message: `Budget for ${categories.find((c) => c.id === data.category_id)?.name} exceeded by ${formatMoney(overBy, currency)}.`,
            alert_type: "budget",
          });
        }
      }
    }

    // Adaptive learning — if user picked a category that disagrees with the rule-based suggestion, remember it
    if (data.description && data.description.trim().length >= 3 && data.type === "expense") {
      const ruleSuggested = suggestCategory(data.description);
      const ruleCat = ruleSuggested ? categories.find((c) => c.name.toLowerCase() === ruleSuggested.toLowerCase()) : null;
      if (!ruleCat || ruleCat.id !== data.category_id) {
        const keywords = extractKeywords(data.description).slice(0, 3);
        if (keywords.length) {
          const rows = keywords.map((kw) => ({ user_id: userId, keyword: kw, category_id: data.category_id }));
          // Upsert so repeats overwrite
          await supabase.from("category_corrections").upsert(rows, { onConflict: "user_id,keyword" });
        }
      }
    }

    toast.success(editing ? "Transaction updated" : "Transaction added");
    onOpenChange(false);
    onSaved();
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} className="mt-1" />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setValue("type", t)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium capitalize transition",
                    watchedType === t
                      ? t === "income" ? "bg-success text-success-foreground border-success" : "bg-destructive text-destructive-foreground border-destructive"
                      : "border-border hover:bg-accent",
                  )}>
                  {t === "income" ? "↑ Income" : "↓ Expense"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} placeholder="e.g. Bolt to Lekki, Lunch at Ibadan..." {...register("description")} className="mt-1" />
            {aiSuggestion && (
              <button type="button" onClick={applySuggestion}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs bg-mint text-navy rounded-full px-3 py-1 hover:bg-accent transition">
                <Sparkles className="h-3 w-3 text-teal" />
                AI suggests: <span className="font-semibold">{aiSuggestion.name}</span> · tap to apply
              </button>
            )}
          </div>

          <div>
            <Label>Category</Label>
            <Select value={watchedCat} onValueChange={(v) => setValue("category_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive mt-1">{errors.category_id.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-teal hover:bg-teal/90 text-teal-foreground">
              {submitting ? "Saving..." : editing ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
