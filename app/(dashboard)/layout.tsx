import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <nav className="flex items-center justify-between px-6 py-3 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">V</div>
          <span className="font-semibold text-sm">VoiceNote AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/record" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors">
            <span>+</span> New Recording
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-xs text-gray-400 hover:text-white transition-colors">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
