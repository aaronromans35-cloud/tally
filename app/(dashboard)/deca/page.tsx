'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  EVENTS, CLUSTER_LABEL, PIS, QUIZ_QUESTIONS, WRITTEN_SECTIONS,
  MILESTONE_TEMPLATE, RUBRIC_CATEGORIES, PREP_CHECKLIST, QA_BANK, MOCK_RUBRIC, MOCK_LEVELS,
  daysBetween, fmtDate, shuffle, piFor, questionsFor, scenariosFor,
  type DecaEvent, type PiEntry, type QuizQuestion,
} from '@/lib/deca'

const INK = { navy900: '#0A1A2F', navy800: '#0B1F3A', navy700: '#14304F', navy300: '#8B9CB5', navy200: '#C4CEDC', navy100: '#E2E7EE', navy50: '#F1F4F8' }
const CREAM = { c50: '#FBF9F4', c200: '#EFEAE0' }
const GOLD = { g700: '#8A5A0B', g600: '#6B5318', g500: '#C9A437', g200: '#ECD79B', g100: '#F5E9C4', g50: '#FAF4E2' }
const POS = '#1F6B47', POS_BG = '#E3F3EA', NEG = '#9B2C2C', NEG_BG = '#FBEAEA', RED = '#C73E3E', INK500 = '#6B707A', INK700 = '#2A2E35'

interface TrackedEvent extends DecaEvent { id: string; addedAt: number }
interface TestState { pool: QuizQuestion[]; idx: number; answers: Record<number, number>; startedAt: number; finished: boolean; len: number }
interface FlashState { order: number[]; idx: number; flipped: boolean; known: Record<number, boolean>; shaky: Record<number, boolean> }
interface PiLibState { open: number; query: string; known: Record<number, boolean> }
interface MockState { phase: 'setup' | 'prep' | 'present' | 'score'; scenarioIdx: number; endsAt: number; notes: string; rubric: Record<string, number>; piSet?: PiEntry[] }
interface SourceRow { title: string; url: string }
interface WrittenState {
  sectionDone: Record<number, boolean>; sectionNotes: Record<number, string>
  milestoneDone: Record<number, boolean>; rubricAddr: Record<number, boolean>; rubricNotes: Record<number, string>
  prepDone: Record<number, boolean>; qaAnswers: Record<number, string>; sources: SourceRow[]
}
type QuizAnswerDims = Record<string, number>

const emptyWritten: WrittenState = { sectionDone: {}, sectionNotes: {}, milestoneDone: {}, rubricAddr: {}, rubricNotes: {}, prepDone: {}, qaAnswers: {}, sources: [{ title: '', url: '' }] }

const pillStyle = (active: boolean): CSSProperties => ({
  flexShrink: 0, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 999,
  border: `1.5px solid ${active ? INK.navy800 : INK.navy100}`, background: active ? INK.navy800 : '#FFFFFF',
  color: active ? CREAM.c50 : INK.navy900, cursor: 'pointer', whiteSpace: 'nowrap',
})

const checkboxStyle = (done: boolean): CSSProperties => ({
  width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 10, fontWeight: 700, border: `1.5px solid ${done ? INK.navy800 : INK.navy200}`,
  background: done ? INK.navy800 : 'transparent', color: CREAM.c50,
})

