# Handoff: Tally — money habits app + marketing site

## Overview

Tally is a personal-finance product for people aged roughly 14–24. It is **not a bank**. It connects read-only to a bank account the user already has (via Plaid), categorises their transactions into four budget buckets, surfaces recurring charges and free-trial conversions, tracks savings goals, and wraps the whole thing in a daily habit streak.

The critical product constraint, which shapes every screen: **Tally can never move money.** Plaid read-only access means the app can observe transactions and balances, but any transfer must be made by the user in their own banking app. Several screens exist specifically to handle that limitation gracefully (the Goals two-step confirm flow, the Accounts can/cannot table).

This bundle contains two deliverables:
- **The signed-in web app** (`Tally App v5.dc.html`) — 6 tabs, the primary build target
- **The marketing site** (`Tally Site.dc.html`) — 4 pages
Plus two reference documents: a naming/logo exploration and an Instagram campaign.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behaviour, **not production code to copy directly**.

They are authored in a proprietary "Design Component" format (`.dc.html`) with a custom runtime (`support.js`). Do not attempt to port that runtime. The format works like this, in case you need to read the source:
- The markup between `<x-dc>` tags is a template with `{{ value }}` holes
- `<sc-for list="{{ items }}" as="item">` is a loop; `<sc-if value="{{ flag }}">` is a conditional
- A `class Component extends DCLogic` block supplies the values via a `renderVals()` method, which is roughly a React class component's render-time data
- All styling is inline; there are no stylesheets or CSS classes

**Your task is to recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and state management. If no environment exists yet, choose the most appropriate framework and implement there. Read the `renderVals()` logic for the *behaviour* and the template for the *layout*, then write idiomatic code for your stack.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, and interactions. Every number on screen is derived from state — there are no hardcoded display values left in the app (this was enforced deliberately; see "Derived-state invariants" below). Recreate the UI pixel-perfectly using your codebase's libraries and patterns.

---

## Design Tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| Ink | `#14140f` | Primary text, dark panels, primary buttons |
| Page | `#f5f4ef` | Site page background |
| App page | `#f0eee6` | App page background (slightly warmer/darker than site) |
| Card | `#ffffff` | Card surfaces |
| Card border | `#e0ded4` | 1px card borders |
| Hairline | `#f0eee5` | List row dividers |
| Track | `#eae8de` | Progress bar tracks (on light) |
| Track dark | `#2c2c24` | Progress bar tracks + dividers (on ink) |
| Green | `#1c6a48` | Primary accent, positive amounts, on-pace state |
| Green mid | `#4f9a72` | Secondary chart series |
| Lime | `#cdf06a` | Highlight panels, accent on dark, current level |
| Lime mid | `#9fd35a` | Logo middle bar |
| Amber | `#8a6a12` | Warning text/state (accessible on light) |
| Amber bar | `#e0a03a` | Warning fill on dark backgrounds |
| Red | `#b8422a` | Over-budget only |
| Muted (light) | `#6b6a60` | Small labels on `#f5f4ef` / `#ffffff` — 4.6:1, passes AA |
| Body muted | `#4a4941` | Secondary body copy |
| Muted (dark) | `#a8a69b` | Small labels on `#14140f` — ~8:1 |
| Disabled | `#c9c6ba` / `#d3d0c5` | Inactive dots, steppers, bars |
| Trial bg / border | `#fcf8e9` / `#d9c477` | Free-trial warning rows |
| Success bg | `#f2f8ee` | Positive inline callouts |

**Accessibility rule that was enforced:** `#6b6a60` only passes AA on `#f5f4ef` and `#ffffff`. On any darker fill (e.g. `#e6e3d8`) it drops to 4.24:1 and fails. Either keep muted text on white/page surfaces, or darken to `#5c5b52`. On `#14140f`, use `#a8a69b` — never `#6f7167` (3.72:1, fails).

### Typography

Two families, both Google Fonts:
- **Space Grotesk** (500/600/700) — all headings, all numerals, logo wordmark
- **IBM Plex Sans** (400/500/600) — body copy, buttons, labels
- **IBM Plex Mono** (400/500) — small caps labels, currency amounts, metadata

| Role | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Site hero h1 | 76px | 700 | −0.035em | 0.94 |
| Site page h1 | 60–64px | 700 | −0.035em | 0.98 |
| Site section h2 | 40–44px | 700 | −0.03em | default |
| App page h1 | 30–32px | 700 | −0.03em | default |
| App card h2 | 20–21px | 700 | −0.02em | default |
| Streak hero numeral | 92px | 700 | −0.05em | 0.86 |
| Big stat | 54–76px | 700 | −0.04em | 1 |
| Medium stat | 30–44px | 700 | −0.025 to −0.035em | 1 |
| Body | 15–17px | 400 | — | 1.5–1.6 |
| Small label (mono) | 10–11px | 400/500 | 0.10–0.14em, uppercase | — |
| Currency (mono) | 12–16px | 400/500 | — | — |

