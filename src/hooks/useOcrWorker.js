import { useCallback, useEffect, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import { prepareImageForOcr } from '../utils/prepareImageForOcr'

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
        const worker = await createWorker('swe', 1, { logger: () => {} })
        await worker.setParameters({
          tessedit_pageseg_mode: '6',
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

  const recognize = useCallback(async (imageSource) => {
    if (!workerRef.current) {
      if (!initPromiseRef.current) {
        throw new Error('OCR inte redo')
      }
      await initPromiseRef.current
    }

    const canvas = await prepareImageForOcr(imageSource)
    return workerRef.current.recognize(canvas)
  }, [])

  return { recognize, ready }
}
