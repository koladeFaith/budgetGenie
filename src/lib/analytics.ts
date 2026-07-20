/** Pure analytics helpers — anomaly, forecast, insights */
import type { Transaction, Budget, Category } from "@/lib/types";

export function rollingAverage(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** A txn is anomalous if amount > 2x avg of last N expenses in same category */
export function isAnomalous(
  amount: number,
  history: number[],
  multiplier = 2,
  minSamples = 3,
): boolean {
  if (history.length < minSamples) return false;
  const avg = rollingAverage(history);
  if (avg <= 0) return false;
  return amount > avg * multiplier;
}

/** Weighted forecast: recent months count more (0.2, 0.3, 0.5 for last 3). */
export function forecastNext(monthlyTotals: number[]): number {
  if (!monthlyTotals.length) return 0;
  if (monthlyTotals.length === 1) return monthlyTotals[0];
  const window = monthlyTotals.slice(-3);
  const weights = window.length === 3 ? [0.2, 0.3, 0.5] : window.length === 2 ? [0.4, 0.6] : [1];
  const weighted = window.reduce((s, v, i) => s + v * weights[i], 0);
  // Blend with linear trend for momentum
  const n = window.length;
  const xs = window.map((_, i) => i);
  const meanX = rollingAverage(xs);
  const meanY = rollingAverage(window);
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (window[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const trendPoint = meanY + slope * n;
  return Math.max(0, weighted * 0.7 + trendPoint * 0.3);
}

/** Safe-to-spend for irregular income: avg monthly income (last 3mo) − fixed bills − target savings, divided by days remaining. */
export function safeToSpendDaily(
  txns: Transaction[],
  fixedBillsCategoryIds: string[],
  monthlySavingsGoal: number,
  now = new Date(),
): { daily: number; monthlyBuffer: number; avgIncome: number } {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // Avg income last 3 months (excluding current to use stable history)
  const incomes: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(y, m - 1 - i, 1);
    const total = txns
      .filter((t) => t.type === "income" && inMonth(t, d.getFullYear(), d.getMonth() + 1))
      .reduce((s, t) => s + Number(t.amount), 0);
    incomes.push(total);
  }
  const avgIncome = rollingAverage(incomes);
  // Fixed bills this month
  const fixedSpent = txns
    .filter(
      (t) =>
        t.type === "expense" &&
        t.category_id &&
        fixedBillsCategoryIds.includes(t.category_id) &&
        inMonth(t, y, m),
    )
    .reduce((s, t) => s + Number(t.amount), 0);
  // Variable spent already
  const varSpent = txns
    .filter(
      (t) =>
        t.type === "expense" &&
        (!t.category_id || !fixedBillsCategoryIds.includes(t.category_id)) &&
        inMonth(t, y, m),
    )
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthlyBuffer = Math.max(0, avgIncome - fixedSpent - monthlySavingsGoal - varSpent);
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  return { daily: monthlyBuffer / daysLeft, monthlyBuffer, avgIncome };
}

/** Group transactions into YYYY-MM totals */
export function monthlyTotals(
  txns: Transaction[],
  type: "income" | "expense",
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== type) continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out[key] = (out[key] ?? 0) + Number(t.amount);
  }
  return out;
}

export function categoryTotals(
  txns: Transaction[],
  type: "income" | "expense" = "expense",
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== type) continue;
    const key = t.category_id ?? "uncategorized";
    out[key] = (out[key] ?? 0) + Number(t.amount);
  }
  return out;
}

