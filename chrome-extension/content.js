// Runs on voicenote-ai-sigma.vercel.app — reads pending audio from extension storage
// and posts it to the page via window.postMessage
chrome.storage.local.get(['pendingAudio', 'pendingTitle'], (result) => {
  if (!result.pendingAudio) return
  window.postMessage({
    type: 'VOICENOTE_EXTENSION_AUDIO',
    data: result.pendingAudio,
    title: result.pendingTitle || 'Meeting Recording'
  }, '*')
  chrome.storage.local.remove(['pendingAudio', 'pendingTitle'])
})
