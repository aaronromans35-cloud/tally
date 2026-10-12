/**
 * Tally — Instagram asset generator.
 *
 * Renders every carousel slide and single post to a real 1080×1350 PNG using
 * headless Chrome, so the output is postable rather than a mockup.
 *
 *   node marketing/instagram/slides.mjs
 *
 * Output: marketing/instagram/out/<set>/<nn>.png
 *
 * ── Why the content is shaped this way ────────────────────────────────────
 * From the research in docs/marketing/CAMPAIGN.md:
 *   • The cover slide decides everything — roughly 1.3 seconds to earn a swipe.
 *   • SAVES are the strongest ranking signal in 2026, so every carousel
 *     carries at least one slide worth keeping: a checklist, a framework, a
 *     reference table.
 *   • 5–8 slides. Completion drops measurably past ten.
 *   • Gen Z rejects shame-based money messaging — which rules out the entire
 *     standard playbook of budgeting marketing. Nothing here scolds.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'out')
const TMP = join(HERE, '.tmp')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const W = 1080
const H = 1350

/* ─────────────────────────── brand ─────────────────────────── */

const C = {
  cream: '#f5f4ef',
  paper: '#ffffff',
  ink: '#14140f',
  green: '#1c6a48',
  lime: '#cdf06a',
  muted: '#6b6a60',
  body: '#4a4941',
  line: '#e0ded4',
  amber: '#8a6a12',
  red: '#b8422a',
}

const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">`

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:${C.cream};color:${C.ink};
  -webkit-font-smoothing:antialiased}
.slide{width:${W}px;height:${H}px;padding:96px 88px;display:flex;flex-direction:column;position:relative}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.kicker{font-family:'IBM Plex Mono',monospace;font-size:26px;letter-spacing:0.16em;
  text-transform:uppercase;color:${C.muted}}
