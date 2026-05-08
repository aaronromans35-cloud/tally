'use client'
import Link from 'next/link'
import { useState } from 'react'

function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--nx-cream-50)',
      borderBottom: '1px solid var(--nx-cream-300)',
      height: 62, padding: '0 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
      </Link>
      <div style={{ display: 'flex', gap: 36 }}>
        {[{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/pricing' }, { label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }].map(l => (
          <Link key={l.label} href={l.href} style={{ fontSize: 14, color: 'var(--nx-ink-500)', fontWeight: 500, textDecoration: 'none' }}>{l.label}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--nx-ink-600)', textDecoration: 'none', padding: '7px 14px' }}>Sign in</Link>
        <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 6, background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)', textDecoration: 'none' }}>Get started</Link>
      </div>
    </nav>
  )
}

const FEATURED = {
  slug: 'how-ai-is-changing-personal-financial-planning',
  tag: 'AI Planning',
  title: 'How AI is changing personal financial planning for everyday Americans',
  excerpt: 'For decades, personalized financial advice was reserved for those with large portfolios. Here\'s how AI is leveling the playing field — and what you should actually do with it.',
  author: 'Aaron Romans',
  date: 'May 2, 2026',
  readTime: '7 min read',
}

const POSTS = [
  // AI Planning
  { slug: 'what-we-send-to-the-ai', tag: 'AI Planning', title: 'What we send to the AI — and what it means for your plan', excerpt: 'Transparency matters. Here\'s exactly what data Nexus passes to Claude when generating your financial plan, and why each piece matters.', author: 'Aaron Romans', date: 'Mar 24, 2026', readTime: '5 min read' },
  { slug: 'real-limits-of-ai-financial-advice', tag: 'AI Planning', title: 'The real limits of AI financial advice (and when to call a human)', excerpt: 'AI financial tools are powerful — but they have blind spots. Knowing when to rely on them and when to call a licensed advisor could save you from costly mistakes.', author: 'Aaron Romans', date: 'Mar 10, 2026', readTime: '6 min read' },
  { slug: 'five-questions-to-ask-your-ai-planner', tag: 'AI Planning', title: '5 questions to ask your AI financial planner to get better answers', excerpt: 'The quality of AI financial advice depends heavily on how you ask. These five questions get you from generic recommendations to a plan you can actually follow.', author: 'Aaron Romans', date: 'Feb 24, 2026', readTime: '4 min read' },
  // Budgeting
  { slug: 'the-50-30-20-rule-is-outdated', tag: 'Budgeting', title: 'The 50/30/20 rule is outdated. Here\'s a better framework.', excerpt: 'Fixed percentage budgets ignore the reality of variable income, student loans, and rising rent. We break down a more flexible approach.', author: 'Aaron Romans', date: 'Apr 28, 2026', readTime: '5 min read' },
  { slug: 'how-to-budget-with-irregular-income', tag: 'Budgeting', title: 'How to budget when your income changes every month', excerpt: 'Freelancers, contractors, and commission earners can\'t just set a fixed budget and forget it. Here\'s a system that actually works for variable income.', author: 'Aaron Romans', date: 'Apr 3, 2026', readTime: '6 min read' },
  { slug: 'psychology-of-overspending', tag: 'Budgeting', title: 'The psychology of overspending: why you do it and how to stop', excerpt: 'Budgets don\'t fail because of math — they fail because of behavior. Understanding the psychology behind overspending is the first step to fixing it.', author: 'Aaron Romans', date: 'Mar 17, 2026', readTime: '5 min read' },
  // Investing
  { slug: 'etfs-vs-individual-stocks', tag: 'Investing', title: 'ETFs vs. individual stocks: what first-time investors actually need to know', excerpt: 'Before you buy your first share of anything, understand why your brokerage account structure matters more than which stock you pick.', author: 'Aaron Romans', date: 'Apr 21, 2026', readTime: '6 min read' },
  { slug: 'dollar-cost-averaging-explained', tag: 'Investing', title: 'Dollar-cost averaging: the boring strategy that actually works', excerpt: 'Trying to time the market is a losing game for most investors. Here\'s why consistent, automatic investing beats trying to be clever.', author: 'Aaron Romans', date: 'Apr 9, 2026', readTime: '5 min read' },
  { slug: 'roth-vs-traditional-ira', tag: 'Investing', title: 'Roth vs. Traditional IRA: which one should you choose?', excerpt: 'The answer depends on your current tax rate, expected future tax rate, and timeline. Here\'s how to think through it without a spreadsheet.', author: 'Aaron Romans', date: 'Mar 28, 2026', readTime: '6 min read' },
  // Debt
  { slug: 'avalanche-vs-snowball-debt-payoff', tag: 'Debt', title: 'Avalanche vs. snowball: which debt payoff method is right for you?', excerpt: 'The math favors avalanche. Human psychology often favors snowball. Here\'s how to decide — and why Nexus lets you run both.', author: 'Aaron Romans', date: 'Apr 14, 2026', readTime: '4 min read' },
  { slug: 'real-cost-of-minimum-payments', tag: 'Debt', title: 'The real cost of making minimum payments on your credit card', excerpt: 'That $5,000 balance at 22% APR will cost you far more than $5,000 if you only pay the minimum. The math is brutal — and most people don\'t know it.', author: 'Aaron Romans', date: 'Mar 20, 2026', readTime: '4 min read' },
  { slug: 'how-to-pay-off-credit-card-debt', tag: 'Debt', title: 'A step-by-step plan for paying off credit card debt this year', excerpt: 'A practical, no-fluff action plan for getting out of credit card debt — including how to find extra money in your budget you didn\'t know you had.', author: 'Aaron Romans', date: 'Mar 5, 2026', readTime: '7 min read' },
  // Tax
  { slug: 'tax-loss-harvesting-explained', tag: 'Tax', title: 'Tax-loss harvesting: the overlooked strategy that could save you thousands', excerpt: 'Most investors only think about taxes at filing time. But TLH is a year-round opportunity. Here\'s how it works in plain English.', author: 'Aaron Romans', date: 'Apr 7, 2026', readTime: '6 min read' },
  { slug: 'capital-gains-tax-explained', tag: 'Tax', title: 'Capital gains tax: short-term vs. long-term (and why it matters)', excerpt: 'Selling an investment held for 11 months vs. 13 months can change your tax bill by thousands of dollars. Here\'s what you need to know before you sell.', author: 'Aaron Romans', date: 'Mar 14, 2026', readTime: '5 min read' },
  { slug: 'reduce-your-tax-bill-legally', tag: 'Tax', title: '7 legal ways to reduce your tax bill before year-end', excerpt: 'Year-end tax planning isn\'t just for accountants. These seven moves can meaningfully reduce what you owe — if you act before December 31.', author: 'Aaron Romans', date: 'Feb 28, 2026', readTime: '7 min read' },
  // Goals
  { slug: 'why-savings-goals-fail', tag: 'Goals', title: 'Why most savings goals fail (and how to set ones that actually stick)', excerpt: 'Vague goals don\'t survive contact with real life. The fix is specific numbers, specific timelines, and a system that reminds you why.', author: 'Aaron Romans', date: 'Mar 31, 2026', readTime: '5 min read' },
  { slug: 'how-to-build-emergency-fund', tag: 'Goals', title: 'How to build a 6-month emergency fund (even on a tight budget)', excerpt: 'An emergency fund is the most important financial foundation you can build. Here\'s a realistic plan for getting there, step by step.', author: 'Aaron Romans', date: 'Mar 7, 2026', readTime: '5 min read' },
  { slug: 'saving-for-a-house-down-payment', tag: 'Goals', title: 'Saving for a house down payment in 2026: a realistic guide', excerpt: 'With home prices where they are, saving a down payment feels impossible. Here\'s a clear plan for getting there — including where to keep the money while you save.', author: 'Aaron Romans', date: 'Feb 18, 2026', readTime: '6 min read' },
]

