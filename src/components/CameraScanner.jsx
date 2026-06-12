import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { useOcrWorker } from '../hooks/useOcrWorker'
import { cropAroundPoint } from '../utils/imageCoords'
import {
  canvasToObjectUrl,
  downscaleIfNeeded,
  loadImageSource,
} from '../utils/prepareImageForOcr'
import PricePicker from './PricePicker'
import PriceConfirm from './PriceConfirm'

export default function CameraScanner({ onAdd, isActive }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const sourceCanvasRef = useRef(null)

  const { readPriceFromCrop, ready: ocrReady } = useOcrWorker(isActive)

  const [step, setStep] = useState('live')
  const [cameraError, setCameraError] = useState(null)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 })
  const [detectedPrice, setDetectedPrice] = useState(null)
  const [lowConfidence, setLowConfidence] = useState(false)
  const [pickId, setPickId] = useState(0)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!isActive || step !== 'live' || previewUrl) return

    let cancelled = false

    async function initCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraError('Kameran stöds inte – välj bild från galleri istället.')
        }
        return
      }

      try {
        stopCamera()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraError(null)
      } catch {
        if (!cancelled) {
          setCameraError('Kunde inte starta kameran – välj bild från galleri istället.')
        }
      }
    }

    initCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [isActive, step, previewUrl, stopCamera])

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  const resetFlow = useCallback(() => {
    setError(null)
    setDetectedPrice(null)
    setLowConfidence(false)
    setIsReading(false)
    revokePreview()
    sourceCanvasRef.current = null
    setImageSize({ w: 0, h: 0 })
    setStep('live')
  }, [revokePreview])

  const setCapturedImage = useCallback(
    async (canvas) => {
      stopCamera()
      const stored = await downscaleIfNeeded(canvas)
      sourceCanvasRef.current = stored
      setImageSize({ w: stored.width, h: stored.height })

      revokePreview()
      const url = await canvasToObjectUrl(stored)
      setPreviewUrl(url)
      setStep('pick')
      setError(null)
      setDetectedPrice(null)
      setLowConfidence(false)
    },
    [stopCamera, revokePreview],
  )

  const captureFrameFromVideo = useCallback(async (video) => {
    const track = streamRef.current?.getVideoTracks()[0]

    if (track && 'ImageCapture' in window) {
      try {
        const capture = new ImageCapture(track)
        const bitmap = await capture.grabFrame()
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        canvas.getContext('2d').drawImage(bitmap, 0, 0)
        bitmap.close()
        return canvas
      } catch {
        // Fall back below
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas
  }, [])

  const captureFromVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = await captureFrameFromVideo(video)
    await setCapturedImage(canvas)
  }, [captureFrameFromVideo, setCapturedImage])

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      const canvas = await loadImageSource(file)
      await setCapturedImage(canvas)
    },
    [setCapturedImage],
  )

  const handlePick = useCallback(
    async (point) => {
      const source = sourceCanvasRef.current
      if (!source || isReading) return

      setIsReading(true)
      setError(null)

      try {
        const crop = cropAroundPoint(
          source,
          point.x,
          point.y,
          point.naturalW,
          point.naturalH,
        )
        const { price, confidence } = await readPriceFromCrop(crop)

        setDetectedPrice(price)
        setLowConfidence(confidence < 55 || price == null)
        setPickId((id) => id + 1)
        setStep('confirm')

        if (price == null) {
          setError('Kunde inte läsa priset – skriv in det manuellt nedan.')
        }
      } catch {
        setDetectedPrice(null)
        setLowConfidence(true)
        setPickId((id) => id + 1)
        setStep('confirm')
        setError('Kunde inte läsa priset – skriv in det manuellt nedan.')
      } finally {
        setIsReading(false)
      }
    },
    [isReading, readPriceFromCrop],
  )

  const handleConfirm = (price) => {
    onAdd(price, 'ocr')
    resetFlow()
  }

  const handleRetryPick = () => {
    setStep('pick')
    setDetectedPrice(null)
    setLowConfidence(false)
    setError(null)
  }

  const showLiveCamera = step === 'live' && !previewUrl
  const showPick = step === 'pick' && previewUrl
  const showConfirm = step === 'confirm'

  return (
    <div className="scanner">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="scanner__file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {showLiveCamera && (
        <div className="scanner__viewport" aria-label="Kameravy">
          <video ref={videoRef} playsInline muted autoPlay className="scanner__media" />
          {!ocrReady && (
            <div className="scanner__viewport-overlay">
              <Loader2 className="scanner__spinner" size={24} aria-hidden="true" />
              <span>Förbereder läsare…</span>
            </div>
          )}
        </div>
      )}

      {showPick && (
        <>
          <PricePicker
            imageUrl={previewUrl}
            naturalWidth={imageSize.w}
            naturalHeight={imageSize.h}
            onPick={handlePick}
            disabled={isReading || !ocrReady}
          />
          {isReading && (
            <div className="scanner__reading" role="status">
              <Loader2 className="scanner__spinner" size={24} aria-hidden="true" />
              <span>Läser markerat pris…</span>
            </div>
          )}
        </>
      )}

      {showConfirm && (
        <PriceConfirm
          key={pickId}
          initialPrice={detectedPrice}
          lowConfidence={lowConfidence}
          onConfirm={handleConfirm}
          onRetry={handleRetryPick}
        />
      )}

      {cameraError && step === 'live' && (
        <p className="scanner__hint" role="status">
          {cameraError}
        </p>
      )}

      <div className="scanner__actions">
        {showLiveCamera && (
          <>
            <button
              type="button"
              className="btn btn--camera"
              onClick={captureFromVideo}
              disabled={!ocrReady}
            >
              <Camera size={28} aria-hidden="true" />
              Ta bild på prislapp
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={22} aria-hidden="true" />
              Välj från galleri
            </button>
          </>
        )}

        {(showPick || showConfirm) && (
          <button type="button" className="btn btn--secondary" onClick={resetFlow}>
            <Camera size={22} aria-hidden="true" />
            Ta ny bild
          </button>
        )}
      </div>

      {error && (
        <p className="scanner__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