h1{font-size:104px;line-height:0.98;letter-spacing:-0.045em;font-weight:700}
h2{font-size:72px;line-height:1.04;letter-spacing:-0.035em;font-weight:700}
h3{font-size:50px;line-height:1.1;letter-spacing:-0.025em;font-weight:700}
p{font-size:34px;line-height:1.5;color:${C.body}}
.big{font-size:150px;line-height:0.9;letter-spacing:-0.05em;font-weight:700}
.dark{background:${C.ink};color:${C.cream}}
.dark p{color:#cfccc2}
.dark .kicker{color:#a8a69b}
.spacer{flex:1}
.logo{display:flex;align-items:center;gap:16px}
.mark{width:44px;height:44px;background:${C.green};border-radius:13px;display:flex;
  flex-direction:column;align-items:center;justify-content:center;gap:4px;flex:none}
.mark i{display:block;border-radius:4px}
.mark i:nth-child(1){width:18px;height:5px;background:${C.lime}}
.mark i:nth-child(2){width:23px;height:5px;background:#9fd35a}
.mark i:nth-child(3){width:28px;height:5px;background:${C.cream}}
.wordmark{font-size:34px;font-weight:700;letter-spacing:-0.02em}
.swipe{font-family:'IBM Plex Mono',monospace;font-size:24px;letter-spacing:0.1em;
  text-transform:uppercase;color:${C.muted};display:flex;align-items:center;gap:12px}
.card{background:${C.paper};border:2px solid ${C.line};border-radius:28px;padding:34px 38px}
.dark .card{background:#1f1f18;border-color:#32322a}
.row{display:flex;align-items:center;gap:22px}
.chip{font-family:'IBM Plex Mono',monospace;font-size:22px;letter-spacing:0.08em;
  text-transform:uppercase;padding:10px 18px;border-radius:999px;background:${C.lime};color:${C.ink}}
.num{font-family:'IBM Plex Mono',monospace;font-size:30px;color:${C.green};font-weight:500;flex:none;
  width:52px}
.bar{height:18px;border-radius:999px;background:#e4e2d9;overflow:hidden}
.bar>span{display:block;height:100%;border-radius:999px}
`

/* ─────────────────────────── slide builders ─────────────────────────── */

const logo = (dark = false) => `
<div class="logo"><span class="mark"><i></i><i></i><i></i></span>
<span class="wordmark" style="color:${dark ? C.cream : C.ink}">Tally</span></div>`

const swipe = (label = 'Swipe') => `<div class="swipe">${label} <span>→</span></div>`

/** Big-type cover. The whole job is earning one swipe. */
const cover = ({ kicker, title, sub, dark = false, chip }) => `
<div class="slide ${dark ? 'dark' : ''}">
  ${logo(dark)}
  <div class="spacer"></div>
  ${chip ? `<div style="margin-bottom:28px"><span class="chip">${chip}</span></div>` : ''}
  ${kicker ? `<div class="kicker" style="margin-bottom:26px">${kicker}</div>` : ''}
  <h1>${title}</h1>
  ${sub ? `<p style="margin-top:32px;font-size:38px">${sub}</p>` : ''}
  <div class="spacer"></div>
  ${swipe()}
</div>`

const statement = ({ kicker, title, body, dark = false }) => `
<div class="slide ${dark ? 'dark' : ''}">
  <div class="spacer"></div>
  ${kicker ? `<div class="kicker" style="margin-bottom:30px">${kicker}</div>` : ''}
  <h2>${title}</h2>
  ${body ? `<p style="margin-top:36px">${body}</p>` : ''}
  <div class="spacer"></div>
  ${swipe()}
</div>`

/** The save-bait slide: a numbered list people screenshot. */
const list = ({ kicker, title, items, dark = false }) => `
<div class="slide ${dark ? 'dark' : ''}">
  <div class="spacer" style="max-height:120px"></div>
  ${kicker ? `<div class="kicker" style="margin-bottom:26px">${kicker}</div>` : ''}
  <h3 style="margin-bottom:46px">${title}</h3>
  <div style="display:flex;flex-direction:column;gap:30px">
    ${items
      .map(
        (it, i) => `<div class="row" style="align-items:flex-start">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <div><div style="font-size:36px;font-weight:600;line-height:1.25">${it.h}</div>
      ${it.p ? `<div style="font-size:28px;line-height:1.45;color:${dark ? '#cfccc2' : C.body};margin-top:8px">${it.p}</div>` : ''}</div>
    </div>`,
      )
      .join('')}
  </div>
  <div class="spacer"></div>
  ${swipe()}
</div>`

const bigNumber = ({ kicker, value, label, body, dark = false }) => `
<div class="slide ${dark ? 'dark' : ''}">
  ${kicker ? `<div class="kicker" style="margin-bottom:30px">${kicker}</div>` : ''}
  <div class="spacer"></div>
  <div class="big" style="color:${dark ? C.lime : C.green}">${value}</div>
  <div style="font-size:40px;font-weight:600;margin-top:20px">${label}</div>
  ${body ? `<p style="margin-top:28px">${body}</p>` : ''}
  <div class="spacer"></div>
  ${swipe()}
</div>`

/** Two-column compare. Reads as a reference table — high save rate. */
const compare = ({ kicker, title, left, right, dark = false }) => `
<div class="slide ${dark ? 'dark' : ''}">
  <div class="spacer"></div>
  ${kicker ? `<div class="kicker" style="margin-bottom:26px">${kicker}</div>` : ''}
  <h3 style="margin-bottom:44px">${title}</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
    <div class="card" style="border-color:${C.red}55">
      <div class="mono" style="font-size:22px;letter-spacing:0.1em;text-transform:uppercase;color:${C.red};margin-bottom:24px">${left.h}</div>
      ${left.items.map((i) => `<div style="font-size:29px;line-height:1.4;margin-bottom:18px">${i}</div>`).join('')}
    </div>
    <div class="card" style="border-color:${C.green}55">
      <div class="mono" style="font-size:22px;letter-spacing:0.1em;text-transform:uppercase;color:${C.green};margin-bottom:24px">${right.h}</div>
      ${right.items.map((i) => `<div style="font-size:29px;line-height:1.4;margin-bottom:18px">${i}</div>`).join('')}
    </div>
  </div>
  <div class="spacer"></div>
  ${swipe()}
</div>`

const cta = ({ title, body, handle = '@usetally', url = 'tally.app' }) => `
<div class="slide dark">
  ${logo(true)}
  <div class="spacer"></div>
  <h2>${title}</h2>
  <p style="margin-top:32px;font-size:36px">${body}</p>
  <div class="spacer"></div>
  <div class="card" style="display:flex;align-items:center;justify-content:space-between">
    <div>
      <div class="mono" style="font-size:24px;color:#a8a69b;letter-spacing:0.08em">FREE TO START</div>
      <div style="font-size:38px;font-weight:600;margin-top:8px;color:${C.cream}">${url}</div>
    </div>
    <div class="chip">${handle}</div>
  </div>
</div>`

/* ─────────────────────────── the campaign ─────────────────────────── */

const SETS = {
  /* 1 — contrarian hook. Explains the streak, which is the product's soul. */
  'c1-save-every-day': [
    cover({
      chip: 'Unpopular opinion',
      title: '“Save money<br>every day”<br>is terrible<br>advice.',
      sub: 'It’s also why most budgeting apps get deleted in week two.',
      dark: true,
    }),
    statement({
      kicker: 'The problem',
      title: 'You can’t save on a Tuesday you didn’t spend on.',
      body: 'A rule you break by living your normal life isn’t a rule. It’s a guilt generator with a progress bar.',
    }),
    statement({
      kicker: 'What actually happens',
      title: 'Miss one day → feel bad → stop opening the app.',
      body: 'Streaks built on perfection punish you for being a person. So people quit, and quitting feels like proof they’re bad with money.',
    }),
    bigNumber({
      kicker: 'So we changed the rule',
      value: '1',
      label: 'A day counts when you check in.',
      body: 'Not when you save. Stay on pace, or clear the one thing Tally flags. That’s it.',
      dark: true,
    }),
    compare({
      kicker: 'The difference',
      title: 'Two ways to build a money habit',
      left: {
        h: 'Perfection streaks',
        items: ['Break once, lose everything', 'Punishes a normal week', 'You avoid the app', 'Shame as a feature'],
      },
      right: {
        h: 'Tally’s streak',
        items: ['One freeze a week, built in', 'A bad day isn’t a reset', 'You check in anyway', 'No scolding, ever'],
      },
    }),
    statement({
      kicker: 'Why it matters',
      title: 'The habit is looking. Not flinching.',
      body: 'People who are “good with money” aren’t spending less every single day. They just always know roughly where they are.',
    }),
    cta({
      title: 'Know where you are.',
      body: 'Tally is a read-only budgeting app. It never moves your money — it just stops the month from surprising you.',
    }),
  ],

  /* 2 — the save-bait utility carousel. */
  'c2-subscriptions': [
    cover({
      chip: 'Checklist',
      title: 'The 6 charges<br>quietly eating<br>your money.',
      sub: 'Most people find at least two they forgot existed.',
    }),
    statement({
      kicker: 'Start here',
      title: 'Free trials don’t end. They convert.',
      body: 'That’s the whole business model. The trial isn’t the product — forgetting is.',
    }),
    list({
      kicker: 'Save this',
      title: 'Check these six, in this order',
      items: [
        { h: 'Trials converting in the next 7 days', p: 'The single highest-value thing to look at today.' },
        { h: 'Anything billed yearly', p: 'It renews invisibly because you only see it once.' },
        { h: 'Duplicate streaming', p: 'Two music apps. Three video apps. It happens to everyone.' },
        { h: 'The “student rate” that expired', p: 'It quietly went full price and nobody emailed you.' },
        { h: 'App Store subscriptions', p: 'These hide outside your bank statement. Check Settings.' },
        { h: 'Anything you last opened 3+ months ago', p: 'If you can’t remember using it, that’s the answer.' },
      ],
    }),
    bigNumber({
      kicker: 'The maths nobody does',
      value: '$143',
      label: 'One $11.99/mo subscription, per year.',
      body: 'Cancelling two forgotten ones is a few hundred dollars you didn’t have to earn.',
      dark: true,
    }),
    statement({
      kicker: 'The trap',
      title: 'Cancelling is boring, so it loses to everything else.',
      body: 'It’s never urgent. That’s exactly why it keeps costing you. The fix isn’t discipline — it’s a reminder that arrives before the charge.',
    }),
    cta({
      title: 'Tally watches the ones you forgot.',
      body: 'It flags trials before they convert, and shows the yearly cost next to the monthly price — because that’s the number that actually matters.',
    }),
  ],

  /* 3 — framework, for saves. */
  'c3-first-budget': [
    cover({
      chip: 'Framework',
      title: 'Your first<br>budget is<br>4 numbers.',
      sub: 'Not a spreadsheet. Not an envelope system. Four.',
    }),
    list({
      kicker: 'That’s the whole thing',
      title: 'Write these down',
      items: [
        { h: 'What comes in', p: 'Shifts, allowance, birthday money. Monthly.' },
        { h: 'What leaves on its own', p: 'Subscriptions, phone, anything automatic.' },
        { h: 'What you want to keep', p: 'The saving number. Pick it first, not last.' },
        { h: 'What’s left', p: 'This is the only number you actually have to manage.' },
      ],
    }),
    statement({
      kicker: 'The one rule',
      title: 'Pick the saving number before the spending number.',
      body: 'If saving is whatever survives the month, nothing survives the month. Decide it first and the rest sorts itself out.',
    }),
    bigNumber({
      kicker: 'Then divide',
      value: '÷4',
      label: 'Turn “what’s left” into a weekly number.',
      body: 'A month is too long to feel. A week is something you can actually steer.',
      dark: true,
    }),
    statement({
      kicker: 'Why most budgets fail',
      title: 'They’re built for a month you’ve never had.',
      body: 'Perfect month, no surprises, nothing social. Build for a normal one instead — the one with a birthday dinner in it.',
    }),
    cta({
      title: 'Tally does the fourth number for you.',
      body: 'It tracks the three above and tells you what’s safe to spend this week. Free to start, and it never moves your money.',
    }),
  ],

  /* 4 — the parent carousel. The parent holds the card. */
  'c4-for-parents': [
    cover({
      kicker: 'For parents',
      title: 'You can’t<br>teach money<br>with a<br>lecture.',
      sub: 'But you can hand them the thing you wish you’d had at 16.',
      dark: true,
    }),
    statement({
      kicker: 'The honest problem',
      title: 'They learn money from whatever they’re already holding.',
      body: 'Right now that’s a phone that is extremely good at getting them to spend, and nothing on the other side of the scale.',
    }),
    compare({
      kicker: 'What Tally is, and isn’t',
      title: 'Read this before you sign anything up',
      left: {
        h: 'Tally never',
        items: ['Moves money', 'Issues a card', 'Sells their data', 'Shows ads', 'Reads their chats'],
      },
      right: {
        h: 'Tally does',
        items: ['Track spending', 'Flag free trials', 'Show you their pace', 'Teach by showing', 'Stay read-only'],
      },
    }),
    list({
      kicker: 'On a Family plan',
      title: 'What you actually see',
      items: [
        { h: 'Their buckets and how they’re pacing', p: 'Not a transaction-by-transaction audit.' },
        { h: 'Their goals and progress', p: 'The concert ticket. The laptop. The thing they’re working toward.' },
        { h: 'An alert when a bucket goes off pace', p: 'Early, while it’s still a conversation instead of a problem.' },
      ],
    }),
    statement({
      kicker: 'And deliberately not',
      title: 'You can see their budget. You can’t edit it.',
      body: 'It stops being their money the moment you can overrule it — and that’s the exact moment they stop learning anything.',
    }),
    bigNumber({
      kicker: 'One more thing',
      value: '18+',
      label: 'Only an adult can connect a bank.',
      body: 'The service that powers bank connections requires account holders to be 18 or over. So you link yours. They never link theirs.',
      dark: true,
    }),
    cta({
      title: 'Start them before the first paycheck.',
      body: 'Family is $20/month for up to five teens. The free plan works forever if you’d rather just try it.',
    }),
  ],

  /* 5 — single posts. */
  'singles': [
    cover({
      chip: 'Reminder',
      title: 'Being broke<br>and being<br>bad with<br>money are<br>different<br>things.',
      sub: 'One is a number. The other is a story you were told.',
      dark: true,
    }),
    statement({
      kicker: 'Tally',
      title: 'We don’t do “you spent $7 on coffee again” energy.',
      body: 'You’re allowed to buy the coffee. You just deserve to know what’s left afterwards.',
    }),
    bigNumber({
      kicker: 'Read-only, always',
      value: '$0',
      label: 'The amount Tally can move.',
      body: 'It can read your balance and your transactions. It cannot send, spend, or transfer a cent. That’s not a setting — it’s the whole design.',
      dark: true,
    }),
    statement({
      kicker: 'Why a streak at all',
      title: 'A freeze a week, because life has weeks like that.',
      body: 'Miss a day and nothing resets. The habit we care about is checking in, and you can’t build that with a punishment.',
    }),
  ],
}

/* ─────────────────────────── render ─────────────────────────── */

function page(html) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS}</style></head><body>${html}</body></html>`
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

let total = 0
for (const [set, slides] of Object.entries(SETS)) {
  const dir = join(OUT, set)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  slides.forEach((html, i) => {
    const n = String(i + 1).padStart(2, '0')
    const file = join(TMP, `${set}-${n}.html`)
    writeFileSync(file, page(html))
    execFileSync(
      CHROME,
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${W},${H}`,
        `--screenshot=${join(dir, `${n}.png`)}`,
        '--virtual-time-budget=4000',
        `file://${file}`,
      ],
      { stdio: 'ignore' },
    )
    total++
    process.stdout.write(`  ${set}/${n}.png\n`)
  })
}

rmSync(TMP, { recursive: true, force: true })
console.log(`\n${total} slides rendered to marketing/instagram/out/`)
