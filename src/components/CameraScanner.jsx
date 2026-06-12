import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { useOcrWorker } from '../hooks/useOcrWorker'
import { canvasToObjectUrl } from '../utils/prepareImageForOcr'
import { extractNumbersFromText, formatNumberButton } from '../utils/extractNumbers'

export default function CameraScanner({ onAdd, isActive }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const { recognize, ready: ocrReady } = useOcrWorker(isActive)

  const [cameraMode, setCameraMode] = useState('live')
  const [cameraError, setCameraError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!isActive || cameraMode !== 'live' || previewUrl) return

    let cancelled = false

    async function initCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraError('Kameran stöds inte – välj bild från galleri istället.')
          setCameraMode('fallback')
        }
        return
      }

      try {
        stopCamera()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 960 },
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
          setCameraMode('fallback')
        }
      }
    }

    initCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [isActive, cameraMode, previewUrl, stopCamera])

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  const runOcr = useCallback(
    async (imageSource) => {
      setError(null)
      setCandidates([])
      setIsScanning(true)

      try {
        const { data } = await recognize(imageSource)
        const numbers = extractNumbersFromText(data.text)

        if (numbers.length === 0) {
          setError('Hittade inga siffror – försök igen med tydligare bild av prislappen.')
        } else {
          setCandidates(numbers)
        }
      } catch {
        setError('Kunde inte läsa bilden. Försök igen eller använd manuell inmatning.')
      } finally {
        setIsScanning(false)
      }
    },
    [recognize],
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
        // Fall back to canvas capture below
      }
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise((resolve) => {
        video.addEventListener('loadeddata', resolve, { once: true })
      })
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
    stopCamera()

    revokePreview()
    const url = await canvasToObjectUrl(canvas)
    setPreviewUrl(url)
    setCameraMode('preview')

    await runOcr(canvas)
  }, [captureFrameFromVideo, stopCamera, revokePreview, runOcr])

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      stopCamera()
      setCameraMode('preview')

      revokePreview()
      setPreviewUrl(URL.createObjectURL(file))

      await runOcr(file)
    },
    [stopCamera, revokePreview, runOcr],
  )

  const handleSelectPrice = (price) => {
    onAdd(price, 'ocr')
    setCandidates([])
    setError(null)
    revokePreview()
    setCameraMode('live')
  }

  const handleReset = () => {
    setCandidates([])
    setError(null)
    revokePreview()
    setCameraMode('live')
  }

  const showLiveCamera = cameraMode === 'live' && !previewUrl
  const showPreview = Boolean(previewUrl)

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
        <div className="scanner__viewport" aria-label="Kameravy – det här skannas">
          <video ref={videoRef} playsInline muted autoPlay className="scanner__media" />
          {!ocrReady && (
            <div className="scanner__viewport-overlay">
              <Loader2 className="scanner__spinner" size={24} aria-hidden="true" />
              <span>Förbereder läsare…</span>
            </div>
          )}
        </div>
      )}

      {showPreview && (
        <div className="scanner__viewport scanner__viewport--preview" aria-label="Skannad bild">
          <img src={previewUrl} alt="Bild som skannas" className="scanner__media" />
          {isScanning && (
            <div className="scanner__viewport-overlay">
              <Loader2 className="scanner__spinner" size={32} aria-hidden="true" />
              <span>Läser prislapp…</span>
            </div>
          )}
        </div>
      )}

      {cameraError && (
        <p className="scanner__hint" role="status">
          {cameraError}
        </p>
      )}

      <div className="scanner__actions">
        {showLiveCamera && (
          <button
            type="button"
            className="btn btn--camera"
            onClick={captureFromVideo}
            disabled={isScanning || !ocrReady}
          >
            <Camera size={28} aria-hidden="true" />
            Ta bild på prislapp
          </button>
        )}

        {showLiveCamera && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
          >
            <ImagePlus size={22} aria-hidden="true" />
            Välj från galleri
          </button>
        )}

        {showPreview && !isScanning && (
          <button type="button" className="btn btn--secondary" onClick={handleReset}>
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

      {candidates.length > 0 && (
        <div className="scanner__candidates">
          <p className="scanner__candidates-label">Välj rätt pris:</p>
          <div className="scanner__candidates-grid">
            {candidates.map((num) => (
              <button
                key={num}
                type="button"
                className="btn btn--price-candidate"
                onClick={() => handleSelectPrice(num)}
              >
                {formatNumberButton(num)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
