import { useRef, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { getTapOnImage } from '../utils/imageCoords'

export default function PricePicker({ imageUrl, naturalWidth, naturalHeight, onPick, disabled }) {
  const imgRef = useRef(null)
  const [marker, setMarker] = useState(null)

  const handlePointer = (event) => {
    if (disabled || !imgRef.current) return

    const point = getTapOnImage(imgRef.current, event.clientX, event.clientY)
    if (!point) return

    setMarker({ x: point.displayX, y: point.displayY })
    onPick(point)
  }

  return (
    <div className="price-picker">
      <p className="price-picker__hint">
        <Crosshair size={18} aria-hidden="true" />
        Tryck direkt på priset i bilden
      </p>

      <button
        type="button"
        className="price-picker__frame"
        onClick={handlePointer}
        disabled={disabled}
        aria-label="Tryck på priset i bilden"
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Fångad bild – tryck på priset"
          className="price-picker__image"
          width={naturalWidth}
          height={naturalHeight}
        />
        {marker && (
          <span
            className="price-picker__marker"
            style={{ left: `${marker.x}px`, top: `${marker.y}px` }}
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}
