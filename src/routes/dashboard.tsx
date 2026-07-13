import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Target, Sparkles, ArrowRight, AlertTriangle, Lightbulb, ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useTransactions, useCategories, useBudgets } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney, formatDate } from "@/lib/format";
import { generateInsights, inMonth, categoryTotals, safeToSpendDaily, recommendInvestments } from "@/lib/analytics";
import { StatCardSkeleton, ChartSkeleton } from "@/components/Skeletons";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · KoboWise" }] }),
  component: () => <ProtectedLayout><DashboardPage /></ProtectedLayout>,
});

const CHART_COLORS = ["#028090", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#A855F7", "#10B981", "#F97316", "#64748B"];

function DashboardPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "NGN";
  const { data: txns = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const thisMonth = txns.filter((t) => inMonth(t, y, m));
  const totalIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const savings = totalIncome - totalExpense;
  const totalBudget = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0);
  const budgetUtil = totalBudget > 0 ? Math.min(100, Math.round((totalExpense / totalBudget) * 100)) : 0;

  // Last 6 months bar chart
  const monthsData = useMemo(() => {
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const yy = d.getFullYear(); const mm = d.getMonth() + 1;
      const inMo = txns.filter((t) => inMonth(t, yy, mm));
      months.push({
        name: d.toLocaleDateString("en-NG", { month: "short" }),
        income: inMo.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: inMo.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      });
    }
    return months;
  }, [txns, y, m]);

  // Spending breakdown
  const breakdown = useMemo(() => {
    const totals = categoryTotals(thisMonth, "expense");
    return Object.entries(totals)
      .map(([cid, value]) => ({
        name: catMap.get(cid)?.name ?? "Uncategorized",
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [thisMonth, catMap]);

  const recent = txns.slice(0, 8);
  const insights = useMemo(() => generateInsights(txns, budgets, categories, now), [txns, budgets, categories]);
  const investmentRecs = useMemo(
    () => recommendInvestments(txns, categories, {
      irregularIncome: !!profile?.irregular_income,
      savingsGoal: Number(profile?.savings_goal ?? 0),
    }),
    [txns, categories, profile?.irregular_income, profile?.savings_goal],
  );

  // Safe-to-spend (irregular income mode)
  const fixedBillsCatIds = useMemo(
    () => categories.filter((c) => ["Housing & Rent", "Utilities & Bills", "Tithe & Offering"].includes(c.name)).map((c) => c.id),
    [categories],
  );
  const safe = useMemo(
    () => safeToSpendDaily(txns, fixedBillsCatIds, Number(profile?.savings_goal ?? 0), now),
    [txns, fixedBillsCatIds, profile?.savings_goal],
  );

  // Active budget statuses
  const budgetStatuses = useMemo(() => {
    const totals = categoryTotals(thisMonth, "expense");
    return budgets.map((b) => {
      const spent = totals[b.category_id] ?? 0;
      const pct = Number(b.monthly_limit) > 0 ? (spent / Number(b.monthly_limit)) * 100 : 0;
      return { ...b, spent, pct, name: catMap.get(b.category_id)?.name ?? "—" };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, [budgets, thisMonth, catMap]);

  if (txLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Greeting */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Hello, {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h2>
          <p className="text-sm text-muted-foreground">Here's how your money is moving this month.</p>
        </div>
        <Button asChild className="bg-teal hover:bg-teal/90 text-teal-foreground">
          <Link to="/transactions">Add transaction <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatMoney(totalIncome, currency)} icon={TrendingUp} tone="success" />
        <StatCard label="Total Expenses" value={formatMoney(totalExpense, currency)} icon={TrendingDown} tone="destructive" />
        <StatCard label="Net Savings" value={formatMoney(savings, currency)} icon={Wallet} tone={savings >= 0 ? "teal" : "warning"} />
        <StatCard label="Budget Used" value={`${budgetUtil}%`} icon={Target} tone="navy" sub={totalBudget > 0 ? `of ${formatMoney(totalBudget, currency)}` : "Set a budget"} />
      </div>

      {profile?.irregular_income && (
        <div className="rounded-xl border border-teal/40 bg-gradient-to-r from-teal/10 to-mint p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wide text-teal font-semibold mb-1">Irregular income mode</div>
              <h3 className="text-xl font-bold">Safe to spend today: {formatMoney(Math.max(0, safe.daily), currency)}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your 3-month average income of {formatMoney(safe.avgIncome, currency)} minus fixed bills and your savings goal.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Remaining buffer this month</div>
              <div className="text-lg font-semibold">{formatMoney(safe.monthlyBuffer, currency)}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-mint to-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-teal flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-teal-foreground" />
          </div>
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((text, i) => (
            <div key={i} className="rounded-lg bg-card border border-border p-3 text-sm">{text}</div>
          ))}
        </div>
      </div>

      {/* Investment recommendations */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-start justify-between gap-3 flex-wrap bg-gradient-to-r from-navy/5 to-teal/5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-navy flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-navy-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Suggested investments for you</h3>
              <p className="text-xs text-muted-foreground">Personalized to your spending habits and income pattern. Not financial advice.</p>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
          {investmentRecs.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("h-4 w-4 shrink-0",
                    r.riskLevel === "Low" ? "text-success" :
                    r.riskLevel === "Medium" ? "text-warning" : "text-destructive")} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.type}</span>
                </div>
                {r.tag && <Badge className="bg-teal text-teal-foreground text-[10px]">{r.tag}</Badge>}
              </div>
              <h4 className="font-semibold text-sm leading-snug">{r.title}</h4>
              <div className="text-xs text-muted-foreground">via <span className="font-medium text-foreground">{r.platform}</span></div>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.reason}</p>
              <div className="mt-auto pt-2 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <div className="text-muted-foreground">Suggested / mo</div>
                  <div className="font-semibold text-foreground">
                    {r.suggestedMonthly > 0 ? formatMoney(r.suggestedMonthly, currency) : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Est. return</div>
                  <div className="font-semibold text-teal">{r.expectedReturn}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Income vs Expenses · Last 6 months</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => formatMoney(Number(v), currency)}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#028090" radius={[6,6,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Spending by category</h3>
          {breakdown.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground text-center">
              No expenses yet this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={breakdown} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(Number(v), currency)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent + budgets */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Recent transactions</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/transactions">View all</Link></Button>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions yet. <Link to="/transactions" className="text-teal underline">Add your first one</Link>.
              </div>
            )}
            {recent.map((t) => {
              const cat = catMap.get(t.category_id ?? "");
              return (
                <div key={t.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: `${cat?.color ?? "#028090"}20`, color: cat?.color ?? "#028090" }}>
                      {t.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{t.description ?? cat?.name ?? "Transaction"}</span>
                        {t.is_anomaly && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" /> Unusual
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{cat?.name ?? "Uncategorized"} · {formatDate(t.date)}</div>
                    </div>
                  </div>
                  <div className={cn("font-semibold text-sm", t.type === "income" ? "text-success" : "text-foreground")}>
                    {t.type === "income" ? "+" : "−"}{formatMoney(Number(t.amount), currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Active budgets</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/budgets">Manage</Link></Button>
          </div>
          <div className="p-5 space-y-4">
            {budgetStatuses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No budgets set. <Link to="/budgets" className="text-teal underline">Create one</Link>.
              </p>
            )}
            {budgetStatuses.map((b) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMoney(b.spent, currency)} / {formatMoney(Number(b.monthly_limit), currency)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, b.pct)}
                  className={cn(
                    "h-2",
                    b.pct >= 90 ? "[&>div]:bg-destructive" :
                    b.pct >= 70 ? "[&>div]:bg-warning" :
                    "[&>div]:bg-success",
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone = "teal", sub,
}: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  tone?: "teal" | "success" | "destructive" | "warning" | "navy"; sub?: string;
}) {
  const toneClass = {
    teal: "bg-teal text-teal-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    navy: "bg-navy text-navy-foreground",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
