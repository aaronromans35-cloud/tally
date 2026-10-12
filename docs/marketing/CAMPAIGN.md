# Tally — launch campaign

Everything needed to run the first 30 days: positioning, 30 rendered assets,
captions you can paste, and three email sequences.

Assets: `marketing/instagram/out/` — real 1080×1350 PNGs, ready to post.
Regenerate after any copy edit with `node marketing/instagram/slides.mjs`.

---

## 1. What the research actually says

Four findings shaped every asset here. They're worth knowing, because they
contradict most advice you'll get.

**The cover slide is ~80% of the outcome.** You get roughly 1.3 seconds to earn
a swipe. If slide 1 doesn't open a loop the viewer needs closed, nothing else
in the carousel is ever seen. Every cover here is a claim, not a label.

**Saves are the strongest ranking signal in 2026** — stronger than likes, and
carousels earn roughly 9× the saves of static posts. Saves push a post to
non-followers, which is the entire growth mechanism when you have no audience.
So every carousel carries at least one slide built to be saved: a checklist, a
framework, a reference table.

**5–8 slides.** Completion rate drops measurably past ten, and completion feeds
the ranking. All four carousels here are 6–7.

**Gen Z rejects shame-based money messaging.** This one matters most, because
it invalidates the standard budgeting-marketing playbook — the guilt, the
"you're wasting $5 a day on coffee", the before/after. None of it works on this
audience, and it's the reason most finance apps for young people read as
condescending. **Nothing in this campaign scolds anyone.**

One more, from the business side: **for teen financial products, market to the
parent.** They hold the card, they're the legally required account holder for
billing, and they're actively looking for a way to teach this. That's why one
of four carousels is aimed squarely at them — and why the Family plan is the
one with the margin.

---

## 2. Positioning

> **Tally is a budgeting app that doesn't make you feel bad.**
> It's read-only, it never moves your money, and the streak counts when you
> *check in* — not when you save.

Three things to repeat until you're sick of them:

1. **Read-only.** Tally cannot move a cent. This is the trust unlock for
   parents and the differentiator against every neobank.
2. **No shame.** The streak explicitly isn't "save money every day". One freeze
   a week. A bad day isn't a reset.
3. **The parent sees the budget, not the chat.** Visibility without surveillance
   — guardians can view a teen's buckets and goals but cannot edit them, and
   can never read their AI coach conversations.

**Avoid saying:** "financial literacy", "take control of your finances",
"money management made easy". All three are category wallpaper.

---

## 3. Content pillars

| Pillar | Share | Job |
|---|---|---|
| **Contrarian takes** | 30% | Reach. Disagreeing with common advice earns comments and shares. |
| **Save-bait utility** | 30% | Growth. Checklists and frameworks get saved, which gets you non-followers. |
| **Parent-facing** | 20% | Revenue. The payer. |
| **Product proof** | 20% | Conversion. Real screenshots of the real app. |

Format mix: Reels bring new followers; carousels convert and retain them.
Target roughly **60% Reels / 25% carousels / 15% stills**. The carousels below
are the retention engine — scripts for Reels are in §7.

---

## 4. The assets

### Carousel 1 — `c1-save-every-day/` (7 slides)
**Pillar:** contrarian · **Goal:** reach + comments

> **"Save money every day" is terrible advice.**
>
> It's also why most budgeting apps get deleted in week two.
>
> You can't save on a Tuesday you didn't spend on. A rule you break by living
> your normal life isn't a rule — it's a guilt generator with a progress bar.
>
> So we built the streak differently. In Tally a day counts when you check in:
> stay on pace, or clear the one thing it flags. One freeze a week, built in,
> because some weeks are like that.
>
> The habit worth building isn't spending less every single day. It's never
> being surprised by your own balance.
>
> Tally is free to start, read-only, and never moves your money. Link in bio.
>
> What's the worst money advice you've been given? 👇

---

### Carousel 2 — `c2-subscriptions/` (6 slides)
**Pillar:** save-bait utility · **Goal:** saves → non-follower reach