export default function DecaStudyHubPage() {
  const [route, setRoute] = useState<'dash' | 'quiz' | 'event'>('dash')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [eventTab, setEventTab] = useState('overview')
  const [events, setEvents] = useState<TrackedEvent[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [tick, setTick] = useState(0)
  const [compDate] = useState('2026-11-14')
  const [quiz, setQuiz] = useState<{ step: number; answers: QuizAnswerDims[]; done: boolean }>({ step: 0, answers: [], done: false })
  const [test, setTest] = useState<Record<string, TestState>>({})
  const [flash, setFlash] = useState<Record<string, FlashState>>({})
  const [pi, setPi] = useState<Record<string, PiLibState>>({})
  const [mock, setMock] = useState<Record<string, MockState>>({})
  const [written, setWritten] = useState<Record<string, WrittenState>>({})
  const [pendingLen, setPendingLen] = useState(20)
  const [weekDone, setWeekDone] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const getEvent = (id: string | null) => events.find(e => e.id === id) ?? null

  function addEvent(catalogItem: DecaEvent) {
    const existing = events.find(e => e.code === catalogItem.code)
    if (existing) { openEvent(existing.id); return }
    const ev: TrackedEvent = { ...catalogItem, id: catalogItem.code, addedAt: Date.now() }
    setEvents(s => [...s, ev])
    setPickerOpen(false); setPickerQuery('')
    openEvent(ev.id)
  }
  function openEvent(id: string) { setRoute('event'); setActiveId(id); setEventTab('overview') }

  function answerQuiz(dims: QuizAnswerDims) {
    setQuiz(s => {
      const answers = [...s.answers, dims]
      return { step: s.step + 1, answers, done: answers.length >= QUIZ_QUESTIONS.length }
    })
  }
  function retakeQuiz() { setQuiz({ step: 0, answers: [], done: false }) }
  function computeQuizTotals() {
    const totals: Record<string, number> = { mk: 0, fi: 0, ht: 0, bm: 0, en: 0, team: 0, writing: 0, speaking: 0 }
    quiz.answers.forEach(d => Object.keys(d).forEach(k => { totals[k] = (totals[k] || 0) + d[k] }))
    return totals
  }
  function quizTop3(): DecaEvent[] {
    const t = computeQuizTotals()
    const scored = EVENTS.map(ev => {
      const clusterScore = ev.cluster === 'core' ? (t.mk + t.fi + t.ht + t.bm + t.en) / 5 : (t[ev.cluster] || 0)
      const formatScore = ev.format === 'written' ? t.writing : t.speaking
      const teamScore = ev.team ? t.team : Math.max(0, 6 - t.team)
      return { ev, score: clusterScore * 2 + formatScore * 1.5 + teamScore }
    })
    scored.sort((a, b) => b.score - a.score)
    const seen = new Set<string>(); const out: DecaEvent[] = []
    for (const s of scored) { if (!seen.has(s.ev.code)) { seen.add(s.ev.code); out.push(s.ev) } if (out.length === 3) break }
    return out
  }
  function reasoningFor(ev: DecaEvent) {
    const t = computeQuizTotals()
    const formatLean = ev.format === 'written'
      ? (t.writing >= t.speaking ? 'leaned toward writing over speaking on your feet' : 'still fits a writing-first event even though you leaned toward speaking')
      : (t.speaking >= t.writing ? 'leaned toward speaking on your feet over writing' : 'fits a live event even though your answers leaned toward writing')
    const teamLine = ev.team ? 'You also showed a preference for sharing the decision with a partner, which fits a team event.' : 'You also showed a preference for owning the outcome yourself, which fits an individual event.'
    return `Your answers pointed hardest toward ${CLUSTER_LABEL[ev.cluster]} and ${formatLean}. ${teamLine}`
  }

  function beginTest(id: string, cluster: string, len: number) {
    const pool = shuffle(questionsFor(cluster), id.length + (Date.now() % 97)).slice(0, len)
    setTest(s => ({ ...s, [id]: { pool, idx: 0, answers: {}, startedAt: Date.now(), finished: false, len } }))
    setPendingLen(len)
  }
  function selectAnswer(id: string, qIdx: number, choiceIdx: number) {
    setTest(s => ({ ...s, [id]: { ...s[id], answers: { ...s[id].answers, [qIdx]: choiceIdx } } }))
  }
  function navTest(id: string, dir: number) {
    setTest(s => { const t = s[id]; const idx = Math.max(0, Math.min(t.pool.length - 1, t.idx + dir)); return { ...s, [id]: { ...t, idx } } })
  }
  function finishTest(id: string) { setTest(s => ({ ...s, [id]: { ...s[id], finished: true } })) }
  function retest(id: string) { setTest(s => { const c = { ...s }; delete c[id]; return c }) }

  function ensureFlash(id: string, cluster: string): FlashState {
    if (flash[id]) return flash[id]
    const order = shuffle(piFor(cluster).map((_, i) => i), id.length + 3)
    const f: FlashState = { order, idx: 0, flipped: false, known: {}, shaky: {} }
    setFlash(s => ({ ...s, [id]: f }))
    return f
  }
  function flipCard(id: string) { setFlash(s => ({ ...s, [id]: { ...s[id], flipped: !s[id].flipped } })) }
  function markCard(id: string, know: boolean) {
    setFlash(s => {
      const f = s[id]; const piIdx = f.order[f.idx]
      const known = { ...f.known }, shaky = { ...f.shaky }
      if (know) known[piIdx] = true; else shaky[piIdx] = true
      const nextIdx = (f.idx + 1) % f.order.length
      return { ...s, [id]: { ...f, known, shaky, idx: nextIdx, flipped: false } }
    })
  }
  function reshuffleDeck(id: string, cluster: string) {
    const order = shuffle(piFor(cluster).map((_, i) => i), Date.now() % 1000)
    setFlash(s => ({ ...s, [id]: { order, idx: 0, flipped: false, known: {}, shaky: {} } }))
  }

  function ensurePi(id: string): PiLibState { return pi[id] || { open: -1, query: '', known: {} } }
  function togglePi(id: string, idx: number) { setPi(s => { const p = ensurePi(id); return { ...s, [id]: { ...p, open: p.open === idx ? -1 : idx } } }) }
  function setPiQuery(id: string, q: string) { setPi(s => ({ ...s, [id]: { ...ensurePi(id), query: q } })) }
  function knowPi(id: string, idx: number) { setPi(s => { const p = ensurePi(id); const known = { ...p.known }; known[idx] = !known[idx]; return { ...s, [id]: { ...p, known } } }) }

  function ensureMock(id: string): MockState {
    if (mock[id]) return mock[id]
    const m: MockState = { phase: 'setup', scenarioIdx: 0, endsAt: 0, notes: '', rubric: {} }
    setMock(s => ({ ...s, [id]: m }))
    return m
  }
  function startPrep(id: string, cluster: string) {
    setMock(s => ({ ...s, [id]: { ...ensureMock(id), phase: 'prep', endsAt: Date.now() + 10 * 60000, piSet: shuffle(piFor(cluster), id.length + 11).slice(0, 4) } }))
  }
  function pickScenario(id: string, idx: number) { setMock(s => ({ ...s, [id]: { ...ensureMock(id), scenarioIdx: idx } })) }
  function mockAdvance(id: string) {
    setMock(s => {
      const m = s[id]; let phase = m.phase, endsAt = m.endsAt
      if (phase === 'prep') { phase = 'present'; endsAt = Date.now() + 10 * 60000 }
      else if (phase === 'present') { phase = 'score' }
      return { ...s, [id]: { ...m, phase, endsAt } }
    })
  }
  function setMockNotes(id: string, v: string) { setMock(s => ({ ...s, [id]: { ...s[id], notes: v } })) }
  function setMockRubric(id: string, key: string, pts: number) { setMock(s => ({ ...s, [id]: { ...s[id], rubric: { ...s[id].rubric, [key]: pts } } })) }
  function resetMock(id: string) { setMock(s => ({ ...s, [id]: { phase: 'setup', scenarioIdx: 0, endsAt: 0, notes: '', rubric: {} } })) }

  function ensureWritten(id: string): WrittenState { return written[id] || emptyWritten }
  function updWritten(id: string, patch: Partial<WrittenState>) { setWritten(s => ({ ...s, [id]: { ...ensureWritten(id), ...patch } })) }

  const now = Date.now()
  const today = useMemo(() => new Date(), [])
  void tick
  const comp = new Date(compDate + 'T00:00:00')
  const daysToComp = Math.max(0, daysBetween(today, comp))
  const evLower = pickerQuery.trim().toLowerCase()

  const groupsMap: Record<string, DecaEvent[]> = {}
  EVENTS.forEach(it => {
    if (evLower && !it.name.toLowerCase().includes(evLower) && !it.code.toLowerCase().includes(evLower)) return
    ;(groupsMap[it.category] = groupsMap[it.category] || []).push(it)
  })

  const totalPiCount = PIS.length
  let knownCount = 0
  Object.values(pi).forEach(p => { knownCount += Object.values(p.known || {}).filter(Boolean).length })
  Object.values(flash).forEach(f => { knownCount += Object.keys(f.known || {}).length })
  const piKnown = Math.min(totalPiCount, knownCount)
  const testScores = Object.values(test).filter(t => t.finished).map(t => {
    let correct = 0; t.pool.forEach((q, i) => { if (t.answers[i] === q.answer) correct++ })
    return correct / t.pool.length
  })
  const readyRatio = testScores.length
    ? (testScores.reduce((a, b) => a + b, 0) / testScores.length) * 0.6 + (piKnown / Math.max(1, totalPiCount)) * 0.4
    : (piKnown / Math.max(1, totalPiCount)) * 0.5
  const readyPctNum = Math.round(readyRatio * 100)

  const activeEvent = getEvent(activeId)

  const coachNotes = [
    "The fastest points come from performance indicators you already half-know. Drill the shaky pile before you drill anything new.",
    "A judge decides most of your role-play score in the first ninety seconds. Practice your opening line until it's automatic.",
    "Written events lose points to formatting and page overruns as often as to weak ideas. Check the budget before you write more.",
  ]
  const coachNote = coachNotes[daysToComp % coachNotes.length]

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: CREAM.c50, fontFamily: "'Geist', system-ui, sans-serif", color: INK.navy900, margin: '-28px -32px', padding: 0 }}>
      <style>{`
        .deca-hub a { color: ${INK.navy700}; text-decoration: none; }
        .deca-hub button { font-family: inherit; }
        .deca-hub input, .deca-hub textarea { font-family: inherit; }
      `}</style>
      <div className="deca-hub">
        <Masthead
          route={route} setRoute={setRoute}
          todayLabel={today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          events={events} activeId={activeId} openEvent={openEvent}
          onOpenPicker={() => setPickerOpen(true)}
        />

        {pickerOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,26,47,0.45)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setPickerOpen(false)}>
            <div style={{ width: 420, maxWidth: '92vw', height: '100%', background: CREAM.c50, boxShadow: '-8px 0 30px rgba(11,31,58,0.18)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${INK.navy100}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, letterSpacing: '-0.02em' }}>Add a DECA event</div>
                  <button onClick={() => setPickerOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 20, color: INK500, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <input value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} placeholder={`Search all ${EVENTS.length} events…`}
                  style={{ fontSize: 13.5, padding: '10px 14px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900 }} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 30px' }}>
                {Object.keys(groupsMap).map(cat => (
                  <div key={cat}>
                    <div style={{ padding: '14px 24px 4px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: INK500 }}>{cat}</div>
                    {groupsMap[cat].map(it => {
                      const added = events.some(e => e.code === it.code)
                      return (
                        <button key={it.code} onClick={() => addEvent(it)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '10px 24px', border: 'none', background: added ? GOLD.g50 : '#FFFFFF', cursor: 'pointer', borderTop: `1px solid ${CREAM.c200}` }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: GOLD.g700, width: 46, flexShrink: 0 }}>{it.code}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.35 }}>{it.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: added ? GOLD.g700 : INK.navy700 }}>{added ? 'Added' : '+ Add'}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main style={{ flex: 1, width: '100%' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 28px 110px', display: 'flex', flexDirection: 'column', gap: 40 }}>

            {route === 'dash' && (
              <DashboardView
                events={events} daysToComp={daysToComp} comp={comp} today={today}
                readyPctNum={readyPctNum} piKnown={piKnown} totalPiCount={totalPiCount}
                coachNote={coachNote} weekDone={weekDone} setWeekDone={setWeekDone}
                onOpenPicker={() => setPickerOpen(true)} onGoQuiz={() => setRoute('quiz')}
              />
            )}

            {route === 'quiz' && (
              <QuizView
                quiz={quiz} answerQuiz={answerQuiz} retakeQuiz={retakeQuiz}
                quizTop3={quizTop3} reasoningFor={reasoningFor}
                events={events} addEvent={addEvent}
              />
            )}

            {route === 'event' && activeEvent && (
              <EventDetail
                event={activeEvent} eventTab={eventTab} setEventTab={setEventTab}
                now={now}
                test={test[activeEvent.id]} pendingLen={pendingLen} setPendingLen={setPendingLen}
                beginTest={beginTest} selectAnswer={selectAnswer} navTest={navTest} finishTest={finishTest} retest={retest}
                flash={ensureFlash(activeEvent.id, activeEvent.cluster)} flipCard={flipCard} markCard={markCard} reshuffleDeck={reshuffleDeck}
                piState={ensurePi(activeEvent.id)} togglePi={togglePi} setPiQuery={setPiQuery} knowPi={knowPi}
                mockState={ensureMock(activeEvent.id)} startPrep={startPrep} pickScenario={pickScenario} mockAdvance={mockAdvance}
                setMockNotes={setMockNotes} setMockRubric={setMockRubric} resetMock={resetMock}
                writtenState={ensureWritten(activeEvent.id)} updWritten={updWritten}
                comp={comp} today={today}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

function Masthead({ route, setRoute, todayLabel, events, activeId, openEvent, onOpenPicker }: {
  route: string; setRoute: (r: 'dash' | 'quiz' | 'event') => void; todayLabel: string
  events: TrackedEvent[]; activeId: string | null; openEvent: (id: string) => void; onOpenPicker: () => void
}) {
  return (
    <header style={{ borderTop: `5px solid ${INK.navy800}`, background: '#FFFFFF' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 28px 16px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 20, borderBottom: `1px solid ${INK.navy900}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>My chapter · DECA study hub</div>
          <div style={{ fontSize: 12.5, color: INK500 }}>{todayLabel}</div>
        </div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 34, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>The Prep Desk</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifySelf: 'end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: GOLD.g50, border: `1px solid ${GOLD.g200}` }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: GOLD.g500 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: GOLD.g600 }}>6-day streak</span>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: INK.navy800, color: GOLD.g100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 13 }}>ME</div>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
        <button onClick={() => setRoute('dash')} style={pillStyle(route === 'dash')}>Dashboard</button>
        <button onClick={() => setRoute('quiz')} style={pillStyle(route === 'quiz')}>Which event? quiz</button>
        <span style={{ width: 1, height: 20, background: INK.navy100, flexShrink: 0, margin: '0 4px' }} />
        {events.map(ev => (
          <button key={ev.id} onClick={() => openEvent(ev.id)} style={pillStyle(route === 'event' && activeId === ev.id)}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', opacity: 0.7, marginRight: 7 }}>{ev.code}</span>
            {ev.name.length > 28 ? ev.name.slice(0, 27) + '…' : ev.name}
          </button>
        ))}
        <button onClick={onOpenPicker} style={{ flexShrink: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: `1.5px dashed ${INK.navy300}`, background: 'transparent', color: INK.navy700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add event</button>
      </div>
    </header>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 16, fontWeight: 600, paddingBottom: 12, borderBottom: `1px solid ${INK.navy900}` }}>{children}</div>
}

function DashboardView({ events, daysToComp, comp, today, readyPctNum, piKnown, totalPiCount, coachNote, weekDone, setWeekDone, onOpenPicker, onGoQuiz }: {
  events: TrackedEvent[]; daysToComp: number; comp: Date; today: Date
  readyPctNum: number; piKnown: number; totalPiCount: number; coachNote: string
  weekDone: Record<number, boolean>; setWeekDone: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
  onOpenPicker: () => void; onGoQuiz: () => void
}) {
  const weekTasksSrc = events.length ? [
    { label: `Run a full practice test in ${events[0].name}`, meta: '20 questions, timed' },
    { label: 'Clear 10 PI flashcards', meta: 'Any event' },
    { label: 'Run one mock role-play with a partner', meta: events.find(e => e.format === 'roleplay')?.name || 'Pick a role-play event' },
    { label: 'Draft one prepared-event section', meta: events.find(e => e.format === 'written')?.name || 'Add a prepared event' },
    { label: "Review yesterday's missed questions", meta: '5 minutes, worth it' },
  ] : [{ label: 'Add your first event to build a weekly plan', meta: 'Use + Add event above' }]

  const countdowns = [{ name: 'Districts', date: fmtDate(comp), days: daysToComp, color: daysToComp <= 14 ? RED : INK.navy800 }]
  events.filter(e => e.format === 'written').slice(0, 2).forEach(e => {
    const due = new Date(comp); due.setDate(due.getDate() - 1)
    countdowns.push({ name: e.name + ' — submit', date: fmtDate(due), days: Math.max(0, daysBetween(today, due)), color: GOLD.g700 })
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 28, borderBottom: `1px solid ${INK.navy100}` }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g500 }}>Today&apos;s brief</div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 36, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: '30ch' }}>
          {events.length ? `${events.length} event${events.length > 1 ? 's' : ''} tracked, ${daysToComp} days to go.` : "Let's figure out what you're competing in."}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.65, color: INK700, maxWidth: '62ch' }}>
          {events.length ? "Everything below is scoped to what you've added. Pick an event above to drill into its tools, or keep working the dashboard." : "Add an event you already know you're doing, or take the two-minute chooser quiz if you're not sure yet."}
        </div>
        {events.length === 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={onOpenPicker} style={{ fontSize: 13.5, fontWeight: 600, padding: '10px 18px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>Add your first event</button>
            <button onClick={onGoQuiz} style={{ fontSize: 13.5, fontWeight: 500, padding: '10px 18px', borderRadius: 6, border: `1.5px solid ${INK.navy200}`, background: 'transparent', color: INK.navy800, cursor: 'pointer' }}>Not sure which one</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Exam readiness</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1 }}>{readyPctNum}%</div>
          <div style={{ height: 4, borderRadius: 999, background: CREAM.c200, overflow: 'hidden', marginTop: 2 }}><div style={{ height: '100%', background: INK.navy800, width: `${readyPctNum}%` }} /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 24px', borderLeft: `1px solid ${INK.navy100}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Performance indicators known</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1 }}>{piKnown}</div>
            <div style={{ fontSize: 14, color: INK500 }}>/ {totalPiCount}</div>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: CREAM.c200, overflow: 'hidden', marginTop: 2 }}><div style={{ height: '100%', background: GOLD.g500, width: `${Math.round((piKnown / Math.max(1, totalPiCount)) * 100)}%` }} /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 24, borderLeft: `1px solid ${INK.navy100}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Events tracked</div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1 }}>{events.length}</div>
          <div style={{ fontSize: 12, color: INK500 }}>Districts · {fmtDate(comp)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 36, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeading>This week</SectionHeading>
          {weekTasksSrc.map((t, i) => {
            const done = !!weekDone[i]
            return (
              <button key={i} onClick={() => setWeekDone(s => ({ ...s, [i]: !s[i] }))} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: `1px solid ${CREAM.c200}`, background: 'transparent', cursor: 'pointer' }}>
                <span style={checkboxStyle(done)}>{done ? '✓' : ''}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35, color: done ? '#8A8F99' : INK.navy900, textDecoration: done ? 'line-through' : 'none' }}>{t.label}</span>
                  <span style={{ fontSize: 11.5, color: INK500 }}>{t.meta}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeading>Countdown</SectionHeading>
            {countdowns.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderBottom: `1px solid ${CREAM.c200}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: INK500 }}>{c.date}</div>
                </div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, letterSpacing: '-0.02em', color: c.color }}>{c.days}<span style={{ fontFamily: 'Geist', fontSize: 11, color: INK500 }}> d</span></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `2px solid ${GOLD.g500}`, paddingLeft: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g700 }}>Coach&apos;s note</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, lineHeight: 1.45, letterSpacing: '-0.01em' }}>{coachNote}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuizView({ quiz, answerQuiz, retakeQuiz, quizTop3, reasoningFor, events, addEvent }: {
  quiz: { step: number; answers: QuizAnswerDims[]; done: boolean }
  answerQuiz: (dims: QuizAnswerDims) => void; retakeQuiz: () => void
  quizTop3: () => DecaEvent[]; reasoningFor: (ev: DecaEvent) => string
  events: TrackedEvent[]; addEvent: (ev: DecaEvent) => void
}) {
  const q = QUIZ_QUESTIONS[quiz.step]
  const results = quiz.done ? quizTop3() : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {!quiz.done && q && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 620, margin: '20px auto 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g500 }}>Question {Math.min(quiz.step + 1, QUIZ_QUESTIONS.length)} of {QUIZ_QUESTIONS.length}</div>
            <div style={{ height: 3, width: 220, borderRadius: 999, background: CREAM.c200, overflow: 'hidden' }}><div style={{ height: '100%', background: INK.navy800, width: `${Math.round((quiz.step / QUIZ_QUESTIONS.length) * 100)}%` }} /></div>
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 27, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.35, textAlign: 'center' }}>{q.text}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((o, i) => (
              <button key={i} onClick={() => answerQuiz(o.dims)} style={{ textAlign: 'left', padding: '16px 20px', borderRadius: 8, border: `1.5px solid ${INK.navy200}`, background: '#FFFFFF', fontSize: 14.5, lineHeight: 1.5, cursor: 'pointer' }}>{o.text}</button>
            ))}
          </div>
        </div>
      )}

      {quiz.done && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20, borderBottom: `1px solid ${INK.navy100}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g500 }}>Your results</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, letterSpacing: '-0.02em' }}>Three events worth trying</div>
            <div style={{ fontSize: 14, color: INK500 }}>Ranked from your answers, best fit first.</div>
          </div>
          {results.map((ev, i) => {
            const already = events.some(e => e.code === ev.code)
            return (
              <div key={ev.code} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '22px 0', borderBottom: `1px solid ${CREAM.c200}` }}>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 40, fontWeight: 400, color: GOLD.g500, lineHeight: 1, flexShrink: 0, width: 46 }}>{i + 1}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 21, letterSpacing: '-0.015em' }}>{ev.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD.g600, background: GOLD.g100, padding: '3px 8px', borderRadius: 999 }}>{ev.code}</span>
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: INK700, maxWidth: '60ch' }}>{reasoningFor(ev)}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => addEvent(ev)} style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>{already ? 'Already added' : 'Add this event'}</button>
                  </div>
                </div>
              </div>
            )
          })}
          <button onClick={retakeQuiz} style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 500, padding: '9px 16px', borderRadius: 6, border: `1.5px solid ${INK.navy200}`, background: 'transparent', color: INK.navy800, cursor: 'pointer' }}>Retake the quiz</button>
        </div>
      )}
    </div>
  )
}

interface EventDetailProps {
  event: TrackedEvent; eventTab: string; setEventTab: (t: string) => void; now: number
  test?: TestState; pendingLen: number; setPendingLen: (n: number) => void
  beginTest: (id: string, cluster: string, len: number) => void
  selectAnswer: (id: string, qIdx: number, choiceIdx: number) => void
  navTest: (id: string, dir: number) => void; finishTest: (id: string) => void; retest: (id: string) => void
  flash: FlashState; flipCard: (id: string) => void; markCard: (id: string, know: boolean) => void
  reshuffleDeck: (id: string, cluster: string) => void
  piState: PiLibState; togglePi: (id: string, idx: number) => void; setPiQuery: (id: string, q: string) => void; knowPi: (id: string, idx: number) => void
  mockState: MockState; startPrep: (id: string, cluster: string) => void; pickScenario: (id: string, idx: number) => void
  mockAdvance: (id: string) => void; setMockNotes: (id: string, v: string) => void
  setMockRubric: (id: string, key: string, pts: number) => void; resetMock: (id: string) => void
  writtenState: WrittenState; updWritten: (id: string, patch: Partial<WrittenState>) => void
  comp: Date; today: Date
}

function EventDetail(props: EventDetailProps) {
  const { event, eventTab, setEventTab } = props
  const cluster = event.cluster
  const label = CLUSTER_LABEL[cluster] || cluster
  const blurb = `${event.team ? 'A team' : 'An individual'} ${event.format === 'roleplay' ? 'role-play' : 'written and presented'} event in ${label}. ${event.format === 'roleplay' ? 'You get a scenario and prep time, then perform in front of a judge.' : 'You research a real or hypothetical business, write it up, then defend it to a judge panel.'}`
  const evFacts = [
    { k: 'Cluster', v: label },
    { k: 'Format', v: (event.team ? 'Team' : 'Individual') + ', ' + (event.format === 'roleplay' ? 'role-play' : 'written + oral') },
    { k: 'Structure', v: event.format === 'roleplay' ? '10-min prep, then a scored performance' : 'Written entry, then an oral defense' },
  ]
  const evScoring = event.format === 'roleplay'
    ? [{ label: 'Performance indicators', pts: '70 pts', note: "Four PIs the scenario calls for, each scored on how clearly and specifically you cover it." }, { label: 'Overall impression & professionalism', pts: '30 pts', note: 'Opening, poise under questions, and a clear close.' }]
    : [{ label: 'Prepared entry', pts: '70 pts', note: 'Content, organization, and adherence to the page/format rules — some 10-page events now require a pitch deck instead of a paper.' }, { label: 'Oral presentation & Q&A', pts: '30 pts', note: 'Delivery, time management, and how you handle judge questions.' }]

  const modeCards = event.format === 'roleplay' ? [
    { kicker: 'Test', title: 'Timed practice test', body: "20 questions pulled from this event's cluster, with a running clock.", cta: 'Start test', tab: 'test' },
    { kicker: 'Flashcards', title: 'PI flashcards', body: 'Flip through the indicators for this cluster until nothing feels shaky.', cta: 'Study cards', tab: 'flash' },
    { kicker: 'Library', title: 'Every PI, explained', body: 'The full reference — plain English, what to say, and a sample line.', cta: 'Browse library', tab: 'pis' },
    { kicker: 'Role-play', title: 'Mock role-play + rubric', body: "10-minute prep timer, a real scenario, then score yourself against the judge's rubric.", cta: 'Run a mock', tab: 'mock' },
  ] : [
    { kicker: 'Outline', title: 'Section-by-section builder', body: 'Every required section with its page budget and where judges dock points.', cta: 'Build outline', tab: 'outline' },
    { kicker: 'Calendar', title: 'Deadlines & milestones', body: 'Backward-planned from your competition date.', cta: 'See milestones', tab: 'milestones' },
    { kicker: 'Rubric', title: 'Point tracker', body: 'The oral-defense rubric, so nothing gets left unprepared.', cta: 'Track rubric', tab: 'rubric' },
    { kicker: 'Q&A', title: 'Interview prep + judge bank', body: 'A presentation checklist and eight questions judges actually ask.', cta: 'Prep answers', tab: 'interview' },
  ]

  const tabDefs = event.format === 'roleplay'
    ? [['overview', 'Overview'], ['test', 'Practice test'], ['flash', 'PI flashcards'], ['pis', 'PI library'], ['mock', 'Mock role-play']]
    : [['overview', 'Overview'], ['outline', 'Outline'], ['milestones', 'Milestones'], ['rubric', 'Rubric'], ['interview', 'Interview & Q&A'], ['sources', 'Sources']]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20, borderBottom: `1px solid ${INK.navy900}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 999, background: INK.navy50, color: '#1F4F8A' }}>{label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 999, background: GOLD.g100, color: GOLD.g600 }}>{event.format === 'roleplay' ? 'Role-play' : 'Prepared event'}</span>
        </div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 32, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.15 }}>{event.name}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: INK700, maxWidth: '68ch' }}>{blurb}</div>
      </div>

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {tabDefs.map(([key, lbl]) => (
          <button key={key} onClick={() => setEventTab(key)} style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, padding: '9px 14px 11px', border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${eventTab === key ? INK.navy800 : 'transparent'}`, color: eventTab === key ? INK.navy900 : INK500 }}>{lbl}</button>
        ))}
      </div>

      {eventTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {evFacts.map(f => (
              <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: 4, borderLeft: `2px solid ${INK.navy100}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>{f.k}</div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeading>Scoring, in plain terms</SectionHeading>
            {evScoring.map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 0', borderBottom: `1px solid ${CREAM.c200}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: INK500 }}>{s.pts}</div>
                </div>
                <div style={{ fontSize: 12.5, color: INK500, lineHeight: 1.5 }}>{s.note}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SectionHeading>Study modes</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: INK.navy100, marginTop: 1 }}>
              {modeCards.map(m => (
                <button key={m.tab} onClick={() => setEventTab(m.tab)} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', textAlign: 'left', padding: '20px 4px 22px', border: 'none', background: CREAM.c50, cursor: 'pointer' }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500 }}>{m.kicker}</span>
                  <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, letterSpacing: '-0.015em', lineHeight: 1.2 }}>{m.title}</span>
                  <span style={{ fontSize: 12.5, color: INK700, lineHeight: 1.5 }}>{m.body}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: INK.navy700, marginTop: 4 }}>{m.cta} →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {eventTab === 'test' && <TestTab {...props} cluster={cluster} />}
      {eventTab === 'flash' && <FlashTab {...props} cluster={cluster} />}
      {eventTab === 'pis' && <PiLibraryTab {...props} label={label} />}
      {eventTab === 'mock' && <MockTab {...props} cluster={cluster} />}

      {eventTab === 'outline' && <OutlineTab {...props} />}
      {eventTab === 'milestones' && <MilestonesTab {...props} />}
      {eventTab === 'rubric' && <RubricTab {...props} />}
      {eventTab === 'interview' && <InterviewTab {...props} />}
      {eventTab === 'sources' && <SourcesTab {...props} />}
    </div>
  )
}

