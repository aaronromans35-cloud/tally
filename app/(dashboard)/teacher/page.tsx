'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ClassRow = { id: string; name: string; join_code: string; description: string; created_at: string; member_count?: number }

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function TeacherPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rawClasses } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (!rawClasses) { setClasses([]); setLoading(false); return }

    // Get member counts
    const withCounts = await Promise.all(rawClasses.map(async cls => {
      const { count } = await supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', cls.id)
      return { ...cls, member_count: count ?? 0 }
    }))
    setClasses(withCounts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createClass(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setCreateError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const join_code = randomCode()
    const { data, error } = await supabase.from('classes').insert({
      teacher_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      join_code,
    }).select().single()
    setSaving(false)
    if (error) { setCreateError(error.message); return }
    setForm({ name: '', description: '' })
    setShowForm(false)
    load()
    if (data) router.push(`/teacher/classes/${data.id}`)
  }

  async function deleteClass(id: string) {
    const supabase = createClient()
    await supabase.from('classes').delete().eq('id', id)
    load()
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">Teacher Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Manage your classes, assignments, and track student progress.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '← Cancel' : '+ New Class'}
        </button>
      </div>

      {/* Create class form */}
      {showForm && (
        <div className="card max-w-lg">
          <h2 className="font-semibold mb-4">Create a Class</h2>
          <form onSubmit={createClass} className="flex flex-col gap-4">
            {createError && (
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {createError}
              </div>
            )}
            <div>
              <label className="label">Class Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. Personal Finance — Period 3" />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Spring 2026, Northwood High School" />
            </div>
            <button type="submit" className="btn-primary justify-center" disabled={saving}>
              {saving ? 'Creating…' : 'Create Class'}
            </button>
          </form>
        </div>
      )}

      {/* Classes grid */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading classes…</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="font-semibold mb-2">No classes yet</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Create your first class and share the join code with students.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Your First Class</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="card flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base">{cls.name}</h3>
                  {cls.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{cls.description}</p>}
                </div>
                <button onClick={() => deleteClass(cls.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ color: 'var(--muted)' }}>✕</button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                  <div className="text-2xl font-bold">{cls.member_count}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Students</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Join Code</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-mono font-bold text-lg" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>{cls.join_code}</span>
                    <button onClick={() => copyCode(cls.join_code)} style={{ fontSize: 14, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      {copied === cls.join_code ? '✓' : '⧉'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn-primary flex-1 justify-center text-sm"
                  onClick={() => router.push(`/teacher/classes/${cls.id}`)}>
                  View Class →
                </button>
                <button
                  onClick={() => copyCode(cls.join_code)}
                  className="btn-secondary text-sm px-4"
                  style={{ color: copied === cls.join_code ? 'var(--green)' : undefined }}>
                  {copied === cls.join_code ? '✓ Copied!' : '⧉ Copy Code'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick tips for teachers */}
      {!loading && (
        <div className="card" style={{ background: 'rgba(91,106,240,0.04)', borderColor: 'rgba(91,106,240,0.2)' }}>
          <h3 className="font-semibold mb-3">📖 Getting Started</h3>
          <ol className="flex flex-col gap-2">
            {[
              'Create a class and copy the 6-character join code',
              'Share the code with students — they join from their Nexus dashboard',
              'Create assignments linked to specific modules (budgeting, investing, etc.)',
              'Track progress and see the class leaderboard from the class detail page',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(91,106,240,0.15)', color: 'var(--accent)' }}>{i + 1}</span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