export function inMonth(t: Transaction, year: number, month: number): boolean {
  const d = new Date(t.date);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

/** Generate dynamic personalized insights */
export function generateInsights(
  txns: Transaction[],
  budgets: Budget[],
  categories: Category[],
  now = new Date(),
): string[] {
  const insights: string[] = [];
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const prevDate = new Date(y, m - 2, 1);
  const py = prevDate.getFullYear();
  const pm = prevDate.getMonth() + 1;

  const thisMonth = txns.filter((t) => inMonth(t, y, m));
  const prevMonth = txns.filter((t) => inMonth(t, py, pm));

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Category change vs last month
  const thisByCat = categoryTotals(thisMonth, "expense");
  const prevByCat = categoryTotals(prevMonth, "expense");
  let biggestChange: { cat: string; pct: number; delta: number } | null = null;
  for (const [cid, amt] of Object.entries(thisByCat)) {
    const prev = prevByCat[cid] ?? 0;
    if (prev <= 0) continue;
    const pct = ((amt - prev) / prev) * 100;
    if (!biggestChange || Math.abs(pct) > Math.abs(biggestChange.pct)) {
      biggestChange = { cat: catMap.get(cid) ?? "a category", pct, delta: amt - prev };
    }
  }
  if (biggestChange) {
    const dir = biggestChange.pct > 0 ? "more" : "less";
    insights.push(
      `You spent ${Math.abs(Math.round(biggestChange.pct))}% ${dir} on ${biggestChange.cat} this month compared to last month.`,
    );
  }

  // Budget projection
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(y, m, 0).getDate();
  for (const b of budgets.filter((b) => b.month === m && b.year === y)) {
    const spent = thisByCat[b.category_id] ?? 0;
    if (spent === 0) continue;
    const projected = (spent / dayOfMonth) * daysInMonth;
    if (projected > Number(b.monthly_limit)) {
      const over = projected - Number(b.monthly_limit);
      insights.push(
        `You're on track to exceed your ${catMap.get(b.category_id) ?? ""} budget by ₦${Math.round(over).toLocaleString()}.`,
      );
      break;
    }
  }

  // Savings rate change
  const totalIn = thisMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = thisMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const prevIn = prevMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const prevOut = prevMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  if (totalIn > 0 && prevIn > 0) {
    const rate = ((totalIn - totalOut) / totalIn) * 100;
    const prevRate = ((prevIn - prevOut) / prevIn) * 100;
    const diff = rate - prevRate;
    if (Math.abs(diff) >= 1) {
      const dir = diff > 0 ? "improved" : "dropped";
      insights.push(`Your savings rate ${dir} by ${Math.abs(Math.round(diff))}% this month.`);
    }
  }

  // Top expense category
  const topCat = Object.entries(thisByCat).sort((a, b) => b[1] - a[1])[0];
  if (topCat && insights.length < 4) {
    insights.push(
      `Your biggest spending category this month is ${catMap.get(topCat[0]) ?? "Uncategorized"} at ₦${Math.round(topCat[1]).toLocaleString()}.`,
    );
  }

  if (!insights.length) {
    insights.push("Add a few transactions to unlock personalized insights about your spending.");
  }
  return insights.slice(0, 4);
}

/* =========================================================================
 * Investment recommendation engine — Nigerian context.
 * Suggests concrete platforms / instruments based on spending habits,
 * disposable income, income stability, and category mix.
 * ========================================================================= */

export type InvestmentRec = {
  id: string;
  title: string;
  platform: string;
  type: "Savings" | "Fixed Income" | "Equities" | "Foreign" | "Goal" | "Emergency";
  riskLevel: "Low" | "Medium" | "High";
  suggestedMonthly: number;
  expectedReturn: string;
  reason: string;
  tag?: string;
};

const NAIRA_FX = 1; // recommendations are quoted in user currency; rendered via formatMoney

/**
 * Recommend investments based on:
 *  - 3-month avg income vs avg expenses (disposable income)
 *  - Income stability (irregular flag)
 *  - Category mix: high "fun" spend → micro-savings nudge; high "fixed" → safe yield; surplus → equities/foreign
 *  - Existing savings_goal as a floor
 */
export function recommendInvestments(
  txns: Transaction[],
  categories: Category[],
  opts: { irregularIncome: boolean; savingsGoal: number; now?: Date } = {
    irregularIncome: false,
    savingsGoal: 0,
  },
): InvestmentRec[] {
  const now = opts.now ?? new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Avg monthly income & expense over last 3 months
  const incomes: number[] = [];
  const expenses: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(y, m - 1 - i, 1);
    const yy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const inMo = txns.filter((t) => inMonth(t, yy, mm));
    incomes.push(inMo.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0));
    expenses.push(
      inMo.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    );
  }
  const avgIncome = rollingAverage(incomes);
  const avgExpense = rollingAverage(expenses);
  const disposable = Math.max(0, avgIncome - avgExpense - Number(opts.savingsGoal || 0));

  // Category mix over the same 3 months
  const last3 = txns.filter((t) => {
    const d = new Date(t.date);
    const diffMonths = (y - d.getFullYear()) * 12 + (m - (d.getMonth() + 1));
    return t.type === "expense" && diffMonths >= 1 && diffMonths <= 3;
  });
  const byCat = categoryTotals(last3, "expense");
  const totalSpend = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
  const share = (name: string) => {
    const id = [...catMap.entries()].find(([, n]) => n === name)?.[0];
    return id ? (byCat[id] ?? 0) / totalSpend : 0;
  };
  const funShare = share("Entertainment & Leisure") + share("Owambe") + share("Aso-ebi");
  const billsShare = share("Utilities & Bills") + share("Data & Airtime") + share("Housing & Rent");

  const recs: InvestmentRec[] = [];

  // Nothing to recommend yet
  if (avgIncome <= 0 && avgExpense <= 0) {
    return [
      {
        id: "starter",
        title: "Log a month of income & expenses",
        platform: "budgetGenie",
        type: "Savings",
        riskLevel: "Low",
        suggestedMonthly: 0,
        expectedReturn: "—",
        reason: "Recommendations get smarter once we see at least one full month of activity.",
      },
    ];
  }

  // 1) Emergency fund first — always, sized to 3× avg expense
  const emergencyTarget = Math.round(avgExpense * 3);
  recs.push({
    id: "emergency",
    title: `Build a ${formatNGN(emergencyTarget)} emergency fund`,
    platform: "PiggyVest Safelock",
    type: "Emergency",
    riskLevel: "Low",
    suggestedMonthly: Math.round(Math.min(disposable * 0.4, avgExpense * 0.5)),
    expectedReturn: "~10–13% p.a.",
    reason: `3× your average monthly spend (${formatNGN(avgExpense)}). Locked so you can't dip into it for owambe weekends.`,
    tag: "Start here",
  });

  // 2) Irregular income → smoothing buffer via flexible savings
  if (opts.irregularIncome) {
    recs.push({
      id: "flex",
      title: "Income-smoothing buffer",
      platform: "Cowrywise Flex / PiggyVest Flex",
      type: "Savings",
      riskLevel: "Low",
      suggestedMonthly: Math.round(disposable * 0.25),
      expectedReturn: "~8–10% p.a.",
      reason:
        "Your income varies month to month. Park surplus in a flexible wallet to cover lean months without selling investments.",
    });
  }

  // 3) Disposable income > 0 → fixed income (safe yield)
  if (disposable > 5000) {
    recs.push({
      id: "tbills",
      title: "Treasury Bills / Money Market Fund",
      platform: "Cowrywise / Stanbic IBTC Money Market",
      type: "Fixed Income",
      riskLevel: "Low",
      suggestedMonthly: Math.round(disposable * 0.3),
      expectedReturn: "~18–22% p.a.",
      reason:
        "Government-backed, beats inflation, no stress. Ideal for the bulk of conservative savings right now.",
    });
  }

  // 4) Decent surplus → Nigerian equities mutual fund
  if (disposable > 15000 && !opts.irregularIncome) {
    recs.push({
      id: "ngx",
      title: "Nigerian Equities Mutual Fund",
      platform: "ARM / Stanbic / Chapel Hill Denham",
      type: "Equities",
      riskLevel: "Medium",
      suggestedMonthly: Math.round(disposable * 0.2),
      expectedReturn: "~15–25% p.a. (volatile)",
      reason: "Diversified exposure to NGX without picking individual stocks. Hold for 3+ years.",
    });
  }

  // 5) Strong surplus → FX / foreign equities to hedge naira
  if (disposable > 30000) {
    recs.push({
      id: "fx",
      title: "Dollar-denominated assets (S&P 500 / Eurobonds)",
      platform: "Risevest / Bamboo / Trove",
      type: "Foreign",
      riskLevel: "Medium",
      suggestedMonthly: Math.round(disposable * 0.15),
      expectedReturn: "~8–12% p.a. in USD",
      reason:
        "Hedge against naira depreciation. Even ₦20k/month compounds meaningfully over years.",
    });
  }

  // 6) High "fun" spend → behavioural nudge: round-ups
  if (funShare > 0.18) {
    recs.push({
      id: "roundups",
      title: "Auto-save your owambe & outing money",
      platform: "PiggyVest Target Savings",
      type: "Goal",
      riskLevel: "Low",
      suggestedMonthly: Math.round((totalSpend * funShare * 0.1) / 3),
      expectedReturn: "~10% p.a.",
      reason: `${Math.round(funShare * 100)}% of your spend is on entertainment, owambe & aso-ebi. Auto-deduct 10% of that to a locked goal — you won't notice it.`,
    });
  }

  // 7) Bills-heavy & low surplus → focus on cutting first
  if (disposable < 5000 && billsShare > 0.5) {
    recs.push({
      id: "review-bills",
      title: "Review subscriptions & data plans first",
      platform: "budgetGenie budgets",
      type: "Savings",
      riskLevel: "Low",
      suggestedMonthly: 0,
      expectedReturn: "Frees up cash to invest",
      reason: `${Math.round(billsShare * 100)}% of your spend is bills. Trim ₦3–5k/month here, then we'll unlock equity recommendations.`,
      tag: "Action needed",
    });
  }

  return recs.slice(0, 6);
}

function formatNGN(n: number): string {
  if (!isFinite(n)) return "₦0";
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
