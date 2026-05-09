'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ClassRow = { id: string; name: string; join_code: string; description: string }
type Student = {
  id: string; full_name: string; age: number | null
  streak: number; achievements: number; score: number
}
type Assignment = {
  id: string; title: string; description: string; module: string
  due_date: string | null; points: number; completion_count: number
}

const MODULE_OPTIONS = [
  { value: 'budgeting',   label: '💰 Budgeting' },
  { value: 'investing',   label: '📈 Investing' },
  { value: 'debt',        label: '💳 Debt Payoff' },
  { value: 'goals',       label: '🎯 Goals' },
  { value: 'tax',         label: '📄 Tax Basics' },
  { value: 'compound',    label: '🧮 Compound Interest' },
  { value: 'general',     label: '📚 General' },
]

const MODULE_COLORS: Record<string, string> = {
  budgeting: '#22c55e', investing: '#5B6AF0', debt: '#ef4444',
  goals: '#f59e0b', tax: '#8b5cf6', compound: '#3b82f6', general: '#64748b',
}

function healthColor(score: number) {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--accent)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string

  const [cls, setCls] = useState<ClassRow | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'assignments' | 'messages'>('leaderboard')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [aForm, setAForm] = useState({ title: '', description: '', module: 'budgeting', due_date: '', points: '10' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Messages
  type Message = { id: string; content: string; pinned: boolean; created_at: string; author_id: string }
  const [messages, setMessages] = useState<Message[]>([])
  const [msgText, setMsgText] = useState('')
  const [msgSaving, setMsgSaving] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [teacherId, setTeacherId] = useState<string | null>(null)

  async function loadMessages() {
    const supabase = createClient()
    const { data } = await supabase
      .from('class_messages')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(50)
    setMessages(data ?? [])
  }

  async function postMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = msgText.trim().slice(0, 2000)
    if (!text) return
    setMsgSaving(true)
    setMsgError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsgSaving(false); return }
    const { error } = await supabase.from('class_messages').insert({
      class_id: classId,
      author_id: user.id,
      content: text,
    })
    setMsgSaving(false)
    if (error) { setMsgError(error.message); return }
    setMsgText('')
    await loadMessages()
  }

  async function deleteMessage(id: string) {
    const supabase = createClient()
    await supabase.from('class_messages').delete().eq('id', id)
    await loadMessages()
  }

  async function togglePin(msg: Message) {
    const supabase = createClient()
    await supabase.from('class_messages').update({ pinned: !msg.pinned }).eq('id', msg.id)
    await loadMessages()
  }

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setTeacherId(user.id)

    // Load class
    const { data: classData } = await supabase.from('classes').select('*').eq('id', classId).single()
    if (!classData) { router.push('/teacher'); return }
    setCls(classData)

    // Load members
    const { data: members } = await supabase
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId)

    const studentIds = members?.map(m => m.student_id) ?? []

    // Load profiles + streaks + achievements for members
    if (studentIds.length > 0) {
      const [{ data: profiles }, { data: streakData }, { data: achieveData }] = await Promise.all([
        supabase.from('profiles').select('id,full_name,age').in('id', studentIds),
        supabase.from('streaks').select('user_id,current_streak').in('user_id', studentIds),
        supabase.from('achievements').select('user_id').in('user_id', studentIds),
      ])

      const streakMap: Record<string, number> = {}
      streakData?.forEach(s => { streakMap[s.user_id] = s.current_streak })

      const achieveCount: Record<string, number> = {}
      achieveData?.forEach(a => { achieveCount[a.user_id] = (achieveCount[a.user_id] ?? 0) + 1 })

      const enriched: Student[] = (profiles ?? []).map(p => {
        const streak = streakMap[p.id] ?? 0
        const ach = achieveCount[p.id] ?? 0
        // Compute a simple financial health score from streak + achievements
        const score = Math.min(100, streak * 5 + ach * 10)
        return { id: p.id, full_name: p.full_name ?? 'Student', age: p.age, streak, achievements: ach, score }
      }).sort((a, b) => b.score - a.score)

      setStudents(enriched)
    } else {
      setStudents([])
    }

    // Load assignments with completion counts
    const { data: assignData } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (assignData) {
      const withCounts = await Promise.all(assignData.map(async a => {
        const { count } = await supabase
          .from('assignment_completions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', a.id)
        return { ...a, completion_count: count ?? 0 }
      }))
      setAssignments(withCounts)
    }

    setLoading(false)
    await loadMessages()
  }

  useEffect(() => {
    load()
    if (classId) sessionStorage.setItem('teacher-class-id', classId)
  }, [classId])

  const [assignError, setAssignError] = useState('')

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setAssignError('')
    const supabase = createClient()
    const { error } = await supabase.from('assignments').insert({
      class_id: classId,
      title: aForm.title.trim(),
      description: aForm.description.trim() || null,
      module: aForm.module,
      due_date: aForm.due_date || null,
      points: parseInt(aForm.points) || 10,
    })
    setSaving(false)
    if (error) {
      setAssignError(error.message)
      return
    }
    setAForm({ title: '', description: '', module: 'budgeting', due_date: '', points: '10' })
    setShowAssignForm(false)
    await load()
  }

  async function deleteAssignment(id: string) {
    const supabase = createClient()
    await supabase.from('assignments').delete().eq('id', id)
    load()
  }

  function copyCode() {
    if (!cls) return
    navigator.clipboard.writeText(cls.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!cls) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/teacher')} className="text-sm mb-2 flex items-center gap-1" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← All Classes
          </button>
          <h1 className="page-title mb-0">{cls.name}</h1>
          {cls.description && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{cls.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(91,106,240,0.08)', border: '1px solid rgba(91,106,240,0.2)' }}>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Join code</span>
            <span className="font-mono font-bold" style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>{cls.join_code}</span>
            <button onClick={copyCode} style={{ fontSize: 14, color: copied ? 'var(--green)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {copied ? '✓' : '⧉'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Students', value: students.length, icon: '👩‍🎓' },
          { label: 'Assignments', value: assignments.length, icon: '📋' },
          { label: 'Avg Score', value: students.length > 0 ? Math.round(students.reduce((s, x) => s + x.score, 0) / students.length) + '%' : '—', icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {([
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'assignments', label: '📋 Assignments' },
          { id: 'messages',    label: `💬 Messages${messages.length > 0 ? ` (${messages.length})` : ''}` },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard tab */}
      {activeTab === 'leaderboard' && (
        students.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">👩‍🎓</div>
            <h3 className="font-semibold mb-2">No students yet</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Share the join code <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{cls.join_code}</strong> with your students.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold">Class Leaderboard</h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Ranked by financial health score</span>
            </div>
            <div>
              {students.map((s, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                const color = healthColor(s.score)
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => router.push(`/teacher/students/${s.id}`)}>
                    {/* Rank */}
                    <div className="w-8 text-center font-bold" style={{ color: medal ? undefined : 'var(--muted)', fontSize: medal ? 20 : 14 }}>
                      {medal ?? `#${i + 1}`}
                    </div>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'var(--accent)', color: 'white' }}>
                      {s.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.full_name}</div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                        <span>🔥 {s.streak}d streak</span>
                        <span>⭐ {s.achievements} achievements</span>
                      </div>
                    </div>
                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold" style={{ color }}>{s.score}%</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>health score</div>
                    </div>
                    {/* View arrow */}
                    <span className="text-xs hidden md:block" style={{ color: 'var(--muted)' }}>View →</span>
                    {/* Score bar */}
                    <div className="w-24 hidden md:block">
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.score}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Assignments tab */}
      {activeTab === 'assignments' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Assignments</h2>
            <button className="btn-primary text-sm" onClick={() => setShowAssignForm(!showAssignForm)}>
              {showAssignForm ? '← Cancel' : '+ Add Assignment'}
            </button>
          </div>

          {showAssignForm && (
            <div className="card max-w-lg">
              <h3 className="font-semibold mb-4">New Assignment</h3>
              <form onSubmit={createAssignment} className="flex flex-col gap-4">
                {assignError && (
                  <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {assignError}
                  </div>
                )}
                <div>
                  <label className="label">Title</label>
                  <input className="input" required value={aForm.title} onChange={e => setAForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Build your first budget" />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input className="input" value={aForm.description} onChange={e => setAForm(f => ({ ...f, description: e.target.value }))} placeholder="What should students do?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Module</label>
                    <select className="input" value={aForm.module} onChange={e => setAForm(f => ({ ...f, module: e.target.value }))}>
                      {MODULE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Points</label>
                    <input className="input" type="number" min="1" max="100" value={aForm.points} onChange={e => setAForm(f => ({ ...f, points: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Due Date (optional)</label>
                  <input className="input" type="date" value={aForm.due_date} onChange={e => setAForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <button type="submit" className="btn-primary justify-center" disabled={saving}>
                  {saving ? 'Saving…' : 'Create Assignment'}
                </button>
              </form>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold mb-2">No assignments yet</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Create assignments to guide students through modules.</p>
              <button className="btn-primary" onClick={() => setShowAssignForm(true)}>+ Create First Assignment</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {assignments.map(a => {
                const mColor = MODULE_COLORS[a.module] ?? '#64748b'
                const completionPct = students.length > 0 ? Math.round((a.completion_count / students.length) * 100) : 0
                const daysLeft = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000) : null
                return (
                  <div key={a.id} className="card flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ background: mColor }}>
                          {MODULE_OPTIONS.find(m => m.value === a.module)?.label ?? a.module}
                        </span>
                        <div>
                          <div className="font-semibold">{a.title}</div>
                          {a.description && <div className="text-xs" style={{ color: 'var(--muted)' }}>{a.description}</div>}
                        </div>
                      </div>
                      <button onClick={() => deleteAssignment(a.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{ color: 'var(--muted)' }}>✕</button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: 'var(--muted)' }}>⭐ {a.points} pts</span>
                      {daysLeft !== null && (
                        <span style={{ color: daysLeft < 0 ? 'var(--red)' : daysLeft < 3 ? 'var(--yellow)' : 'var(--muted)' }}>
                          📅 {daysLeft < 0 ? 'Past due' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </span>
                      )}
                      <span style={{ color: 'var(--muted)' }}>
                        ✅ {a.completion_count}/{students.length} submitted
                      </span>
                    </div>

                    {students.length > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                          <span>Completion</span>
                          <span>{completionPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, background: mColor }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MESSAGES TAB ── */}
      {activeTab === 'messages' && (
        <div className="flex flex-col gap-4">
          {/* Post form */}
          <div className="card">
            <div className="font-semibold mb-3">Post a message to your class</div>
            <form onSubmit={postMessage} className="flex flex-col gap-3">
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value.slice(0, 2000))}
                placeholder="Write an announcement, reminder, or tip for your students…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
                  border: '1px solid var(--border)', background: 'var(--background)',
                  color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit',
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{msgText.length}/2000</span>
                <div className="flex gap-2 items-center">
                  {msgError && <span className="text-xs" style={{ color: 'var(--red)' }}>{msgError}</span>}
                  <button type="submit" className="btn-primary" disabled={msgSaving || !msgText.trim()}
                    style={{ padding: '8px 20px', fontSize: 13 }}>
                    {msgSaving ? 'Posting…' : 'Post Message'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-semibold mb-2">No messages yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Post announcements, reminders, or tips above — your students will see them in their class view.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Pinned first */}
              {[...messages].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(msg => (
                <div key={msg.id} className="card flex flex-col gap-2"
                  style={msg.pinned ? { border: '1px solid var(--accent)', background: 'rgba(91,106,240,0.04)' } : {}}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.pinned && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: 'rgba(91,106,240,0.15)', color: 'var(--accent)' }}>📌 Pinned</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => togglePin(msg)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>
                        {msg.pinned ? 'Unpin' : '📌 Pin'}
                      </button>
                      <button onClick={() => deleteMessage(msg.id)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--red)', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
