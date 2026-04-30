import { NextRequest, NextResponse } from 'next/server'
import { generateMeetingNotes } from '@/lib/providers/groq-ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { meetingId, transcript, language } = await req.json()
    if (!meetingId || !transcript) {
      return NextResponse.json({ error: 'Missing meetingId or transcript' }, { status: 400 })
    }

    const notes = await generateMeetingNotes(transcript, language ?? 'mixed')

    // Save notes to DB
    const { data, error } = await supabase.from('meeting_notes').upsert({
      meeting_id: meetingId,
      ...notes,
    }, { onConflict: 'meeting_id' }).select().single()

    if (error) throw error

    // Mark meeting as done
    await supabase.from('meetings').update({ status: 'done' }).eq('id', meetingId)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Notes generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
