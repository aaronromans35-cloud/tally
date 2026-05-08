import Link from 'next/link'
import { notFound } from 'next/navigation'

const POSTS: Record<string, {
  tag: string; title: string; author: string; date: string; readTime: string
  content: { heading?: string; body: string }[]
}> = {
  'how-ai-is-changing-personal-financial-planning': {
    tag: 'AI Planning', author: 'Aaron Romans', date: 'May 2, 2026', readTime: '7 min read',
    title: 'How AI is changing personal financial planning for everyday Americans',
    content: [
      { body: 'For decades, personalized financial advice was something only wealthy families could access. If you had a $500,000 portfolio, you could sit down with a certified financial planner who would review your whole situation — your income, debts, goals, tax exposure — and give you a real plan. Everyone else got generic advice: "max out your 401k," "pay off high-interest debt first," "have 3-6 months of expenses saved."' },
      { body: 'Good advice, sure. But not a plan. Not something tailored to the reality of your specific income, your specific debt load, your specific goals. The gap between generic financial guidance and truly personalized advice has been enormous — and until recently, it was a gap that money could bridge but time and technology could not.' },
      { heading: 'What changed', body: 'Large language models changed the economics of personalized financial guidance. An AI can read thousands of data points about your financial situation in seconds, reason through trade-offs, and generate a prioritized plan — all at a fraction of the cost of a human advisor. That\'s the core insight behind Nexus.' },
      { body: 'When you generate a plan in Nexus, we pass your actual financial data — your income, your expense categories, your debt balances and interest rates, your investment holdings, your goals — to a frontier AI model. It doesn\'t give you a generic "pay off debt" recommendation. It tells you specifically which debt to attack first, why, and what the math looks like at your exact income and payment capacity.' },
      { body: 'The result is advice that accounts for your actual life, not a hypothetical median household. Someone earning $52,000 with $18,000 in student loans and $4,000 in credit card debt gets a very different plan than someone earning $95,000 with a paid-off car and maxed-out 401k. The inputs are different, so the outputs should be too.' },
      { heading: 'Who benefits most', body: 'AI financial planning tools are most transformative for people who have complex enough situations to need real guidance but not wealthy enough to access a human advisor. That\'s most working adults. Freelancers managing inconsistent income. Families trying to balance paying off debt with saving for college. First-generation investors who never had anyone to ask. Recent graduates figuring out how to prioritize $80,000 in student loans against a Roth IRA contribution.' },
      { body: 'These are people who genuinely need a plan — not just inspiration — and who have historically had nowhere to get one. A $250/hour CFP is not accessible to a teacher making $48,000. An AI that knows your real numbers is.' },
      { heading: 'What AI financial planning can do', body: 'AI planning tools are excellent at synthesizing complex financial data and identifying the highest-leverage actions you can take. They can run scenarios — "what happens if I put an extra $200/month toward my credit card vs. my emergency fund?" — and explain the trade-offs clearly. They can identify gaps you didn\'t know you had, like being underweight in tax-advantaged accounts, or carrying debt at an interest rate high enough to make any investment mathematically suboptimal.' },
      { body: 'They\'re also good at sequencing. The order in which you take financial steps matters more than most people realize. Investing aggressively before you have an emergency fund creates fragility. Paying off low-interest debt before capturing an employer 401k match leaves free money on the table. AI can reason through this sequence for your specific situation.' },
      { heading: 'What AI financial planning can\'t do', body: 'AI planning tools cannot replace a licensed advisor for genuinely complex situations. Estate planning involving trusts, business ownership and succession, divorce and asset division, major tax events from equity compensation — these require a human professional who can take legal responsibility for advice, understand nuanced jurisdiction-specific rules, and advocate for you in ways an AI cannot.' },
      { body: 'They\'re also limited by the data you give them. Garbage in, garbage out. If you underreport your expenses or don\'t include a debt you\'re embarrassed about, the plan will be wrong. The AI can only work with what it knows.' },
      { heading: 'How to actually use it', body: 'The key to getting value from AI financial planning is data quality. The more accurate your numbers — real income, real expenses, real debt balances — the more specific and actionable the recommendations become. Nexus is built around this: every module feeds real data into the plan. Your budget tracker, your debt payoff page, your portfolio holdings, your goals — all of it flows into the AI when you generate a plan.' },
      { body: 'Start by getting your actual numbers into the system. Not approximations — real figures. Then generate a plan. Read it critically. Push back on recommendations that don\'t fit your situation. And treat it as a starting point for your own thinking, not a directive from an oracle.' },
      { body: 'The technology is genuinely good. Use it.' },
    ],
  },

  'what-we-send-to-the-ai': {
    tag: 'AI Planning', author: 'Aaron Romans', date: 'Mar 24, 2026', readTime: '5 min read',
    title: "What we send to the AI — and what it means for your plan",
    content: [
      { body: "Transparency is important to us. When you generate a financial plan in Nexus, here's exactly what data gets sent to the AI model — and why each piece matters for the quality of your recommendations." },
      { heading: 'Your profile', body: "We send your age, annual income, and stated risk tolerance. Age helps calibrate investment horizon — a 25-year-old and a 55-year-old have fundamentally different planning contexts, and the AI uses this to adjust its recommendations accordingly. Your income provides the scale for everything else: what's an aggressive savings rate for one income is a survival budget for another. Risk tolerance shapes investment allocation recommendations." },
      { heading: 'Budget summary', body: "We send your monthly income total, total expenses, and net savings — derived from your actual logged transactions, not what you think you spend. This tells the AI whether you're currently cash-flow positive or negative, and by how much. A plan for someone saving $1,500/month looks very different from one for someone spending more than they earn. The AI uses this to determine whether your first priority should be cutting expenses, increasing income, or optimizing what you're already doing." },
      { heading: 'Debt details', body: "We send each debt's name, balance, interest rate, and minimum payment. This is critical — the optimal financial move for someone with $40,000 in 22% APR credit card debt is very different from someone with $40,000 in 4% student loans. Interest rate determines the mathematical cost of carrying debt, and the AI uses this to prioritize which debts to attack and in what order." },
      { heading: 'Investment holdings', body: "We send your total portfolio value and asset class breakdown (equities, bonds, cash, crypto, real estate, etc.). This allows the AI to reason about your overall allocation and whether your investment strategy aligns with your goals and timeline. A 35-year-old who is 90% in bonds is significantly misallocated; a 60-year-old who is 90% in equities carries more risk than most people their age should want." },
      { heading: 'Goals', body: "We send each goal's name, target amount, current progress, and deadline. Goals provide the 'why' behind the recommendations — a plan optimized for buying a house in 3 years looks very different from one optimized for early retirement in 15 years. Without goals, the AI is optimizing for abstract financial health. With goals, it's optimizing for your life." },
      { heading: 'What we don\'t send', body: "We don't send individual transaction details, exact account numbers, Social Security numbers, or any identifying information beyond what's listed above. The AI receives a structured financial snapshot — not your personal history or identity." },
      { body: "This data is processed by Anthropic's Claude model. It is not stored by Anthropic or used to train AI models, per their API usage policy. You can review Anthropic's privacy policy at anthropic.com." },
    ],
  },

  'real-limits-of-ai-financial-advice': {
    tag: 'AI Planning', author: 'Aaron Romans', date: 'Mar 10, 2026', readTime: '6 min read',
    title: 'The real limits of AI financial advice (and when to call a human)',
    content: [
      { body: "AI financial planning tools have gotten genuinely good. They can analyze complex data, identify high-leverage actions, and generate personalized recommendations faster than any human could. But they have real limits — and knowing those limits is as important as knowing the capabilities." },
      { heading: 'Where AI advice breaks down', body: "The biggest limitation is that AI works from the data you give it. If your situation involves complexity that doesn't translate cleanly into numbers — a complicated family situation, a small business with ambiguous income, a pending inheritance with strings attached — the AI will work from an incomplete picture. And incomplete inputs produce incomplete outputs." },
      { body: "AI also cannot take legal or fiduciary responsibility for advice. A licensed CFP or attorney can be held accountable for recommendations that harm you. An AI cannot. This matters enormously in situations where the stakes are high and the details are legally consequential." },
      { heading: 'Complex tax situations', body: "If you're a W-2 employee with a simple brokerage account, AI tax guidance is probably sufficient for high-level planning. If you have equity compensation (RSUs, ISOs, NQSOs), run a business, have rental properties, or are dealing with the tax consequences of a major life event like divorce or inheritance — you need a CPA or tax attorney. The rules are genuinely complex, they vary by jurisdiction, and the consequences of getting them wrong are expensive." },
      { heading: 'Estate planning', body: "AI can explain what a trust is and why you might want one. It cannot draft a trust that will hold up in your state's probate court. It cannot advise on the interaction between your estate plan and your beneficiary designations. Estate planning is inherently legal, and it requires a licensed professional who can take responsibility for the document they help you create." },
      { heading: 'Major investment decisions under uncertainty', body: "If you're considering whether to take a pension vs. lump sum, exercise stock options, sell a concentrated position, or make another large, irreversible financial decision — the stakes are high enough to warrant a second opinion from a human advisor. AI can help you frame the question and understand the variables, but a fiduciary CFP should review the actual decision." },
      { heading: 'The right way to use both', body: "Use AI tools to get informed, organized, and clear on the basics. Use them to understand your options, run scenarios, and identify questions you need to ask. Then bring that knowledge to a conversation with a human professional when the situation warrants it. You'll get more value from a $300 hour with a CFP if you walk in already understanding your numbers." },
      { body: "Nexus is designed to make you a more informed financial decision-maker — not to replace professional advice when you genuinely need it. We'll always tell you when you should talk to someone." },
    ],
  },

  'five-questions-to-ask-your-ai-planner': {
    tag: 'AI Planning', author: 'Aaron Romans', date: 'Feb 24, 2026', readTime: '4 min read',
    title: '5 questions to ask your AI financial planner to get better answers',
    content: [
      { body: "The quality of AI financial advice depends heavily on how you engage with it. A vague prompt gets a generic answer. A specific, well-framed question gets a specific, actionable answer. Here are five questions that consistently produce better recommendations." },
      { heading: '1. "Given my exact numbers, what should I do first?"', body: "Don't ask \"how do I get my finances in order?\" Ask \"Given that I earn $5,200/month, spend $4,800, have $12,000 in credit card debt at 21% APR, and $3,000 in savings — what is the single most impactful thing I should do this month?\" The more specific you are, the more specific the answer." },
      { heading: '2. "What am I missing?"', body: "After getting a recommendation, ask what you might be overlooking. Good AI financial planners will surface blind spots — tax implications you hadn't considered, a better account type for your situation, a risk in your current plan. This question often produces the most valuable part of the conversation." },
      { heading: '3. "Walk me through the math"', body: "Don't just accept a recommendation — ask why. \"You said to pay off the credit card before investing. Can you show me the math on why that\'s better in my situation?\" Understanding the reasoning makes you a better financial decision-maker and helps you spot when the AI's logic doesn't apply to your case." },
      { heading: '4. "What changes if I do X instead?"', body: "Run alternatives. \"What changes if I put $300/month toward debt instead of $500?\" \"What does my plan look like if I increase my income by $800/month?\" Scenarios help you understand the levers you have and how sensitive your outcomes are to different choices." },
      { heading: '5. "Is there anything in my situation where I should talk to a human?"', body: "A good AI tool should be honest about its limits. Ask explicitly whether your situation has any complexity that warrants professional advice. If the answer is yes, that's valuable information — and it means the AI is working in your interest, not just telling you what you want to hear." },
    ],
  },

  'the-50-30-20-rule-is-outdated': {
    tag: 'Budgeting', author: 'Aaron Romans', date: 'Apr 28, 2026', readTime: '5 min read',
    title: "The 50/30/20 rule is outdated. Here's a better framework.",
    content: [
      { body: "The 50/30/20 rule — 50% to needs, 30% to wants, 20% to savings — was popularized in Elizabeth Warren's 2005 book \"All Your Worth.\" It's a fine starting point. But it was designed for a world with lower rent, cheaper healthcare, no student loan crisis, and a median income that could actually sustain those percentages. For most people in 2026, it simply doesn't fit." },
      { heading: 'The problem with fixed percentages', body: "If you live in a high cost-of-living city, 'needs' might consume 65-70% of your income before you've spent a dollar on anything discretionary. Rent alone often takes 35-40%. Add transportation, groceries, utilities, and minimum debt payments, and there's nothing left for the tidy 50% bucket." },
      { body: "If you have significant student debt, the 20% savings target is nearly impossible while also making minimum payments on $60,000 in loans. And if you earn a lower income, the 30% 'wants' allocation is almost offensive — most of that money will go to things that are more need than want, like car insurance, phone bills, and basic clothing." },
      { body: "The rule was never meant to be applied rigidly — but most people treat it like a grade they're failing." },
      { heading: 'A better approach: priority-based budgeting', body: "Instead of fixed buckets, think in terms of a financial priority stack. Work through these in order, allocating money at each level before moving to the next:" },
      { body: "First: cover true essentials — rent, utilities, groceries, minimum debt payments, health insurance. These are non-negotiable. Second: capture any employer 401k match. It's an immediate 50-100% return on your contribution; there is no better investment. Third: build a starter emergency fund of $1,000. This keeps one bad month from derailing everything. Fourth: pay off high-interest debt aggressively (anything above 7-8% APR). Fifth: build a full 3-6 month emergency fund. Sixth: invest for long-term goals. Seventh: lifestyle upgrades and discretionary spending." },
      { heading: 'Why the order matters more than the percentage', body: "The percentage each level takes will vary dramatically by person. A high earner in a low cost-of-living area might zip through levels 1-3 with 40% of their income and have plenty left. Someone supporting a family on $45,000 might be stretched to get through level 1." },
      { body: "What matters is the sequence. Getting the order wrong — investing for retirement before eliminating 22% APR credit card debt, for example — is mathematically costly. Paying off a 4% student loan before capturing a 100% 401k match is also a mistake. The priority stack prevents these errors." },
      { heading: 'How Nexus approaches it', body: "Nexus doesn't enforce a 50/30/20 framework. The budget tracker shows you where your money actually goes, and the AI plan identifies which priority tier you're on and what the next highest-leverage move is for your specific situation. Real numbers, real recommendations — not a percentage target that may not apply to you." },
    ],
  },

  'how-to-budget-with-irregular-income': {
    tag: 'Budgeting', author: 'Aaron Romans', date: 'Apr 3, 2026', readTime: '6 min read',
    title: 'How to budget when your income changes every month',
    content: [
      { body: "Standard budgeting advice assumes you know exactly how much money you're going to make this month. For freelancers, contractors, commission salespeople, gig workers, and small business owners, that assumption is wrong — sometimes wildly wrong. A budgeting system built for a predictable paycheck will fail you when your income swings from $3,000 one month to $9,000 the next." },
      { heading: 'The core problem', body: "The core problem with irregular income isn't the variability itself — it's that most people spend based on their best months and panic during their worst ones. They take on fixed expenses (rent, car payments, subscriptions) that are sustainable when income is high but brutal when it dips. The fix requires both a different budgeting approach and a different mindset." },
      { heading: 'Step 1: find your baseline income', body: "Look at your lowest three months of income over the past year. Not the average — the lowest. That's your baseline. Budget as though that's all you'll ever make. Every expense category, every fixed commitment — it needs to be survivable on that number. This sounds harsh, but it's the only way to avoid the cycle of feast-and-famine spending." },
      { heading: 'Step 2: build an income buffer account', body: "Open a separate savings account called something like 'Income Buffer' or 'Operating Account.' When you earn more than your baseline in a given month, deposit the excess here. When you earn less than baseline, draw from this account to top up your 'paycheck' to the baseline amount. The goal is to pay yourself the same amount every month regardless of what comes in. This turns irregular income into a consistent monthly budget." },
      { body: "Aim for 3-6 months of baseline income in this account before you start directing excess money toward other goals. Until it's funded, irregular income means genuine financial risk." },
      { heading: 'Step 3: use a percentage-based budget', body: "Once you're paying yourself a consistent amount from your buffer account, budget in percentages rather than fixed dollar amounts. This way, a lower-than-usual month automatically scales your spending down proportionally rather than creating a shortfall." },
      { heading: 'Step 4: handle taxes proactively', body: "If you're self-employed or a contractor, taxes aren't withheld from your income. The IRS expects quarterly estimated payments. A common approach: set aside 25-30% of every payment you receive into a dedicated tax savings account immediately. Don't wait until April. This money is not yours — treat it like it's already gone." },
      { heading: 'The mindset shift', body: "People with irregular income need to think like a business: revenue is not profit, and not every dollar that comes in is available to spend. Your 'salary' is what you pay yourself from the buffer account. Revenue above that goes to taxes, the buffer, and then goals. This mental model protects you from the biggest mistake irregular earners make: spending high-income months as if that income will continue." },
    ],
  },

  'psychology-of-overspending': {
    tag: 'Budgeting', author: 'Aaron Romans', date: 'Mar 17, 2026', readTime: '5 min read',
    title: 'The psychology of overspending: why you do it and how to stop',
    content: [
      { body: "Budgets don't fail because of math. The math is easy — spend less than you earn. Budgets fail because of behavior. Understanding why humans overspend — the cognitive biases and emotional patterns that drive it — is more useful than another spreadsheet template." },
      { heading: 'Present bias', body: "The single biggest driver of overspending is present bias: the tendency to value immediate rewards far more than future ones. Buying something now feels very real and satisfying. Retirement savings 30 years from now is abstract. This isn't irrational — it's how human brains are wired. But it systematically produces decisions that our future selves will regret." },
      { body: "The fix for present bias is automation. Set up automatic transfers to savings on payday so the money is gone before you can spend it. The decision to save is made once, in advance, by a clear-headed version of you. The impulsive version never has access to the money." },
      { heading: 'Hedonic adaptation', body: "Hedonic adaptation means we quickly return to a baseline level of happiness after any positive change. The new car, the bigger apartment, the nicer neighborhood — they stop feeling special within weeks. We adapt, and then we need the next upgrade to feel the same lift. This drives lifestyle inflation, the gradual expansion of spending that matches (or exceeds) any income growth." },
      { body: "Awareness helps. Before any significant spending increase, ask whether you're buying a lasting upgrade or a temporary happiness boost that you'll adapt to. The research suggests experiences create more lasting happiness than possessions — budget accordingly." },
      { heading: 'Mental accounting errors', body: "Mental accounting is the tendency to treat money differently based on where it came from or where it's categorized, even though money is fungible. A tax refund feels like 'found money' and gets spent on things you'd never buy with your regular paycheck. A 'budget for dining out' that runs out doesn't stop you from dining out — you just move the expense to a different mental bucket." },
      { body: "The fix is a unified budget with real tracking. When you see all money in one place and track all spending against one bottom line, mental accounting tricks are harder to pull off." },
      { heading: 'Social comparison', body: "Humans are social creatures who instinctively compare their situation to the people around them. When your friends are upgrading their apartments and cars, your perfectly functional situation starts to feel inadequate. Social media amplifies this by making everyone's highlight reel visible — and comparison is the engine of a lot of unnecessary spending." },
      { body: "You don't know your friends' financial situations. The nice car might be financed at 19% APR. The European vacation might be on a credit card. Comparing your balance sheet to someone else's visible consumption is a losing game." },
      { heading: 'The practical fix', body: "Track every dollar for one month. Not to judge yourself — to understand yourself. Look at where money actually went versus where you thought it went. Most people are surprised. Then build a budget that reflects your actual patterns, not an aspirational version of your behavior. A budget you can follow beats a perfect budget you can't." },
    ],
  },

  'etfs-vs-individual-stocks': {
    tag: 'Investing', author: 'Aaron Romans', date: 'Apr 21, 2026', readTime: '6 min read',
    title: 'ETFs vs. individual stocks: what first-time investors actually need to know',
    content: [
      { body: "The question every new investor asks: should I buy ETFs or individual stocks? It sounds like a simple either/or, but it's actually the wrong starting question. The right question is: what am I trying to accomplish, and do I have any genuine edge in how I'm trying to accomplish it?" },
      { heading: 'What an ETF actually is', body: "An ETF (exchange-traded fund) is a basket of securities that trades on an exchange like a stock. A broad-market ETF like VTI holds shares of over 3,500 U.S. companies proportional to their market capitalization. When you buy one share of VTI, you own a tiny piece of Apple, Microsoft, Amazon, and thousands of other companies at once. It's diversification in a single trade." },
      { heading: 'The case for ETFs', body: "The data on this is remarkably consistent: over 15+ year periods, the vast majority of actively managed funds — run by professionals who study markets full time, have access to institutional research, and charge significant fees — underperform simple index ETFs. Not most years. Most 15-year periods. For most investors, most of the time, ETFs are the right answer." },
      { body: "The reasons are structural. ETFs have extremely low expense ratios (often 0.03-0.05% annually). They're tax-efficient due to how they handle redemptions. And they eliminate stock-specific risk — if one company goes bankrupt, it's a small fraction of your portfolio, not a catastrophe." },
      { heading: 'The case for individual stocks', body: "Individual stocks make sense in specific circumstances: if you have genuine informational or analytical edge in a particular industry, if you want to express a high-conviction thesis with a portion of your portfolio, or if you work in an industry and understand it better than most investors. Having 5-10% of a portfolio in individual stocks alongside a core ETF allocation is a perfectly reasonable approach for many investors." },
      { body: "What doesn't make sense is building a portfolio primarily from individual stocks without a clear articulation of your edge. Most retail investors don't have edge — they have opinions and emotions, which are different things. 'I think Tesla is going to be big' is not an investment thesis." },
      { heading: 'Account structure matters more than stock selection', body: "Before worrying about ETFs vs. individual stocks, make sure you're investing in the right account type. A Roth IRA lets your investments grow completely tax-free — you pay taxes on contributions now, and everything you earn inside the account is never taxed again. Over 30 years, this can be worth tens of thousands of dollars more than the same investments in a taxable account." },
      { body: "A traditional 401k or IRA gives you a tax deduction on contributions now, with taxes deferred until withdrawal. A taxable brokerage account is flexible — no contribution limits, no withdrawal rules — but your gains are taxed each year. Getting the account structure right is one of the highest-leverage financial decisions you can make, and it matters more than whether you buy VTI or a dozen individual stocks." },
      { heading: 'A practical starting point', body: "For most first-time investors: open a Roth IRA (if you're eligible), contribute as much as you can up to the annual limit ($7,000 in 2026), and invest it in a single broad-market index ETF. Automate monthly contributions. Review once a year. That's it. You'll outperform the vast majority of people trying much harder." },
    ],
  },

  'dollar-cost-averaging-explained': {
    tag: 'Investing', author: 'Aaron Romans', date: 'Apr 9, 2026', readTime: '5 min read',
    title: 'Dollar-cost averaging: the boring strategy that actually works',
    content: [
      { body: "Every investor wants to buy at the bottom and sell at the top. The evidence is overwhelming that almost no one can do this consistently — not individual investors, not most professional fund managers. Dollar-cost averaging (DCA) is the strategy that works precisely because it stops you from trying." },
      { heading: 'What dollar-cost averaging is', body: "Dollar-cost averaging means investing a fixed dollar amount at regular intervals — say, $300 on the first of every month — regardless of whether the market is up or down. When prices are high, you buy fewer shares. When prices are low, you buy more. Over time, this averages out your cost basis in a way that's mathematically advantageous compared to trying to time purchases." },
      { heading: 'Why it works psychologically', body: "The bigger advantage isn't mathematical — it's behavioral. Trying to time the market requires making constant decisions under uncertainty. Those decisions are emotionally charged: fear when the market drops, greed when it rises. DCA removes the decision. You invest on the 1st. You don't think about whether it's a good time. You don't check the news before transferring money. This makes you far less likely to panic-sell in a crash or overinvest at a peak." },
      { body: "The investors who consistently underperform the market aren't choosing bad stocks — they're buying at highs and selling at lows, driven by emotion. DCA is a system designed to prevent exactly that behavior." },
      { heading: 'Lump sum vs. DCA', body: "If you receive a large sum of money — an inheritance, a bonus, the proceeds from selling a house — you face a choice: invest it all at once (lump sum) or spread it over time (DCA). Mathematically, lump-sum investing outperforms DCA about two-thirds of the time, because markets go up more often than they go down. But the one-third of cases where you invest a lump sum right before a crash are psychologically devastating. For most people, spreading a windfall over 6-12 months is a reasonable trade-off between expected returns and peace of mind." },
      { heading: 'How to set it up', body: "Most brokerage accounts let you set up automatic recurring investments. Set the amount, set the frequency, choose the fund — and let it run. Automating removes the decision entirely, which is the whole point. If your income is irregular, you can approximate DCA by investing a percentage of each payment you receive rather than a fixed dollar amount." },
      { body: "The boring truth about investing is that the strategy matters far less than the behavior. A disciplined investor following a simple DCA plan into a broad index fund will outperform most active traders over 20+ years. Not because they're smart — because they're consistent." },
    ],
  },

  'roth-vs-traditional-ira': {
    tag: 'Investing', author: 'Aaron Romans', date: 'Mar 28, 2026', readTime: '6 min read',
    title: 'Roth vs. Traditional IRA: which one should you choose?',
    content: [
      { body: "Roth vs. Traditional IRA is one of the most common personal finance questions — and the answer genuinely depends on your situation. Both accounts offer significant tax advantages. The difference is when you pay taxes: now, or later." },
      { heading: 'How a Traditional IRA works', body: "With a Traditional IRA, contributions may be tax-deductible (subject to income limits if you also have a 401k). Your investments grow tax-deferred — you don't pay taxes on dividends or capital gains each year. When you withdraw money in retirement, you pay ordinary income tax on the withdrawals. The benefit: a tax deduction now, when you presumably need the cash. The cost: taxes on everything at the end, including all the growth." },
      { heading: 'How a Roth IRA works', body: "With a Roth IRA, contributions are made with after-tax dollars — no deduction now. Your investments grow tax-free. Qualified withdrawals in retirement are completely tax-free, including all the growth. The benefit: never paying taxes on your investment returns. The cost: no upfront deduction." },
      { heading: 'The key variable: your tax rate', body: "The decision hinges on a single question: will your tax rate be higher now or in retirement? If higher now: Traditional is better (take the deduction today, pay less-taxed withdrawals later). If higher in retirement: Roth is better (pay taxes now at the lower rate, withdraw everything tax-free later)." },
      { body: "For most people early in their careers, Roth wins. You're likely in a relatively low tax bracket now. As your career advances, your income — and tax rate — will probably rise. And in retirement, between Social Security, Required Minimum Distributions from traditional accounts, and potentially other income, you might be in a higher bracket than you expect. Locking in today's lower rate makes mathematical sense." },
      { heading: 'Income limits', body: "Roth IRA contributions phase out at higher incomes ($161,000 for single filers, $240,000 for married filing jointly in 2026). If you earn above these limits, you can't contribute directly — though there's a legal workaround called a 'backdoor Roth' for high earners. Traditional IRA deductibility also phases out at certain income levels if you have a workplace retirement plan." },
      { heading: 'The flexibility advantage of Roth', body: "Roth IRAs have one major practical advantage beyond the tax math: you can withdraw your contributions (not earnings) at any time, for any reason, with no taxes or penalties. This makes a Roth function somewhat like a very long-term savings account that also happens to be a retirement vehicle. For people who are uncertain whether they can afford to lock money away until 59½, this flexibility matters." },
      { heading: 'The simple answer for most people', body: "If you're under 40 and not in a high tax bracket: open a Roth IRA and max it out every year. Automate contributions. Invest in a broad index fund. If you're in a high tax bracket or close to retirement, a Traditional IRA or Traditional 401k contribution might make more sense. When in doubt, diversifying between Roth and traditional accounts gives you tax flexibility in retirement." },
    ],
  },

  'avalanche-vs-snowball-debt-payoff': {
    tag: 'Debt', author: 'Aaron Romans', date: 'Apr 14, 2026', readTime: '4 min read',
    title: 'Avalanche vs. snowball: which debt payoff method is right for you?',
    content: [
      { body: "If you're paying off multiple debts, you have two main strategic options: the avalanche method and the snowball method. Both work. Choosing between them comes down to math versus psychology — and understanding which one matters more for you." },
      { heading: 'The avalanche method', body: "In the avalanche method, you make minimum payments on all debts and throw every extra dollar at the debt with the highest interest rate first. Once that's paid off, you roll its minimum payment to the next highest-rate debt, creating an accelerating 'avalanche' of payments. This minimizes total interest paid over the life of your debts and is the mathematically optimal approach." },
      { body: "The downside: if your highest-interest debt also has the largest balance, it can take a long time before you eliminate your first debt. That waiting period can feel demoralizing if you need visible progress to stay motivated." },
      { heading: 'The snowball method', body: "In the snowball method, you target the debt with the lowest balance first, regardless of interest rate. You get quick wins — accounts fully paid off — which research by behavioral economists suggests is highly motivating. When Dave Ramsey popularized this method, he wasn't wrong about the psychology: people who get early wins are more likely to stick with a payoff plan." },
      { body: "The cost is paying more in total interest. For small balance differences between debts, the extra interest may be negligible. For large differences, it can be significant." },
      { heading: 'How to decide', body: "Ask yourself honestly: have you ever started a debt payoff plan and abandoned it? If yes, snowball. The mathematically optimal method is worthless if you don't stick with it. If you're highly disciplined, motivated by numbers and efficiency, and your highest-rate debt isn't enormously larger than your others — avalanche." },
      { body: "There's also a hybrid approach: use snowball to eliminate one or two small debts quickly (for the psychological win), then switch to avalanche for the remaining balances. You capture some of the motivational benefit while minimizing long-term interest cost." },
      { body: "Nexus lets you model both strategies and see projected payoff dates and total interest for each, so you can make the choice with real numbers rather than guesses." },
    ],
  },

  'real-cost-of-minimum-payments': {
    tag: 'Debt', author: 'Aaron Romans', date: 'Mar 20, 2026', readTime: '4 min read',
    title: 'The real cost of making minimum payments on your credit card',
    content: [
      { body: "Credit card minimum payments are designed to keep you in debt for as long as possible while charging you maximum interest. That's not a conspiracy theory — it's how the math works. And most people have no idea how much minimum payments actually cost them." },
      { heading: 'The math on a typical balance', body: "Say you have $5,000 in credit card debt at 22% APR. Your minimum payment might be around $100/month (2% of the balance, which is common). At that pace, it takes over 9 years to pay off the balance — and you'll pay roughly $5,800 in interest. You'll pay more in interest than the original balance. And that's assuming you never add another dollar to the card." },
      { heading: 'Why minimums are so small', body: "Credit card companies set minimum payments low intentionally. A lower minimum means more customers can 'afford' their payments, which means fewer defaults. It also means customers stay in debt longer, generating more interest revenue. The minimum payment is not a suggestion for what you should pay — it's the minimum required to avoid penalty, designed to maximize your total payment." },
      { heading: 'What extra payments do', body: "The impact of small additional payments is dramatic. Adding just $50/month to that $5,000 balance at 22% APR cuts the payoff time from 9 years to about 3 years and saves roughly $4,200 in interest. Adding $100/month cuts it to under 2 years and saves $5,000. The first extra dollar you put toward high-interest debt earns a guaranteed 22% return — better than almost any investment." },
      { heading: 'The credit card company wants you paying minimums', body: "Credit card rewards programs, cash back, and points are funded by interest charges from customers who carry balances. If you pay your balance in full every month, the rewards are essentially a subsidy from cardholders who don't. Understanding this dynamic should change how you think about credit card 'benefits.'" },
      { body: "The single best financial move for most people carrying high-interest credit card debt: pay as much above the minimum as you possibly can, every single month, until the balance is gone. Use Nexus's debt payoff planner to see exactly how long it will take and how much you'll save." },
    ],
  },

  'how-to-pay-off-credit-card-debt': {
    tag: 'Debt', author: 'Aaron Romans', date: 'Mar 5, 2026', readTime: '7 min read',
    title: 'A step-by-step plan for paying off credit card debt this year',
    content: [
      { body: "Credit card debt is one of the most expensive financial burdens you can carry. At 18-29% APR, it compounds faster than almost any investment can keep up with. Getting out of it — completely — should be a top financial priority. Here's a concrete, actionable plan for doing it." },
      { heading: 'Step 1: get the full picture', body: "List every credit card you have with its current balance, interest rate, and minimum payment. Don't estimate — log in and get the exact numbers. Most people carrying credit card debt have a vague sense of what they owe but not a precise picture. Precision matters because it's the starting point for your payoff calculation." },
      { heading: 'Step 2: stop adding to the balances', body: "This sounds obvious, but it's where most payoff plans fail. You cannot pay off credit card debt if you're still charging things you can't pay back. Cut up the cards if necessary. Delete saved card numbers from shopping sites. Freeze the cards in a block of ice. Whatever makes it physically inconvenient to use them. You need to plug the hole before you start bailing water." },
      { heading: 'Step 3: find your payoff money', body: "Look at your budget — or create one if you don't have one — and find every dollar you can redirect to debt. Common places to find money: subscriptions you don't use (check your bank statements), dining out frequency, streaming services, clothing spending. Also look at income opportunities: selling things you own, freelance work, a second job for a defined period. Every extra dollar goes to debt, not lifestyle." },
      { heading: 'Step 4: choose a payoff strategy', body: "If you have multiple cards, use either the avalanche method (highest interest rate first) or snowball method (lowest balance first). The avalanche saves the most money; the snowball provides faster psychological wins. Choose based on what you know about your own motivation patterns. Either way, pay the minimum on all cards and put every extra dollar toward the target card." },
      { heading: 'Step 5: consider a balance transfer', body: "If you have good credit (usually 670+), a 0% balance transfer card can save significant money. These cards offer 0% APR for a promotional period — typically 15-21 months — in exchange for a balance transfer fee (usually 3-5%). If you can pay off the transferred balance within the promotional period, you avoid all interest. The math often works powerfully in your favor. Just make sure to stop using the new card for new purchases, and pay it off completely before the promotional period ends." },
      { heading: 'Step 6: automate minimum payments everywhere', body: "Set up autopay for the minimum payment on every card. Missing a minimum payment triggers penalty APR (often 29.99%) and a late fee. You're already fighting the interest rate — don't give them more ammunition. Autopay ensures you never accidentally make your situation worse." },
      { heading: 'Step 7: celebrate milestones, stay the course', body: "Paying off debt is a long game. Build in milestones — pay off one card, reduce total debt by 25%, hit a specific month's target — and acknowledge them. The emotional experience of debt payoff matters for sustainability. Track your progress visually. Watch the number go down. The psychological weight of being debt-free is significant; keep it in mind when motivation dips." },
      { body: "Nexus's debt payoff planner will calculate your exact payoff date and total interest under any strategy you choose. Enter your balances, set an extra monthly payment, and see the road to debt-free mapped out in front of you." },
    ],
  },

  'tax-loss-harvesting-explained': {
    tag: 'Tax', author: 'Aaron Romans', date: 'Apr 7, 2026', readTime: '6 min read',
    title: 'Tax-loss harvesting: the overlooked strategy that could save you thousands',
    content: [
      { body: "Tax-loss harvesting (TLH) is one of the most powerful strategies available to investors with taxable brokerage accounts — and one of the least used by everyday investors. It involves selling investments that have declined in value to realize a loss on paper, which can then offset capital gains and reduce your tax bill." },
      { heading: 'How it works', body: "Imagine you hold two investments in a taxable account. One is up $8,000. Another is down $5,000. If you sell both, you have a net gain of $3,000 — and you only owe capital gains tax on $3,000 instead of $8,000. That's tax-loss harvesting in its simplest form." },
      { body: "You can also harvest losses to offset ordinary income. If your losses exceed your gains in a given year, you can deduct up to $3,000 of net losses against ordinary income annually. Any remaining losses carry forward indefinitely to future years." },
      { heading: 'The wash-sale rule', body: "The IRS prevents a specific form of tax gaming called the wash sale. If you sell a security for a loss and buy the 'substantially identical' security within 30 days before or after the sale, the loss is disallowed." },
      { body: "The solution is to sell the losing position and immediately buy a similar — but not identical — security. Sell a S&P 500 ETF, buy a total market ETF. Sell one technology ETF, buy a different technology ETF. You maintain your market exposure while locking in the tax loss. The IRS has not defined 'substantially identical' precisely for ETFs, so this area requires some care — but the general principle is well-established." },
      { heading: 'When to harvest', body: "TLH is most valuable in years when you have significant realized capital gains to offset. It's also useful any time a position has declined meaningfully — you don't have to wait for December. Some of the best opportunities come during market corrections, when many positions are temporarily underwater. A 10-15% market decline is painful, but it's also an opportunity to harvest losses that offset future gains." },
      { heading: 'Who benefits most', body: "TLH is most powerful for investors in high tax brackets (where long-term capital gains rates are 15-20% plus state taxes) with significant realized gains in a given year. It's less impactful in tax-advantaged accounts like IRAs and 401ks, where gains aren't taxed annually anyway — TLH only applies to taxable brokerage accounts." },
      { body: "Nexus's tax assistant helps you identify positions with unrealized losses and estimates the potential tax savings from harvesting them. It's a tool worth checking whenever the market has a significant down period." },
    ],
  },

  'capital-gains-tax-explained': {
    tag: 'Tax', author: 'Aaron Romans', date: 'Mar 14, 2026', readTime: '5 min read',
    title: 'Capital gains tax: short-term vs. long-term (and why it matters)',
    content: [
      { body: "Capital gains tax is the tax you pay when you sell an investment for more than you paid for it. But the rate you pay depends heavily on how long you held the investment — and the difference can be enormous. Understanding this distinction is one of the most practically valuable pieces of tax knowledge an investor can have." },
      { heading: 'Short-term capital gains', body: "If you sell an investment you've held for one year or less, the profit is a short-term capital gain. Short-term gains are taxed as ordinary income — the same rate as your salary. Depending on your total income, this could be 22%, 24%, 32%, or higher. This is an expensive way to pay taxes on investment returns." },
      { heading: 'Long-term capital gains', body: "If you hold an investment for more than one year before selling, the profit is a long-term capital gain. Long-term rates are significantly lower: 0% for lower income earners, 15% for most, and 20% for high earners. Adding the 3.8% net investment income tax that applies to high earners, the maximum federal long-term rate is 23.8% — still meaningfully lower than short-term rates." },
      { heading: 'The one-year threshold', body: "The difference between holding an investment 11 months versus 13 months could change your tax rate by 10-15 percentage points. On a $50,000 gain, that's $5,000-$7,500 in extra taxes for selling too early. This is why 'hold for at least one year' is fundamental investment tax advice — not because of any investment thesis, but because of the tax cliff at the one-year mark." },
      { heading: 'State taxes', body: "Federal capital gains rates are one part of the picture. Most states also tax capital gains, and many don't distinguish between short and long-term. California, for example, taxes all capital gains as ordinary income with a top rate of 13.3%. New York adds another 10.9%. If you live in a high-tax state, your combined marginal rate on short-term gains can exceed 50%." },
      { heading: 'Practical implications', body: "Before selling any investment in a taxable account, check: how long have I held it? If you're approaching the one-year mark on a profitable position, waiting a few weeks could save thousands. If you're well past one year, the timing is less critical. And if you have losses in other positions, consider harvesting those to offset the gains. Tax planning around investment sales is one area where a small amount of advance thought has an outsized financial impact." },
    ],
  },

  'reduce-your-tax-bill-legally': {
    tag: 'Tax', author: 'Aaron Romans', date: 'Feb 28, 2026', readTime: '7 min read',
    title: '7 legal ways to reduce your tax bill before year-end',
    content: [
      { body: "Tax planning is most effective before December 31 — not in April when you're filing. Many of the best tax-reduction strategies are time-sensitive, and the window closes at year-end. Here are seven moves worth making before the calendar turns." },
      { heading: '1. Max out tax-advantaged retirement accounts', body: "401k contributions reduce your taxable income dollar-for-dollar. In 2026, you can contribute up to $23,000 ($30,500 if you're 50+). If you haven't hit the limit, increasing your contribution rate in November and December can meaningfully reduce this year's tax bill. Traditional IRA contributions (up to $7,000, $8,000 if 50+) are also deductible if you meet income requirements." },
      { heading: '2. Harvest tax losses', body: "If you have investments in a taxable account that are currently underwater, selling them before year-end creates a realized loss you can use to offset gains or up to $3,000 of ordinary income. Buy a similar (but not substantially identical) fund immediately to maintain your market exposure. Losses that exceed $3,000 carry forward to future years." },
      { heading: '3. Consider a Roth conversion', body: "A Roth conversion moves money from a Traditional IRA to a Roth IRA, triggering income tax on the converted amount now but eliminating taxes on future growth. This is particularly attractive in years when your income is lower than usual — a career transition, a gap year, a business loss. If you expect to be in a higher tax bracket in retirement, converting at today's lower rate is a powerful move." },
      { heading: '4. Bunch charitable deductions', body: "The standard deduction ($14,600 for single filers in 2026) means itemizing only helps if your deductions exceed that threshold. If you give to charity but don't itemize, consider 'bunching' two years of donations into one year — giving double the amount in a single year to push you above the standard deduction, then taking the standard deduction the following year. A donor-advised fund makes this particularly easy." },
      { heading: '5. Use your FSA or HSA', body: "Health savings accounts (HSAs) offer the best tax treatment of any account: contributions are pre-tax, growth is tax-free, and withdrawals for medical expenses are tax-free. Flexible spending accounts (FSAs) are use-it-or-lose-it — check your balance and use any remaining funds before the plan year ends. Both reduce your taxable income and should be fully utilized." },
      { heading: '6. Accelerate deductible expenses', body: "If you're self-employed or itemize deductions, consider accelerating deductible expenses into this calendar year. Buy equipment, pay professional dues, make charitable contributions, or prepay state and local taxes — anything that creates a deductible expense this year rather than next. This is particularly valuable if you expect higher income next year." },
      { heading: '7. Gift appreciated assets', body: "If you plan to give to charity, donating appreciated securities directly (instead of cash) is significantly more tax-efficient. You avoid capital gains tax on the appreciation and get a charitable deduction for the full market value. If you're gifting to family members who are in a lower tax bracket, gifting appreciated assets can also shift the eventual capital gains tax to a lower rate." },
      { body: "Not every strategy applies to every situation, and some (particularly Roth conversions and large asset gifts) are complex enough to warrant a conversation with a tax professional. But reviewing this list before December 31 is worth the time." },
    ],
  },

  'why-savings-goals-fail': {
    tag: 'Goals', author: 'Aaron Romans', date: 'Mar 31, 2026', readTime: '5 min read',
    title: 'Why most savings goals fail (and how to set ones that actually stick)',
    content: [
      { body: "'I want to save more money' is not a goal. It's a wish. Goals that actually change behavior share three traits: they're specific, time-bound, and connected to something you genuinely care about. Generic financial goals fail not because of willpower — they fail because they're not designed to succeed." },
      { heading: 'Specific', body: "'Save $10,000' is a goal. 'Save more' is not. The number matters because it creates a clear finish line and makes progress measurable. Without a specific target, you can never know if you're on track — and your brain treats the goal as optional and abstract, which means it deprioritizes it under any pressure." },
      { heading: 'Time-bound', body: "'Save $10,000 by December 2027' is better than 'save $10,000 someday.' A deadline converts a wish into a plan. It lets you reverse-engineer a monthly target ($10,000 ÷ 18 months = $556/month). Now you have an actionable number to put in your budget. You know immediately whether you're on track and by how much." },
      { heading: 'Connected to something real', body: "'Save $10,000 for a house down payment by December 2027' is the strongest version. The emotional connection to a concrete outcome — owning a home, traveling with your family, retiring early — makes sacrifice feel meaningful. When you choose not to buy something impulsive, you're not just 'being responsible' — you're actively building toward something you want. That reframe is more powerful than it sounds." },
      { heading: 'Why tracking matters', body: "Regular progress tracking is one of the strongest predictors of goal achievement in behavioral psychology research. Not because watching a number is motivating in itself, but because it surfaces problems early. If you're $200 behind in month three, you can adjust. If you discover you're $2,400 behind in month twelve, the gap may be unrecoverable." },
      { body: "Checking in monthly — not daily, not annually — seems to be the sweet spot for most savings goals. Daily checking creates anxiety without useful information. Annual checking lets problems compound unchecked. Monthly creates the right cadence of awareness and adjustment." },
      { heading: 'Automating the decision', body: "The most reliable way to hit a savings goal is to remove the decision entirely. Set up an automatic transfer on payday to a dedicated savings account named after your goal (most banks let you label accounts). When the money moves automatically before you see it, you spend what's left without agonizing over each individual contribution. The decision to save is made once, by a deliberate version of you, and runs automatically after that." },
      { body: "Nexus's goal tracker is built around this framework: set a specific target and deadline, track real progress, and see whether your current savings rate will get you there." },
    ],
  },

  'how-to-build-emergency-fund': {
    tag: 'Goals', author: 'Aaron Romans', date: 'Mar 7, 2026', readTime: '5 min read',
    title: 'How to build a 6-month emergency fund (even on a tight budget)',
    content: [
      { body: "An emergency fund is the foundation of financial stability. Without one, a single unexpected expense — a car repair, a medical bill, a job loss — can force you into high-interest debt that takes years to escape. With one, the same event is a temporary inconvenience instead of a financial crisis. Building it is one of the highest-priority financial moves you can make." },
      { heading: 'How much do you actually need?', body: "The standard advice is 3-6 months of living expenses. But the right number for you depends on your income stability and fixed obligations. A dual-income household with stable salaried jobs can probably get by with 3 months. A single-income household, someone who is self-employed, anyone in a commission-based role, or anyone with dependents should target 6 months. If your industry is volatile or your job market is thin, 9-12 months is not excessive." },
      { body: "Calculate your actual monthly expenses — not income, expenses. Rent/mortgage, utilities, groceries, insurance, minimum debt payments, transportation. That monthly number times 3-6 is your target." },
      { heading: 'Start with $1,000', body: "A 6-month emergency fund can feel impossibly large when you have $200 in savings. Don't think about the full number yet. Set an initial target of $1,000. This covers the most common small emergencies — a car repair, an urgent medical copay — without triggering credit card debt. Getting to $1,000 is a meaningful, achievable milestone that creates momentum." },
      { heading: 'Where to keep it', body: "Keep your emergency fund in a high-yield savings account (HYSA) — not a standard bank savings account that pays 0.01%, and not invested in the stock market. A HYSA at an online bank (Marcus, Ally, SoFi, etc.) currently pays 4-5% APY with full FDIC insurance and next-day accessibility. The goal isn't growth — it's earning a fair return on money that needs to be safe and instantly available." },
      { heading: 'How to build it faster', body: "The two levers are: redirect existing spending, and create additional income. On the spending side: temporarily reduce discretionary spending (dining out, entertainment, subscriptions) and direct those dollars to the fund. On the income side: sell things you own, pick up freelance work, or take on extra hours. This isn't permanent — it's a focused sprint to build the foundation that protects everything else." },
      { body: "Automate a transfer from your checking account to your HYSA every payday — even if it's $50 or $100. Consistency beats size. A $100/month automated transfer builds an emergency fund in a year without requiring constant willpower. Once the fund is fully funded, redirect those automated transfers to your next financial goal." },
    ],
  },

  'saving-for-a-house-down-payment': {
    tag: 'Goals', author: 'Aaron Romans', date: 'Feb 18, 2026', readTime: '6 min read',
    title: 'Saving for a house down payment in 2026: a realistic guide',
    content: [
      { body: "With median home prices where they are and mortgage rates still elevated, saving for a down payment can feel like moving toward a retreating horizon. But it's achievable with a clear plan and realistic timelines. Here's how to approach it." },
      { heading: 'How much do you actually need?', body: "The traditional answer is 20% down to avoid Private Mortgage Insurance (PMI). PMI typically costs 0.5-1.5% of the loan amount annually — on a $400,000 loan, that's $2,000-$6,000 per year until you reach 20% equity. It's worth avoiding if you can, but it shouldn't prevent you from buying if you're otherwise ready." },
      { body: "Conventional loans allow as little as 3% down. FHA loans require 3.5% with a 580+ credit score. First-time buyer programs in many states offer down payment assistance, reduced PMI, or other benefits. Know your options before setting a savings target." },
      { heading: 'Setting a realistic timeline', body: "Take your target down payment amount and divide it by what you can realistically save each month. If you need $60,000 and can save $1,500/month, you're looking at 40 months — just over 3 years. If that timeline feels discouraging, consider whether your target price range is realistic or whether there are ways to accelerate the savings." },
      { body: "Also account for closing costs (typically 2-5% of the purchase price), moving expenses, and 3-6 months of mortgage payments in reserve — most lenders want to see cash reserves even after a down payment." },
      { heading: 'Where to save it', body: "Down payment savings belong in a high-yield savings account for timelines under 3 years. The stock market is too volatile for money you'll need at a specific point in the near future — a 30% market drop the year before you want to buy would be devastating. HYSA currently yielding 4-5% is appropriate: safe, accessible, and earning a reasonable return." },
      { body: "For longer timelines (5+ years), a taxable brokerage account invested conservatively might be reasonable. But for most people saving on a 2-4 year timeline, HYSA is the right answer." },
      { heading: 'Accelerating your savings', body: "Beyond the obvious (save more, spend less), there are a few specific strategies worth knowing. If you have a 401k with a first-time homebuyer exception — some plans allow loans or hardship withdrawals for home purchases. Roth IRA contributions (not earnings) can be withdrawn penalty-free for a first home purchase up to $10,000 lifetime. Some states have first-time homebuyer savings accounts with state tax deductions. And windfalls — tax refunds, bonuses, gifts — are powerful accelerants when directed entirely to the down payment fund." },
      { heading: 'A note on timing the market', body: "People frequently try to time the housing market — waiting for prices to fall or rates to drop. Some of this is reasonable. But the risk of waiting is that you spend 2-3 years renting while your down payment goal keeps moving (prices rise) and you're not building equity. The best time to buy is when you're financially ready and the home meets your needs — not when the market looks perfect, which it rarely does." },
      { body: "Nexus's goal tracker lets you set a specific down payment target with a deadline and tracks your real progress month by month. Set the goal, automate the savings, and watch it build." },
    ],
  },
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'AI Planning': { bg: 'rgba(201,164,55,0.12)', text: '#6B5318' },
  'Budgeting':   { bg: 'var(--nx-pos-50)',       text: 'var(--nx-pos-700)' },
  'Investing':   { bg: 'var(--nx-navy-100)',      text: 'var(--nx-navy-700)' },
  'Debt':        { bg: 'var(--nx-neg-50)',        text: 'var(--nx-neg-700)' },
  'Tax':         { bg: 'var(--nx-warn-50)',       text: 'var(--nx-warn-700)' },
  'Goals':       { bg: 'var(--nx-cream-200)',     text: 'var(--nx-ink-600)' },
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = POSTS[slug]
  if (!post) notFound()

  const tagColors = TAG_COLORS[post.tag] ?? { bg: 'var(--nx-cream-200)', text: 'var(--nx-ink-600)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--nx-cream-50)', borderBottom: '1px solid var(--nx-cream-300)', height: 62, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
        </Link>
        <Link href="/blog" style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>← Back to blog</Link>
      </nav>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: '64px 48px 96px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999, background: tagColors.bg, color: tagColors.text }}>
          {post.tag}
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', lineHeight: 1.15, marginTop: 20, marginBottom: 24 }}>
          {post.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 36, borderBottom: '1px solid var(--nx-cream-300)', marginBottom: 44 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--nx-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-gold-400)' }}>
            {post.author[0]}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-navy-900)' }}>{post.author}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{post.date} · {post.readTime}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {post.content.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>
                  {block.heading}
                </h2>
              )}
              <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--nx-ink-600)' }}>{block.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64, padding: '36px 40px', borderRadius: 16, background: 'var(--nx-navy-800)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--nx-cream-50)', marginBottom: 10 }}>
            Put this into practice.
          </div>
          <p style={{ fontSize: 14, color: 'var(--nx-navy-300)', marginBottom: 24 }}>
            Nexus applies these ideas to your real numbers — for free.
          </p>
          <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, padding: '10px 28px', borderRadius: 7, background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)', textDecoration: 'none', display: 'inline-block' }}>
            Get started free →
          </Link>
        </div>
      </article>

      <footer style={{ background: 'var(--nx-navy-900)', borderTop: '1px solid var(--nx-navy-800)', padding: '22px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 22, height: 22, background: 'var(--nx-cream-50)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--nx-cream-200)' }}>Nexus</span>
        </Link>
        <p style={{ fontSize: 12, color: 'var(--nx-navy-500)' }}>For educational purposes only. Not financial advice.</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: 'mailto:aaronromans35@gmail.com' }].map(l => (
            <Link key={l.label} href={l.href} style={{ fontSize: 12, color: 'var(--nx-navy-500)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
