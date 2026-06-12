import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { extractNumbersFromText, formatNumberButton } from '../utils/extractNumbers'

export default function CameraScanner({ onAdd }) {
  const fileInputRef = useRef(null)
  const workerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const getWorker = async () => {
    if (workerRef.current) return workerRef.current

    const worker = await createWorker('swe+eng', 1, {
      logger: () => {},
    })
    workerRef.current = worker
    return worker
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setCandidates([])
    setIsScanning(true)

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const worker = await getWorker()
      const { data } = await worker.recognize(file)
      const numbers = extractNumbersFromText(data.text)

      if (numbers.length === 0) {
        setError('Hittade inga siffror – försök ta en tydligare bild av prislappen.')
      } else {
        setCandidates(numbers)
      }
    } catch {
      setError('Kunde inte läsa bilden. Försök igen eller använd manuell inmatning.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSelectPrice = (price) => {
    onAdd(price, 'ocr')
    setCandidates([])
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleReset = () => {
    setCandidates([])
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="scanner">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="scanner__file-input"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        type="button"
        className="btn btn--camera"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        <Camera size={28} aria-hidden="true" />
        Ta bild på prislapp
      </button>

      {isScanning && (
        <div className="scanner__loading" role="status" aria-live="polite">
          <Loader2 className="scanner__spinner" size={32} aria-hidden="true" />
          <span>Läser prislapp…</span>
        </div>
      )}

      {previewUrl && !isScanning && (
        <div className="scanner__preview">
          <img src={previewUrl} alt="Förhandsgranskning av prislapp" />
        </div>
      )}

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
          <button type="button" className="btn btn--text" onClick={handleReset}>
            Ta ny bild
          </button>
        </div>
      )}
    </div>
  )
}
