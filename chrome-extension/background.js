let mediaRecorder = null
let audioChunks = []
let captureStream = null

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'START_CAPTURE') {
    startCapture(msg.tabId).then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.action === 'STOP_CAPTURE') {
    stopCapture().then(blob => {
      const reader = new FileReader()
      reader.onloadend = () => sendResponse({ ok: true, data: reader.result })
      reader.readAsDataURL(blob)
    }).catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  if (msg.action === 'GET_STATUS') {
    sendResponse({ recording: mediaRecorder?.state === 'recording' })
  }
})

async function startCapture(tabId) {
  captureStream = await chrome.tabCapture.capture({ audio: true, video: false })
  audioChunks = []
  mediaRecorder = new MediaRecorder(captureStream, { mimeType: 'audio/webm' })
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data) }
  mediaRecorder.start(1000)
}

async function stopCapture() {
  return new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      captureStream?.getTracks().forEach(t => t.stop())
      resolve(blob)
    }
    mediaRecorder.stop()
  })
}