> **Six charges quietly eating your money.** Most people find at least two they
> forgot existed.
>
> Free trials don't end. They convert. That's the whole business model — the
> trial isn't the product, forgetting is.
>
> Check these, in this order:
> 1. Trials converting in the next 7 days
> 2. Anything billed yearly
> 3. Duplicate streaming
> 4. The "student rate" that quietly expired
> 5. App Store subscriptions — these hide outside your bank statement
> 6. Anything you last opened 3+ months ago
>
> One $11.99/month subscription is $143 a year. Cancelling two forgotten ones
> is a few hundred dollars you didn't have to earn.
>
> 🔖 Save this and actually do it this week.
>
> Tally flags trials before they convert and shows the yearly cost next to the
> monthly one — because that's the number that actually matters.

---

### Carousel 3 — `c3-first-budget/` (6 slides)
**Pillar:** save-bait framework · **Goal:** saves + shares

> **Your first budget is 4 numbers.** Not a spreadsheet. Not an envelope
> system. Four.
>
> 1. What comes in
> 2. What leaves on its own
> 3. What you want to keep
> 4. What's left
>
> The one rule: pick the saving number **before** the spending number. If
> saving is whatever survives the month, nothing survives the month.
>
> Then divide what's left by four. A month is too long to feel. A week is
> something you can actually steer.
>
> Most budgets fail because they're built for a month you've never had — the
> perfect one with no birthdays in it. Build for a normal month instead.
>
> 🔖 Save this for when you next get paid.

---

### Carousel 4 — `c4-for-parents/` (7 slides)
**Pillar:** parent-facing · **Goal:** revenue · **Boost this one**

> **You can't teach money with a lecture.** But you can hand them the thing you
> wish you'd had at 16.
>
> Your kid learns money from whatever they're already holding. Right now that's
> a phone extremely good at getting them to spend, with nothing on the other
> side of the scale.
>
> What Tally never does: move money · issue a card · sell their data · show ads
> · read their conversations.
>
> What you see on a Family plan: their buckets and how they're pacing, their
> goals, and an alert when something goes off pace — early, while it's still a
> conversation instead of a problem.
>
> What you deliberately can't do: **edit it.** It stops being their money the
> moment you can overrule it, and that's the exact moment they stop learning.
>
> One honest note: only an adult can connect a bank account. The service that
> powers bank connections requires account holders to be 18+, so you link
> yours — they never link theirs.
>
> Family is $20/month for up to five teens. Free plan works forever if you'd
> rather just try it first.

---

### Singles — `singles/` (4 posts)

**01 — "Being broke and being bad with money are different things."**
> One is a number. The other is a story someone told you.
>
> Usually someone who learned money in an economy that doesn't exist any more.
>
> Tally doesn't do the shame thing. It just shows you where you actually are.

**02 — "We don't do 'you spent $7 on coffee again' energy."**
> You're allowed to buy the coffee.
>
> You just deserve to know what's left afterwards. That's the entire product.

**03 — "$0: the amount Tally can move."**
> It reads your balance and your transactions. It cannot send, spend or
> transfer a cent.
>
> That isn't a setting you toggle. It's the whole design — and it's why a
> parent can say yes to this.

**04 — "A freeze a week, because life has weeks like that."**
> Miss a day in Tally and nothing resets.
>
> The habit we care about is checking in. You cannot build that with a
> punishment.

---

## 5. Hashtags

Instagram's own guidance is that hashtags are now a minor ranking input —
**the caption's first line does far more work.** Use 3–5, never 30; large tags
bury a small account instantly.

Rotate these sets so the account doesn't look automated:

- **Teen/money:** `#moneytok #firstjob #teenmoney #budgetingtips #savingmoney`
- **Parent:** `#parentingteens #raisingteens #moneylessons #teachingkids`
- **Build:** `#buildinpublic #indiehackers #solofounder`

Skip `#finance` and `#personalfinance` — tens of millions of posts, zero chance.

---

## 6. First 30 days

Three posts a week beats seven for two weeks and then nothing. Consistency is
the only compounding variable you control.

