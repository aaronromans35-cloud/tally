import { EVENTS, CLUSTER_LABEL, type DecaEvent } from './events'
import { CORE_PIS } from './core-pis'
import { FINANCE_PIS } from './finance-pis'
import { MARKETING_PIS } from './marketing-pis'
import { HOSPITALITY_PIS } from './hospitality-pis'
import { BUSINESS_MGMT_PIS } from './business-mgmt-pis'
import { PIS, QUESTIONS, type ContentPI, type QuizQuestion } from './content'

export { EVENTS, CLUSTER_LABEL, PIS, type DecaEvent, type ContentPI, type QuizQuestion }

export interface PiEntry {
  area: string
  pi: string
  code: string
  plain: string
  judge: string
  sample: string
}

export const AREA_CLUSTER: Record<string, string> = {
  "Economics": "core", "Financial Analysis": "fi", "Pricing": "mk", "Marketing": "mk",
  "Marketing-Information Management": "mk", "Promotion": "mk", "Selling": "mk",
  "Customer Relations": "core", "Communications": "core", "Business Law": "bm",
  "Human Resources Management": "bm", "Operations": "core", "Strategic Management": "core",
  "Professional Development": "core", "Emotional Intelligence": "core",
  "Information Management": "bm", "Channel Management": "mk",
}

export interface QuizOption { text: string; dims: Record<string, number> }
export interface QuizPromptQuestion { text: string; options: QuizOption[] }

export const QUIZ_QUESTIONS: QuizPromptQuestion[] = [
  { text: "When your team faces a problem, you're the one who…", options: [
    { text: "Jumps in to persuade the room", dims: { mk: 2, speaking: 2 } },
    { text: "Runs the numbers before anyone decides", dims: { fi: 2, writing: 1 } },
    { text: "Makes sure the guest experience doesn't suffer", dims: { ht: 2, speaking: 1 } },
    { text: "Steps back and organizes who does what", dims: { bm: 2, team: 2 } } ] },
  { text: "Pick the scenario you'd rather walk into cold:", options: [
    { text: "A judge hands you a problem and you have 10 minutes to solve it out loud", dims: { speaking: 2 } },
    { text: "A blank document and two weeks to build a full plan", dims: { writing: 2, team: 1 } },
    { text: "A pitch meeting where you're selling an idea to investors", dims: { en: 2, speaking: 1 } },
    { text: "A partner and a shared decision to defend together", dims: { team: 2, bm: 1 } } ] },
  { text: "Which line sounds most like you?", options: [
    { text: "I like knowing exactly how the money works.", dims: { fi: 2 } },
    { text: "I like figuring out why people buy what they buy.", dims: { mk: 2 } },
    { text: "I like making an experience feel effortless for someone else.", dims: { ht: 2 } },
    { text: "I like building something from nothing.", dims: { en: 2 } } ] },
  { text: "Under pressure, you'd rather…", options: [
    { text: "Talk your way through it live", dims: { speaking: 2 } },
    { text: "Have it all written down in advance", dims: { writing: 2 } },
    { text: "Split the pressure with a partner", dims: { team: 2 } },
    { text: "Just give me the facts, either way is fine", dims: { bm: 1, fi: 1 } } ] },
  { text: "Which prep sounds more appealing?", options: [
    { text: "Memorizing performance indicators and running mock role-plays", dims: { speaking: 2 } },
    { text: "Researching a real company and writing a 20-page plan", dims: { writing: 2, en: 1 } },
    { text: "Practicing a sales pitch until it's smooth", dims: { mk: 2, speaking: 1 } },
    { text: "Managing a project timeline with a team", dims: { team: 2, bm: 1 } } ] },
  { text: "If you had to pick one, what sounds most fun?", options: [
    { text: "Running a hotel for a weekend", dims: { ht: 2 } },
    { text: "Reading a company's balance sheet", dims: { fi: 2 } },
    { text: "Launching your own product", dims: { en: 2 } },
    { text: "Leading a team decision under a clock", dims: { bm: 2, team: 1 } } ] },
]

export interface WrittenSection { name: string; pages: number; pts: number; guidance: string; trap: string }
export const WRITTEN_SECTIONS: WrittenSection[] = [
  { name: "Executive summary", pages: 1, pts: 10, guidance: "One page. State the concept, the ask, and the headline numbers before a judge decides whether to keep reading closely.", trap: "it reads like an introduction instead of a summary of the whole plan." },
  { name: "Company / concept description", pages: 2, pts: 10, guidance: "What the business is, who runs it, and why now. Keep it concrete — no filler about passion.", trap: "it's vague about what actually gets sold." },
  { name: "Market analysis", pages: 2, pts: 15, guidance: "Size the market, name the target segment, and show at least one real competitor comparison.", trap: "market size has no source or method behind it." },
  { name: "Marketing / sales plan", pages: 2, pts: 15, guidance: "Cover product, price, place and promotion, tied back to the target segment you defined above.", trap: "the four P's are listed but never connected to the target customer." },
  { name: "Operations plan", pages: 2, pts: 10, guidance: "How the business actually runs day to day — staffing, suppliers, location, systems.", trap: "there's no answer for what happens when something goes wrong." },
  { name: "Financial plan", pages: 3, pts: 20, guidance: "Startup costs, a break-even calculation, and 1–3 year projections with assumptions stated plainly.", trap: "assumptions aren't stated, so every number looks invented." },
  { name: "Appendix / exhibits", pages: 2, pts: 10, guidance: "Supporting charts, sample materials, and citations — reference-only, not new claims.", trap: "new, unreferenced claims show up here for the first time." },
]

