'use client'
/**
 * Tally — signed-in web app.
 *
 * Port of "Tally App v5.dc.html". The design's template markup becomes JSX here;
 * every inline style string is passed through `css()` so this file stays close
 * to the source. All display values come from `deriveModel()` — see model.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { BODY, DISPLAY, MONO, css as c, Hover, sx } from './lib'
import { deriveModel, initialState, type Page, type TallyModel, type TallyState } from './model'
import { loadState, saveState } from './storage'
import { AddTransaction, HiddenHistory, ImportCsv, PlanSwitcher, UpgradeNote } from './components'
import Coach from './Coach'
import MobileShell from './TallyMobile'

/** Swap to the phone layout under 768px. SSR renders desktop, then hydrates. */
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return mobile
}

export default function TallyApp() {
  const [state, setState] = useState<TallyState>(initialState)
  const isMobile = useIsMobile()
  /**
   * Gate the first paint on hydration. Two things differ between server and
   * client here — the saved state in localStorage, and the current date — and
   * rendering either before mount produces a hydration mismatch. This is a
   * signed-in app, so there is no SEO cost to waiting a frame.
   */
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  // Persist on every change, but never write the seed over a real save before
  // the load has happened.
  const firstSave = useRef(true)
  useEffect(() => {
    if (!hydrated) return
    if (firstSave.current) {
      firstSave.current = false
      return
    }
    saveState(state)
  }, [state, hydrated])

  const go = useCallback((p: Page) => {
    setState((st) => ({ ...st, page: p }))
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }, [])

  const m = useMemo(() => deriveModel(state, setState, go), [state, go])

  if (!hydrated) {
    return (
      <div
        style={sx(c('background:#f0eee6;min-height:100vh'), { fontFamily: BODY })}
        aria-busy="true"
      />
    )
  }

  if (isMobile) {
    return (
      <>
        <MobileShell m={m} />
        <Coach m={m} />
      </>
    )
  }

  return (
    <div style={sx(c('background:#f0eee6;color:#14140f;min-height:100vh'), { fontFamily: BODY })}>
      <div style={{ minWidth: 1180, overflowX: 'auto' }}>
        <Header m={m} />
        <main style={c('max-width:1240px;margin:0 auto;padding:32px 32px 88px')}>
          {m.isToday && <Today m={m} />}
          {m.isSpending && <Spending m={m} />}
          {m.isGoals && <Goals m={m} />}
          {m.isSubs && <Subscriptions m={m} />}
          {m.isRecap && <Recap m={m} />}
          {m.isAccounts && <Accounts m={m} />}
        </main>
      </div>
      <Coach m={m} />
    </div>
  )
}

/* ─────────────────────────── shell ─────────────────────────── */

