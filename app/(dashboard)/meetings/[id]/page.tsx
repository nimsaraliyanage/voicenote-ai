import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDuration } from '@/lib/utils'
import { Meeting, TranscriptSegment, MeetingNotes, ActionItem } from '@/lib/types'

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [meetingRes, segmentsRes, notesRes] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).eq('user_id', user!.id).single(),
    supabase.from('transcript_segments').select('*').eq('meeting_id', id).order('start_time'),
    supabase.from('meeting_notes').select('*').eq('meeting_id', id).single(),
  ])

  if (meetingRes.error || !meetingRes.data) notFound()

  const meeting = meetingRes.data as Meeting
  const segments = (segmentsRes.data ?? []) as TranscriptSegment[]
  const notes = notesRes.data as MeetingNotes | null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white mb-2 inline-block">← Dashboard</Link>
          <h1 className="text-2xl font-semibold">{meeting.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{formatDate(meeting.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {meeting.duration_seconds && (
            <span className="text-xs text-gray-400">{formatDuration(meeting.duration_seconds)}</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
            {meeting.language === 'si' ? 'සිංහල' : meeting.language === 'en' ? 'English' : 'Sinhala + English'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes panel */}
        {notes ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">Summary</h2>
              <p className="text-sm text-gray-200 leading-relaxed">{notes.summary}</p>
            </div>

            {/* Action Items */}
            {notes.action_items?.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">
                  Action Items ({notes.action_items.length})
                </h2>
                <div className="space-y-2">
                  {(notes.action_items as ActionItem[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-4 h-4 rounded border flex-shrink-0 mt-0.5" style={{ border: '1px solid #6366f1' }} />
                      <div>
                        <span className="text-gray-200">{item.text}</span>
                        {item.assignee && (
                          <span className="ml-2 text-xs text-indigo-400">@{item.assignee}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {notes.key_points?.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">Key Points</h2>
                <ul className="space-y-2">
                  {notes.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <span className="text-indigo-400 mt-0.5">•</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decisions */}
            {notes.decisions?.length > 0 && (
              <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">Decisions</h2>
                <ul className="space-y-2">
                  {notes.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <span className="text-green-400 mt-0.5">✓</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: '200px' }}>
            <div className="text-3xl mb-3">🤖</div>
            <p className="text-sm text-gray-400">No notes generated yet</p>
          </div>
        )}

        {/* Transcript */}
        <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">
            Transcript ({segments.length} segments)
          </h2>
          {segments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {segments.map((seg, i) => (
                <div key={i} className="text-sm leading-relaxed">
                  <span className="text-xs text-indigo-400/60 mr-2">{Math.floor(seg.start_time)}s</span>
                  <span className="text-gray-200">{seg.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No transcript available</p>
          )}
        </div>
      </div>
    </div>
  )
}
