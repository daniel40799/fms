import { ArrowPathIcon } from '@heroicons/react/24/outline'
import jsQR from 'jsqr'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatedDialog } from '../modals/AnimatedDialog'
import { Button, InlineError } from '../ui'

type ScanState = 'idle' | 'requesting' | 'scanning' | 'error'

function getCameraErrorMessage(error: unknown) {
  if (!window.isSecureContext) {
    return 'Camera scanning requires HTTPS or localhost. Paste the QR token manually on this connection.'
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not support camera access. Paste the QR token manually.'
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Camera permission was denied. Allow camera access or paste the QR token manually.'
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera was found on this device. Paste the QR token manually.'
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'The camera could not be opened. Close other camera apps and try again, or paste the QR token manually.'
    }
  }

  return 'The camera could not be opened. Paste the QR token manually.'
}

export function QrCameraScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean
  onClose: () => void
  onDetected: (token: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
  }, [])

  const scanFrame = useCallback(() => {
    if (!streamRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      frameRef.current = window.requestAnimationFrame(scanFrame)
      return
    }

    const width = video.videoWidth
    const height = video.videoHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!width || !height || !context) {
      frameRef.current = window.requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(video, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)
    const result = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })
    const token = result?.data?.trim()

    if (token) {
      stopCamera()
      onDetected(token)
      return
    }

    frameRef.current = window.requestAnimationFrame(scanFrame)
  }, [onDetected, stopCamera])

  const startCamera = useCallback(async () => {
    stopCamera()
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setError('')
    setScanState('requesting')

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(getCameraErrorMessage(null))
      setScanState('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      })

      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream

      if (!videoRef.current) {
        stopCamera()
        return
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (requestIdRef.current !== requestId) {
        stopCamera()
        return
      }

      setScanState('scanning')
      frameRef.current = window.requestAnimationFrame(scanFrame)
    } catch (caught) {
      if (requestIdRef.current !== requestId) return
      stopCamera()
      setError(getCameraErrorMessage(caught))
      setScanState('error')
    }
  }, [scanFrame, stopCamera])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setScanState('idle')
      setError('')
      return
    }

    void startCamera()

    return () => stopCamera()
  }, [open, retryCount, startCamera, stopCamera])

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <AnimatedDialog isOpen={open} onClose={handleClose} title="Scan QR code" size="sm">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-white/10">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          {scanState === 'requesting' ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/80 px-4 text-center text-sm font-medium text-white">
              Requesting camera permission...
            </div>
          ) : null}
          {scanState === 'scanning' ? (
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-sky-300/80 shadow-[0_0_0_999px_rgb(2_6_23_/_0.35)]" />
          ) : null}
          {scanState === 'error' ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/85 px-4 text-center text-sm font-medium text-white">
              Camera unavailable
            </div>
          ) : null}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {error ? <InlineError message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {scanState === 'error' ? (
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowPathIcon className="h-4 w-4" aria-hidden />}
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </AnimatedDialog>
  )
}
