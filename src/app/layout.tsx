import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import './app.css'

export const metadata: Metadata = {
  title: 'Snakey - Reptile Care Tracker',
  description: 'Track feedings, sheds, weights, and environmental conditions for your reptile collection',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-cool-50 dark:bg-cool-950 text-warm-900 dark:text-warm-100 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
