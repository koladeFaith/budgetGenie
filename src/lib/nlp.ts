/**
 * Lightweight rule-based NLP categorizer.
 * Inspired by Compromise/Natural-style keyword classification — runs entirely
 * in the browser with zero deps. Returns the best matching default category name.
 */

const RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Food & Groceries",
    keywords: [
      "food", "lunch", "dinner", "breakfast", "restaurant", "eatery", "buka",
      "jollof", "rice", "suya", "bread", "groceries", "grocery", "market",
      "shoprite", "chicken", "amala", "egusi", "snack", "kfc", "dominos",
      "chicken republic", "mr biggs", "supermarket", "noodles", "indomie",
    ],
  },
  {
    category: "Transportation",
    keywords: [
      "uber", "bolt", "indrive", "taxi", "bus", "danfo", "keke", "okada",
      "fuel", "petrol", "diesel", "transport", "fare", "trip", "bike",
      "filling station", "nnpc",
    ],
  },
  {
    category: "Housing & Rent",
    keywords: ["rent", "house", "landlord", "apartment", "lease", "mortgage", "service charge", "agent fee"],
  },
  {
    category: "Entertainment & Leisure",
    keywords: [
      "movie", "cinema", "filmhouse", "netflix", "spotify", "apple music",
      "showmax", "concert", "club", "party", "game", "playstation", "xbox",
      "gym", "leisure", "outing",
    ],
  },
  {
    category: "Education",
    keywords: ["school", "tuition", "fees", "books", "course", "udemy", "coursera", "exam", "waec", "jamb", "textbook"],
  },
  {
    category: "Health & Medical",
    keywords: ["hospital", "pharmacy", "drugs", "medicine", "doctor", "clinic", "consultation", "test", "lab", "dental"],
  },
  {
    category: "Utilities & Bills",
    keywords: ["electricity", "ekedc", "ikedc", "phcn", "nepa", "water", "bill", "gas", "cable", "dstv", "gotv", "startimes"],
  },
  {
    category: "Clothing & Fashion",
    keywords: ["clothes", "shirt", "shoe", "fashion", "ankara", "tailor", "jewelry", "perfume", "cosmetics", "makeup", "hair", "salon", "barber"],
  },
  {
    category: "Data & Airtime",
    keywords: ["airtime", "data", "mtn", "glo", "airtel", "9mobile", "recharge", "internet", "wifi", "spectranet", "smile"],
  },
  {
    category: "Savings & Investment",
    keywords: ["savings", "save", "invest", "investment", "stocks", "bonds", "cowrywise", "piggyvest", "bamboo", "risevest", "crypto"],
  },
  {
    category: "Aso-ebi",
    keywords: ["aso ebi", "asoebi", "aso-ebi", "uniform", "lace", "ankara fabric"],
  },
  {
    category: "Family Support",
    keywords: ["mama", "papa", "mum", "mom", "dad", "sister", "brother", "cousin", "uncle", "aunty", "send home", "family", "village"],
  },
  {
    category: "Tithe & Offering",
    keywords: ["tithe", "offering", "church", "mosque", "seed", "donation", "sadaqa", "zakat"],
  },
  {
    category: "POS Charges",
    keywords: ["pos", "withdrawal", "atm fee", "transfer fee", "bank charge", "stamp duty", "vat fee"],
  },
  {
    category: "Black Tax",
    keywords: ["black tax", "support", "stipend", "feeding money", "school fees sibling"],
  },
  {
    category: "Owambe",
    keywords: ["owambe", "wedding", "burial", "naming", "party gift", "spray", "souvenir"],
  },
];

const INCOME_KEYWORDS = [
  "salary", "wage", "payment", "freelance", "gig", "bonus", "refund",
  "client", "invoice", "income", "dividend", "interest", "stipend", "allowance",
];

/** Extract candidate keywords (merchant/vendor tokens) from a description. */
export function extractKeywords(description: string): string[] {
  const text = description.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const stop = new Set(["the","and","for","with","from","into","that","this","was","were","are","but","not","you","your","our","its","just","got","paid","pay","bought","buy","spend","spent","sent","sending"]);
  const tokens = text.split(/\s+/).filter((t) => t.length > 2 && !stop.has(t));
  // Also include 2-grams for vendor names like "chicken republic"
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) bigrams.push(`${tokens[i]} ${tokens[i+1]}`);
  return Array.from(new Set([...bigrams, ...tokens]));
}

/** Suggest from learned per-user corrections first, then fall back to rules. */
export function suggestFromCorrections(
  description: string,
  corrections: { keyword: string; category_id: string }[],
): string | null {
  if (!description || !corrections.length) return null;
  const text = description.toLowerCase();
  // Longest-keyword match wins
  const sorted = [...corrections].sort((a, b) => b.keyword.length - a.keyword.length);
  for (const c of sorted) {
    if (c.keyword && text.includes(c.keyword.toLowerCase())) return c.category_id;
  }
  return null;
}

export function suggestCategory(description: string): string | null {
  if (!description) return null;
  const text = description.toLowerCase();

  // Score every category by keyword hits
  let best: { category: string; score: number } | null = null;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) score += kw.length; // longer keyword = stronger signal
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category: rule.category, score };
    }
  }
  return best?.category ?? null;
}

export function detectType(description: string): "income" | "expense" | null {
  if (!description) return null;
  const text = description.toLowerCase();
  if (INCOME_KEYWORDS.some((k) => text.includes(k))) return "income";
  return null;
}

/** Tokenize and return top word-frequency tokens (Natural-style). */
export function topTokens(text: string, n = 5): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);
  const freq = new Map<string, number>();
  tokens.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}
