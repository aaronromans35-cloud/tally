'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'
import { useTheme } from '@/lib/context/ThemeContext'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { useStreak } from '@/lib/hooks/useStreak'
import ConfirmDialog from '@/components/ConfirmDialog'

const EMOJIS = ['👤','🧑','📚','💼','🏠','🎓','🚗','✈️','🎯','💡','🧪','📊','🏦','🌎','🎮']

function WorkspaceTabs() {
  const { workspaces, activeWorkspaceId, switchWorkspace, addWorkspace, deleteWorkspace } = useWorkspace()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📚')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteWs, setConfirmDeleteWs] = useState<{ id: string; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addWorkspace(newName.trim(), newEmoji)
    setNewName('')
    setNewEmoji('📚')
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteWorkspace(id)
      toast.success('Profile deleted.')
    } catch {
      toast.error('Could not delete that profile. Please try again.')
    } finally {
      setDeletingId(null)
      setConfirmDeleteWs(null)
    }
  }

  return (
    <div style={{ padding: '10px 10px 0', borderBottom: '1px solid var(--nx-navy-700)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-navy-500)', marginBottom: 6, paddingLeft: 2 }}>
        Profiles
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>

        {/* Default "Me" tab */}
        <button
          onClick={() => switchWorkspace(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeWorkspaceId === null ? 'var(--nx-gold-500)' : 'rgba(255,255,255,0.07)',
            color: activeWorkspaceId === null ? 'var(--nx-navy-900)' : 'var(--nx-navy-300)',
            fontSize: 12, fontWeight: activeWorkspaceId === null ? 700 : 500,
            transition: 'all 140ms',
          }}
        >
          <span>👤</span> Me
        </button>

        {/* Named workspace tabs */}
        {workspaces.map(ws => (
          <div key={ws.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => switchWorkspace(ws.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 26px 4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeWorkspaceId === ws.id ? 'var(--nx-gold-500)' : 'rgba(255,255,255,0.07)',
                color: activeWorkspaceId === ws.id ? 'var(--nx-navy-900)' : 'var(--nx-navy-300)',
                fontSize: 12, fontWeight: activeWorkspaceId === ws.id ? 700 : 500,
                transition: 'all 140ms', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              <span>{ws.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</span>
            </button>
            {/* Delete × */}
            <button
              onClick={() => setConfirmDeleteWs({ id: ws.id, name: ws.name })}
              disabled={deletingId === ws.id}
              title={`Delete "${ws.name}"`}
              style={{
                position: 'absolute', right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: activeWorkspaceId === ws.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: activeWorkspaceId === ws.id ? 'var(--nx-navy-800)' : 'var(--nx-navy-400)',
                fontSize: 9, fontWeight: 700, padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* + Add button */}
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          style={{
            width: 26, height: 26, borderRadius: 6, border: '1px dashed var(--nx-navy-600)',
            background: 'transparent', cursor: 'pointer', color: 'var(--nx-navy-400)',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 140ms', fontWeight: 400, lineHeight: 1,
          }}
          title="Add a practice profile"
        >
          +
        </button>
      </div>

      {/* Add workspace inline form */}
      {adding && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--nx-navy-600)',
          borderRadius: 8, padding: '10px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-gold-400)', marginBottom: 8 }}>
            New practice profile
          </div>
          {/* Emoji picker */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                style={{
                  width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 14,
                  background: newEmoji === e ? 'var(--nx-gold-500)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          {/* Name input */}
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="e.g. 30yr old, Bad habits…"
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 5,
              border: '1px solid var(--nx-navy-600)', background: 'rgba(255,255,255,0.06)',
              color: 'var(--nx-cream-50)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: newName.trim() ? 'var(--nx-gold-500)' : 'var(--nx-navy-700)',
                color: newName.trim() ? 'var(--nx-navy-900)' : 'var(--nx-navy-500)',
                fontSize: 12, fontWeight: 600,
              }}
            >
              Add profile
            </button>
            <button
              onClick={() => { setAdding(false); setNewName('') }}
              style={{
                padding: '5px 10px', borderRadius: 5, border: '1px solid var(--nx-navy-600)',
                background: 'transparent', color: 'var(--nx-navy-400)', fontSize: 12, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteWs !== null}
        title="Delete this profile?"
        description={confirmDeleteWs ? `This will permanently delete "${confirmDeleteWs.name}" and all of its practice data. This can't be undone.` : ''}
        confirmLabel="Delete profile"
        busy={!!confirmDeleteWs && deletingId === confirmDeleteWs.id}
        onConfirm={() => confirmDeleteWs && handleDelete(confirmDeleteWs.id)}
        onCancel={() => setConfirmDeleteWs(null)}
      />
    </div>
  )
}

const NAV_STUDENT = [
  { href: '/dashboard',    label: 'Overview',          icon: <IconHome />,       tour: undefined },
  { href: '/budget',       label: 'Budget',            icon: <IconWallet />,     tour: 'tour-budget' },
  { href: '/portfolio',    label: 'Portfolio',         icon: <IconTrending />,   tour: undefined },
  { href: '/plan',         label: 'AI Plan',           icon: <IconSparkles />,   tour: 'tour-plan' },
  { href: '/compound',     label: 'Compound Calc',     icon: <IconCompound />,   tour: 'tour-compound' },
  { href: '/debt',         label: 'Debt Payoff',       icon: <IconCreditCard />, tour: undefined },
  { href: '/tax',          label: 'Tax 101',           icon: <IconLandmark />,   tour: undefined },
  { href: '/goals',        label: 'Goals',             icon: <IconTarget />,     tour: 'tour-goals' },
  { href: '/class',        label: 'My Class',          icon: <IconUsers />,      tour: undefined },
  { href: '/simulation',   label: 'Stock Sim',         icon: <IconTrending />,   tour: undefined },
  { href: '/deca',         label: 'DECA Prep',         icon: <IconAward />,      tour: undefined },
  { href: '/transactions', label: 'Transactions',      icon: <IconList />,       tour: undefined },
  { href: '/profile',      label: 'Settings',          icon: <IconSettings />,   tour: undefined },
]
const NAV_TEACHER = [
  { href: '/dashboard',    label: 'Overview',          icon: <IconHome />,       tour: undefined },
  { href: '/teacher',      label: 'Teacher Dashboard', icon: <IconUsers />,      tour: undefined },
  { href: '/budget',       label: 'Budget',            icon: <IconWallet />,     tour: 'tour-budget' },
  { href: '/portfolio',    label: 'Portfolio',         icon: <IconTrending />,   tour: undefined },
  { href: '/simulation',   label: 'Stock Sim',         icon: <IconTrending />,   tour: undefined },
  { href: '/plan',         label: 'AI Plan',           icon: <IconSparkles />,   tour: 'tour-plan' },
  { href: '/compound',     label: 'Compound Calc',     icon: <IconCompound />,   tour: 'tour-compound' },
  { href: '/debt',         label: 'Debt Payoff',       icon: <IconCreditCard />, tour: undefined },
  { href: '/tax',          label: 'Tax 101',           icon: <IconLandmark />,   tour: undefined },
  { href: '/goals',        label: 'Goals',             icon: <IconTarget />,     tour: 'tour-goals' },
  { href: '/transactions', label: 'Transactions',      icon: <IconList />,       tour: undefined },
  { href: '/profile',      label: 'Settings',          icon: <IconSettings />,   tour: undefined },
]
const NAV_PERSONAL = [
  { href: '/dashboard',    label: 'Overview',          icon: <IconHome />,       tour: undefined },
  { href: '/budget',       label: 'Budget',            icon: <IconWallet />,     tour: 'tour-budget' },
  { href: '/portfolio',    label: 'Portfolio',         icon: <IconTrending />,   tour: undefined },
  { href: '/simulation',   label: 'Stock Sim',         icon: <IconTrending />,   tour: undefined },
  { href: '/plan',         label: 'AI Plan',           icon: <IconSparkles />,   tour: 'tour-plan' },
  { href: '/compound',     label: 'Compound Calc',     icon: <IconCompound />,   tour: 'tour-compound' },
  { href: '/debt',         label: 'Debt Payoff',       icon: <IconCreditCard />, tour: undefined },
  { href: '/tax',          label: 'Tax 101',           icon: <IconLandmark />,   tour: undefined },
  { href: '/goals',        label: 'Goals',             icon: <IconTarget />,     tour: 'tour-goals' },
  { href: '/transactions', label: 'Transactions',      icon: <IconList />,       tour: undefined },
  { href: '/profile',      label: 'Settings',          icon: <IconSettings />,   tour: undefined },
]

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Svg({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
function IconHome()        { return <Svg><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg> }
function IconWallet()      { return <Svg><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Svg> }
function IconTrending()    { return <Svg><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg> }
function IconSparkles()    { return <Svg><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></Svg> }
function IconCreditCard()  { return <Svg><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></Svg> }
function IconLandmark()    { return <Svg><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></Svg> }
function IconTarget()      { return <Svg><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Svg> }
function IconList()        { return <Svg><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Svg> }
function IconSettings()    { return <Svg size={16}><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></Svg> }
function IconCompound()    { return <Svg><path d="M2 20h20M5 20V10l7-7 7 7v10"/><path d="M9 20v-5h6v5"/></Svg> }
function IconUsers()       { return <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg> }
function IconAward()       { return <Svg><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></Svg> }

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { budgetSummary, totalDebt, portfolioValue, goalCount, loading, profile } = useUserData()
  const { theme, toggle } = useTheme()
  const { activeWorkspace, isDefaultWorkspace } = useWorkspace()
  const streak = useStreak()
  const [email, setEmail] = useState('')

  const acctType = profile?.account_type ?? 'personal'
  const NAV = acctType === 'teacher' ? NAV_TEACHER : acctType === 'student' ? NAV_STUDENT : NAV_PERSONAL

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? '')
    })
  }, [])

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : email ? email[0].toUpperCase() : 'N'

  const displayName = profile?.full_name || email?.split('@')[0] || 'Account'

  return (
    <aside style={{
      width: mobile ? '100%' : 240,
      background: 'var(--nx-navy-800)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: mobile ? 'relative' : 'sticky', top: 0,
    }}>

      {/* Brand */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--nx-navy-700)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--nx-cream-50)', borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-cream-50)' }}>
            Nexus
          </span>
        </div>
        {/* Close button on mobile */}
        {mobile && onClose && (
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--nx-navy-300)', padding: 4,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Workspace tabs */}
      <WorkspaceTabs />

      {/* Practice mode banner */}
      {!isDefaultWorkspace && (
        <div style={{
          margin: '8px 10px 0',
          padding: '7px 10px',
          borderRadius: 6,
          background: 'rgba(201,164,55,0.12)',
          border: '1px solid var(--nx-gold-700)',
          fontSize: 11,
          color: 'var(--nx-gold-300)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>🧪</span>
          <span><strong>Practice mode</strong> — {activeWorkspace?.name}. All data is isolated.</span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-navy-400)', padding: '8px 10px 6px' }}>
          Menu
        </p>

        {NAV.map(({ href, label, icon, tour }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose} data-tour={tour} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6,
              fontSize: 13.5, fontWeight: 500,
              color: active ? 'var(--nx-cream-50)' : 'var(--nx-navy-300)',
              background: active ? 'var(--nx-navy-700)' : 'transparent',
              textDecoration: 'none', position: 'relative',
              transition: 'all 140ms cubic-bezier(0.2,0,0,1)',
            }}>
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 16, background: 'var(--nx-gold-500)', borderRadius: 2,
                }} />
              )}
              <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                {icon}
              </span>
              {label}
            </Link>
          )
        })}

        {/* Streak badge */}
        {streak.current > 0 && (
          <div style={{
            margin: '8px 0 0', padding: '7px 12px',
            background: streak.current >= 7 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${streak.current >= 7 ? 'rgba(245,158,11,0.3)' : 'var(--nx-navy-700)'}`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: streak.current >= 7 ? 'var(--nx-gold-300)' : 'var(--nx-cream-50)' }}>
                  {streak.current} day streak
                </div>
                <div style={{ fontSize: 10, color: 'var(--nx-navy-400)' }}>Best: {streak.longest}d</div>
              </div>
            </div>
            {streak.current >= 7 && <span style={{ fontSize: 14 }}>⭐</span>}
          </div>
        )}

        {/* Live stats */}
        <div style={{
          margin: '10px 0 0', padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--nx-navy-700)', borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 2 }}>
            Live Overview
          </p>
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
            ))
          ) : (
            <>
              {[
                { label: 'Portfolio',  value: fmt(portfolioValue),        color: 'var(--nx-gold-300)' },
                { label: 'Income',     value: fmt(budgetSummary.income),  color: 'var(--nx-pos-500)' },
                { label: 'Expenses',   value: fmt(budgetSummary.expenses),color: 'var(--nx-neg-500)' },
                { label: 'Debt',       value: fmt(totalDebt),             color: totalDebt > 0 ? 'var(--nx-warn-500)' : 'var(--nx-pos-500)' },
                { label: 'Goals',      value: `${goalCount} active`,      color: 'var(--nx-navy-300)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--nx-navy-400)' }}>{r.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: r.color }}>{r.value}</span>
                </div>
              ))}
              {budgetSummary.income > 0 && (
                <div style={{ paddingTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: 'var(--nx-navy-400)' }}>Savings rate</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: budgetSummary.savingsRate >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)' }}>
                      {Math.round(budgetSummary.savingsRate)}%
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, Math.min(100, budgetSummary.savingsRate))}%`,
                      background: budgetSummary.savingsRate >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)',
                      borderRadius: 999, transition: 'width 500ms',
                    }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Bottom: dark mode toggle + account */}
      <div style={{ borderTop: '1px solid var(--nx-navy-700)', padding: '12px' }}>

        {/* Dark mode toggle */}
        <button onClick={toggle} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px', borderRadius: 6, marginBottom: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--nx-navy-700)',
          cursor: 'pointer', color: 'var(--nx-navy-300)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span style={{ fontSize: 12, fontWeight: 500 }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: 30, height: 17, borderRadius: 999,
            background: theme === 'dark' ? 'var(--nx-gold-500)' : 'var(--nx-navy-600)',
            position: 'relative', transition: 'background 200ms',
          }}>
            <div style={{
              position: 'absolute', top: 2.5, left: theme === 'dark' ? 15 : 2,
              width: 12, height: 12, borderRadius: '50%',
              background: 'white', transition: 'left 200ms',
            }} />
          </div>
        </button>

        {/* Account row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-cream-50)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--nx-navy-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email}
            </div>
          </div>
          <button onClick={signOut} title="Sign out" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--nx-navy-400)', padding: 4, borderRadius: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', transition: 'color 140ms',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
