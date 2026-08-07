'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자', designer: '디자인팀', field: '현장팀', partner: '외부협력업체',
}

// 로그인 + 상단 네비게이션. admin/designer만 통과 (견적 = 금액 정보)
export default function Header({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
  const allowed = profile?.role === 'admin' || profile?.role === 'designer'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) setErr('로그인 실패: 이메일/비밀번호를 확인하세요.')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-300 bg-gray-50">불러오는 중…</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form onSubmit={login} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">JM 견적프로그램</h1>
          <p className="text-xs text-gray-400 mb-5">JM 관리시스템 계정으로 로그인하세요.</p>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="이메일" autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-2" />
          <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="비밀번호"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3" />
          {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
          <button type="submit" disabled={busy}
            className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {busy ? '확인 중…' : '로그인'}
          </button>
        </form>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 p-4">
        <p className="text-gray-500 text-sm">접근 권한이 없습니다. (관리자/디자인팀 전용)</p>
        <button onClick={signOut} className="text-xs text-gray-400 underline">로그아웃</button>
      </div>
    )
  }

  const nav = [
    { href: '/', label: '견적서' },
    { href: '/prices', label: '단가표' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-5">
          <span className="font-bold whitespace-nowrap">JM 견적</span>
          <nav className="flex gap-1 flex-1">
            {nav.map(n => {
              const active = n.href === '/' ? (pathname === '/' || pathname.startsWith('/estimates')) : pathname.startsWith(n.href)
              return (
                <Link key={n.href} href={n.href}
                  className={`px-3 py-1.5 rounded-lg text-sm ${active ? 'bg-green-600' : 'text-green-100 hover:bg-green-700'}`}>
                  {n.label}
                </Link>
              )
            })}
          </nav>
          <span className="text-xs text-green-200 hidden sm:inline">
            {profile?.name} · {ROLE_LABEL[profile?.role || ''] || profile?.role}
          </span>
          <button onClick={signOut} className="text-xs text-green-300 hover:text-white">로그아웃</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-5">{children}</main>
    </div>
  )
}