### Spacing, radius, motion

- Page gutters: 32px; app content max-width 1240px, site max-width 1200px
- Card padding: 26–32px (app), 40–56px (site panels)
- Grid gaps: 16–20px between cards, 18px in the app dashboard
- Radius: 26–28px large cards · 22–24px standard cards · 18–20px inner panels · 12–14px buttons · 999px pills · 6–8px chart bars
- Transitions: `width 200–220ms ease` on all progress bars; `background 140–160ms ease` on toggles/day cells
- Buttons: minimum 42–48px tall (44px+ for anything touch-facing)
- Charts: always cap bar width (`max-width` 24–40px) and give bars `flex:none` inside a **fixed-height track** — percentage heights inside a flex column get shrunk by `flex-shrink` and silently clamp. This bug occurred twice; render bars in an explicit `height:82px` (or similar) container.

### Logo

Coin-stack mark: a `26×26` rounded square (`radius 8px`, fill `#1c6a48`) containing three horizontally-centred bars stacked with `gap: 2.5px`, each `height: 3px`, `border-radius: 3px`, widening downward:
- 11px wide, `#cdf06a`
- 14px wide, `#9fd35a`
- 17px wide, `#f5f4ef`

Wordmark "Tally" in Space Grotesk 700, 19–20px, `−0.02em`, 10px to the right of the mark. The mark reads as stacked coins and as tally strokes turned on their side — both meanings are intentional.

---

## Screens / Views — Web App (`Tally App v5.dc.html`)

Shell: sticky header (`#f0eee6`, 1px `#ddd9cc` bottom border, 14px/32px padding) containing logo, pill tab nav, a "Synced 4m ago" status pill, and a 32px lime avatar. Active tab = `#14140f` fill with `#f5f4ef` text; inactive = transparent with `#4a4941`. Tabs can carry a lime count badge.

### 1. Today (dashboard) — default

Purpose: the whole financial picture at a glance, with the streak as the emotional centre.

Blocks top to bottom:
1. **Greeting row** — "Hey Jordan" + a subhead derived from bucket pace ("Every bucket is on pace. Today already counts." / "N buckets are spending fast — worth a look."), date right-aligned.
2. **Streak hero** — full-width `#14140f`, radius 28px, padding 34/38px. Three columns (`auto 1fr auto`, gap 44px):
   - Left: "CURRENT STREAK" label, 92px numeral, lime "days", then "{level} · freeze available this week"
   - Centre: 14 day blocks in a `repeat(14,1fr)` grid, gap 7px, each 52px tall / radius 6px, with a weekday letter beneath in `#a8a69b`. Colour encodes *how* the day was earned: `#1c6a48` stayed under pace, `#cdf06a` cleared a task, `#4a4941` freeze used, `#2c2c24` missed. A legend sits below a `#2c2c24` divider.
   - Right (min 210px): "NEXT LEVEL", level name, an 8px lime progress bar, days-remaining text, and a full-width pill button — `Mark today reviewed` when the day has not counted, or a lime `✓ Today counts — under pace` / `— reviewed` chip when it has.
3. **Safe to spend + Buckets** — two columns (`1fr 1.6fr`). Left is a lime card: 64px number, subtitle, then three rows (Left in buckets / Bills still due / Per week from here) above a 2px rule. Right is a white card with all four buckets in a 2×2 grid, each with name, pace label, `$used of $limit`, and an 8px bar.
4. **Summary row** — four cards (`repeat(4,1fr)`): Subscriptions (monthly total + trial warning), Goals (total saved + which goal is behind), **Learn** (dark card, `N/6 lessons done` + next lesson name), This week (spend + delta). All clickable, routing to their tabs.
5. **August so far + Where it goes** — two columns. Left compares spend-progress against time-progress with a bar and a verdict panel that turns amber when spending outruns the calendar. Right lists top merchants with bars and visit counts.
6. **Pattern Tally noticed** — lime strip with an insight ("Five coffees a week is $1,092 a year") and a button into the matching lesson.
7. **Recent activity** — five rows: day, merchant, category pill, amount.

### 2. Spending

- **Period recap card** — segmented control (Week / Month / 3 months / Year). Each period drives: a title, a 58px total, a delta line, three stats, a bar chart (bars capped 34px in a 114px track, peak highlighted amber), and a written insight sentence.
- **Four bucket cards** — each with pace label, 30px amount, bar, and `−` / `+` steppers that adjust the limit in $5 increments (min $10). Adjusting a limit recomputes pace, colour, and the safe-to-spend figure everywhere.
- **Transactions list** — category filter pills (All / Food / Fun / Transport / Saving), then rows of day, merchant, four inline category chips (the active one filled green — tapping recategorises and persists for that merchant), an optional flag pill ("new merchant", "recurring", "trial"), and the amount.

