import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/providers/groq-stt'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const meetingId = formData.get('meetingId') as string

    if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    // Upload audio to Supabase Storage
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    const fileName = `${user.id}/${meetingId}.webm`

    const { data: uploadData } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBlob, { upsert: true })

    // Transcribe with Groq Whisper
    const result = await transcribeAudio(audioBlob, audioFile.name || 'recording.webm')

    // Save transcript segments to DB
    if (result.segments.length > 0) {
      const segments = result.segments.map(seg => ({
        meeting_id: meetingId,
        start_time: seg.start,
        end_time: seg.end,
        text: seg.text,
        language: result.language === 'si' ? 'si' : result.language === 'en' ? 'en' : 'mixed',
        speaker: null,
      }))
      await supabase.from('transcript_segments').insert(segments)
    }

    // Update meeting status
    await supabase.from('meetings').update({
      status: 'processing',
      audio_url: uploadData?.path ?? null,
      language: result.language === 'si' ? 'si' : 'mixed',
    }).eq('id', meetingId)

    return NextResponse.json({
      text: result.text,
      language: result.language,
      segments: result.segments,
    })
  } catch (err: any) {
    console.error('Transcribe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
