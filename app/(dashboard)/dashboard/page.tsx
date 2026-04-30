import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
import { Meeting } from '@/lib/types'

const STATUS_BADGE: Record<string, string> = {
  recording: 'bg-red-500/20 text-red-400',
  processing: 'bg-yellow-500/20 text-yellow-400',
  done: 'bg-green-500/20 text-green-400',
  error: 'bg-gray-500/20 text-gray-400',
}

const PLATFORM_ICON: Record<string, string> = {
  zoom: '🎥', teams: '💬', meet: '📹', direct: '🎙️', upload: '📁',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: meetings } = await supabase
    .from('meetings').select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Hey, {name} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Your meeting notes</p>
        </div>
        <Link href="/record"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
          + New Recording
        </Link>
      </div>

      {(!meetings || meetings.length === 0) ? (
        <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed var(--border)' }}>
          <div className="text-4xl mb-4">🎙️</div>
          <h2 className="font-semibold text-lg mb-2">No recordings yet</h2>
          <p className="text-gray-400 text-sm mb-6">Start your first meeting recording</p>
          <Link href="/record" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            Start Recording
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(meetings as Meeting[]).map(m => (
            <Link key={m.id} href={`/meetings/${m.id}`}
              className="flex items-center gap-4 p-4 rounded-xl hover:border-indigo-500/50 transition-colors group"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-xl">{PLATFORM_ICON[m.platform] ?? '🎙️'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate group-hover:text-indigo-300 transition-colors">{m.title}</div>
                <div className="text-gray-400 text-xs mt-0.5">{formatDate(m.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                {m.duration_seconds && (
                  <span className="text-xs text-gray-400">{formatDuration(m.duration_seconds)}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[m.status]}`}>
                  {m.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                  {m.language === 'si' ? 'සිංහල' : m.language === 'en' ? 'EN' : 'Mixed'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
