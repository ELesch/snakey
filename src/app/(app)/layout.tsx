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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <Header />
        <main id="main-content" className="flex-1 p-4 md:p-6" role="main">
          {children}
        </main>
        <OfflineIndicator />
      </div>
    </div>
  )
}
