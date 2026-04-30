'use client'
import { useState, useRef, useCallback } from 'react'
import { formatDuration } from '@/lib/utils'

interface Props {
  meetingId: string
  onTranscribed: (text: string, segments: any[]) => void
  onError: (msg: string) => void
}

type RecordingState = 'idle' | 'recording' | 'uploading' | 'transcribing'

export default function AudioRecorder({ meetingId, onTranscribed, onError }: Props) {
  const [state, setState] = useState<RecordingState>('idle')
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(1000)
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      onError('Microphone access denied. Browser settings eke allow karanna.')
    }
  }, [onError])

  const stopAndProcess = useCallback(async () => {
    if (!mediaRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)

    setState('uploading')

    await new Promise<void>(resolve => {
      mediaRef.current!.onstop = () => resolve()
      mediaRef.current!.stop()
      mediaRef.current!.stream.getTracks().forEach(t => t.stop())
    })

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('meetingId', meetingId)

    setState('transcribing')

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
      onTranscribed(data.text, data.segments ?? [])
      setState('idle')
    } catch (err: any) {
      onError(err.message)
      setState('idle')
    }
  }, [meetingId, onTranscribed, onError])

  const isRecording = state === 'recording'
  const isBusy = state === 'uploading' || state === 'transcribing'

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Timer */}
      <div className="text-4xl font-mono font-light tabular-nums" style={{ color: isRecording ? '#ef4444' : 'var(--foreground)' }}>
        {formatDuration(seconds)}
      </div>

      {/* Audio wave animation */}
      {isRecording && (
        <div className="audio-wave flex items-end gap-1 h-6">
          <span /><span /><span /><span /><span />
        </div>
      )}

      {/* Record button */}
      <button
        onClick={isRecording ? stopAndProcess : startRecording}
        disabled={isBusy}
        className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
        style={{
          background: isRecording ? '#ef4444' : '#6366f1',
          boxShadow: isRecording ? '0 0 0 0 rgba(239,68,68,0.4)' : 'none',
        }}
      >
        {isRecording && <div className="recording-pulse absolute inset-0 rounded-full" />}
        {isRecording ? (
          <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V21h2v-1.07A8 8 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z" />
          </svg>
        )}
      </button>

      {/* Status label */}
      <p className="text-sm text-gray-400">
        {state === 'idle' && 'Click to start recording'}
        {state === 'recording' && 'Recording... Click to stop'}
        {state === 'uploading' && 'Uploading audio...'}
        {state === 'transcribing' && 'Transcribing with Groq Whisper...'}
      </p>
    </div>
  )
}
