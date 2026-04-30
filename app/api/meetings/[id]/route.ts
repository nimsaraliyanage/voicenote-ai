import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [meetingRes, segmentsRes, notesRes] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('transcript_segments').select('*').eq('meeting_id', id).order('start_time'),
    supabase.from('meeting_notes').select('*').eq('meeting_id', id).single(),
  ])

  if (meetingRes.error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    meeting: meetingRes.data,
    segments: segmentsRes.data ?? [],
    notes: notesRes.data ?? null,
  })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('meetings').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