| Week | Mon | Wed | Fri |
|---|---|---|---|
| **1** | Single 02 (voice) | **Carousel 1** (contrarian) | Single 03 (read-only) |
| **2** | **Carousel 2** (subscriptions) | Reel A (§7) | Single 04 (freeze) |
| **3** | **Carousel 3** (first budget) | Single 01 (shame) | Reel B (§7) |
| **4** | **Carousel 4** (parents) | Reel C (§7) | Repost best performer |

**Rules.** Post when your audience is actually awake — for teens that's
after-school (3–6pm) and late evening (9–11pm) local. Reply to every comment in
the first hour; early engagement decides distribution. After four weeks, look
at **saves per post**, not likes, and make more of whatever got saved.

---

## 7. Reel scripts (7–12s each, talking-head or screen recording)

**Reel A — the subscription check**
> *Screen recording of Tally's Subscriptions tab.*
> "Two free trials are converting this week and I forgot both of them.
> That's $18 I was about to pay for nothing.
> The app told me before the charge, not after. That's the only difference
> between a budget that works and a budget you abandon."

**Reel B — the streak**
> *Screen recording of the streak card.*
> "Most apps break your streak if you spend money.
> Mine doesn't. A day counts when I check in — and I get one freeze a week.
> I've got a 14-day streak and I bought concert tickets in the middle of it."

**Reel C — for parents**
> *Talking head.*
> "My kid can see their own budget. I can see it too — and I can't change it.
> That's on purpose. The second I can overrule their spending it stops being
> their money, and they stop learning anything."

---

## 8. Email sequences

Built on what the research supports: **5–8 emails over 10–21 days,
front-loaded, one job per email, one CTA per email, never more than two emails
in the first 48 hours** — exceeding that trains people to mute you, which kills
every later email.

### Sequence A — new signup (teen or adult), 6 emails

**A1 · immediately · "You're in"**
> Subject: `Your first number`
> Preview: `Takes about two minutes.`
>
> Tally works out one number for you: what's safe to spend this week. To get
> it, it needs to know roughly what you're working with.
>
> Add your three or four buckets — Food, Fun, Transport, Saving is a fine start
> — and a couple of things you've spent this week. That's enough.
>
> **→ Set up your buckets**
>
> Tally is read-only. It can't move your money, and it never will.

**A2 · day 1 · "The thing most people miss"**
> Subject: `Two of your subscriptions renew this month`
> Preview: `One of them is probably a trial.`
>
> Free trials don't end — they convert. That's the business model.
>
> Add the subscriptions you can remember and Tally will warn you *before* each
> charge, not after. It also shows the yearly cost next to the monthly one,
> which is the number that actually changes your mind.
>
> **→ Add your subscriptions**

**A3 · day 3 · "Why your streak didn't break"**
> Subject: `You can spend money and keep your streak`
> Preview: `That's not a bug.`
>
> Most apps break your streak when you spend. Tally counts a day when you check
> in: stay on pace, or clear the one thing it flags.
>
> You also get one freeze a week, automatically. A bad day isn't a reset.
>
> We built it this way because "save money every day" is advice you break by
> living a normal life — and an app that punishes you for that is one you
> delete.
>
> **→ See your streak**

**A4 · day 5 · "Ask it something"**
> Subject: `It can see your buckets. Ask it anything.`
> Preview: `"Where is my money actually going?"`
>
> Tally's coach reads your actual buckets, goals and subscriptions — not your
> name, not your bank details — and answers in plain language.
>
> Try: *"What should I cut first?"* or *"Can I afford to go out this weekend?"*
>
> **→ Ask the coach**

**A5 · day 8 · "Your first month"**
> Subject: `Here's what changed`
> Preview: `Your recap is ready.`
>
> A week in, Tally can see your pattern — your most expensive day, the bucket
> that runs out first, how your pace compares to the calendar.
>
> **→ See your recap**
>
> *(Behaviour-triggered: send when ≥10 transactions exist, otherwise hold.)*

**A6 · triggered on hitting a plan limit · "You've outgrown Free"**
> Subject: `You've hit 3 buckets`
> Preview: `Starter is $5.`
>
> Free gives you three buckets and a month of history. You're using all three,
> which usually means your real budget has more shapes in it than that.
>
> Starter is $5/month: unlimited buckets, a year of history, CSV import from
> your bank, the subscription tracker, and 20 coach messages a month.
>
> **→ See the plans**
>
> Nothing is deleted if you stay on Free. Older history is hidden, not gone.

