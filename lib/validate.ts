/**
 * Input validation & sanitization for all API routes.
 * No external dependencies — stdlib only.
 */

// ─── String sanitization ────────────────────────────────────────────────────

/** Strip control characters and limit length */
export function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars (keep \n \r \t)
    .trim()
    .slice(0, maxLen)
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{1,63}$/.test(email)
}

/** Validate stock ticker — letters, dots, hyphens, 1–10 chars */
export function isValidTicker(ticker: string): boolean {
  return /^[A-Z0-9.\-]{1,10}$/.test(ticker.toUpperCase())
}

// ─── Number sanitization ────────────────────────────────────────────────────

export function sanitizeNumber(val: unknown, min: number, max: number, fallback = 0): number {
  const n = Number(val)
  if (!isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

// ─── Body size guard ────────────────────────────────────────────────────────

/** Parse JSON body and reject if it exceeds maxBytes */
export async function parseBody(req: Request, maxBytes = 32_000): Promise<{ data: unknown; error: string | null }> {
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return { data: null, error: `Request body too large (max ${maxBytes} bytes)` }
  }
  try {
    const text = await req.text()
    if (text.length > maxBytes) {
      return { data: null, error: `Request body too large (max ${maxBytes} bytes)` }
    }
    return { data: JSON.parse(text), error: null }
  } catch {
    return { data: null, error: 'Invalid JSON body' }
  }
}

// ─── Auth input validation ───────────────────────────────────────────────────

export function validateAuthInput(email: unknown, password: unknown): string | null {
  const e = sanitizeString(email, 254)
  const p = sanitizeString(password, 128)

  if (!e) return 'Email is required'
  if (!isValidEmail(e)) return 'Invalid email format'
  if (!p) return 'Password is required'
  if (p.length < 6) return 'Password must be at least 6 characters'
  if (p.length > 128) return 'Password too long'

  return null // valid
}

// ─── Ticker validation ───────────────────────────────────────────────────────

export function validateTicker(raw: string | null): { ticker: string; error: string | null } {
  if (!raw) return { ticker: '', error: 'Ticker is required' }
  const ticker = sanitizeString(raw, 10).toUpperCase()
  if (!isValidTicker(ticker)) return { ticker: '', error: 'Invalid ticker symbol' }
  return { ticker, error: null }
}

// ─── Plan input sanitization ─────────────────────────────────────────────────

export function sanitizePlanInput(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const profile = b.profile && typeof b.profile === 'object' ? b.profile as Record<string, unknown> : {}
  const goals = Array.isArray(b.goals) ? b.goals.slice(0, 20) : []
  const debts = Array.isArray(b.debts) ? b.debts.slice(0, 20) : []
  const holdings = Array.isArray(b.holdings) ? b.holdings.slice(0, 50) : []
  const budget = b.budget && typeof b.budget === 'object' ? b.budget : {}

  return {
    profile: {
      age: sanitizeNumber(profile.age, 10, 100, 18),
      annual_income: sanitizeNumber(profile.annual_income, 0, 10_000_000, 0),
      monthly_expenses: sanitizeNumber(profile.monthly_expenses, 0, 1_000_000, 0),
      risk_tolerance: ['low', 'moderate', 'high'].includes(String(profile.risk_tolerance))
        ? String(profile.risk_tolerance) : 'moderate',
      retirement_age: sanitizeNumber(profile.retirement_age, 18, 100, 65),
      tax_filing_status: ['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household']
        .includes(String(profile.tax_filing_status)) ? String(profile.tax_filing_status) : 'single',
    },
    goals: goals.map((g: unknown) => {
      if (!g || typeof g !== 'object') return null
      const goal = g as Record<string, unknown>
      return {
        name: sanitizeString(goal.name, 100),
        type: sanitizeString(goal.type, 50),
        target_amount: sanitizeNumber(goal.target_amount, 0, 100_000_000, 0),
        target_date: sanitizeString(goal.target_date, 20),
      }
    }).filter(Boolean),
    debts: debts.map((d: unknown) => {
      if (!d || typeof d !== 'object') return null
      const debt = d as Record<string, unknown>
      return {
        name: sanitizeString(debt.name, 100),
        balance: sanitizeNumber(debt.balance, 0, 100_000_000, 0),
        interest_rate: sanitizeNumber(debt.interest_rate, 0, 100, 0),
      }
    }).filter(Boolean),
    holdings: holdings.map((h: unknown) => {
      if (!h || typeof h !== 'object') return null
      const holding = h as Record<string, unknown>
      return {
        shares: sanitizeNumber(holding.shares, 0, 1_000_000, 0),
        avg_cost_basis: sanitizeNumber(holding.avg_cost_basis, 0, 1_000_000, 0),
      }
    }).filter(Boolean),
    budget,
    extraContext: sanitizeString(b.extraContext, 500),
  }
}

// ─── Stock research input sanitization ──────────────────────────────────────

export function sanitizeStockResearchInput(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const ticker = sanitizeString(b.ticker, 10).toUpperCase()
  if (!isValidTicker(ticker)) return null

  const history = Array.isArray(b.history)
    ? b.history.slice(0, 60).map((h: unknown) => {
        if (!h || typeof h !== 'object') return null
        const item = h as Record<string, unknown>
        return {
          date: sanitizeString(item.date, 20),
          price: sanitizeNumber(item.price, 0, 1_000_000, 0),
        }
      }).filter(Boolean)
    : []

  return {
    ticker,
    name: sanitizeString(b.name, 100),
    price: sanitizeNumber(b.price, 0, 1_000_000, 0),
    change: sanitizeNumber(b.change, -100_000, 100_000, 0),
    changePct: sanitizeNumber(b.changePct, -100, 10_000, 0),
    high52: sanitizeNumber(b.high52, 0, 1_000_000, 0),
    low52: sanitizeNumber(b.low52, 0, 1_000_000, 0),
    marketCap: sanitizeNumber(b.marketCap, 0, 100_000_000_000_000, 0),
    volume: sanitizeNumber(b.volume, 0, 100_000_000_000, 0),
    rangeChangePct: sanitizeNumber(b.rangeChangePct, -10_000, 10_000, 0),
    // Fundamentals (optional — null if not available)
    pe: b.pe != null ? sanitizeNumber(b.pe, -10_000, 100_000, 0) : null,
    forwardPe: b.forwardPe != null ? sanitizeNumber(b.forwardPe, -10_000, 100_000, 0) : null,
    eps: b.eps != null ? sanitizeNumber(b.eps, -100_000, 100_000, 0) : null,
    beta: b.beta != null ? sanitizeNumber(b.beta, -100, 100, 0) : null,
    dividendYield: b.dividendYield != null ? sanitizeNumber(b.dividendYield, 0, 10, 0) : null,
    sector: b.sector != null ? sanitizeString(b.sector, 80) : null,
    industry: b.industry != null ? sanitizeString(b.industry, 100) : null,
    revenueGrowth: b.revenueGrowth != null ? sanitizeNumber(b.revenueGrowth, -100, 1000, 0) : null,
    profitMargin: b.profitMargin != null ? sanitizeNumber(b.profitMargin, -100, 100, 0) : null,
    debtToEquity: b.debtToEquity != null ? sanitizeNumber(b.debtToEquity, 0, 100_000, 0) : null,
    history,
  }
}
