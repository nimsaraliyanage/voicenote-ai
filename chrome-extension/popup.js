const APP_URL = 'https://voicenote-ai.vercel.app' // Update after deploy

let recording = false
let timerInterval = null
let seconds = 0

const btn = document.getElementById('btn-record')
const statusEl = document.getElementById('status')
const timerEl = document.getElementById('timer')
const titleInput = document.getElementById('meeting-title')

function formatTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

chrome.runtime.sendMessage({ action: 'GET_STATUS' }, res => {
  if (res?.recording) setRecordingUI()
})

btn.addEventListener('click', async () => {
  if (!recording) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    chrome.runtime.sendMessage({ action: 'START_CAPTURE', tabId: tab.id }, res => {
      if (res.ok) setRecordingUI()
      else { statusEl.textContent = 'Error: ' + res.error; statusEl.className = 'status' }
    })
  } else {
    chrome.runtime.sendMessage({ action: 'STOP_CAPTURE' }, async res => {
      if (!res.ok) { statusEl.textContent = 'Error: ' + res.error; return }
      clearInterval(timerInterval)
      statusEl.textContent = 'Uploading to VoiceNote AI...'
      btn.disabled = true

      // Open app with the audio data
      const title = titleInput.value || 'Meeting from extension'
      const url = `${APP_URL}/record?from=extension&title=${encodeURIComponent(title)}`
      chrome.tabs.create({ url })

      // Store audio data for the app to pick up
      await chrome.storage.local.set({ pendingAudio: res.data, pendingTitle: title })

      resetUI()
    })
  }
})

function setRecordingUI() {
  recording = true
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
  btn.textContent = 'Start Recording'
  btn.className = ''
  btn.disabled = false
  statusEl.textContent = 'Ready to record'
  statusEl.className = 'status'
  timerEl.style.display = 'none'
}