function TestTab(props: EventDetailProps & { cluster: string }) {
  const { event, test, pendingLen, setPendingLen, beginTest, selectAnswer, navTest, finishTest, retest, now, cluster } = props
  if (!test) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Set up your practice test</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Length</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setPendingLen(n)} style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: '10px 6px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${pendingLen === n ? INK.navy800 : INK.navy100}`, background: pendingLen === n ? INK.navy800 : '#FFFFFF', color: pendingLen === n ? CREAM.c50 : INK.navy900 }}>{n} Q</button>
            ))}
          </div>
        </div>
        <button onClick={() => beginTest(event.id, cluster, pendingLen)} style={{ alignSelf: 'flex-start', fontSize: 13.5, fontWeight: 600, padding: '11px 20px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>Start test</button>
      </div>
    )
  }
  if (!test.finished) {
    const q = test.pool[test.idx]
    const elapsed = Math.floor((now - test.startedAt) / 1000)
    const remain = Math.max(0, test.pool.length * 60 - elapsed)
    const mm = String(Math.floor(remain / 60)).padStart(2, '0'), ss = String(remain % 60).padStart(2, '0')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Question {test.idx + 1} of {test.pool.length}</div>
            <div style={{ fontSize: 11.5, color: INK500 }}>{q.area}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: remain < 60 ? RED : INK.navy900 }}>{mm}:{ss}</div>
            <button onClick={() => finishTest(event.id)} style={{ fontSize: 12.5, fontWeight: 500, padding: '7px 14px', borderRadius: 6, border: `1px solid ${INK.navy200}`, background: '#FFFFFF', color: INK.navy800, cursor: 'pointer' }}>Score it now</button>
          </div>
        </div>
        <div style={{ height: 3, background: CREAM.c200 }}><div style={{ height: '100%', background: GOLD.g500, width: `${Math.round(((test.idx + 1) / test.pool.length) * 100)}%` }} /></div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.4, maxWidth: '68ch' }}>{q.stem}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          {q.choices.map((c, i) => {
            const sel = test.answers[test.idx] === i
            return (
              <button key={i} onClick={() => selectAnswer(event.id, test.idx, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', padding: '14px 16px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${sel ? INK.navy800 : INK.navy100}`, background: sel ? INK.navy50 : '#FFFFFF' }}>
                <span style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, background: sel ? INK.navy800 : CREAM.c200, color: sel ? CREAM.c50 : INK.navy900 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, paddingTop: 2 }}>{c}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button onClick={() => navTest(event.id, -1)} style={{ fontSize: 13.5, fontWeight: 500, padding: '10px 16px', borderRadius: 6, border: `1px solid ${INK.navy200}`, background: '#FFFFFF', color: INK.navy800, cursor: 'pointer', opacity: test.idx === 0 ? 0.4 : 1 }}>Back</button>
          <div style={{ fontSize: 12, color: INK500 }}>{Object.keys(test.answers).length} of {test.pool.length} answered</div>
          <button onClick={() => test.idx === test.pool.length - 1 ? finishTest(event.id) : navTest(event.id, 1)} style={{ fontSize: 13.5, fontWeight: 600, padding: '10px 20px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>{test.idx === test.pool.length - 1 ? 'Finish & score' : 'Next'}</button>
        </div>
      </div>
    )
  }

  let correct = 0
  const byArea: Record<string, { c: number; n: number }> = {}
  test.pool.forEach((qq, i) => {
    const ok = test.answers[i] === qq.answer
    if (ok) correct++
    byArea[qq.area] = byArea[qq.area] || { c: 0, n: 0 }
    byArea[qq.area].n++
    if (ok) byArea[qq.area].c++
  })
  const pct = Math.round((correct / test.pool.length) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 30, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g500 }}>Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 14, color: INK500 }}>{correct} of {test.pool.length} correct</div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: INK700, marginTop: 4 }}>{pct >= 80 ? "Strong. This cluster's exam won't be your weak point." : pct >= 60 ? 'Solid base — a couple more passes and this is locked in.' : 'This is your highest-leverage study time right now.'}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={() => retest(event.id)} style={{ fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>New test</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 600, paddingBottom: 10, borderBottom: `1px solid ${INK.navy900}` }}>Breakdown by area</div>
          {Object.keys(byArea).map(a => {
            const r = byArea[a]; const pctA = Math.round((r.c / r.n) * 100)
            const color = pctA >= 70 ? '#2D8A5C' : pctA >= 40 ? GOLD.g500 : RED
            return (
              <div key={a} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 56px', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${CREAM.c200}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a}</div>
                <div style={{ height: 5, borderRadius: 999, background: CREAM.c200, overflow: 'hidden' }}><div style={{ height: '100%', background: color, width: `${pctA}%` }} /></div>
                <div style={{ fontSize: 12, color: INK700, textAlign: 'right' }}>{r.c}/{r.n}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SectionHeading>Review every question</SectionHeading>
        {test.pool.map((qq, i) => {
          const your = test.answers[i]; const ok = your === qq.answer
          return (
            <div key={i} style={{ padding: '18px 0', borderBottom: `1px solid ${CREAM.c200}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: ok ? POS_BG : NEG_BG, color: ok ? POS : NEG }}>{ok ? '✓' : '✕'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.45 }}>{qq.stem}</div>
                <div style={{ fontSize: 13, color: INK700 }}>Your answer: <strong style={{ color: ok ? POS : NEG }}>{your != null ? qq.choices[your] : '—'}</strong> · Correct: <strong style={{ color: POS }}>{qq.choices[qq.answer]}</strong></div>
                <div style={{ fontSize: 13, color: INK700, lineHeight: 1.55, borderLeft: `2px solid ${GOLD.g500}`, padding: '8px 14px' }}>{qq.why}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FlashTab(props: EventDetailProps & { cluster: string }) {
  const { event, flash, flipCard, markCard, reshuffleDeck, cluster } = props
  const piList = piFor(cluster)
  const curPi = piList[flash.order[flash.idx]]
  if (!curPi) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ fontSize: 12.5, color: INK500 }}>Front is how the judge reads it. Back is what it means and what to say.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: INK500 }}>{flash.idx + 1} / {piList.length} · {Object.keys(flash.known).length} known</div>
          <button onClick={() => reshuffleDeck(event.id, cluster)} style={{ fontSize: 12.5, fontWeight: 500, padding: '8px 14px', borderRadius: 6, border: `1px solid ${INK.navy200}`, background: '#FFFFFF', color: INK.navy800, cursor: 'pointer' }}>Reshuffle</button>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 700, perspective: 1600 }}>
        <div style={{ position: 'relative', minHeight: 320, transition: 'transform 400ms cubic-bezier(0.2,0,0,1)', transformStyle: 'preserve-3d', transform: flash.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div onClick={() => flipCard(event.id)} style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: '#FFFFFF', border: `1.5px solid ${INK.navy900}`, borderRadius: 4, padding: 40, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500 }}>{curPi.area}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: INK500 }}>{curPi.code}</div>
            </div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{curPi.pi}</div>
            <div style={{ fontSize: 12.5, color: INK500, marginTop: 'auto' }}>Click to flip</div>
          </div>
          <div onClick={() => flipCard(event.id)} style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: INK.navy800, color: CREAM.c50, borderRadius: 4, padding: '34px 38px', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500, marginBottom: 6 }}>What it means</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{curPi.plain}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500, marginBottom: 6 }}>Say this</div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14.5, lineHeight: 1.55, color: INK.navy200 }}>&ldquo;{curPi.sample}&rdquo;</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => markCard(event.id, false)} style={{ fontSize: 13.5, fontWeight: 500, padding: '11px 22px', borderRadius: 6, border: `1px solid ${INK.navy200}`, background: '#FFFFFF', color: NEG, cursor: 'pointer' }}>Still shaky</button>
        <button onClick={() => markCard(event.id, true)} style={{ fontSize: 13.5, fontWeight: 600, padding: '11px 26px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>I&apos;ve got this</button>
      </div>
    </div>
  )
}

