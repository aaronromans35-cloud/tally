import Sidebar from '@/components/Sidebar'
import { UserDataProvider } from '@/lib/context/UserDataContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </UserDataProvider>
  )
}
