import Groq from 'groq-sdk'
import { ActionItem, MeetingNotes } from '../types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateMeetingNotes(
  transcript: string,
  language: string
): Promise<Omit<MeetingNotes, 'id' | 'meeting_id' | 'created_at'>> {
  const prompt = `You are an AI assistant that creates structured meeting notes.
The transcript may be in Sinhala, English, or a mix of both (called "Singlish" - where Sinhala is written in English letters like "api wage hadamu", "meka fix karanna one", etc.).

Analyze the following meeting transcript and extract:
1. A clear summary (2-4 sentences) in the SAME language as the transcript
2. Action items with assignee if mentioned
3. Key discussion points (bullet points)
4. Decisions made

IMPORTANT: If the transcript is in Sinhala or Singlish, write the summary and notes in Sinhala (using Sinhala script). If it's English, write in English. If mixed, write in English but keep Sinhala terms where appropriate.

Transcript:
---
${transcript}
---

Respond with ONLY valid JSON in this exact format:
{
  "summary": "...",
  "action_items": [
    { "text": "...", "assignee": "name or null", "due_date": null, "done": false }
  ],
  "key_points": ["...", "..."],
  "decisions": ["...", "..."]
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(content)

  return {
    summary: parsed.summary ?? '',
    action_items: (parsed.action_items ?? []) as ActionItem[],
    key_points: parsed.key_points ?? [],
    decisions: parsed.decisions ?? [],
  }
}