### 3. Goals

Three goal cards, each a `1fr 1.3fr auto` grid: name + pace label; amount saved / target / due with a 9px bar; and a two-step action column.

**The two-step transfer flow is the most important interaction in the app.** Because Tally cannot move money:
1. `Open my bank` (dark button) → state becomes `pending`
2. `Mark it landed` (lime button) → state becomes `done`
3. Card then shows `✓ Confirmed`, pace flips to "on target", the suggested amount reads "$12 moved · counted", **and the saved amount and progress bar advance** ($182 → $194, 73% → 78%)

Goal data carries a typed `dueKind` field (`relative` | `date` | `none`) so sentences compose correctly — "with 3 weeks left" vs "due Nov 2026" vs no clause.

### 4. Learn

- **Featured lesson** — dark panel, `1.4fr 1fr`. Left: kicker, 34px title, body, CTA button. Right: an inner `#22221b` panel showing three facts pulled from the user's real data.
- **Six lesson cards** — tag pill, duration, title, body, and a hook line (e.g. "$551 a year"). Clicking marks a lesson finished (lime border + "✓ Finished"), which advances the featured lesson and the counter.
- **Locked by level** — three lessons gated on habit-day count (8 / 30 / 90), showing "N days away" computed from the streak total.

Lesson copy is generated from live values — subscription count and total, trial count, month spend.

### 5. Subscriptions

Header with three stats (Active / Per month / Per year). Then one row per subscription: a 4px left border colour-coding state (green normal, amber trial, grey cancelled), name + tag pill, meta line, price with annual cost beneath, and a `How to cancel` button. Cancelling greys the row, updates all three stats, the tab badge, the dashboard card, the recap win, and the Today bills figure. A closing note explains that Tally cannot cancel on the user's behalf.

### 6. Recap

- Header: "Week of Aug 24" + "Week 34 · 5 of 7 days logged"
- **Spent this week** — dark card, 62px total, delta, four per-bucket bars with week-over-week deltas
- **Win of the week** — lime card; only claims a cancellation win when one actually happened, otherwise credits the lower spend
- **Watch next week** — white card with amber/green left border, deriving the tightest bucket and its runout day from real pace math
- **Top merchants** — bars + visit counts
- **When you spend** — day-of-week chart with the peak day highlighted and an insight sentence
- **Three week stats** — days logged, saved, left in buckets
- **Four-week comparison** — bars capped at 40px, current week in green

### 7. Accounts

Two connected-account rows (checking, savings) with a green live dot, masked number, sync status, balance, and Disconnect. A dashed "Add another account" card with a `Connect with Plaid` button. Finally a dark two-column **can / cannot** table — the honesty centrepiece:

- **Can:** read transactions and balances · categorise spending · spot recurring charges and trials · tell you the transfer to make
- **Cannot:** move, send, or withdraw money · see or store your bank password · open accounts or issue a card · sell your transaction data

---

## Interactions & Behaviour

| Interaction | Behaviour |
|---|---|
| Tab nav | Switches page, scrolls to top |
| Bucket `+` / `−` | ±$5 (min $10); recomputes pace, colour, safe-to-spend, month progress, recap watch card |
| Category chip on a transaction | Sets that merchant's category permanently; filter list re-filters |
| Period segmented control | Swaps the entire recap card contents |
| Goal `Open my bank` → `Mark it landed` | Two-step; second step advances saved amount, bar, pace, dashboard total, and both account balances |
| `How to cancel` on a subscription | Marks cancelled; cascades to 6+ derived figures across 4 screens |
| Lesson card click | Marks finished; advances featured lesson and counter |
| `Mark today reviewed` | Sets the day as counted when buckets are off-pace |
| Hover | Cards that navigate get `border-color: #1c6a48`; dark cards lighten to `#1c6a48`; ghost buttons fill `#e6e3d8` or `#cdf06a` |

No page-level loading or error states are designed. If your implementation fetches from Plaid you will need to add: an initial connect/OAuth flow, a syncing state for the header pill, and a re-auth prompt for expired Plaid items.

---

## State Management

```
page            string   active tab
days            int[14]  1 = day counted, 0 = missed
dayKind         string[] 'pace' | 'task' | 'freeze' — how each day was earned
reviewed        bool     user manually marked today
spent           { Food, Fun, Transport, Saving }  month-to-date per bucket
limits          { Food, Fun, Transport, Saving }  editable monthly limits
cats            { [merchantName]: category }      user overrides
filter          string   transaction category filter
period          string   'Week' | 'Month' | '3 months' | 'Year'
goalState       { [goalKey]: 'open' | 'pending' | 'done' }
subsCancelled   string[] cancelled subscription names
lessons         string[] finished lesson ids
```

