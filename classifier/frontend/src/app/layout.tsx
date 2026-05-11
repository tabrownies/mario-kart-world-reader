import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MKW Classifier',
  description: 'Mario Kart World Frame Classifier',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>{children}</body>
    </html>
  )
}
