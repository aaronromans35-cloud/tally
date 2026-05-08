'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { UserDataProvider, useUserData } from '@/lib/context/UserDataContext'

// Redirect new users (no profile) to onboarding
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUserData()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && profile === null && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [loading, profile, pathname, router])

  return <>{children}</>
}

function Svg({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const BOTTOM_NAV = [
  {
    href: '/dashboard', label: 'Home',
    icon: <Svg size={22}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  },
  {
    href: '/budget', label: 'Budget',
    icon: <Svg size={22}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Svg>,
  },
  {
    href: '/portfolio', label: 'Portfolio',
    icon: <Svg size={22}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg>,
  },
  {
    href: '/plan', label: 'AI Plan',
    icon: <Svg size={22}><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></Svg>,
  },
  {
    href: '/goals', label: 'Goals',
    icon: <Svg size={22}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Svg>,
  },
]

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="mobile-nav-bar">
      <button onClick={onMenu} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--nx-cream-50)', padding: 6, display: 'flex',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{ width: 26, height: 26, background: 'var(--nx-cream-50)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-cream-50)' }}>Nexus</span>
      </Link>
      <div style={{ width: 34 }} /> {/* spacer */}
    </div>
  )
}

function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <div className="mobile-bottom-nav">
      {BOTTOM_NAV.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 12px', textDecoration: 'none',
            color: active ? 'var(--nx-gold-400)' : 'var(--nx-navy-400)',
            flex: 1, justifyContent: 'center',
          }}>
            {icon}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <UserDataProvider>
      <OnboardingGate>
      {/* Mobile top bar */}
      <MobileHeader onMenu={() => setDrawerOpen(true)} />

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="sidebar-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Sidebar drawer (mobile) */}
      <div className={`sidebar-drawer ${drawerOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setDrawerOpen(false)} mobile />
      </div>

      {/* Main layout */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        minHeight: '100vh',
        background: 'var(--background)',
      }}>
        {/* Desktop sidebar */}
        <div className="sidebar-desktop">
          <Sidebar />
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main
            className="main-content"
            style={{ padding: '28px 32px 64px', maxWidth: 1280, width: '100%', margin: '0 auto' }}
          >
            {/* Mobile top spacer */}
            <div className="mobile-nav-bar" style={{ height: 56, display: 'none', position: 'relative', background: 'transparent', border: 'none' }} />
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
      </OnboardingGate>
    </UserDataProvider>
  )
}