### Derived-state invariants

These are non-negotiable and were the source of eight consecutive review failures during design. **Nothing displayed may be a hardcoded literal** if a related value exists in state:

- `safe to spend` = (total limits − total spent − upcoming charges) ÷ days left × 7
- `bills still due` = sum of predicted outgoing charges, **not** a constant
- bucket pace = `used ≤ (dayOfMonth / daysInMonth) × limit`; for **Saving** the comparison inverts (above target is good, below is amber)
- goal saved = `base + (state === 'done' ? suggestedAmount : 0)`
- savings account balance = sum of all goal saved amounts
- checking balance = base − confirmed transfers
- recap "win" = sum of `price × 12` over cancelled subscriptions; falls back to a spend-comparison message when nothing is cancelled
- recap "watch" = worst-pacing non-Saving bucket, runout day = `dayOfMonth + (limit − used) / (used / dayOfMonth)`
- streak day counts when every non-Saving bucket is under pace **or** the user marked it reviewed

Currency formatting: sign goes **outside** the symbol — `−$7`, never `$-7`. Use `−` (U+2212) for negatives, matching the transaction list.

Ordinal helper needed for dates ("the 31st"), handling the 11/12/13 exception.

---

## Screens / Views — Marketing Site (`Tally Site.dc.html`)

Four pages behind a sticky header nav (Home / Product / Streaks / About) plus a "Get early access" button.

- **Home** — 76px hero headline "Money habits, one day at a time.", subhead, two CTAs, three stat blocks (Free / Read-only / 2 min). Right column is a stack of live feature panels (safe-to-spend with four bucket bars, a trial alert card, a dark tappable streak card) — deliberately **not** a phone mockup, because the product is web too. Then: six habit cards, a lime "no new account to open" panel with four Plaid proof points, and a three-step setup section.
- **Product** — six alternating feature rows (image placeholder on alternating sides) covering budgeting, safe-to-spend, goals, subscriptions, recap, streaks. Closes with a dark three-column safety panel.
- **Streaks** — interactive 14-day grid the visitor can tap, level ladder (Rookie / Starter / Builder / Compounder), and a two-column "rules we kept / tricks we refused" panel documenting the anti-dark-pattern stance.
- **About** — mission copy, three values, a "Free while we're building" pricing note, an illustrative market-size section (flagged as placeholder data), and a waitlist form.

Footer: four columns (brand + disclosure, Product, Company, Legal) over a copyright/social bar. The disclosure line — "Tally is not a bank and does not hold or move funds. Account data is provided by Plaid." — is legally load-bearing; keep it.

---

## Assets

**No image assets exist.** Every visual is CSS — the logo is three divs, all charts are flex boxes with computed heights, and there are no icons or illustrations anywhere.

Image placeholders on the Product and About pages are striped `repeating-linear-gradient(135deg, #eceadf 0 10px, #f5f4ef 10px 20px)` blocks with a centred label naming what belongs there (e.g. "budget buckets screen", "founding team photo"). These need real screenshots or photography before launch.

Fonts load from Google Fonts. Self-host them for production.

---

## Files

| File | What it is |
|---|---|
| `Tally App v5.dc.html` | **Primary build target.** The signed-in web app, 6 tabs, all interactions |
| `Tally Site.dc.html` | Marketing site, 4 pages |
| `Naming & Logos.dc.html` | Reference: 15 name candidates and 14 logo marks. Name and mark are already chosen (Tally + coin stack) — this documents the reasoning |
| `Instagram Campaign.dc.html` | Reference: 5 launch posts, 24 frames at 1080×1350, with captions. Not part of the app build |
| `support.js` | The design-tool runtime. **Do not port this.** Included only so the HTML files open and render in a browser |

To view any of them, open the `.dc.html` file directly in a browser — no build step, no server.

---

## Suggested build order

1. Design tokens and the two-family type scale
2. App shell — header, tab nav, routing
3. The derived-state layer (buckets, pace, safe-to-spend) — everything else reads from it
4. Today dashboard, streak hero first
5. Spending (period recap, steppers, recategorisation)
6. Goals two-step flow, wired to the account balances
7. Subscriptions with its full cascade
8. Recap and Learn
9. Accounts + the real Plaid Link integration
10. Marketing site

## Open questions for the product owner

- Plaid is referenced throughout but no integration exists — the sandbox is free and would make the Accounts tab real
- The streak rule ("under pace OR reviewed") is designed but has never been tested with users; the freeze allowance is one per week
- Market-size figures on the About page are illustrative placeholders and need citation before publishing
- No mobile breakpoints are designed. The app assumes ≥1240px, the site ≥1200px
- No empty states (new user, zero transactions, no goals) and no error states are designed
