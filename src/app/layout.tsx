import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import './app.css'

export const metadata: Metadata = {
  title: 'Snakey - Reptile Care Tracker',
  description: 'Track feedings, sheds, weights, and environmental conditions for your reptile collection',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Snakey',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#4a7c59',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-cool-50 text-warm-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