function PiLibraryTab(props: EventDetailProps & { label: string }) {
  const { event, piState, togglePi, setPiQuery, knowPi, label } = props
  const piList = piFor(event.cluster)
  const filtered = piList.filter(p => !piState.query || p.pi.toLowerCase().includes(piState.query.toLowerCase()) || p.area.toLowerCase().includes(piState.query.toLowerCase()))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, color: INK500 }}>{piList.length} indicators scoped to {label}.</div>
        <input value={piState.query} onChange={e => setPiQuery(event.id, e.target.value)} placeholder="Search indicators…" style={{ fontSize: 13.5, padding: '9px 13px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900, minWidth: 240 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filtered.map((p) => {
          const realIdx = piList.indexOf(p)
          const known = !!piState.known[realIdx]
          const open = piState.open === realIdx
          return (
            <div key={realIdx} style={{ borderTop: `1px solid ${INK.navy100}` }}>
              <button onClick={() => togglePi(event.id, realIdx)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: '13px 0', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 999, flexShrink: 0, background: INK.navy50, color: '#1F4F8A', width: 150, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.area}</span>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{p.pi}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: INK.navy300, flexShrink: 0 }}>{p.code}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: POS }}>{known ? 'Known' : ''}</span>
                <span style={{ fontSize: 15, color: '#9097A2', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
              </button>
              {open && (
                <div style={{ padding: '0 0 22px 164px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>In plain English</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: INK700 }}>{p.plain}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Hit it by</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: INK700 }}>{p.judge}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14.5, lineHeight: 1.55, borderLeft: `2px solid ${GOLD.g500}`, padding: '4px 16px' }}>&ldquo;{p.sample}&rdquo;</div>
                  <button onClick={() => knowPi(event.id, realIdx)} style={{ alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 500, padding: '8px 14px', borderRadius: 6, border: `1px solid ${INK.navy200}`, background: '#FFFFFF', color: INK.navy800, cursor: 'pointer' }}>{known ? 'Marked known' : 'Mark as known'}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MockTab(props: EventDetailProps & { cluster: string }) {
  const { event, mockState, startPrep, pickScenario, mockAdvance, setMockNotes, setMockRubric, resetMock, now, cluster } = props
  const scenarios = scenariosFor(cluster, event.code)

  if (mockState.phase === 'setup') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 30, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeading>Pick a scenario</SectionHeading>
          {scenarios.map((s, i) => (
            <button key={i} onClick={() => pickScenario(event.id, i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, textAlign: 'left', padding: '16px 0', border: 'none', borderBottom: `1px solid ${CREAM.c200}`, background: mockState.scenarioIdx === i ? CREAM.c50 : 'transparent', cursor: 'pointer' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, letterSpacing: '-0.015em' }}>{s.title}</span>
              <span style={{ fontSize: 12.5, color: INK700, lineHeight: 1.5 }}>{s.teaser}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: `2px solid ${GOLD.g500}`, paddingLeft: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>How this runs</div>
          {[
            { n: '1', text: 'Pick a scenario on the left.' },
            { n: '2', text: '10-minute prep timer starts — take notes.' },
            { n: '3', text: '10-minute present timer runs while you perform, live or recorded.' },
            { n: '4', text: "Score yourself (or a partner scores you) against the judge's rubric." },
          ].map(st => (
            <div key={st.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 13, color: GOLD.g500, flexShrink: 0 }}>{st.n}</span>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: INK700 }}>{st.text}</span>
            </div>
          ))}
          <button onClick={() => startPrep(event.id, cluster)} style={{ marginTop: 4, fontSize: 13.5, fontWeight: 600, padding: '11px 18px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>Start 10-min prep</button>
        </div>
      </div>
    )
  }

  if (mockState.phase === 'prep' || mockState.phase === 'present') {
    const sc = scenarios[mockState.scenarioIdx]
    const remainMs = Math.max(0, mockState.endsAt - now)
    const mm = String(Math.floor(remainMs / 60000)).padStart(2, '0'), ss = String(Math.floor((remainMs % 60000) / 1000)).padStart(2, '0')
    const scBlocks = [{ k: 'Situation', v: sc.situation }, { k: 'Your role', v: sc.role }, { k: 'Task', v: sc.task }]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ background: INK.navy800, color: CREAM.c50, borderRadius: 4, padding: '20px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500 }}>{mockState.phase === 'prep' ? 'Prep time' : 'Presenting'}</div>
            <div style={{ fontSize: 13, color: INK.navy200 }}>{mockState.phase === 'prep' ? 'Read the scenario, plan your PIs, take notes.' : 'Perform now — the clock keeps you honest.'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em' }}>{mm}:{ss}</div>
            <button onClick={() => mockAdvance(event.id)} style={{ fontSize: 13.5, fontWeight: 600, padding: '11px 20px', borderRadius: 6, border: 'none', background: GOLD.g500, color: INK.navy900, cursor: 'pointer' }}>{mockState.phase === 'prep' ? 'Start presenting' : 'Finish & score'}</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 30, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: INK500 }}>Role-play scenario</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 23, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{sc.title}</div>
            {scBlocks.map(b => (
              <div key={b.k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: GOLD.g500 }}>{b.k}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: INK700 }}>{b.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Cover these PIs</div>
              {(mockState.piSet || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${CREAM.c200}` }}>
                  <span style={{ fontFamily: "'Source Serif 4', serif", color: GOLD.g500, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>{p.pi}</span>
                </div>
              ))}
            </div>
            <textarea value={mockState.notes} onChange={e => setMockNotes(event.id, e.target.value)} placeholder="Greeting → recommendation → PI 1,2,3,4 → close."
              style={{ minHeight: 130, resize: 'vertical', fontSize: 13, lineHeight: 1.6, padding: '12px 14px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900 }} />
          </div>
        </div>
      </div>
    )
  }

  const total = MOCK_RUBRIC.reduce((sum, r) => sum + (mockState.rubric[r.key] || 0), 0)
  let fixes = MOCK_RUBRIC.filter(r => (mockState.rubric[r.key] || 0) <= 10).map(r => `${r.label}: scored below meets-expectations — drill this specifically before your next mock.`)
  if (!fixes.length) fixes = ['Nothing below expectations — solid round.']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 30, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 600, paddingBottom: 12, borderBottom: `1px solid ${INK.navy900}` }}>Score yourself against the rubric</div>
        {MOCK_RUBRIC.map(r => (
          <div key={r.key} style={{ padding: '16px 0', borderBottom: `1px solid ${CREAM.c200}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: INK500 }}>{mockState.rubric[r.key] != null ? mockState.rubric[r.key] + ' pts' : 'Not scored'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MOCK_LEVELS.map(lv => {
                const sel = mockState.rubric[r.key] === lv.pts
                return (
                  <button key={lv.label} onClick={() => setMockRubric(event.id, r.key, lv.pts)} style={{ fontSize: 11.5, fontWeight: 500, padding: '9px 6px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', lineHeight: 1.3, border: `1.5px solid ${sel ? INK.navy800 : INK.navy100}`, background: sel ? INK.navy800 : '#FFFFFF', color: sel ? CREAM.c50 : INK.navy900 }}>{lv.label}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: GOLD.g500 }}>Role-play score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em' }}>{total}</div>
            <div style={{ fontSize: 14, color: INK500 }}>/ 100</div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: INK700 }}>{total >= 85 ? 'Judge-ready. Keep this scenario in rotation to stay sharp.' : total >= 65 ? 'Solid, with a clear gap or two to close.' : 'Run this again after reviewing the PI library for this cluster.'}</div>
          <button onClick={() => resetMock(event.id)} style={{ alignSelf: 'flex-start', marginTop: 8, fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 6, border: 'none', background: INK.navy800, color: CREAM.c50, cursor: 'pointer' }}>Run another</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `2px solid ${RED}`, paddingLeft: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Fix these first</div>
          {fixes.map((f, i) => <div key={i} style={{ fontSize: 13, lineHeight: 1.55, color: INK700 }}>{f}</div>)}
        </div>
      </div>
    </div>
  )
}

function OutlineTab({ event, writtenState, updWritten }: EventDetailProps) {
  const w = writtenState
  const pageBudget = WRITTEN_SECTIONS.reduce((a, sec) => a + sec.pages, 0)
  const sectionsDone = Object.values(w.sectionDone).filter(Boolean).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 28, fontSize: 12.5, color: INK500 }}>
        <div><strong style={{ color: INK.navy900, fontSize: 15, fontFamily: "'Source Serif 4', serif" }}>{pageBudget}</strong> page budget</div>
        <div><strong style={{ color: INK.navy900, fontSize: 15, fontFamily: "'Source Serif 4', serif" }}>{sectionsDone} / {WRITTEN_SECTIONS.length}</strong> sections drafted</div>
      </div>
      {WRITTEN_SECTIONS.map((sec, i) => {
        const done = !!w.sectionDone[i]
        return (
          <div key={sec.name} style={{ borderTop: `1px solid ${INK.navy100}`, padding: '18px 0', display: 'grid', gridTemplateColumns: '24px 1fr 280px', gap: 18, alignItems: 'start' }}>
            <button onClick={() => updWritten(event.id, { sectionDone: { ...w.sectionDone, [i]: !done } })} style={checkboxStyle(done)}>{done ? '✓' : ''}</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: done ? '#8A8F99' : INK.navy900 }}>{sec.name}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: INK.navy50, color: '#1F4F8A' }}>{sec.pages}pg</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: GOLD.g100, color: GOLD.g600 }}>{sec.pts}pts</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: INK700 }}>{sec.guidance}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: NEG }}>Judges deduct when: {sec.trap}</div>
            </div>
            <textarea value={w.sectionNotes[i] || ''} onChange={e => updWritten(event.id, { sectionNotes: { ...w.sectionNotes, [i]: e.target.value } })} placeholder="Draft notes…"
              style={{ minHeight: 100, resize: 'vertical', fontSize: 12.5, lineHeight: 1.6, padding: '10px 12px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900, width: '100%' }} />
          </div>
        )
      })}
    </div>
  )
}

