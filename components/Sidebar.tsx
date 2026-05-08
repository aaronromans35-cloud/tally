'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'
import { useTheme } from '@/lib/context/ThemeContext'

const NAV = [
  { href: '/dashboard',    label: 'Overview',       icon: <IconHome /> },
  { href: '/budget',       label: 'Budget',          icon: <IconWallet /> },
  { href: '/portfolio',    label: 'Portfolio',       icon: <IconTrending /> },
  { href: '/plan',         label: 'AI Plan',         icon: <IconSparkles /> },
  { href: '/debt',         label: 'Debt Payoff',     icon: <IconCreditCard /> },
  { href: '/tax',          label: 'Tax Assistant',   icon: <IconLandmark /> },
  { href: '/goals',        label: 'Goals',           icon: <IconTarget /> },
  { href: '/transactions', label: 'Transactions',    icon: <IconList /> },
  { href: '/profile',      label: 'Settings',        icon: <IconSettings /> },
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

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { budgetSummary, totalDebt, portfolioValue, goalCount, loading, profile } = useUserData()
  const { theme, toggle } = useTheme()
  const [email, setEmail] = useState('')

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

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-navy-400)', padding: '8px 10px 6px' }}>
          Menu
        </p>

        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose} style={{
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
