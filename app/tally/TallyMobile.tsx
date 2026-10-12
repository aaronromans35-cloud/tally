'use client'
/**
 * Tally — iPhone layout.
 *
 * The design handoff has no mobile breakpoints ("the app assumes ≥1240px"), so
 * this is a new mobile-first layout, not a reflow: a fixed bottom tab bar, one
 * column of cards, bigger touch targets, a tighter type scale. It reads the same
 * `deriveModel()` output as the desktop app — only the containers change.
 */
import { useState } from 'react'
import Link from 'next/link'
import { BODY, DISPLAY, MONO, css as c, sx } from './lib'
import type { TallyModel } from './model'
import { AddTransaction, HiddenHistory, ImportCsv, PlanSwitcher, UpgradeNote } from './components'

const mono = (x: string) => sx(c(x), { fontFamily: MONO })
const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })

const CARD = 'background:#ffffff;border:1px solid #e0ded4;border-radius:20px;padding:18px'
const DARK = 'background:#14140f;color:#f5f4ef;border-radius:22px;padding:20px'
const LIME = 'background:#cdf06a;border-radius:22px;padding:20px'
const KICKER = "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px"
const H2 = 'font-size:16px;font-weight:700;letter-spacing:-0.02em;margin:0'
const linkBtn = c('font-size:13px;font-weight:600;color:#1c6a48;background:none;border:none;cursor:pointer;padding:0')

export default function MobileShell({ m }: { m: TallyModel }) {
  return (
    <div style={sx(c('background:#f0eee6;color:#14140f;min-height:100vh'), { fontFamily: BODY, paddingBottom: 82 })}>
      <MHeader />
      <main style={c('padding:14px 14px 28px;display:flex;flex-direction:column;gap:12px')}>
        {m.isToday && <MToday m={m} />}
        {m.isSpending && <MSpending m={m} />}
        {m.isGoals && <MGoals m={m} />}
        {m.isSubs && <MSubs m={m} />}
        {m.isRecap && <MRecap m={m} />}
        {m.isAccounts && <MAccounts m={m} />}
      </main>
      <MTabBar m={m} />
    </div>
  )
}

/* ─────────────────────────── chrome ─────────────────────────── */

function Mark() {
  return (
    <div style={c('width:24px;height:24px;background:#1c6a48;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex:none')}>
      <div style={c('width:10px;height:2.5px;border-radius:3px;background:#cdf06a')} />
      <div style={c('width:13px;height:2.5px;border-radius:3px;background:#9fd35a')} />
      <div style={c('width:16px;height:2.5px;border-radius:3px;background:#f5f4ef')} />
    </div>
  )
}

function MHeader() {
  return (
    <header
      style={c(
        'position:sticky;top:0;z-index:30;background:rgba(240,238,230,0.92);backdrop-filter:blur(10px);border-bottom:1px solid #ddd9cc;padding:10px 16px;display:flex;align-items:center;gap:12px',
      )}
    >
      <Mark />
      <span style={display('font-weight:700;font-size:17px;letter-spacing:-0.02em')}>Tally</span>
      <div style={c('display:flex;align-items:center;gap:6px;margin-left:auto')}>
        <div style={c('width:6px;height:6px;border-radius:99px;background:#1c6a48')} />
        <span style={mono('font-size:10px;color:#4a4941')}>Synced 4m ago</span>
      </div>
      <Link
        href="/tally/account"
        aria-label="Account"
        style={sx(
          c('width:30px;height:30px;border-radius:99px;background:#cdf06a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#14140f;flex:none'),
          { fontFamily: DISPLAY },
        )}
      >
        JR
      </Link>
    </header>
  )
}

function TabIcon({ name }: { name: string }) {
  const p: Record<string, React.ReactNode> = {
    today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>,
    spending: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
    goals: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    subs: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
    recap: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    accounts: <><path d="M3 21h18M4 21V9l8-5 8 5v12M9 21v-6h6v6" /></>,
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  )
}

