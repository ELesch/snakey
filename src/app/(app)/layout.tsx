import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { OfflineIndicator } from '@/components/layout/offline-indicator'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
        <OfflineIndicator />
      </div>
    </div>
  )
}
