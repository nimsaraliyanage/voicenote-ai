const APP_URL = 'https://voicenote-ai-sigma.vercel.app'

let recording = false
let finalizing = false
let timerInterval = null
let pollInterval = null
let seconds = 0

const btn = document.getElementById('btn-record')
const statusEl = document.getElementById('status')
const timerEl = document.getElementById('timer')
const titleInput = document.getElementById('meeting-title')

function formatTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function handleAudioReady() {
  if (!recording && !finalizing) return
  recording = false
  finalizing = false
  clearInterval(timerInterval)
  clearInterval(pollInterval)
  pollInterval = null
  const title = titleInput.value || 'Meeting from extension'
  chrome.storage.local.set({ pendingTitle: title })
  statusEl.textContent = 'Opening VoiceNote AI...'
  const url = `${APP_URL}/record?from=extension&title=${encodeURIComponent(title)}`
  chrome.tabs.create({ url })
  setTimeout(resetUI, 1000)
}

// Listen for audio saved to storage (works even if service worker was killed)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.pendingAudio) return
  handleAudioReady()
})

chrome.runtime.sendMessage({ action: 'GET_STATUS' }, res => {
  if (chrome.runtime.lastError) return
  if (res?.recording) setRecordingUI()
})

btn.addEventListener('click', async () => {
  if (!recording) {
    btn.disabled = true
    statusEl.textContent = 'Starting...'
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    chrome.runtime.sendMessage({ action: 'START_CAPTURE', tabId: tab.id }, res => {
      if (chrome.runtime.lastError || !res) {
        statusEl.textContent = 'Error: Try again'
        btn.disabled = false
        return
      }
      if (res.ok) setRecordingUI()
      else { statusEl.textContent = 'Error: ' + res.error; btn.disabled = false }
    })
  } else {
    clearInterval(timerInterval)
    statusEl.textContent = 'Finalizing recording...'
    btn.disabled = true
    finalizing = true

    // Polling fallback — in case storage.onChanged doesn't fire
    pollInterval = setInterval(() => {
      chrome.storage.local.get(['pendingAudio'], result => {
        if (result.pendingAudio) handleAudioReady()
      })
    }, 1500)

    chrome.runtime.sendMessage({ action: 'STOP_CAPTURE' }, res => {
      if (chrome.runtime.lastError) {
        // SW was killed — check storage directly, offscreen may have already saved
        chrome.storage.local.get(['pendingAudio'], result => {
          if (result.pendingAudio) handleAudioReady()
        })
      }
    })
  }
})

function setRecordingUI() {
  recording = true
  finalizing = false
  btn.disabled = false
  btn.textContent = 'Stop Recording'
  btn.className = 'recording'
  statusEl.textContent = 'Recording tab audio...'
  statusEl.className = 'status recording'
  timerEl.style.display = 'block'
  seconds = 0
  timerInterval = setInterval(() => { seconds++; timerEl.textContent = formatTime(seconds) }, 1000)
}

function resetUI() {
  recording = false
  finalizing = false
  clearInterval(pollInterval)
  pollInterval = null
  btn.textContent = 'Start Recording'
  btn.className = ''
  btn.disabled = false
  statusEl.textContent = 'Ready to record'
  statusEl.className = 'status'
  timerEl.style.display = 'none'
}