function MilestonesTab({ event, writtenState, updWritten, comp, today }: EventDetailProps) {
  const w = writtenState
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {MILESTONE_TEMPLATE.map((ms, i) => {
        const due = new Date(comp); due.setDate(due.getDate() - ms.offset)
        const d = daysBetween(today, due)
        const done = !!w.milestoneDone[i]
        const daysColor = done ? POS : d < 0 ? RED : d < 7 ? GOLD.g700 : INK500
        return (
          <button key={ms.label} onClick={() => updWritten(event.id, { milestoneDone: { ...w.milestoneDone, [i]: !done } })} style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderTop: `1px solid ${CREAM.c200}`, background: 'transparent', cursor: 'pointer' }}>
            <span style={checkboxStyle(done)}>{done ? '✓' : ''}</span>
            <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, color: done ? '#8A8F99' : INK.navy900, textDecoration: done ? 'line-through' : 'none' }}>{ms.label}</span>
            <span style={{ fontSize: 12, color: INK500 }}>{fmtDate(due)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: daysColor, width: 70, textAlign: 'right' }}>{done ? 'done' : d < 0 ? 'overdue' : d + 'd'}</span>
          </button>
        )
      })}
    </div>
  )
}

function RubricTab({ event, writtenState, updWritten }: EventDetailProps) {
  const w = writtenState
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 13, color: INK500, marginBottom: 12 }}>Oral defense rubric — mark what you&apos;ve prepared for and note how you&apos;ll answer it.</div>
      {RUBRIC_CATEGORIES.map((r, i) => {
        const done = !!w.rubricAddr[i]
        return (
          <div key={r.label} style={{ borderTop: `1px solid ${INK.navy100}`, padding: '16px 0', display: 'grid', gridTemplateColumns: '24px 1fr 280px', gap: 18, alignItems: 'start' }}>
            <button onClick={() => updWritten(event.id, { rubricAddr: { ...w.rubricAddr, [i]: !done } })} style={checkboxStyle(done)}>{done ? '✓' : ''}</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                <span style={{ fontSize: 11, color: INK500 }}>{r.pts} pts</span>
              </div>
            </div>
            <textarea value={w.rubricNotes[i] || ''} onChange={e => updWritten(event.id, { rubricNotes: { ...w.rubricNotes, [i]: e.target.value } })} placeholder="How you'll cover this…"
              style={{ minHeight: 70, resize: 'vertical', fontSize: 12.5, lineHeight: 1.6, padding: '10px 12px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900, width: '100%' }} />
          </div>
        )
      })}
    </div>
  )
}

