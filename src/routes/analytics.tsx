import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useTransactions, useCategories, useBudgets } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney, monthLabel } from "@/lib/format";
import { categoryTotals, inMonth, monthlyTotals, forecastNext } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics · KoboWise" }] }),
  component: () => <ProtectedLayout><AnalyticsPage /></ProtectedLayout>,
});

function AnalyticsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "NGN";
  const { data: txns = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // 6 month trend (line)
  const trendData = useMemo(() => {
    const out: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const yy = d.getFullYear(); const mm = d.getMonth() + 1;
      const inMo = txns.filter((t) => inMonth(t, yy, mm));
      out.push({
        name: d.toLocaleDateString("en-NG", { month: "short" }),
        income: inMo.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: inMo.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      });
    }
    return out;
  }, [txns, y, m]);

  // Category bar (current month)
  const catBars = useMemo(() => {
    const thisMonth = txns.filter((t) => inMonth(t, y, m));
    const totals = categoryTotals(thisMonth, "expense");
    return Object.entries(totals)
      .map(([cid, value]) => ({
        name: catMap.get(cid)?.name ?? "Uncategorized",
        value: Math.round(value),
        color: catMap.get(cid)?.color ?? "#64748B",
      }))
      .sort((a, b) => b.value - a.value);
  }, [txns, catMap, y, m]);

  // Weekly heatmap (last 8 weeks × 7 days)
  const heatmap = useMemo(() => {
    const days: { date: Date; total: number }[] = [];
    const start = new Date(y, m - 1, now.getDate() - 55);
    for (let i = 0; i < 56; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const total = txns
        .filter((t) => t.type === "expense" && new Date(t.date).toDateString() === d.toDateString())
        .reduce((s, t) => s + Number(t.amount), 0);
      days.push({ date: d, total });
    }
    const max = Math.max(1, ...days.map((d) => d.total));
    return { days, max };
  }, [txns, y, m, now]);

  // Budget table
  const monthExpenseTotals = useMemo(() => {
    const monthTxns = txns.filter((t) => inMonth(t, y, m));
    return categoryTotals(monthTxns, "expense");
  }, [txns, y, m]);

  // Forecast — per category, using last 3 months
  const forecast = useMemo(() => {
    const expenseTxns = txns.filter((t) => t.type === "expense");
    const out: { name: string; forecast: number; budget: number; color: string }[] = [];
    for (const cat of categories.filter((c) => c.name !== "Income")) {
      const catTxns = expenseTxns.filter((t) => t.category_id === cat.id);
      if (catTxns.length === 0) continue;
      const totals = monthlyTotals(catTxns, "expense");
      const sorted = Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
      const last3 = sorted.slice(-3);
      const f = forecastNext(last3);
      const budget = budgets.find((b) => b.category_id === cat.id);
      out.push({ name: cat.name, forecast: Math.round(f), budget: budget ? Number(budget.monthly_limit) : 0, color: cat.color });
    }
    return out.sort((a, b) => b.forecast - a.forecast).slice(0, 6);
  }, [txns, categories, budgets]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Spot trends, anomalies, and what's coming next.</p>
      </div>

      {/* Trend */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Income vs Expense trend · Last 6 months</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatMoney(Number(v), currency)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#028090" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Category bars */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Spending by category · {monthLabel(y, m)}</h3>
          {catBars.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No expenses this month.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catBars} layout="vertical" margin={{ top: 5, right: 10, left: 90, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" fontSize={11} width={90} />
                <Tooltip formatter={(v) => formatMoney(Number(v), currency)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#028090" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Heatmap */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Weekly spending heatmap</h3>
          <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }).map((_, week) => (
              <div key={week} className="flex gap-1">
                {heatmap.days.slice(week * 7, week * 7 + 7).map((d, i) => {
                  const intensity = d.total / heatmap.max;
                  return (
                    <div
                      key={i}
                      className="flex-1 aspect-square rounded-sm border border-border/50"
                      style={{
                        background: d.total === 0
                          ? "var(--muted)"
                          : `color-mix(in oklab, var(--teal) ${Math.round(20 + intensity * 80)}%, var(--background))`,
                      }}
                      title={`${d.date.toLocaleDateString("en-NG")} · ${formatMoney(d.total, currency)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            Less
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.8, 1].map((v) => (
                <div key={v} className="h-3 w-3 rounded-sm" style={{ background: `color-mix(in oklab, var(--teal) ${v * 100}%, var(--background))` }} />
              ))}
            </div>
            More
          </div>
        </div>
      </div>

      {/* Budget performance table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Budget performance · {monthLabel(y, m)}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium text-right">Budgeted</th>
                <th className="px-5 py-3 font-medium text-right">Actual</th>
                <th className="px-5 py-3 font-medium text-right">Remaining</th>
                <th className="px-5 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No budgets set for this month.</td></tr>
              )}
              {budgets.map((b) => {
                const cat = catMap.get(b.category_id);
                const actual = monthExpenseTotals[b.category_id] ?? 0;
                const limit = Number(b.monthly_limit);
                const remaining = limit - actual;
                const pct = limit > 0 ? (actual / limit) * 100 : 0;
                return (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-5 py-3 font-medium">{cat?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(limit, currency)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(actual, currency)}</td>
                    <td className={cn("px-5 py-3 text-right font-medium", remaining < 0 ? "text-destructive" : "text-success")}>
                      {formatMoney(remaining, currency)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        pct >= 100 ? "bg-destructive/15 text-destructive" :
                        pct >= 90 ? "bg-destructive/10 text-destructive" :
                        pct >= 70 ? "bg-warning/15 text-warning" :
                        "bg-success/15 text-success")}>
                        {Math.round(pct)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-mint to-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-teal flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-teal-foreground" />
          </div>
          <h3 className="font-semibold">AI Forecast · Projected spend this month</h3>
        </div>
        {forecast.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a few months of transactions to enable forecasting.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {forecast.map((f) => {
              const overBudget = f.budget > 0 && f.forecast > f.budget;
              return (
                <div key={f.name} className="rounded-lg bg-card border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
                    <span className="font-medium text-sm">{f.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">{formatMoney(f.forecast, currency)}</span>
                    <TrendingUp className="h-3 w-3 text-teal" />
                  </div>
                  {f.budget > 0 && (
                    <div className={cn("text-xs mt-1", overBudget ? "text-destructive" : "text-muted-foreground")}>
                      Budget: {formatMoney(f.budget, currency)}
                      {overBudget && ` · over by ${formatMoney(f.forecast - f.budget, currency)}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
