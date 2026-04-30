let mediaRecorder = null
let chunks = []
let audioCtx = null
let audioSource = null

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.target !== 'offscreen') return

  if (msg.action === 'START_RECORDING') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: msg.streamId
          }
        },
        video: false
      })

      // Play audio through speakers while recording
      audioCtx = new AudioContext()
      audioSource = audioCtx.createMediaStreamSource(stream)
      audioSource.connect(audioCtx.destination)

      chunks = []
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        audioSource?.disconnect()
        audioCtx?.close()
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          // chrome.storage is not available in offscreen docs — send to background to save
          chrome.runtime.sendMessage({ action: 'SAVE_AUDIO', data: reader.result }).catch(() => {})
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start(1000)
    } catch (e) {
      chrome.runtime.sendMessage({ action: 'SAVE_AUDIO_ERROR', error: e.message }).catch(() => {})
    }
  }

  if (msg.action === 'STOP_RECORDING') {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }
})
