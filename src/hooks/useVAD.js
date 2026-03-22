import { useRef, useState, useCallback, useEffect } from 'react'

const VAD_CONFIG = {
  model: 'legacy',
  baseAssetPath: '/vad/',
  onnxWASMBasePath: '/vad/',
  positiveSpeechThreshold: 0.6,
  negativeSpeechThreshold: 0.35,
  minSpeechMs: 300,
  redemptionMs: 800,
  preSpeechPadMs: 230,
  submitUserSpeechOnPause: true,
}

export default function useVAD({ onSpeechEnd, onStatusChange }) {
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const vadRef = useRef(null)

  const start = useCallback(async () => {
    if (vadRef.current) {
      await vadRef.current.start()
      setListening(true)
      onStatusChange?.('listening')
      return
    }

    setLoading(true)
    try {
      const { MicVAD, utils } = await import('@ricky0123/vad-web')

      const vad = await MicVAD.new({
        ...VAD_CONFIG,

        onSpeechStart: () => {
          onStatusChange?.('speaking')
        },

        onSpeechEnd: (audioFloat32) => {
          const wavBuffer = utils.encodeWAV(audioFloat32)
          const blob = new Blob([wavBuffer], { type: 'audio/wav' })
          onSpeechEnd?.(blob)
          onStatusChange?.('listening')
        },

        onVADMisfire: () => {
          onStatusChange?.('listening')
        },
      })

      vadRef.current = vad
      await vad.start()
      setListening(true)
      onStatusChange?.('listening')
    } catch (err) {
      console.error('VAD init failed:', err)
      onStatusChange?.('error')
    } finally {
      setLoading(false)
    }
  }, [onSpeechEnd, onStatusChange])

  const pause = useCallback(async () => {
    if (vadRef.current) {
      await vadRef.current.pause()
      setListening(false)
      onStatusChange?.('idle')
    }
  }, [onStatusChange])

  const destroy = useCallback(async () => {
    if (vadRef.current) {
      await vadRef.current.destroy()
      vadRef.current = null
      setListening(false)
      onStatusChange?.('idle')
    }
  }, [onStatusChange])

  useEffect(() => {
    return () => {
      vadRef.current?.destroy()
      vadRef.current = null
    }
  }, [])

  return { listening, loading, start, pause, destroy }
}
