import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'JM 견적프로그램',
  description: 'JM건축인테리어 견적 작성 프로그램',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          <Header>{children}</Header>
        </AuthProvider>
      </body>
    </html>
  )
}
