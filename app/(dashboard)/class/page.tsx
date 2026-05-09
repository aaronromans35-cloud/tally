'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClassRow = { id: string; name: string; join_code: string; description: string }
type Assignment = {
  id: string; title: string; description: string; module: string
  due_date: string | null; points: number; completed: boolean
}
type Message = { id: string; content: string; pinned: boolean; created_at: string }

const MODULE_COLORS: Record<string, string> = {
  budgeting: '#22c55e', investing: '#5B6AF0', debt: '#ef4444',
  goals: '#f59e0b', tax: '#8b5cf6', compound: '#3b82f6', general: '#64748b',
}
const MODULE_LABELS: Record<string, string> = {
  budgeting: '💰 Budgeting', investing: '📈 Investing', debt: '💳 Debt Payoff',
  goals: '🎯 Goals', tax: '📄 Tax Basics', compound: '🧮 Compound Interest', general: '📚 General',
}

export default function ClassPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [myClasses, setMyClasses] = useState<ClassRow[]>([])
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<'assignments' | 'messages'>('assignments')
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  async function load(uid: string) {
    const supabase = createClient()
    const { data: memberships } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('student_id', uid)

    const classIds = memberships?.map(m => m.class_id) ?? []
    if (classIds.length === 0) { setMyClasses([]); setLoading(false); return }

    const { data: classData } = await supabase.from('classes').select('*').in('id', classIds)
    setMyClasses(classData ?? [])

    const firstId = activeClassId ?? classIds[0]
    setActiveClassId(firstId)
    await Promise.all([loadAssignments(uid, firstId), loadMessages(firstId)])
    setLoading(false)
  }

  async function loadAssignments(uid: string, classId: string) {
    const supabase = createClient()
    const [{ data: assignData }, { data: completions }] = await Promise.all([
      supabase.from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false }),
      supabase.from('assignment_completions').select('assignment_id').eq('student_id', uid),
    ])
    const completedIds = new Set(completions?.map(c => c.assignment_id) ?? [])
    setAssignments((assignData ?? []).map(a => ({ ...a, completed: completedIds.has(a.id) })))
  }

  async function loadMessages(classId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('class_messages')
      .select('id,content,pinned,created_at')
      .eq('class_id', classId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    setMessages(data ?? [])
  }

  async function switchClass(uid: string, classId: string) {
    setActiveClassId(classId)
    await Promise.all([loadAssignments(uid, classId), loadMessages(classId)])
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      load(user.id)
    }
    init()
  }, [])

  async function joinClass(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setJoining(true)
    setJoinError('')
    const supabase = createClient()

    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (!cls) { setJoinError('Class not found. Check the code and try again.'); setJoining(false); return }

    const { data: existing } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', cls.id)
      .eq('student_id', userId)
      .single()

    if (existing) { setJoinError("You're already in this class!"); setJoining(false); return }

    await supabase.from('class_members').insert({ class_id: cls.id, student_id: userId })
    setJoinCode('')
    setJoining(false)
    load(userId)
  }

  async function markComplete(assignmentId: string) {
    if (!userId) return
    setCompleting(assignmentId)
    const supabase = createClient()
    await supabase.from('assignment_completions').upsert({ assignment_id: assignmentId, student_id: userId })
    await updateStreak(userId)
    if (activeClassId) await loadAssignments(userId, activeClassId)
    setCompleting(null)
  }

  async function updateStreak(uid: string) {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase.from('streaks').select('*').eq('user_id', uid).single()
    if (!existing) {
      await supabase.from('streaks').insert({ user_id: uid, current_streak: 1, longest_streak: 1, last_active_date: today })
    } else {
      const last = existing.last_active_date
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      let newStreak = existing.current_streak
      if (last === today) return
      else if (last === yesterday) newStreak = existing.current_streak + 1
      else newStreak = 1
      const longest = Math.max(existing.longest_streak, newStreak)
      await supabase.from('streaks').update({ current_streak: newStreak, longest_streak: longest, last_active_date: today, updated_at: new Date().toISOString() }).eq('user_id', uid)
    }
  }

  const completedCount = assignments.filter(a => a.completed).length
  const totalPts = assignments.filter(a => a.completed).reduce((s, a) => s + a.points, 0)
  const pinnedMessages = messages.filter(m => m.pinned)
  const unpinnedMessages = messages.filter(m => !m.pinned)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">My Class</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Complete assignments to earn points and see messages from your teacher.</p>
        </div>
      </div>

      {/* Join a class */}
      <div className="card">
        <h2 className="font-semibold mb-3">Join a Class</h2>
        <form onSubmit={joinClass} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Enter 6-character join code (e.g. XK92BZ)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 600 }}
          />
          <button type="submit" className="btn-primary" disabled={joining || joinCode.length < 6}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </form>
        {joinError && <p className="text-sm mt-2" style={{ color: 'var(--red)' }}>{joinError}</p>}
      </div>

      {loading ? (
        <div className="card text-center py-10">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : myClasses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🎓</div>
          <h3 className="font-semibold mb-2">Not in any classes yet</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Ask your teacher for the 6-character join code above.</p>
        </div>
      ) : (
        <>
          {/* Pinned messages banner — always visible */}
          {pinnedMessages.length > 0 && (
            <div className="flex flex-col gap-2">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(91,106,240,0.06)', border: '1px solid rgba(91,106,240,0.2)' }}>
                  <span style={{ fontSize: 16 }}>📌</span>
                  <div className="flex-1">
                    <p style={{ color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
                    <span className="text-xs mt-1 block" style={{ color: 'var(--muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Class tabs if multiple */}
          {myClasses.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {myClasses.map(c => (
                <button key={c.id} onClick={() => userId && switchClass(userId, c.id)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeClassId === c.id ? 'var(--accent)' : 'var(--surface)',
                    color: activeClassId === c.id ? 'white' : 'var(--foreground)',
                    border: `1px solid ${activeClassId === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Progress summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold">{completedCount}/{assignments.length}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Completed</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totalPts}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Points Earned</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                {assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0}%
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Progress</div>
            </div>
          </div>

          {/* Inner tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)', width: 'fit-content' }}>
            {([
              { id: 'assignments', label: `📋 Assignments (${assignments.length})` },
              { id: 'messages',    label: `💬 Messages${unpinnedMessages.length > 0 ? ` (${unpinnedMessages.length})` : ''}` },
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

          {/* Assignments tab */}
          {activeTab === 'assignments' && (
            <div className="flex flex-col gap-3">
              {assignments.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>No assignments yet — your teacher hasn't posted any.</p>
                </div>
              ) : (
                assignments.map(a => {
                  const mColor = MODULE_COLORS[a.module] ?? '#64748b'
                  const daysLeft = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000) : null
                  return (
                    <div key={a.id} className="card flex flex-col gap-3"
                      style={{ borderColor: a.completed ? 'rgba(34,197,94,0.3)' : 'var(--border)', background: a.completed ? 'rgba(34,197,94,0.02)' : 'var(--surface)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                            style={{ background: mColor }}>
                            {MODULE_LABELS[a.module] ?? a.module}
                          </span>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {a.title}
                              {a.completed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}>✓ Done</span>}
                            </div>
                            {a.description && <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{a.description}</div>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>+{a.points} pts</div>
                          {daysLeft !== null && (
                            <div className="text-xs" style={{ color: daysLeft < 0 ? 'var(--red)' : daysLeft < 3 ? 'var(--yellow)' : 'var(--muted)' }}>
                              {daysLeft < 0 ? 'Past due' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                            </div>
                          )}
                        </div>
                      </div>
                      {!a.completed && (
                        <button onClick={() => markComplete(a.id)} disabled={completing === a.id}
                          className="btn-primary text-sm w-full justify-center" style={{ background: mColor }}>
                          {completing === a.id ? 'Marking…' : '✓ Mark as Complete'}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Messages tab */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>No messages from your teacher yet.</p>
                </div>
              ) : (
                [...pinnedMessages, ...unpinnedMessages].map(msg => (
                  <div key={msg.id} className="card flex flex-col gap-2"
                    style={msg.pinned ? { border: '1px solid rgba(91,106,240,0.3)', background: 'rgba(91,106,240,0.04)' } : {}}>
                    <div className="flex items-center gap-2">
                      {msg.pinned && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: 'rgba(91,106,240,0.15)', color: 'var(--accent)' }}>📌 Pinned</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