export interface MilestoneDef { label: string; offset: number }
export const MILESTONE_TEMPLATE: MilestoneDef[] = [
  { label: "Pick your company / topic", offset: 60 },
  { label: "Finish research & data collection", offset: 45 },
  { label: "Draft executive summary", offset: 35 },
  { label: "Complete full written draft", offset: 21 },
  { label: "Get outside feedback & revise", offset: 14 },
  { label: "Final proofread & formatting", offset: 7 },
  { label: "Practice oral presentation", offset: 3 },
  { label: "Submit / print & pack", offset: 1 },
]

export interface RubricCategory { label: string; pts: number }
export const RUBRIC_CATEGORIES: RubricCategory[] = [
  { label: "Clarity of presentation", pts: 15 },
  { label: "Depth of research", pts: 20 },
  { label: "Financial soundness", pts: 20 },
  { label: "Feasibility of the plan", pts: 15 },
  { label: "Response to judge questions", pts: 20 },
  { label: "Professionalism & delivery", pts: 10 },
]

export const PREP_CHECKLIST: string[] = [
  "Practice the full presentation out loud, 3 times minimum",
  "Time yourself — most rounds cap at 7–15 minutes",
  "Prepare visual aids or exhibits, if allowed",
  "Assign speaking roles if this is a team event",
  "Write transition lines between sections",
]

export const QA_BANK: string[] = [
  "How did you validate your market size?",
  "What's your customer acquisition cost, and how did you get that number?",
  "How is this different from [nearest competitor]?",
  "What happens if your primary revenue assumption is wrong?",
  "Walk me through your break-even calculation.",
  "What's the biggest risk to this plan, and what would you do about it?",
  "Why should we believe your financial projections?",
  "What would you do differently with another six months?",
]

export interface MockRubricItem { key: string; label: string }
export const MOCK_RUBRIC: MockRubricItem[] = [
  { key: "greeting", label: "Greeting & professionalism" },
  { key: "understanding", label: "Understanding of the situation" },
  { key: "pis", label: "Performance indicators covered" },
  { key: "recommendation", label: "Recommendation quality" },
  { key: "questions", label: "Handling judge questions" },
]
export const MOCK_LEVELS: { label: string; pts: number }[] = [
  { label: "Below expectations", pts: 5 },
  { label: "Approaches", pts: 10 },
  { label: "Meets", pts: 15 },
  { label: "Exceeds", pts: 20 },
]

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = arr.slice()
  let s = seed || 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const REAL_PI_SOURCES: Record<string, typeof CORE_PIS> = {
  core: CORE_PIS,
  fi: [...CORE_PIS, ...FINANCE_PIS],
  mk: [...CORE_PIS, ...MARKETING_PIS],
  ht: [...CORE_PIS, ...HOSPITALITY_PIS],
  bm: [...CORE_PIS, ...BUSINESS_MGMT_PIS],
}

export function piFor(cluster: string): PiEntry[] {
  const real = REAL_PI_SOURCES[cluster]
  if (real) {
    return real.map(p => ({
      area: p.area, pi: p.text, code: p.code,
      plain: p.text,
      judge: "Say this explicitly, by name, and tie it to what's actually happening in the scenario in front of you.",
      sample: `I'd start by ${p.text.charAt(0).toLowerCase() + p.text.slice(1)}.`,
    }))
  }
  return PIS.filter(p => p.clusters.includes(cluster) || (cluster !== "core" && p.clusters.includes("core")))
    .map(p => ({ area: p.area, pi: p.pi, code: "", plain: p.plain, judge: p.judge, sample: p.sample }))
}

export function questionsFor(cluster: string): QuizQuestion[] {
  return QUESTIONS.filter(q => {
    const c = AREA_CLUSTER[q.area] || "core"
    return cluster === "core" ? true : (c === cluster || c === "core")
  })
}

export interface Scenario { title: string; teaser: string; situation: string; role: string; task: string }

export function scenariosFor(cluster: string, code: string): Scenario[] {
  if (code === "ACT") {
    return [
      { title: "Best Coffee (official DECA sample, 2026)", teaser: "Accounting cycle and transaction types for a coffee shop.", situation: "You are to assume the role of an accounting associate for Best Coffee, a coffee shop. The owner (judge) needs your help identifying and understanding the accounting cycle and different types of business transactions.", role: "Accounting associate at Best Coffee.", task: "Walk the owner through the accounting cycle and classify the transactions in front of you." },
      { title: "Dogs-R-Us (official DECA sample, 2026)", teaser: "Cash receipts, payments, and week-end cash position for a pet retailer.", situation: "You are to assume the role of the accounting manager for Dogs-R-Us, a retail store dedicated to dog food and toys. The owner (judge) has asked you to record both cash receipts and payments for the most recent week, and to provide insight into the company's cash position at week's end.", role: "Accounting manager at Dogs-R-Us.", task: "Record the week's cash activity and tell the owner what their cash position means." },
    ]
  }
  const label = CLUSTER_LABEL[cluster] || "business"
  return [
    { title: "The frustrated customer", teaser: "A guest or client's experience went sideways and they want it fixed now.", situation: `You are meeting with a customer who had a bad experience related to ${label.toLowerCase()}. They are frustrated and considering taking their business elsewhere.`, role: "You are a manager who must repair the relationship.", task: "Diagnose what went wrong, propose a specific fix, and rebuild trust before they leave." },
    { title: "The growth decision", teaser: "Leadership wants a recommendation on a real expansion opportunity.", situation: `Ownership is deciding whether to expand into a new offering in ${label.toLowerCase()}, and wants your recommendation before committing budget.`, role: "You are an advisor reporting to the owner.", task: "Weigh the opportunity against the risk and land on one clear recommendation." },
  ]
}
