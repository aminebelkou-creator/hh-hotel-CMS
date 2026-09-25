'use client'
import React, { useEffect } from 'react'

/**
 * Shrinks photos in the browser before they are uploaded. The platform's functions accept
 * request bodies up to 6 MB (EdgeOne Makers), and phone photos are often 8–12 MB. Any image
 * over MAX_BYTES or MAX_SIDE px is re-encoded to at most MAX_SIDE px on its long side; the
 * server then makes the WebP sizes as usual. Anything that fails to decode is left untouched.
 */
const MAX_BYTES = 4 * 1024 * 1024
const MAX_SIDE = 2400
const MARK = '__hhShrunk'

async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const long = Math.max(bitmap.width, bitmap.height)
  if (file.size <= MAX_BYTES && long <= MAX_SIDE) {
    bitmap.close()
    return file
  }
  const scale = Math.min(1, MAX_SIDE / long)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  let quality = 0.86
  let blob: Blob | null = null
  for (let i = 0; i < 4; i++) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (!blob || blob.size <= MAX_BYTES) break
    quality -= 0.12
  }
  if (!blob) return file
  const name = file.name.replace(/\.(png|webp|jpeg|jpg)$/i, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })
}

export function UploadShrinker({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const onChange = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.length) return
      if ((e as Event & { [MARK]?: boolean })[MARK]) return
      const files = [...input.files]
      if (!files.some((f) => /^image\//.test(f.type) && f.size > MAX_BYTES)) {
        // Small files pass through untouched, but still check dimensions cheaply later on the server.
        return
      }
      e.stopImmediatePropagation()
      e.preventDefault()
      void Promise.all(files.map(shrink)).then((out) => {
        const dt = new DataTransfer()
        out.forEach((f) => dt.items.add(f))
        input.files = dt.files
        const again = new Event('change', { bubbles: true }) as Event & { [MARK]?: boolean }
        again[MARK] = true
        input.dispatchEvent(again)
      })
    }
    const onDrop = (e: DragEvent) => {
      const files = [...(e.dataTransfer?.files ?? [])]
      if (!files.length || (e as DragEvent & { [MARK]?: boolean })[MARK]) return
      if (!files.some((f) => /^image\//.test(f.type) && f.size > MAX_BYTES)) return
      e.stopImmediatePropagation()
      e.preventDefault()
      const target = e.target as Element
      void Promise.all(files.map(shrink)).then((out) => {
        const dt = new DataTransfer()
        out.forEach((f) => dt.items.add(f))
        const again = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }) as DragEvent & { [MARK]?: boolean }
        again[MARK] = true
        target.dispatchEvent(again)
      })
    }
    document.addEventListener('change', onChange, true)
    document.addEventListener('drop', onDrop, true)
    return () => {
      document.removeEventListener('change', onChange, true)
      document.removeEventListener('drop', onDrop, true)
    }
  }, [])
  return <>{children}</>
}