function Header({ m }: { m: TallyModel }) {
  return (
    <header
      style={c(
        'border-bottom:1px solid #ddd9cc;background:#f0eee6;position:sticky;top:0;z-index:30',
      )}
    >
      <div
        style={c(
          'max-width:1240px;margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:28px',
        )}
      >
        <Logo />
        <nav style={c('display:flex;gap:2px')}>
          {m.tabs.map((t, i) => (
            <button key={i} type="button" onClick={t.go} style={c(t.style)}>
              <span>{t.label}</span>
              {t.badge ? <span style={c(t.badgeStyle)}>{t.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div style={c('margin-left:auto;display:flex;align-items:center;gap:14px')}>
          <div
            style={c(
              'display:flex;align-items:center;gap:8px;background:#ffffff;border:1px solid #e0ded4;border-radius:999px;padding:7px 14px',
            )}
          >
            <div style={c('width:7px;height:7px;border-radius:99px;background:#1c6a48')} />
            <span style={sx(c('font-size:11px;color:#4a4941'), { fontFamily: MONO })}>
              Synced 4m ago
            </span>
          </div>
          <Link
            href="/tally/account"
            aria-label="Account and sign in"
            style={sx(
              c(
                'width:32px;height:32px;border-radius:99px;background:#cdf06a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#14140f',
              ),
              { fontFamily: DISPLAY },
            )}
          >
            JR
          </Link>
        </div>
      </div>
    </header>
  )
}

function Logo() {
  return (
    <Link
      href="/tally/site"
      aria-label="Tally home"
      style={sx(c('display:flex;align-items:center;gap:10px'), { color: 'inherit' })}
    >
      <div
        style={c(
          'width:26px;height:26px;background:#1c6a48;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5px;flex:none',
        )}
      >
        <div style={c('width:11px;height:3px;border-radius:3px;background:#cdf06a')} />
        <div style={c('width:14px;height:3px;border-radius:3px;background:#9fd35a')} />
        <div style={c('width:17px;height:3px;border-radius:3px;background:#f5f4ef')} />
      </div>
      <span style={sx(c('font-weight:700;font-size:19px;letter-spacing:-0.02em'), { fontFamily: DISPLAY })}>
        Tally
      </span>
    </Link>
  )
}

const h1 = (size = 30) =>
  sx(
    c(`font-size:${size}px;font-weight:700;letter-spacing:-0.03em;margin:0 0 4px`),
    { fontFamily: DISPLAY },
  )
const h2 = sx(c('font-size:20px;font-weight:700;letter-spacing:-0.02em;margin:0'), { fontFamily: DISPLAY })
const mono = (extra: string) => sx(c(extra), { fontFamily: MONO })
const display = (extra: string) => sx(c(extra), { fontFamily: DISPLAY })
const linkBtn = c('font-size:14px;font-weight:600;color:#1c6a48;background:none;border:none;cursor:pointer;padding:0')

/* ─────────────────────────── Today ─────────────────────────── */

function Today({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:18px')}>
      <div
        style={c(
          'display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap',
        )}
      >
        <div>
          <h1 style={h1(32)}>Hey Jordan</h1>
          <p style={c('font-size:15px;color:#4a4941;margin:0')}>{m.dashSub}</p>
        </div>
        <div style={mono('font-size:12px;color:#6b6a60')}>{m.todayLabel}</div>
      </div>

      {/* streak hero */}
      <div style={c('background:#14140f;color:#f5f4ef;border-radius:28px;padding:34px 38px')}>
        <div
          style={c('display:grid;grid-template-columns:auto 1fr auto;gap:44px;align-items:center')}
        >
          <div>
            <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a69b;margin-bottom:12px')}>
              Current streak
            </div>
            <div style={c('display:flex;align-items:baseline;gap:12px')}>
              <span style={display('font-size:92px;font-weight:700;letter-spacing:-0.05em;line-height:0.86')}>
                {m.streak}
              </span>
              <span style={c('font-size:20px;color:#cdf06a;font-weight:600')}>days</span>
            </div>
            <div style={c('font-size:15px;color:#a8a69b;margin-top:10px')}>
              {m.level} · {m.freezeNote}
            </div>
            <div style={c('font-size:13px;line-height:1.5;color:#8a8a7e;margin-top:8px;max-width:22em')}>
              {m.levelPerk}
            </div>
          </div>

          <div>
            <div style={c('display:grid;grid-template-columns:repeat(14,1fr);gap:7px;margin-bottom:16px')}>
              {m.days.map((d, i) => (
                <div key={i} style={c('display:flex;flex-direction:column;gap:7px')}>
                  <div style={c(d.bigStyle)} title={d.tip} />
                  <div style={mono('font-size:10px;text-align:center;color:#a8a69b')}>{d.label}</div>
                </div>
              ))}
            </div>
            <div style={c('display:flex;gap:22px;flex-wrap:wrap;padding-top:16px;border-top:1px solid #2c2c24')}>
              {m.legend.map((l, i) => (
                <div key={i} style={c('display:flex;align-items:center;gap:8px')}>
                  <div style={c(l.swatch)} />
                  <span style={mono('font-size:11px;color:#a8a69b')}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={c('min-width:210px')}>
            <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a69b;margin-bottom:12px')}>
              Next level
            </div>
            <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.02em;margin-bottom:12px')}>
              {m.nextLevel}
            </div>
            <div style={c('height:8px;border-radius:99px;background:#2c2c24;overflow:hidden;margin-bottom:12px')}>
              <div style={c(m.tierFill)} />
            </div>
            <div style={c('font-size:14px;line-height:1.5;color:#a8a69b;margin-bottom:14px')}>
              {m.tierNote}
            </div>
            <div
              style={c(
                'font-size:13px;line-height:1.5;margin-bottom:12px;color:' +
                  (m.todayTask ? '#e0a03a' : '#cdf06a'),
              )}
            >
              {m.todayTask ? m.todayTask.text : m.streakCheckin}
            </div>
            <button type="button" onClick={m.markReviewed} style={c(m.todayChipStyle)}>
              {m.todayChip}
            </button>
          </div>
        </div>
      </div>

      {/* safe to spend + buckets */}
      <div style={c('display:grid;grid-template-columns:1fr 1.6fr;gap:18px')}>
        <div style={c('background:#cdf06a;border-radius:26px;padding:30px 32px')}>
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3d5410;margin-bottom:12px')}>
            Safe to spend this week
          </div>
          <div style={display('font-size:64px;font-weight:700;letter-spacing:-0.045em;line-height:1;margin-bottom:10px')}>
            {m.safeToSpend}
          </div>
          <div style={c('font-size:15px;color:#2c3b0d;margin-bottom:24px')}>{m.safeNote}</div>
          <div style={c('display:flex;flex-direction:column;gap:10px;padding-top:20px;border-top:2px solid rgba(20,20,15,0.16)')}>
            {m.safeRows.map((r, i) => (
              <div key={i} style={c('display:flex;justify-content:space-between;font-size:14px;color:#2c3b0d')}>
                <span>{r.label}</span>
                <span style={mono('font-weight:500')}>{r.value}</span>
              </div>
            ))}
          </div>
          {/* month-end forecast */}
          <div style={c('margin-top:18px;padding-top:16px;border-top:2px solid rgba(20,20,15,0.16)')}>
            <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
              <span style={mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3d5410')}>
                Lowest ahead
              </span>
              <span style={mono('font-size:13px;font-weight:500;color:#2c3b0d')}>
                {m.forecastLow} · {m.forecastLowLabel}
              </span>
            </div>
            <div style={c('display:flex;align-items:flex-end;gap:3px;height:56px;margin-bottom:8px')}>
              {m.forecastBars.map((b, i) => (
                <div key={i} style={c(b.barStyle)} title={b.value || undefined} />
              ))}
            </div>
            <div style={c('font-size:13px;line-height:1.5;color:#2c3b0d')}>{m.forecastNote}</div>
          </div>
        </div>

        <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:24px')}>
            <h2 style={h2}>Buckets · {m.monthName}</h2>
            <button type="button" onClick={m.goSpending} style={linkBtn}>
              Manage
            </button>
          </div>
          <div style={c('display:grid;grid-template-columns:repeat(2,1fr);gap:22px 32px')}>
            {m.buckets.map((b) => (
              <div key={b.id} onClick={b.go} style={c('cursor:pointer')}>
                <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
                  <span style={c('font-size:15px;font-weight:600')}>{b.name}</span>
                  <span style={c(b.paceStyle)}>{b.pace}</span>
                </div>
                <div style={c('display:flex;align-items:baseline;gap:8px;margin-bottom:9px')}>
                  <span style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em')}>{b.used}</span>
                  <span style={mono('font-size:12px;color:#6b6a60')}>of {b.limit}</span>
                </div>
                <div style={c('height:8px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                  <div style={c(b.fill)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* summary row */}
      <div style={c('display:grid;grid-template-columns:repeat(4,1fr);gap:18px')}>
        <Hover
          onClick={m.goSubs}
          base={c('background:#ffffff;border-width:1px;border-style:solid;border-color:#e0ded4;border-radius:26px;padding:28px 30px;cursor:pointer')}
          hover={{ borderColor: '#1c6a48' }}
        >
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>
            Subscriptions
          </div>
          <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:16px')}>
            <span style={display('font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1')}>
              {m.subsMonthly}
            </span>
            <span style={c('font-size:14px;color:#4a4941')}>a month</span>
          </div>
          <div style={c(m.trialStyle)}>{m.trialNote}</div>
        </Hover>

        <Hover
          onClick={m.goGoals}
          base={c('background:#ffffff;border-width:1px;border-style:solid;border-color:#e0ded4;border-radius:26px;padding:28px 30px;cursor:pointer')}
          hover={{ borderColor: '#1c6a48' }}
        >
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>
            Goals
          </div>
          <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:16px')}>
            <span style={display('font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1')}>
              {m.goalsSaved}
            </span>
            <span style={c('font-size:14px;color:#4a4941')}>across 3</span>
          </div>
          <div style={c('font-size:14px;line-height:1.5;color:#4a4941')}>{m.goalsNote}</div>
        </Hover>

        <div style={c('background:#14140f;color:#f5f4ef;border-radius:26px;padding:28px 30px')}>
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a69b;margin-bottom:14px')}>
            Streak
          </div>
          <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:16px')}>
            <span style={display('font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1')}>
              {m.streak}
            </span>
            <span style={c('font-size:14px;color:#a8a69b')}>days · {m.level}</span>
          </div>
          <div style={c('font-size:14px;line-height:1.5;color:#a8a69b')}>{m.tierNote}</div>
        </div>

        <Hover
          onClick={m.goRecap}
          base={c('background:#ffffff;border-width:1px;border-style:solid;border-color:#e0ded4;border-radius:26px;padding:28px 30px;cursor:pointer')}
          hover={{ borderColor: '#1c6a48' }}
        >
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>
            This week
          </div>
          <div style={c('display:flex;align-items:baseline;gap:10px;margin-bottom:16px')}>
            <span style={display('font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1')}>$86</span>
            <span style={c('font-size:14px;color:#1c6a48')}>−$18 vs last</span>
          </div>
          <div style={c('font-size:14px;line-height:1.5;color:#4a4941')}>Sunday recap is ready to read.</div>
        </Hover>
      </div>

      {/* month progress + where it goes */}
      <div style={c('display:grid;grid-template-columns:1fr 1fr;gap:18px')}>
        <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px')}>
            <h2 style={h2}>{m.monthName} so far</h2>
            <span style={mono('font-size:12px;color:#6b6a60')}>day {m.dayOfMonth} of 31</span>
          </div>
          <div style={c('display:flex;align-items:baseline;gap:14px;margin-bottom:8px')}>
            <span style={display('font-size:44px;font-weight:700;letter-spacing:-0.035em;line-height:1')}>
              {m.monthSpent}
            </span>
            <span style={c('font-size:15px;color:#4a4941')}>of {m.monthBudget} budgeted</span>
          </div>
          <div style={c('height:10px;border-radius:99px;background:#eae8de;overflow:hidden;margin:18px 0 10px;position:relative')}>
            <div style={c(m.monthFill)} />
          </div>
          <div style={mono('display:flex;justify-content:space-between;font-size:11px;color:#6b6a60;margin-bottom:20px')}>
            <span>{m.monthPctLabel} spent</span>
            <span>{m.monthTimeLabel} of the month gone</span>
          </div>
          <div style={c(m.monthVerdictStyle)}>{m.monthVerdict}</div>
        </div>

        <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
          <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px')}>
            <h2 style={h2}>Where it goes</h2>
            <button type="button" onClick={m.goRecap} style={linkBtn}>
              Full recap
            </button>
          </div>
          <div style={c('display:flex;flex-direction:column')}>
            {m.topMerchants.map((mm, i) => (
              <div
                key={i}
                style={c('display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:11px 0;border-bottom:1px solid #f0eee5')}
              >
                <div>
                  <div style={c('font-size:15px;margin-bottom:6px')}>{mm.name}</div>
                  <div style={c('height:6px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                    <div style={c(mm.fill)} />
                  </div>
                </div>
                <div style={c('text-align:right')}>
                  <div style={mono('font-size:14px')}>{mm.amount}</div>
                  <div style={mono('font-size:11px;color:#6b6a60')}>{mm.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* contextual insights */}
      {m.insights.slice(0, 2).map((ins, i) => (
        <div key={i} style={c(ins.wrapStyle)}>
          <div style={c('display:flex;align-items:center;gap:28px;flex-wrap:wrap')}>
            <div style={c('flex:1;min-width:280px')}>
              <div style={sx(mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:10px'), { color: ins.kickerColor })}>
                {i === 0 ? 'Pattern Tally noticed' : 'Also worth knowing'}
              </div>
              <div style={display('font-size:22px;font-weight:700;letter-spacing:-0.025em;line-height:1.25;margin-bottom:8px')}>
                {ins.title}
              </div>
              <div style={sx(c('font-size:15px;line-height:1.5'), { color: ins.bodyColor })}>{ins.body}</div>
            </div>
            {ins.cta ? (
              <Hover
                as="button"
                onClick={ins.go}
                base={sx(c(ins.btnStyle), { fontFamily: BODY })}
                hover={{ background: '#1c6a48' }}
              >
                {ins.cta}
              </Hover>
            ) : null}
          </div>
        </div>
      ))}

      {/* recent activity */}
      <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
        <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px')}>
          <h2 style={h2}>Recent activity</h2>
          <button type="button" onClick={m.goSpending} style={linkBtn}>
            All transactions
          </button>
        </div>
        <div style={c('display:flex;flex-direction:column')}>
          {m.recent.map((t, i) => (
            <div
              key={i}
              style={c('display:grid;grid-template-columns:60px 1fr auto auto;gap:18px;align-items:center;padding:13px 0;border-bottom:1px solid #f0eee5')}
            >
              <span style={mono('font-size:12px;color:#6b6a60')}>{t.day}</span>
              <span style={c('font-size:16px')}>{t.name}</span>
              <span style={c(t.catStyle)}>{t.cat}</span>
              <span style={c(t.amtStyle)}>{t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Spending ─────────────────────────── */

function Spending({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:20px')}>
      <div>
        <h1 style={h1(30)}>Spending</h1>
        <p style={c('font-size:15px;color:#4a4941;margin:0')}>
          Tap a category on any transaction to fix it. Tally remembers the merchant next time.
        </p>
      </div>

      <PlanSwitcher m={m} />

      <div style={c('display:grid;grid-template-columns:1.1fr 1fr;gap:16px;align-items:start')}>
        <AddTransaction m={m} />
        <ImportCsv m={m} />
      </div>

      <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
        <div style={c('display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:26px')}>
          <h2 style={h2}>{m.periodTitle}</h2>
          <div style={c('display:flex;gap:6px;flex-wrap:wrap')}>
            {m.periods.map((p, i) => (
              <button key={i} type="button" onClick={p.pick} style={c(p.style)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={c('display:grid;grid-template-columns:0.9fr 1.6fr;gap:40px;align-items:center')}>
          <div>
            <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:10px')}>
              Total spent
            </div>
            <div style={display('font-size:58px;font-weight:700;letter-spacing:-0.045em;line-height:1;margin-bottom:10px')}>
              {m.periodTotal}
            </div>
            <div style={c(m.periodDeltaStyle)}>{m.periodDelta}</div>
            <div style={c('display:flex;flex-direction:column;gap:11px;margin-top:24px;padding-top:20px;border-top:1px solid #eae8de')}>
              {m.periodStats.map((r, i) => (
                <div key={i} style={c('display:flex;justify-content:space-between;font-size:14px')}>
                  <span style={c('color:#4a4941')}>{r.label}</span>
                  <span style={mono('font-weight:500')}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={c('display:flex;align-items:flex-end;gap:10px;height:172px;margin-bottom:16px')}>
              {m.periodBars.map((b, i) => (
                <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
                  <div style={c(b.valStyle)}>{b.value}</div>
                  <div style={c('height:114px;flex:none;display:flex;align-items:flex-end;justify-content:center')}>
                    <div style={c(b.bar)} />
                  </div>
                  <div style={c(b.labelStyle)}>{b.label}</div>
                </div>
              ))}
            </div>
            <div style={c('font-size:15px;line-height:1.55;color:#4a4941')}>{m.periodInsight}</div>
          </div>
        </div>
      </div>

      <div style={c('display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap')}>
        <h2 style={h2}>Your categories</h2>
        <span style={mono('font-size:12px;color:#6b6a60')}>
          Rename inline · toggle spend / save · {'−'} / + adjusts the limit by $5
        </span>
      </div>
      <div style={c('display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px')}>
        {m.buckets.map((b) => (
          <div key={b.id} style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:22px;padding:22px')}>
            <div style={c('display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px')}>
              <input
                value={b.name}
                onChange={(e) => b.rename(e.target.value)}
                aria-label="Category name"
                style={sx(
                  c('font-size:15px;font-weight:600;color:#14140f;background:transparent;border:none;border-bottom:1px solid transparent;padding:2px 0;min-width:0;flex:1;outline:none'),
                  { fontFamily: BODY },
                )}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#cac7bc')}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
              />
              <button
                type="button"
                onClick={b.remove}
                aria-label={`Remove ${b.name}`}
                title="Remove category"
                style={c('width:22px;height:22px;border-radius:7px;border:1px solid #e0ded4;background:transparent;color:#9a988c;cursor:pointer;font-size:13px;line-height:1;flex:none')}
              >
                ×
              </button>
            </div>
            <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px')}>
              <button
                type="button"
                onClick={b.toggleKind}
                style={mono(
                  'font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;cursor:pointer;border:1px solid #e0ded4;background:transparent;color:#6b6a60',
                )}
              >
                {b.kind === 'save' ? 'saving' : 'spending'}
              </button>
              <span style={c(b.paceStyle)}>{b.pace}</span>
            </div>
            <div style={display('font-size:28px;font-weight:700;letter-spacing:-0.025em;line-height:1;margin-bottom:10px')}>
              {b.used}
            </div>
            <div style={c('height:8px;border-radius:99px;background:#eae8de;overflow:hidden;margin-bottom:14px')}>
              <div style={c(b.fill)} />
            </div>
            <div style={c('display:flex;align-items:center;gap:8px')}>
              <button type="button" onClick={b.down} style={c(b.stepStyle)}>
                −
              </button>
              <span style={mono('font-size:12px;color:#4a4941;flex:1;text-align:center')}>limit {b.limit}</span>
              <button type="button" onClick={b.up} style={c(b.stepStyle)}>
                +
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={m.addBucket}
          disabled={!m.canAddBucket}
          title={m.canAddBucket ? undefined : `${m.planName} includes ${m.ent.maxBuckets} buckets`}
          style={sx(
            c(
              `background:transparent;border:1px dashed #cac7bc;border-radius:22px;padding:22px;cursor:${m.canAddBucket ? 'pointer' : 'default'};color:#4a4941;font-size:15px;font-weight:600;min-height:150px;display:flex;align-items:center;justify-content:center;text-align:center;opacity:${m.canAddBucket ? 1 : 0.5}`,
            ),
            { fontFamily: BODY },
          )}
        >
          {m.canAddBucket ? '+ Add a category' : `${m.planName} caps you at ${m.ent.maxBuckets}`}
        </button>
      </div>

      {!m.canAddBucket && (
        <UpgradeNote
          m={m}
          need="starter"
          text="Unlimited buckets, so your budget can match how you actually spend."
        />
      )}

      <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:24px;padding:28px 32px')}>
        <div style={c('display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:18px')}>
          <h2 style={h2}>Transactions</h2>
          <div style={c('display:flex;gap:8px;flex-wrap:wrap')}>
            {m.filters.map((f, i) => (
              <button key={i} type="button" onClick={f.pick} style={c(f.style)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={c('display:flex;flex-direction:column')}>
          {m.txns.length === 0 && (
            <p style={c('font-size:15px;color:#6b6a60;margin:8px 0 4px')}>
              Nothing here yet. Add a transaction above and it shows up instantly.
            </p>
          )}
          {m.txns.map((t) => (
            <div
              key={t.id}
              style={c('display:grid;grid-template-columns:56px 1fr auto auto auto;gap:18px;align-items:center;padding:14px 0;border-bottom:1px solid #f0eee5')}
            >
              <span style={mono('font-size:12px;color:#6b6a60')}>{t.day}</span>
              <div>
                <div style={c('font-size:16px;margin-bottom:3px')}>{t.name}</div>
                <div style={c('display:flex;gap:5px;flex-wrap:wrap')}>
                  {t.cats.map((cat, j) => (
                    <button key={j} type="button" onClick={cat.pick} style={c(cat.style)}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <span style={c(t.flagStyle)}>{t.flag}</span>
              <span style={c(t.amtStyle)}>{t.amount}</span>
              <button
                type="button"
                onClick={t.remove}
                aria-label={`Delete ${t.name}`}
                title="Delete"
                style={c('width:30px;height:30px;border-radius:9px;border:1px solid #e0ded4;background:transparent;color:#6b6a60;cursor:pointer;font-size:15px;line-height:1')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={c('margin-top:16px')}>
          <HiddenHistory m={m} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Goals ─────────────────────────── */

function Goals({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:20px')}>
      <div>
        <h1 style={h1(30)}>Goals</h1>
        <p style={c('font-size:15px;color:#4a4941;margin:0')}>
          Tally can&apos;t move your money. It tells you the transfer to make, then confirms it landed
          on the next sync.
        </p>
      </div>

      {m.goals.map((g, i) => (
        <div key={i} style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:24px;padding:28px 32px')}>
          <div style={c('display:grid;grid-template-columns:1fr 1.3fr auto;gap:32px;align-items:center')}>
            <div>
              <div style={display('font-size:23px;font-weight:700;letter-spacing:-0.02em;margin-bottom:5px')}>
                {g.name}
              </div>
              <div style={c(g.paceStyle)}>{g.pace}</div>
            </div>
            <div>
              <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px')}>
                <span style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em')}>{g.saved}</span>
                <span style={mono('font-size:12px;color:#6b6a60')}>
                  of {g.target} · {g.due}
                </span>
              </div>
              <div style={c('height:9px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                <div style={c(g.fill)} />
              </div>
            </div>
            <div style={c('display:flex;flex-direction:column;gap:8px;min-width:190px')}>
              <div style={c(g.suggestStyle)}>{g.suggest}</div>
              <button type="button" onClick={g.act} style={c(g.btnStyle)}>
                {g.btnLabel}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────── Subscriptions ─────────────────────────── */

function Subscriptions({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:20px')}>
      <div style={c('display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap')}>
        <div>
          <h1 style={h1(30)}>Subscriptions</h1>
          <p style={c('font-size:15px;color:#4a4941;margin:0')}>
            Found by matching recurring charges in your transaction history.
          </p>
        </div>
        <div style={c('display:flex;gap:28px;flex-wrap:wrap')}>
          {m.subStats.map((s, i) => (
            <div key={i}>
              <div style={mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:5px')}>
                {s.label}
              </div>
              <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.025em;line-height:1')}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {m.subs.map((s, i) => (
        <div key={i} style={c(s.rowStyle)}>
          <div style={c('flex:1')}>
            <div style={c('display:flex;align-items:center;gap:10px;margin-bottom:5px')}>
              <span style={c('font-size:18px;font-weight:600')}>{s.name}</span>
              <span style={c(s.tagStyle)}>{s.tag}</span>
            </div>
            <div style={mono('font-size:12px;color:#4a4941')}>{s.meta}</div>
          </div>
          <div style={c('text-align:right;margin-right:28px')}>
            <div style={display('font-size:22px;font-weight:700;letter-spacing:-0.02em')}>{s.price}</div>
            <div style={mono('font-size:11px;color:#6b6a60')}>{s.yearly} a year</div>
          </div>
          <button type="button" onClick={s.act} style={c(s.btnStyle)}>
            {s.btnLabel}
          </button>
        </div>
      ))}

      <div style={c('background:#e6e3d8;border-radius:20px;padding:22px 26px;font-size:14px;line-height:1.6;color:#4a4941')}>
        Tally can&apos;t cancel for you — no app can, without your login. It gives you the exact steps
        for each merchant and then confirms the charge stopped on your next sync.
      </div>
    </div>
  )
}

/* ─────────────────────────── Recap ─────────────────────────── */

function ShareButton({ text }: { text: string }) {
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
          /* clipboard unavailable — no-op in the prototype */
        }
      }}
      style={sx(
        c('font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:1px solid #14140f;border-radius:12px;background:transparent;color:#14140f;cursor:pointer;flex:none'),
        { fontFamily: BODY },
      )}
    >
      {copied ? 'Copied ✓' : 'Share recap'}
    </button>
  )
}

function Recap({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:18px')}>
      <div style={c('display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap')}>
        <div>
          <h1 style={h1(30)}>{m.weekLabel}</h1>
          <p style={c('font-size:15px;color:#4a4941;margin:0')}>
            Fifteen seconds. Then get on with your Sunday.
          </p>
        </div>
        <div style={mono('font-size:12px;color:#6b6a60')}>Week 34 · 5 of 7 days logged</div>
      </div>

      {/* the week, in one line */}
      <div style={c('background:#cdf06a;border-radius:26px;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap')}>
        <div>
          <div style={display('font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.2;max-width:20em')}>
            {m.recapHeadline}
          </div>
          <div style={mono('font-size:12px;color:#3d5410;margin-top:8px')}>{m.recapSubhead}</div>
        </div>
        <ShareButton text={m.recapShareText} />
      </div>

      <div style={c('display:grid;grid-template-columns:1.2fr 1fr;gap:18px')}>
        <div style={c('background:#14140f;color:#f5f4ef;border-radius:26px;padding:32px')}>
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8a69b;margin-bottom:12px')}>
            Spent this week
          </div>
          <div style={c('display:flex;align-items:baseline;gap:16px;margin-bottom:28px')}>
            <span style={display('font-size:62px;font-weight:700;letter-spacing:-0.045em;line-height:1')}>$86</span>
            <span style={c('font-size:15px;color:#cdf06a')}>$18 less than last week</span>
          </div>
          <div style={c('display:flex;flex-direction:column;gap:15px')}>
            {m.recapBars.map((r, i) => (
              <div key={i}>
                <div style={c('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px')}>
                  <span style={c('font-size:14px')}>{r.name}</span>
                  <span style={mono('font-size:12px;color:#b6b4a8')}>{r.delta}</span>
                </div>
                <div style={c('height:7px;background:#2c2c24;border-radius:99px;overflow:hidden')}>
                  <div style={c(r.fill)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={c('display:flex;flex-direction:column;gap:16px')}>
          <div style={c('background:#cdf06a;border-radius:26px;padding:28px')}>
            <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3d5410;margin-bottom:10px')}>
              Win of the week
            </div>
            <div style={c('font-size:19px;font-weight:600;line-height:1.4')}>{m.recapWin}</div>
          </div>
          <div style={c(m.watchCardStyle)}>
            <div style={sx(c(m.watchKickerStyle), { fontFamily: MONO })}>{m.watchKicker}</div>
            <div style={c('font-size:19px;font-weight:600;line-height:1.4;margin-bottom:14px')}>{m.watchText}</div>
            <Hover
              as="button"
              onClick={m.goSpending}
              base={sx(
                c('font-size:14px;font-weight:600;min-height:42px;padding:0 18px;border:1px solid #14140f;border-radius:12px;background:transparent;cursor:pointer'),
                { fontFamily: BODY },
              )}
              hover={{ background: '#cdf06a' }}
            >
              {m.watchCta}
            </Hover>
          </div>
        </div>
      </div>

      <div style={c('display:grid;grid-template-columns:1fr 1fr;gap:18px')}>
        <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:20px')}>
            Where it went — top merchants
          </div>
          <div style={c('display:flex;flex-direction:column')}>
            {m.merchants.map((mm, i) => (
              <div
                key={i}
                style={c('display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid #f0eee5')}
              >
                <div>
                  <div style={c('font-size:16px;margin-bottom:6px')}>{mm.name}</div>
                  <div style={c('height:6px;border-radius:99px;background:#eae8de;overflow:hidden')}>
                    <div style={c(mm.fill)} />
                  </div>
                </div>
                <div style={c('text-align:right')}>
                  <div style={mono('font-size:15px')}>{mm.amount}</div>
                  <div style={mono('font-size:11px;color:#6b6a60')}>{mm.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
          <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:20px')}>
            When you spend
          </div>
          <div style={c('display:flex;align-items:flex-end;gap:10px;height:150px;margin-bottom:18px')}>
            {m.dayPattern.map((d, i) => (
              <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
                <div style={c(d.valStyle)}>{d.value}</div>
                <div style={c('height:96px;flex:none;display:flex;align-items:flex-end;justify-content:center')}>
                  <div style={c(d.bar)} />
                </div>
                <div style={c(d.labelStyle)}>{d.label}</div>
              </div>
            ))}
          </div>
          <div style={c('font-size:15px;line-height:1.5;color:#4a4941')}>{m.dayInsight}</div>
        </div>
      </div>

      <div style={c('display:grid;grid-template-columns:repeat(3,1fr);gap:18px')}>
        {m.weekStats.map((w, i) => (
          <div key={i} style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:28px 30px')}>
            <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:14px')}>
              {w.label}
            </div>
            <div style={display('font-size:34px;font-weight:700;letter-spacing:-0.03em;line-height:1;margin-bottom:8px')}>
              {w.value}
            </div>
            <div style={c(w.noteStyle)}>{w.note}</div>
          </div>
        ))}
      </div>

      <div style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:26px;padding:30px 32px')}>
        <div style={mono('font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6a60;margin-bottom:18px')}>
          Compared to your last four weeks
        </div>
        <div style={c('display:flex;align-items:flex-end;gap:14px;height:120px')}>
          {m.fourWeeks.map((w, i) => (
            <div key={i} style={c('flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%')}>
              <div style={c(w.valStyle)}>{w.value}</div>
              <div style={c('height:70px;flex:none;display:flex;align-items:flex-end')}>
                <div style={c(w.bar)} />
              </div>
              <div style={c(w.labelStyle)}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Accounts ─────────────────────────── */

function Accounts({ m }: { m: TallyModel }) {
  return (
    <div style={c('display:flex;flex-direction:column;gap:20px')}>
      <div>
        <h1 style={h1(30)}>Connected accounts</h1>
        <p style={c('font-size:15px;color:#4a4941;margin:0')}>
          Read-only through Plaid. Tally can see these — it cannot move anything.
        </p>
      </div>

      {m.accounts.map((a, i) => (
        <div
          key={i}
          style={c('background:#ffffff;border:1px solid #e0ded4;border-radius:24px;padding:26px 30px;display:flex;align-items:center;gap:20px')}
        >
          <div style={c(a.dot)} />
          <div style={c('flex:1')}>
            <div style={c('font-size:18px;font-weight:600;margin-bottom:4px')}>{a.name}</div>
            <div style={mono('font-size:12px;color:#4a4941')}>{a.meta}</div>
          </div>
          <div style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em;margin-right:24px')}>
            {a.balance}
          </div>
          <button type="button" onClick={a.act} style={c(a.btnStyle)}>
            {a.btnLabel}
          </button>
        </div>
      ))}

      <div style={c('background:#ffffff;border:1px dashed #cac7bc;border-radius:24px;padding:30px;text-align:center')}>
        <div style={c('font-size:17px;font-weight:600;margin-bottom:6px')}>Add another account</div>
        <div style={c('font-size:14px;color:#4a4941;margin-bottom:18px')}>
          Checking, savings, or a card. More accounts means better categories.
        </div>
        <Hover
          as="button"
          base={sx(
            c('font-size:15px;font-weight:600;min-height:46px;padding:0 24px;border:none;border-radius:12px;background:#1c6a48;color:#f7fbf6;cursor:pointer'),
            { fontFamily: BODY },
          )}
          hover={{ background: '#14140f' }}
        >
          Connect with Plaid
        </Hover>
      </div>

      <div style={c('background:#14140f;color:#f5f4ef;border-radius:24px;padding:30px')}>
        <div style={mono('font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a8a69b;margin-bottom:18px')}>
          What Tally can and cannot do
        </div>
        <div style={c('display:grid;grid-template-columns:1fr 1fr;gap:32px')}>
          <div>
            <div style={c('font-size:15px;font-weight:600;color:#cdf06a;margin-bottom:12px')}>Can</div>
            <div style={c('display:flex;flex-direction:column;gap:9px')}>
              {m.canDo.map((cd, i) => (
                <div key={i} style={c('font-size:15px;color:#b6b4a8')}>
                  {cd}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={c('font-size:15px;font-weight:600;color:#cdf06a;margin-bottom:12px')}>Cannot</div>
            <div style={c('display:flex;flex-direction:column;gap:9px')}>
              {m.cannotDo.map((cd, i) => (
                <div key={i} style={c('font-size:15px;color:#b6b4a8')}>
                  {cd}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