function MTabBar({ m }: { m: TallyModel }) {
  const items = [
    { key: 'today', label: 'Today', icon: 'today', on: m.isToday, badge: m.tabs.find((t) => t.label === 'Today')?.badge },
    { key: 'spending', label: 'Spend', icon: 'spending', on: m.isSpending, badge: '' },
    { key: 'goals', label: 'Goals', icon: 'goals', on: m.isGoals, badge: '' },
    { key: 'subs', label: 'Subs', icon: 'subs', on: m.isSubs, badge: m.tabs.find((t) => t.label === 'Subscriptions')?.badge },
    { key: 'recap', label: 'Recap', icon: 'recap', on: m.isRecap, badge: '' },
    { key: 'accounts', label: 'Acct', icon: 'accounts', on: m.isAccounts, badge: '' },
  ]
  const goByLabel = (label: string) => m.tabs.find((t) => t.label === label)?.go
  const jump: Record<string, (() => void) | undefined> = {
    today: goByLabel('Today'),
    spending: goByLabel('Spending'),
    goals: goByLabel('Goals'),
    subs: goByLabel('Subscriptions'),
    recap: goByLabel('Recap'),
    accounts: goByLabel('Accounts'),
  }
  return (
    <nav
      style={sx(
        c('position:fixed;left:0;right:0;bottom:0;z-index:40;background:#ffffff;border-top:1px solid #ddd9cc;display:flex;padding:6px 4px'),
        { paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))' },
      )}
    >
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={jump[it.key]}
          style={sx(
            c('flex:1;min-width:0;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 1px;position:relative'),
            { color: it.on ? '#1c6a48' : '#8a8980', fontFamily: BODY },
          )}
        >
          <TabIcon name={it.icon} />
          <span style={{ fontSize: 9, fontWeight: it.on ? 600 : 500 }}>{it.label}</span>
          {it.badge ? (
            <span style={c('position:absolute;top:1px;right:calc(50% - 16px);min-width:13px;height:13px;padding:0 3px;border-radius:99px;background:#cdf06a;color:#14140f;font-size:8px;display:flex;align-items:center;justify-content:center')}>
              {it.badge}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  )
}

/* ─────────────────────────── Today ─────────────────────────── */

function MToday({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:23px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>Hey Jordan</h1>
        <p style={c('font-size:13px;color:#4a4941;margin:0 0 2px')}>{m.dashSub}</p>
        <div style={mono('font-size:11px;color:#6b6a60')}>{m.todayLabel}</div>
      </div>

      {/* streak */}
      <div style={c(DARK)}>
        <div style={sx(c(KICKER), { color: '#a8a69b' })}>Current streak</div>
        <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:6px')}>
          <span style={display('font-size:56px;font-weight:700;letter-spacing:-0.05em;line-height:0.86')}>{m.streak}</span>
          <span style={c('font-size:16px;color:#cdf06a;font-weight:600')}>days</span>
        </div>
        <div style={c('font-size:13px;color:#a8a69b;margin-bottom:16px')}>
          {m.level} · {m.freezeNote}
        </div>

        <div style={c('display:grid;grid-template-columns:repeat(14,1fr);gap:4px;margin-bottom:12px')}>
          {m.days.map((d, i) => (
            <div key={i} style={c('display:flex;flex-direction:column;gap:5px')}>
              <div style={sx(c(d.bigStyle), { height: 34 })} title={d.tip} />
              <div style={mono('font-size:8px;text-align:center;color:#a8a69b')}>{d.label}</div>
            </div>
          ))}
        </div>
        <div style={c('display:flex;gap:14px;flex-wrap:wrap;padding-top:12px;border-top:1px solid #2c2c24;margin-bottom:16px')}>
          {m.legend.map((l, i) => (
            <div key={i} style={c('display:flex;align-items:center;gap:6px')}>
              <div style={c(l.swatch)} />
              <span style={mono('font-size:10px;color:#a8a69b')}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={c('padding-top:14px;border-top:1px solid #2c2c24')}>
          <div style={sx(c(KICKER), { color: '#a8a69b' })}>Next level · {m.nextLevel}</div>
          <div style={c('height:7px;border-radius:99px;background:#2c2c24;overflow:hidden;margin-bottom:10px')}>
            <div style={c(m.tierFill)} />
          </div>
          <div style={c('font-size:12px;line-height:1.5;color:#a8a69b')}>{m.tierNote}</div>
          <div style={c('font-size:11px;line-height:1.5;color:#8a8a7e;margin-bottom:10px')}>{m.levelPerk}</div>
          <div style={c('font-size:12px;line-height:1.5;margin-bottom:12px;color:' + (m.todayTask ? '#e0a03a' : '#cdf06a'))}>
            {m.todayTask ? m.todayTask.text : m.streakCheckin}
          </div>
          <button type="button" onClick={m.markReviewed} style={c(m.todayChipStyle)}>
            {m.todayChip}
          </button>
        </div>
      </div>

      {/* safe to spend */}
      <div style={c(LIME)}>
        <div style={sx(c(KICKER), { color: '#3d5410' })}>Safe to spend this week</div>
        <div style={display('font-size:42px;font-weight:700;letter-spacing:-0.045em;line-height:1;margin-bottom:6px')}>
          {m.safeToSpend}
        </div>
        <div style={c('font-size:13px;color:#2c3b0d;margin-bottom:16px')}>{m.safeNote}</div>
        <div style={c('display:flex;flex-direction:column;gap:8px;padding-top:14px;border-top:2px solid rgba(20,20,15,0.16)')}>
          {m.safeRows.map((r, i) => (
            <div key={i} style={c('display:flex;justify-content:space-between;font-size:13px;color:#2c3b0d')}>
              <span>{r.label}</span>
              <span style={mono('font-weight:500')}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={c('margin-top:14px;padding-top:14px;border-top:2px solid rgba(20,20,15,0.16)')}>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
            <span style={sx(c('font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase'), { color: '#3d5410' })}>
              Lowest ahead
            </span>
            <span style={mono('font-size:12px;font-weight:500;color:#2c3b0d')}>
              {m.forecastLow} · {m.forecastLowLabel}
            </span>
          </div>
          <div style={c('display:flex;align-items:flex-end;gap:2px;height:48px;margin-bottom:8px')}>
            {m.forecastBars.map((b, i) => (
              <div key={i} style={c(b.barStyle)} />
            ))}
          </div>
          <div style={c('font-size:12px;line-height:1.5;color:#2c3b0d')}>{m.forecastNote}</div>
        </div>
      </div>

      {/* buckets */}
      <div style={c(CARD)}>
        <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px')}>
          <h2 style={display(H2)}>Buckets · {m.monthName}</h2>
          <button type="button" onClick={m.goSpending} style={linkBtn}>Manage</button>
        </div>
        <div style={c('display:flex;flex-direction:column;gap:14px')}>
          {m.buckets.map((b) => (
            <div key={b.id} onClick={b.go} style={c('cursor:pointer')}>
              <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px')}>
                <span style={c('font-size:14px;font-weight:600')}>
                  {b.name} <span style={mono('font-size:11px;color:#6b6a60')}>{b.used} of {b.limit}</span>
                </span>
                <span style={c(b.paceStyle)}>{b.pace}</span>
              </div>
              <div style={c('height:7px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                <div style={c(b.fill)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* summary tiles */}
      <div style={c('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
        <button type="button" onClick={m.goSubs} style={sx(c(CARD), { textAlign: 'left', cursor: 'pointer', fontFamily: BODY })}>
          <div style={sx(c(KICKER), { color: '#6b6a60' })}>Subscriptions</div>
          <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:8px')}>{m.subsMonthly}</div>
          <div style={c(m.trialStyle)}>{m.trialNote}</div>
        </button>
        <button type="button" onClick={m.goGoals} style={sx(c(CARD), { textAlign: 'left', cursor: 'pointer', fontFamily: BODY })}>
          <div style={sx(c(KICKER), { color: '#6b6a60' })}>Goals</div>
          <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:8px')}>{m.goalsSaved}</div>
          <div style={c('font-size:12px;line-height:1.45;color:#4a4941')}>{m.goalsNote}</div>
        </button>
        <div style={c(DARK)}>
          <div style={sx(c(KICKER), { color: '#a8a69b' })}>Streak</div>
          <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:8px')}>
            {m.streak} <span style={c('font-size:12px;color:#a8a69b')}>· {m.level}</span>
          </div>
          <div style={c('font-size:12px;line-height:1.45;color:#a8a69b')}>{m.tierNote}</div>
        </div>
        <button type="button" onClick={m.goRecap} style={sx(c(CARD), { textAlign: 'left', cursor: 'pointer', fontFamily: BODY })}>
          <div style={sx(c(KICKER), { color: '#6b6a60' })}>This week</div>
          <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:8px')}>$86</div>
          <div style={c('font-size:12px;line-height:1.45;color:#4a4941')}>Sunday recap is ready.</div>
        </button>
      </div>

      {/* month progress */}
      <div style={c(CARD)}>
        <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px')}>
          <h2 style={display(H2)}>{m.monthName} so far</h2>
          <span style={mono('font-size:11px;color:#6b6a60')}>day {m.dayOfMonth} of 31</span>
        </div>
        <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:12px')}>
          <span style={display('font-size:34px;font-weight:700;letter-spacing:-0.035em;line-height:1')}>{m.monthSpent}</span>
          <span style={c('font-size:13px;color:#4a4941')}>of {m.monthBudget}</span>
        </div>
        <div style={c('height:9px;border-radius:99px;background:#eae8de;overflow:hidden;margin-bottom:8px')}>
          <div style={c(m.monthFill)} />
        </div>
        <div style={mono('display:flex;justify-content:space-between;font-size:10px;color:#6b6a60;margin-bottom:14px')}>
          <span>{m.monthPctLabel} spent</span>
          <span>{m.monthTimeLabel} of month gone</span>
        </div>
        <div style={c(m.monthVerdictStyle)}>{m.monthVerdict}</div>
      </div>

      {/* where it goes */}
      <div style={c(CARD)}>
        <h2 style={sx(display(H2), { marginBottom: 12 })}>Where it goes</h2>
        {m.topMerchants.map((mm, i) => (
          <div key={i} style={c('display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid #f0eee5')}>
            <div>
              <div style={c('font-size:13px;margin-bottom:5px')}>{mm.name}</div>
              <div style={c('height:5px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                <div style={c(mm.fill)} />
              </div>
            </div>
            <div style={c('text-align:right')}>
              <div style={mono('font-size:13px')}>{mm.amount}</div>
              <div style={mono('font-size:10px;color:#6b6a60')}>{mm.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* contextual insights */}
      {m.insights.slice(0, 2).map((ins, i) => (
        <div key={i} style={c(ins.wrapStyle.replace('padding:26px 30px', 'padding:18px'))}>
          <div style={sx(c('font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px'), { color: ins.kickerColor })}>
            {i === 0 ? 'Pattern Tally noticed' : 'Also worth knowing'}
          </div>
          <div style={display('font-size:17px;font-weight:700;letter-spacing:-0.025em;line-height:1.25;margin-bottom:6px')}>
            {ins.title}
          </div>
          <div style={sx(c('font-size:12px;line-height:1.5;' + (ins.cta ? 'margin-bottom:12px' : '')), { color: ins.bodyColor })}>
            {ins.body}
          </div>
          {ins.cta ? (
            <button
              type="button"
              onClick={ins.go}
              style={sx(c('font-size:13px;font-weight:600;width:100%;min-height:42px;border:none;border-radius:12px;background:#14140f;color:#f5f4ef;cursor:pointer'), { fontFamily: BODY })}
            >
              {ins.cta}
            </button>
          ) : null}
        </div>
      ))}

      {/* recent */}
      <div style={c(CARD)}>
        <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px')}>
          <h2 style={display(H2)}>Recent activity</h2>
          <button type="button" onClick={m.goSpending} style={linkBtn}>All</button>
        </div>
        {m.recent.map((t, i) => (
          <div key={i} style={c('display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f0eee5')}>
            <div>
              <div style={c('font-size:14px;margin-bottom:3px')}>{t.name}</div>
              <div style={c('display:flex;gap:8px;align-items:center')}>
                <span style={mono('font-size:10px;color:#6b6a60')}>{t.day}</span>
                <span style={c(t.catStyle)}>{t.cat}</span>
              </div>
            </div>
            <span style={c(t.amtStyle)}>{t.amount}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ─────────────────────────── Spending ─────────────────────────── */

function MSpending({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>Spending</h1>
        <p style={c('font-size:13px;color:#4a4941;margin:0')}>Tap a category on any transaction to fix it.</p>
      </div>

      <PlanSwitcher m={m} />
      <AddTransaction m={m} compact />
      <ImportCsv m={m} />

      <div style={c(CARD)}>
        <div style={c('display:flex;gap:6px;overflow-x:auto;margin-bottom:16px;padding-bottom:2px')}>
          {m.periods.map((p, i) => (
            <button key={i} type="button" onClick={p.pick} style={sx(c(p.style), { flex: 'none' })}>{p.label}</button>
          ))}
        </div>
        <div style={mono('font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6a60;margin-bottom:6px')}>{m.periodTitle}</div>
        <div style={display('font-size:44px;font-weight:700;letter-spacing:-0.045em;line-height:1;margin-bottom:6px')}>{m.periodTotal}</div>
        <div style={c(m.periodDeltaStyle)}>{m.periodDelta}</div>
        <div style={c('display:flex;align-items:flex-end;gap:6px;height:130px;margin:16px 0')}>
          {m.periodBars.map((b, i) => (
            <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
              <div style={c(b.valStyle)}>{b.value}</div>
              <div style={c('height:90px;flex:none;display:flex;align-items:flex-end;justify-content:center')}>
                <div style={sx(c(b.bar), { maxWidth: 22 })} />
              </div>
              <div style={c(b.labelStyle)}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={c('display:flex;flex-direction:column;gap:9px;padding-top:14px;border-top:1px solid #eae8de;margin-bottom:12px')}>
          {m.periodStats.map((r, i) => (
            <div key={i} style={c('display:flex;justify-content:space-between;font-size:13px')}>
              <span style={c('color:#4a4941')}>{r.label}</span>
              <span style={mono('font-weight:500')}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={c('font-size:13px;line-height:1.55;color:#4a4941')}>{m.periodInsight}</div>
      </div>

      <div style={c('display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:0 2px')}>
        <h2 style={display(H2)}>Your categories</h2>
        <span style={mono('font-size:10px;color:#6b6a60')}>rename · spend/save · ± $5</span>
      </div>
      {m.buckets.map((b) => (
        <div key={b.id} style={c(CARD)}>
          <div style={c('display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px')}>
            <input
              value={b.name}
              onChange={(e) => b.rename(e.target.value)}
              aria-label="Category name"
              style={sx(c('font-size:15px;font-weight:600;color:#14140f;background:transparent;border:none;padding:2px 0;min-width:0;flex:1;outline:none'), { fontFamily: BODY })}
            />
            <button type="button" onClick={b.toggleKind} style={mono('font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid #e0ded4;background:transparent;color:#6b6a60')}>
              {b.kind === 'save' ? 'saving' : 'spending'}
            </button>
            <button
              type="button"
              onClick={b.remove}
              aria-label={`Remove ${b.name}`}
              style={c('width:26px;height:26px;border-radius:8px;border:1px solid #e0ded4;background:transparent;color:#9a988c;cursor:pointer;font-size:14px;line-height:1;flex:none')}
            >
              ×
            </button>
          </div>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
            <span style={display('font-size:24px;font-weight:700;letter-spacing:-0.025em;line-height:1')}>{b.used}</span>
            <span style={c(b.paceStyle)}>{b.pace}</span>
          </div>
          <div style={c('height:7px;border-radius:99px;background:#eae8de;overflow:hidden;margin-bottom:12px')}>
            <div style={c(b.fill)} />
          </div>
          <div style={c('display:flex;align-items:center;gap:8px')}>
            <button type="button" onClick={b.down} style={sx(c(b.stepStyle), { width: 40, height: 40 })}>−</button>
            <span style={mono('font-size:12px;color:#4a4941;flex:1;text-align:center')}>limit {b.limit}</span>
            <button type="button" onClick={b.up} style={sx(c(b.stepStyle), { width: 40, height: 40 })}>+</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={m.addBucket}
        disabled={!m.canAddBucket}
        style={sx(
          c(
            `background:transparent;border:1px dashed #cac7bc;border-radius:20px;padding:18px;cursor:${m.canAddBucket ? 'pointer' : 'default'};color:#4a4941;font-size:14px;font-weight:600;opacity:${m.canAddBucket ? 1 : 0.5}`,
          ),
          { fontFamily: BODY },
        )}
      >
        {m.canAddBucket ? '+ Add a category' : `${m.planName} caps you at ${m.ent.maxBuckets}`}
      </button>
      {!m.canAddBucket && (
        <UpgradeNote m={m} need="starter" text="Unlimited buckets, so your budget matches how you actually spend." />
      )}

      <div style={c(CARD)}>
        <h2 style={sx(display(H2), { marginBottom: 12 })}>Transactions</h2>
        <div style={c('display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px')}>
          {m.filters.map((f, i) => (
            <button key={i} type="button" onClick={f.pick} style={sx(c(f.style), { flex: 'none' })}>{f.label}</button>
          ))}
        </div>
        {m.txns.length === 0 && (
          <p style={c('font-size:13px;color:#6b6a60;margin:4px 0')}>
            Nothing yet. Add one above and it shows up instantly.
          </p>
        )}
        {m.txns.map((t) => (
          <div key={t.id} style={c('padding:12px 0;border-bottom:1px solid #f0eee5')}>
            <div style={c('display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:8px')}>
              <span style={c('font-size:14px')}>
                <span style={mono('font-size:10px;color:#6b6a60;margin-right:8px')}>{t.day}</span>
                {t.name}
              </span>
              <span style={c('display:flex;align-items:center;gap:10px')}>
                <span style={c(t.amtStyle)}>{t.amount}</span>
                <button
                  type="button"
                  onClick={t.remove}
                  aria-label={`Delete ${t.name}`}
                  style={c('width:30px;height:30px;border-radius:9px;border:1px solid #e0ded4;background:transparent;color:#6b6a60;cursor:pointer;font-size:15px;line-height:1;flex:none')}
                >
                  ×
                </button>
              </span>
            </div>
            <div style={c('display:flex;gap:5px;flex-wrap:wrap')}>
              {t.cats.map((cat, j) => (
                <button key={j} type="button" onClick={cat.pick} style={c(cat.style)}>{cat.label}</button>
              ))}
            </div>
            {t.flag ? <div style={sx(c(t.flagStyle), { display: 'inline-block', marginTop: 8 })}>{t.flag}</div> : null}
          </div>
        ))}
        <div style={c('margin-top:12px')}>
          <HiddenHistory m={m} />
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────── Goals ─────────────────────────── */

function MGoals({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>Goals</h1>
        <p style={c('font-size:13px;color:#4a4941;margin:0')}>
          Tally can&apos;t move your money. It tells you the transfer, then confirms it landed.
        </p>
      </div>
      {m.goals.map((g, i) => (
        <div key={i} style={c(CARD)}>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px')}>
            <span style={display('font-size:19px;font-weight:700;letter-spacing:-0.02em')}>{g.name}</span>
            <span style={c(g.paceStyle)}>{g.pace}</span>
          </div>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
            <span style={display('font-size:22px;font-weight:700;letter-spacing:-0.02em')}>{g.saved}</span>
            <span style={mono('font-size:11px;color:#6b6a60')}>of {g.target} · {g.due}</span>
          </div>
          <div style={c('height:8px;border-radius:99px;background:#eae8de;overflow:hidden;margin-bottom:14px')}>
            <div style={c(g.fill)} />
          </div>
          <div style={sx(c(g.suggestStyle), { textAlign: 'left', marginBottom: 8 })}>{g.suggest}</div>
          <button type="button" onClick={g.act} style={sx(c(g.btnStyle), { width: '100%' })}>{g.btnLabel}</button>
        </div>
      ))}
    </>
  )
}


/* ─────────────────────────── Subscriptions ─────────────────────────── */

function MSubs({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>Subscriptions</h1>
        <p style={c('font-size:13px;color:#4a4941;margin:0')}>Found by matching recurring charges.</p>
      </div>
      <div style={c('display:flex;gap:22px;padding:0 2px')}>
        {m.subStats.map((s, i) => (
          <div key={i}>
            <div style={mono('font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:4px')}>{s.label}</div>
            <div style={display('font-size:20px;font-weight:700;letter-spacing:-0.025em;line-height:1')}>{s.value}</div>
          </div>
        ))}
      </div>
      {m.subs.map((s, i) => (
        <div key={i} style={sx(c(s.rowStyle), { display: 'block', padding: 18 })}>
          <div style={c('display:flex;align-items:center;gap:8px;margin-bottom:4px')}>
            <span style={c('font-size:16px;font-weight:600')}>{s.name}</span>
            <span style={c(s.tagStyle)}>{s.tag}</span>
          </div>
          <div style={mono('font-size:11px;color:#4a4941;margin-bottom:12px')}>{s.meta}</div>
          <div style={c('display:flex;justify-content:space-between;align-items:center;gap:10px')}>
            <div>
              <span style={display('font-size:20px;font-weight:700;letter-spacing:-0.02em')}>{s.price}</span>
              <span style={mono('font-size:10px;color:#6b6a60;margin-left:8px')}>{s.yearly}/yr</span>
            </div>
            <button type="button" onClick={s.act} style={c(s.btnStyle)}>{s.btnLabel}</button>
          </div>
        </div>
      ))}
      <div style={c('background:#e6e3d8;border-radius:18px;padding:16px;font-size:12px;line-height:1.6;color:#4a4941')}>
        Tally can&apos;t cancel for you — it gives you the exact steps for each merchant, then confirms
        the charge stopped on your next sync.
      </div>
    </>
  )
}

/* ─────────────────────────── Recap ─────────────────────────── */

function MShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          /* no-op */
        }
      }}
      style={sx(
        c('font-size:13px;font-weight:600;width:100%;min-height:44px;border:1px solid #14140f;border-radius:12px;background:transparent;color:#14140f;cursor:pointer'),
        { fontFamily: BODY },
      )}
    >
      {copied ? 'Copied ✓' : 'Share recap'}
    </button>
  )
}

function MRecap({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>{m.weekLabel}</h1>
        <div style={mono('font-size:11px;color:#6b6a60')}>Week 34 · 5 of 7 days logged</div>
      </div>

      <div style={c(LIME)}>
        <div style={display('font-size:20px;font-weight:700;letter-spacing:-0.03em;line-height:1.25')}>
          {m.recapHeadline}
        </div>
        <div style={mono('font-size:11px;color:#3d5410;margin:8px 0 14px')}>{m.recapSubhead}</div>
        <MShareButton text={m.recapShareText} />
      </div>

      <div style={c(DARK)}>
        <div style={sx(c(KICKER), { color: '#a8a69b' })}>Spent this week</div>
        <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:18px')}>
          <span style={display('font-size:44px;font-weight:700;letter-spacing:-0.045em;line-height:1')}>$86</span>
          <span style={c('font-size:13px;color:#cdf06a')}>$18 less than last week</span>
        </div>
        <div style={c('display:flex;flex-direction:column;gap:12px')}>
          {m.recapBars.map((r, i) => (
            <div key={i}>
              <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px')}>
                <span style={c('font-size:13px')}>{r.name}</span>
                <span style={mono('font-size:11px;color:#b6b4a8')}>{r.delta}</span>
              </div>
              <div style={c('height:6px;background:#2c2c24;border-radius:99px;overflow:hidden')}>
                <div style={c(r.fill)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={c(LIME)}>
        <div style={sx(c(KICKER), { color: '#3d5410' })}>Win of the week</div>
        <div style={c('font-size:16px;font-weight:600;line-height:1.4')}>{m.recapWin}</div>
      </div>

      <div style={sx(c(m.watchCardStyle), { padding: 20 })}>
        <div style={sx(c(m.watchKickerStyle), { fontFamily: MONO })}>{m.watchKicker}</div>
        <div style={c('font-size:16px;font-weight:600;line-height:1.4;margin-bottom:14px')}>{m.watchText}</div>
        <button
          type="button"
          onClick={m.goSpending}
          style={sx(c('font-size:13px;font-weight:600;width:100%;min-height:42px;border:1px solid #14140f;border-radius:12px;background:transparent;cursor:pointer'), { fontFamily: BODY })}
        >
          {m.watchCta}
        </button>
      </div>

      <div style={c(CARD)}>
        <div style={mono('font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>Top merchants</div>
        {m.merchants.map((mm, i) => (
          <div key={i} style={c('display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #f0eee5')}>
            <div>
              <div style={c('font-size:14px;margin-bottom:5px')}>{mm.name}</div>
              <div style={c('height:5px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                <div style={c(mm.fill)} />
              </div>
            </div>
            <div style={c('text-align:right')}>
              <div style={mono('font-size:13px')}>{mm.amount}</div>
              <div style={mono('font-size:10px;color:#6b6a60')}>{mm.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={c(CARD)}>
        <div style={mono('font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>When you spend</div>
        <div style={c('display:flex;align-items:flex-end;gap:8px;height:120px;margin-bottom:14px')}>
          {m.dayPattern.map((d, i) => (
            <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
              <div style={c(d.valStyle)}>{d.value}</div>
              <div style={c('height:80px;flex:none;display:flex;align-items:flex-end;justify-content:center')}>
                <div style={sx(c(d.bar), { maxWidth: 22 })} />
              </div>
              <div style={c(d.labelStyle)}>{d.label}</div>
            </div>
          ))}
        </div>
        <div style={c('font-size:13px;line-height:1.5;color:#4a4941')}>{m.dayInsight}</div>
      </div>

      <div style={c('display:flex;flex-direction:column;gap:10px')}>
        {m.weekStats.map((w, i) => (
          <div key={i} style={sx(c(CARD), { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' })}>
            <div>
              <div style={mono('font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:4px')}>{w.label}</div>
              <div style={c(w.noteStyle)}>{w.note}</div>
            </div>
            <div style={display('font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:1')}>{w.value}</div>
          </div>
        ))}
      </div>

      <div style={c(CARD)}>
        <div style={mono('font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>Last four weeks</div>
        <div style={c('display:flex;align-items:flex-end;gap:10px;height:100px')}>
          {m.fourWeeks.map((w, i) => (
            <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
              <div style={c(w.valStyle)}>{w.value}</div>
              <div style={c('height:60px;flex:none;display:flex;align-items:flex-end')}>
                <div style={c(w.bar)} />
              </div>
              <div style={c(w.labelStyle)}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────── Accounts ─────────────────────────── */

function MAccounts({ m }: { m: TallyModel }) {
  return (
    <>
      <div>
        <h1 style={display('font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0 0 3px')}>Connected accounts</h1>
        <p style={c('font-size:13px;color:#4a4941;margin:0')}>Read-only through Plaid. Tally can see these — it cannot move anything.</p>
      </div>
      {m.accounts.map((a, i) => (
        <div key={i} style={sx(c(CARD), { display: 'block' })}>
          <div style={c('display:flex;align-items:center;gap:12px;margin-bottom:12px')}>
            <div style={c(a.dot)} />
            <div style={c('flex:1')}>
              <div style={c('font-size:16px;font-weight:600')}>{a.name}</div>
              <div style={mono('font-size:11px;color:#4a4941')}>{a.meta}</div>
            </div>
          </div>
          <div style={c('display:flex;justify-content:space-between;align-items:center;gap:10px')}>
            <span style={display('font-size:22px;font-weight:700;letter-spacing:-0.02em')}>{a.balance}</span>
            <button type="button" onClick={a.act} style={c(a.btnStyle)}>{a.btnLabel}</button>
          </div>
        </div>
      ))}

      <div style={c('background:#ffffff;border:1px dashed #cac7bc;border-radius:20px;padding:22px;text-align:center')}>
        <div style={c('font-size:15px;font-weight:600;margin-bottom:4px')}>Add another account</div>
        <div style={c('font-size:12px;color:#4a4941;margin-bottom:14px')}>Checking, savings, or a card.</div>
        <button
          type="button"
          style={sx(c('font-size:14px;font-weight:600;width:100%;min-height:46px;border:none;border-radius:12px;background:#1c6a48;color:#f7fbf6;cursor:pointer'), { fontFamily: BODY })}
        >
          Connect with Plaid
        </button>
      </div>

      <div style={c(DARK)}>
        <div style={sx(c(KICKER), { color: '#a8a69b' })}>What Tally can and cannot do</div>
        <div style={c('font-size:13px;font-weight:600;color:#cdf06a;margin-bottom:10px')}>Can</div>
        <div style={c('display:flex;flex-direction:column;gap:8px;margin-bottom:18px')}>
          {m.canDo.map((cd, i) => <div key={i} style={c('font-size:13px;color:#b6b4a8')}>{cd}</div>)}
        </div>
        <div style={c('font-size:13px;font-weight:600;color:#cdf06a;margin-bottom:10px')}>Cannot</div>
        <div style={c('display:flex;flex-direction:column;gap:8px')}>
          {m.cannotDo.map((cd, i) => <div key={i} style={c('font-size:13px;color:#b6b4a8')}>{cd}</div>)}
        </div>
      </div>

      <Link href="/tally/account" style={sx(c('text-align:center;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6a60'), { fontFamily: MONO })}>
        Account Sign in / manage accountamp; settings
      </Link>
    </>
  )
}
