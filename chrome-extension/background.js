let recordingTabId = null

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'GET_STATUS') {
    sendResponse({ recording: recordingTabId !== null })
    return
  }

  if (msg.action === 'START_CAPTURE') {
    chrome.tabCapture.getMediaStreamId({ targetTabId: msg.tabId }, async (streamId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      try {
        const exists = await chrome.offscreen.hasDocument()
        if (!exists) {
          await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Capture tab audio for transcription'
          })
        }
        chrome.runtime.sendMessage({ target: 'offscreen', action: 'START_RECORDING', streamId })
        recordingTabId = msg.tabId
        sendResponse({ ok: true })
      } catch (e) {
        sendResponse({ ok: false, error: e.message })
      }
    })
    return true
  }

  if (msg.action === 'STOP_CAPTURE') {
    // Send directly without gating on hasDocument (can be unreliable after SW restart)
    chrome.runtime.sendMessage({ target: 'offscreen', action: 'STOP_RECORDING' }).catch(() => {})
    recordingTabId = null
    sendResponse({ ok: true })
    return true
  }

  // offscreen can't use chrome.storage — it sends audio here for saving
  if (msg.action === 'SAVE_AUDIO') {
    chrome.storage.local.set({ pendingAudio: msg.data })
    recordingTabId = null
    chrome.offscreen.closeDocument().catch(() => {})
    return
  }

  if (msg.action === 'SAVE_AUDIO_ERROR') {
    chrome.storage.local.set({ pendingAudioError: msg.error })
    chrome.offscreen.closeDocument().catch(() => {})
    return
  }
})
