import type { Metadata } from 'next'
import { InspectDevtools } from '@inspect-devtools/next/component'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inspect Devtools — Next.js Playground',
  description: 'Next.js playground for Inspect Devtools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InspectDevtools />
        {children}
      </body>
    </html>
  )
}
