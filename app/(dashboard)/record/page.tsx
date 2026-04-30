'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AudioRecorder from '@/components/AudioRecorder'
import { Suspense } from 'react'

const PLATFORMS = [
  { id: 'zoom', label: 'Zoom', icon: '🎥' },
  { id: 'teams', label: 'Teams', icon: '💬' },
  { id: 'meet', label: 'Google Meet', icon: '📹' },
  { id: 'direct', label: 'Direct', icon: '🎙️' },
]

function RecordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('direct')
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [segments, setSegments] = useState<any[]>([])
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'setup' | 'recording' | 'processing' | 'review'>('setup')

  useEffect(() => {
    const fromExtension = searchParams.get('from') === 'extension'
    const extTitle = searchParams.get('title')
    if (extTitle) setTitle(decodeURIComponent(extTitle))

    const handler = async (e: MessageEvent) => {
      if (e.data?.type !== 'VOICENOTE_EXTENSION_AUDIO') return

      const audioDataUrl: string = e.data.data
      const audioTitle: string = e.data.title || 'Meeting Recording'
      setTitle(audioTitle)
      setStep('processing')
      setError('')

      try {
        // Create meeting
        const meetRes = await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: audioTitle, platform: 'direct' }),
        })
        const meetData = await meetRes.json()
        if (!meetRes.ok) { setError(meetData.error); setStep('setup'); return }
        setMeetingId(meetData.id)

        // Convert base64 to file
        const fetchRes = await fetch(audioDataUrl)
        const blob = await fetchRes.blob()
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })

        // Transcribe
        const formData = new FormData()
        formData.append('audio', file)
        formData.append('meetingId', meetData.id)
        const txRes = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const txData = await txRes.json()
        if (!txRes.ok) { setError(txData.error); setStep('setup'); return }

        setTranscript(txData.transcript || '')
        setSegments(txData.segments || [])
        setStep('review')
      } catch (err: any) {
        setError(err.message)
        setStep('setup')
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [searchParams])

  async function createMeeting() {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Untitled Meeting', platform }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMeetingId(data.id)
    setStep('recording')
  }

  function handleTranscribed(text: string, segs: any[]) {
    setTranscript(text)
    setSegments(segs)
    setStep('review')
  }

  async function generateNotes() {
    if (!meetingId || !transcript) return
    setGeneratingNotes(true)
    const res = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, transcript }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setGeneratingNotes(false); return }
    router.push(`/meetings/${meetingId}`)
  }

  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🎙️</div>
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p className="text-gray-400 text-sm">Transcribing your recording... please wait</p>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    )
  }

  if (step === 'setup') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-6">New Recording</h1>
        <div className="space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Meeting title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint planning — May 2025"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
              style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: platform === p.id ? 'rgba(99,102,241,0.2)' : 'var(--background)',
                    border: `1px solid ${platform === p.id ? '#6366f1' : 'var(--border)'}`,
                    color: platform === p.id ? '#a5b4fc' : '#9ca3af',
                  }}>
                  <span className="text-xl">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={createMeeting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors">
            Start Recording
          </button>
        </div>
      </div>
    )
  }

  if (step === 'recording') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-2">{title || 'Untitled Meeting'}</h1>
        <p className="text-gray-400 text-sm mb-6">Recording in progress</p>
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {meetingId && (
            <AudioRecorder
              meetingId={meetingId}
              onTranscribed={handleTranscribed}
              onError={setError}
            />
          )}
          {error && <p className="text-red-400 text-sm px-6 pb-4">{error}</p>}
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          Sinhala, English, Singlish — automatically detected
        </p>
      </div>
    )
  }

  // Review step
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">{title || 'Untitled Meeting'}</h1>
      <p className="text-gray-400 text-sm mb-6">Transcription complete</p>

      <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-medium text-gray-300 mb-3">Transcript</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {segments.length > 0 ? segments.map((seg, i) => (
            <div key={i} className="text-sm text-gray-200 leading-relaxed">
              <span className="text-xs text-indigo-400 mr-2">{Math.floor(seg.start)}s</span>
              {seg.text}
            </div>
          )) : (
            <p className="text-sm text-gray-300">{transcript}</p>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-3">
        <button onClick={generateNotes} disabled={generatingNotes}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors">
          {generatingNotes ? 'Generating notes...' : 'Generate AI Notes'}
        </button>
        <button onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-400 hover:text-white"
          style={{ border: '1px solid var(--border)' }}>
          Skip
        </button>
      </div>
    </div>
  )
}

export default function RecordPage() {
  return (
    <Suspense>
      <RecordPageInner />
    </Suspense>
  )
}
