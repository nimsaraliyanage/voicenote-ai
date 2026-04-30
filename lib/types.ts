export type MeetingStatus = 'recording' | 'processing' | 'done' | 'error'
export type MeetingPlatform = 'zoom' | 'teams' | 'meet' | 'direct' | 'upload'
export type Language = 'si' | 'en' | 'mixed'

export interface Meeting {
  id: string
  user_id: string
  title: string
  platform: MeetingPlatform
  status: MeetingStatus
  language: Language
  duration_seconds: number | null
  audio_url: string | null
  created_at: string
  updated_at: string
}

export interface TranscriptSegment {
  id: string
  meeting_id: string
  start_time: number
  end_time: number
  text: string
  language: Language
  speaker: string | null
  created_at: string
}

export interface MeetingNotes {
  id: string
  meeting_id: string
  summary: string
  action_items: ActionItem[]
  key_points: string[]
  decisions: string[]
  created_at: string
}

export interface ActionItem {
  text: string
  assignee: string | null
  due_date: string | null
  done: boolean
}