function InterviewTab({ event, writtenState, updWritten }: EventDetailProps) {
  const w = writtenState
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SectionHeading>Presentation checklist</SectionHeading>
        {PREP_CHECKLIST.map((label, i) => {
          const done = !!w.prepDone[i]
          return (
            <button key={label} onClick={() => updWritten(event.id, { prepDone: { ...w.prepDone, [i]: !done } })} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 0', border: 'none', borderBottom: `1px solid ${CREAM.c200}`, background: 'transparent', cursor: 'pointer' }}>
              <span style={checkboxStyle(done)}>{done ? '✓' : ''}</span>
              <span style={{ fontSize: 13.5, color: done ? '#8A8F99' : INK.navy900, textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SectionHeading>Judge Q&amp;A bank</SectionHeading>
        {QA_BANK.map((q, i) => (
          <div key={q} style={{ padding: '16px 0', borderBottom: `1px solid ${CREAM.c200}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15.5, letterSpacing: '-0.01em' }}>&ldquo;{q}&rdquo;</div>
            <textarea value={w.qaAnswers[i] || ''} onChange={e => updWritten(event.id, { qaAnswers: { ...w.qaAnswers, [i]: e.target.value } })} placeholder="Draft your answer…"
              style={{ minHeight: 60, resize: 'vertical', fontSize: 12.5, lineHeight: 1.6, padding: '10px 12px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF', color: INK.navy900 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SourcesTab({ event, writtenState, updWritten }: EventDetailProps) {
  const w = writtenState
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: INK500 }}>{w.sources.filter(x => x.title || x.url).length} sources logged — five or more is a safe floor for a judge asking &quot;how do you know?&quot;</div>
      {w.sources.map((src, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: 10, padding: '12px 0', borderTop: `1px solid ${INK.navy100}` }}>
          <input value={src.title} onChange={e => { const s2 = w.sources.slice(); s2[i] = { ...s2[i], title: e.target.value }; updWritten(event.id, { sources: s2 }) }} placeholder="Source title" style={{ fontSize: 13, padding: '9px 11px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF' }} />
          <input value={src.url} onChange={e => { const s2 = w.sources.slice(); s2[i] = { ...s2[i], url: e.target.value }; updWritten(event.id, { sources: s2 }) }} placeholder="URL or citation" style={{ fontSize: 13, padding: '9px 11px', border: `1px solid ${INK.navy200}`, borderRadius: 6, background: '#FFFFFF' }} />
          <button onClick={() => { const s2 = w.sources.filter((_, j) => j !== i); updWritten(event.id, { sources: s2.length ? s2 : [{ title: '', url: '' }] }) }} style={{ border: `1px solid ${INK.navy200}`, background: '#FFFFFF', borderRadius: 6, color: NEG, cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      ))}
      <button onClick={() => updWritten(event.id, { sources: [...w.sources, { title: '', url: '' }] })} style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 500, padding: '9px 16px', borderRadius: 6, border: `1.5px dashed ${INK.navy300}`, background: 'transparent', color: INK.navy700, cursor: 'pointer' }}>+ Add source</button>
    </div>
  )
}