### Sequence B — guardian, 4 emails

**B1 · immediately · "What you'll actually see"**
> Subject: `What Tally shows you — and what it doesn't`
>
> You can see their buckets, their pace and their goals. You get an alert when
> something goes off pace, early enough that it's a conversation.
>
> You cannot edit their budget, and you cannot read their coach conversations.
> Both are deliberate. Visibility, not surveillance — the moment you can
> overrule it, they stop learning.
>
> **→ Invite your teen**

**B2 · day 2 · "Connect your account, not theirs"**
> Subject: `Why they can't link their own bank`
>
> Plaid, which powers bank connections, requires account holders to be 18 or
> over. So bank linking lives on your account — never theirs.
>
> It's read-only either way. Tally can see balances and transactions. It cannot
> move money, and there is no feature in the product that does.
>
> **→ Connect an account**

**B3 · day 6 · "The conversation that works"**
> Subject: `Don't open with the spending`
>
> The quickest way to make a teenager hide their spending is to lead with it.
>
> What tends to work: ask what they're saving *for*. Tally shows goals next to
> spending for exactly this reason — the goal is the part they want to talk
> about, and the spending comes up on its own.

**B4 · day 14 · "Your family's first month"**
> Subject: `A month in`
>
> Here's what their month looked like — pace, goals, and what they cancelled.
>
> **→ See the family digest**

### Sequence C — went quiet (no open/visit in 14 days), 2 emails

**C1 · "No guilt, genuine question"**
> Subject: `Did it just not fit?`
>
> You set Tally up and then stopped. That's useful information and we'd rather
> know than guess.
>
> Was it too much typing? Did you want the bank connection? Did it just not
> stick? Reply — it goes to a person.

**C2 · 7 days later · "Last one"**
> Subject: `Turning these off`
>
> We'll stop emailing after this. Your data stays exactly where it is and
> nothing is deleted — come back whenever.
>
> If it's useful: the thing most people say made it click was adding one
> week of real spending. Seven transactions and the numbers start meaning
> something.
>
> **→ Open Tally** · **→ Unsubscribe**

### Email rules

- One job, one CTA. Two CTAs halve both.
- Subject lines under 45 characters so they survive a phone lock screen.
- **A5 and A6 are behaviour-triggered, not date-triggered.** A "your first
  month" email to someone with three transactions is worse than no email.
- Under-18 accounts: send transactional and product emails only. No
  promotional sends to minors, and no third-party ad pixels in those emails —
  COPPA's amended rule and several 2026 state laws treat under-18 marketing
  data very differently from adult data.

---

## 9. What to measure

Ignore followers for 90 days. Watch:

| Metric | Why | Healthy |
|---|---|---|
| **Saves per post** | The 2026 ranking signal, and the growth engine | rising week over week |
| **Carousel completion** | Feeds ranking; tells you if slide 1 lied | >55% |
| **Profile → link taps** | The only social metric tied to revenue | >3% of reach |
| **Signup → first transaction** | The real activation moment | >40% |
| **Free → paid** | The business | >4% by day 30 |

If saves are flat after four weeks, the covers are the problem — not the
posting frequency, not the hashtags. Rewrite the hooks.

---

## Sources

- Instagram carousel best practices 2026 — https://carouselli.com/blog/instagram-carousel-best-practices
- Carousel slide-by-slide design for saves — https://www.adpicto.com/en/blog/instagram-carousel-best-practices-2026
- Instagram content formats ranked — https://creatorflow.so/blog/instagram-content-formats-guide/
- SaaS onboarding email sequences — https://www.sequenzy.com/blog/welcome-email-sequence-saas
- Onboarding sequence examples — https://smashsend.com/blog/onboarding-email-sequence-examples
- Gen Z marketing for financial institutions — https://www.data-axle.com/resources/blog/6-creative-gen-z-marketing-strategies-for-financial-institutions/
- To win Gen Z, target their parents — https://thefinancialbrand.com/news/gen-z-banking/to-win-gen-z-community-banks-and-credit-unions-should-target-their-parents-199646
