import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-semibold text-lg">VoiceNote AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
          Sinhala + English + Singlish
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl leading-tight">
          Meeting notes that{' '}
          <span className="text-indigo-400">understand Sinhala</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Zoom, Teams, Google Meet — ඕනෑම meeting eka record කරන්න. Sinhala, English, Singlish — AI automatically transcribe කරලා smart notes හදනවා.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-base transition-colors">
            Start for free
          </Link>
          <Link href="/login"
            className="px-8 py-3.5 rounded-xl font-medium text-base transition-colors text-gray-300 hover:text-white"
            style={{ border: '1px solid var(--border)' }}>
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: '🎙️', title: 'Sinhala STT', desc: 'Groq Whisper large-v3 — Sinhala, English, Singlish හොඳට හදුනගන්නවා' },
            { icon: '🤖', title: 'Smart Notes', desc: 'AI auto-generate කරනවා summary, action items, key decisions' },
            { icon: '🔗', title: 'Zoom & Teams', desc: 'Browser extension හරහා directly capture — app switch කරන්න ඕනෑ නෑ' },
          ].map(f => (
            <div key={f.title} className="p-5 rounded-xl text-left" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-1 text-sm">{f.title}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
