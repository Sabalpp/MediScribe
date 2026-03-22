/**
 * AudioStream — captures microphone audio via MediaRecorder,
 * chunks it into ~250ms WebM segments, and streams them as binary
 * frames over a WebSocket (preceded by an audio_metadata text frame).
 *
 * Protocol matches the Django InterpreterConsumer:
 *   1. Text frame:  { type: "audio_metadata", direction, patient_language }
 *   2. Binary frame: raw audio bytes
 */

const TIMESLICE_MS = 250
const MIME_TYPE = 'audio/webm;codecs=opus'

let mediaStream = null
let mediaRecorder = null
let muted = false

/**
 * Start capturing microphone audio and streaming binary chunks over ws.
 *
 * @param {object} options
 * @param {WebSocket} options.ws - native WebSocket instance
 * @param {string} options.language - patient language code (e.g. "es")
 * @param {string} [options.deviceId] - specific mic device ID
 * @returns {Promise<void>}
 */
export async function start({ ws, language, deviceId } = {}) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    return
  }

  const constraints = {
    audio: deviceId
      ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
      : { echoCancellation: true, noiseSuppression: true },
  }

  mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

  if (!MediaRecorder.isTypeSupported(MIME_TYPE)) {
    console.warn(`${MIME_TYPE} not supported, falling back to default`)
  }

  const options = MediaRecorder.isTypeSupported(MIME_TYPE) ? { mimeType: MIME_TYPE } : {}
  mediaRecorder = new MediaRecorder(mediaStream, options)

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data.size === 0 || muted) return
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    try {
      // 1. Send metadata text frame so the backend knows direction + language
      ws.send(JSON.stringify({
        type: 'audio_metadata',
        direction: 'patient_to_provider',
        patient_language: language,
      }))

      // 2. Send raw audio as binary frame
      const arrayBuffer = await event.data.arrayBuffer()
      ws.send(arrayBuffer)
    } catch (err) {
      console.error('Failed to send audio chunk:', err)
    }
  }

  mediaRecorder.start(TIMESLICE_MS)
}

/** Stop capturing and release the microphone. */
export function stop() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  mediaRecorder = null

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

/** Gate audio streaming without releasing the mic. */
export function setMuted(value) {
  muted = value
  if (mediaStream) {
    mediaStream.getAudioTracks().forEach((t) => {
      t.enabled = !value
    })
  }
}

/** @returns {boolean} */
export function isMuted() {
  return muted
}

/** @returns {boolean} */
export function isCapturing() {
  return mediaRecorder !== null && mediaRecorder.state === 'recording'
}

/**
 * Enumerate available audio input devices.
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export async function listMicrophones() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'audioinput')
}
