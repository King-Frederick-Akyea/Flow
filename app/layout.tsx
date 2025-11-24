import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Builder',
  description: 'Visual automation workflow builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}