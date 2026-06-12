import { useCallback, useEffect, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import { extractBestPrice } from '../utils/extractNumbers'
import { prepareCropForOcr } from '../utils/prepareImageForOcr'

export function useOcrWorker(isActive) {
  const workerRef = useRef(null)
  const initPromiseRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    const init = async () => {
      if (workerRef.current) {
        setReady(true)
        return
      }

      if (initPromiseRef.current) {
        await initPromiseRef.current
        if (!cancelled) setReady(true)
        return
      }

      initPromiseRef.current = (async () => {
        const worker = await createWorker('eng', 1, { logger: () => {} })
        await worker.setParameters({
          tessedit_pageseg_mode: '7',
          tessedit_char_whitelist: '0123456789krKR:,.- SEK',
        })
        workerRef.current = worker
      })()

      await initPromiseRef.current
      if (!cancelled) setReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      initPromiseRef.current = null
    }
  }, [])

  const readPriceFromCrop = useCallback(async (cropCanvas) => {
    if (!workerRef.current) {
      if (!initPromiseRef.current) {
        throw new Error('OCR inte redo')
      }
      await initPromiseRef.current
    }

    const prepared = prepareCropForOcr(cropCanvas)
    const { data } = await workerRef.current.recognize(prepared)
    const price = extractBestPrice(data.text)

    return {
      price,
      rawText: data.text.trim(),
      confidence: data.confidence,
    }
  }, [])

  return { readPriceFromCrop, ready }
}