const TAGS = ['All', 'AI Planning', 'Budgeting', 'Investing', 'Debt', 'Tax', 'Goals']

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'AI Planning': { bg: 'rgba(201,164,55,0.12)', text: '#6B5318' },
  'Budgeting':   { bg: 'var(--nx-pos-50)',       text: 'var(--nx-pos-700)' },
  'Investing':   { bg: 'var(--nx-navy-100)',      text: 'var(--nx-navy-700)' },
  'Debt':        { bg: 'var(--nx-neg-50)',        text: 'var(--nx-neg-700)' },
  'Tax':         { bg: 'var(--nx-warn-50)',       text: 'var(--nx-warn-700)' },
  'Goals':       { bg: 'var(--nx-cream-200)',     text: 'var(--nx-ink-600)' },
}

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag] ?? { bg: 'var(--nx-cream-200)', text: 'var(--nx-ink-600)' }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, background: colors.bg, color: colors.text }}>
      {tag}
    </span>
  )
}

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState('All')
  const filtered = activeTag === 'All' ? POSTS : POSTS.filter(p => p.tag === activeTag)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)' }}>
      <NavBar />

      {/* Header */}
      <section style={{ padding: '72px 48px 48px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', borderRadius: 999, marginBottom: 20, background: 'var(--nx-gold-100)', border: '1px solid var(--nx-gold-200)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B5318' }}>Nexus Journal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', lineHeight: 1.1 }}>
            Financial clarity,<br />
            <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>in plain English.</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 320, paddingBottom: 4 }}>
            Practical guides, honest takes, and the thinking behind how Nexus works.
          </p>
        </div>
      </section>

      {/* Tag filters */}
      <section style={{ padding: '0 48px 40px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--nx-cream-300)' }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => setActiveTag(t)} style={{
              fontSize: 13.5, fontWeight: activeTag === t ? 600 : 500,
              padding: '6px 16px', borderRadius: 999, cursor: 'pointer',
              background: activeTag === t ? 'var(--nx-navy-800)' : 'transparent',
              color: activeTag === t ? 'var(--nx-cream-50)' : 'var(--nx-ink-600)',
              border: activeTag === t ? '1px solid var(--nx-navy-800)' : '1px solid var(--nx-cream-300)',
              fontFamily: 'var(--font-sans)', transition: 'all 150ms',
            }}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Featured post — only show when All is selected */}
      {activeTag === 'All' && (
        <section style={{ padding: '0 48px 56px', maxWidth: 1080, margin: '0 auto' }}>
          <Link href={`/blog/${FEATURED.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--nx-navy-800)', borderRadius: 18, padding: '52px 56px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
              cursor: 'pointer',
            }}>
              <div>
                <TagPill tag={FEATURED.tag} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', lineHeight: 1.25, marginTop: 16, marginBottom: 16 }}>
                  {FEATURED.title}
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--nx-navy-300)', marginBottom: 28 }}>{FEATURED.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--nx-gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--nx-navy-900)' }}>
                      {FEATURED.author[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-cream-50)' }}>{FEATURED.author}</div>
                      <div style={{ fontSize: 11, color: 'var(--nx-navy-400)' }}>{FEATURED.date} · {FEATURED.readTime}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--nx-gold-400)' }}>Read more →</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Budgeting basics', 'AI-powered planning', 'Debt strategy', 'Tax optimization', 'Goal setting'].map((topic, i) => (
                  <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--nx-navy-700)', opacity: 1 - i * 0.15 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nx-gold-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--nx-cream-200)' }}>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Post grid */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1080, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No posts in this category yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {filtered.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  background: 'var(--nx-white)', borderRadius: 14, padding: '26px 24px',
                  border: '1px solid var(--nx-cream-300)',
                  boxShadow: '0 2px 8px rgba(11,31,58,0.05)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  cursor: 'pointer', height: '100%',
                }}>
                  <TagPill tag={post.tag} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--nx-navy-900)', lineHeight: 1.35 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)', flex: 1 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--nx-cream-200)', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--nx-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--nx-cream-50)', fontFamily: 'var(--font-display)' }}>
                        {post.author[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-navy-800)' }}>{post.author}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{post.date} · {post.readTime}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--nx-gold-600)', fontWeight: 600 }}>Read →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section style={{ padding: '72px 48px', background: 'var(--nx-navy-800)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', marginBottom: 14, lineHeight: 1.15 }}>
          Get new posts in your inbox.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--nx-navy-300)', marginBottom: 28 }}>No spam. Just practical personal finance, once a week.</p>
        <div style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto', justifyContent: 'center' }}>
          <input type="email" placeholder="you@example.com" style={{ flex: 1, padding: '11px 16px', borderRadius: 7, border: '1px solid var(--nx-navy-600)', background: 'rgba(255,255,255,0.06)', color: 'var(--nx-cream-50)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)' }} readOnly />
          <button style={{ fontSize: 14, fontWeight: 600, padding: '11px 22px', borderRadius: 7, background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Subscribe</button>
        </div>
      </section>

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
