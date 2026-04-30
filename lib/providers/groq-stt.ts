import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function transcribeAudio(audioBlob: Blob, filename: string): Promise<{
  text: string
  language: string
  segments: Array<{ start: number; end: number; text: string }>
}> {
  const file = new File([audioBlob], filename, { type: audioBlob.type })

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    // Sinhala + English both detected automatically
    // language: 'si' would force Sinhala only — leave blank for auto-detect
  })

  const segments = (transcription as any).segments?.map((s: any) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  })) ?? []

  return {
    text: transcription.text,
    language: (transcription as any).language ?? 'en',
    segments,
  }
}
