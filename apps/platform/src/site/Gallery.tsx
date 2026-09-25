'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

export type GalleryPhoto = { src: string; full: string; alt: string; srcset?: string; sizes?: string; w?: number; h?: number }
type Labels = { close: string; previous: string; next: string }

/* eslint-disable @next/next/no-img-element */
/**
 * Photo grid with a lightbox: each photo is a plain link to its full-size file (works without
 * JavaScript); with it, the link opens a native <dialog> (focus-trapped, Esc closes) showing the
 * photo fitted to the screen with its description; arrow keys and swipe move between photos.
 * No library; the grid itself is CSS (templates restyle `.hh-gallery`).
 */
export function Gallery({ photos, labels }: { photos: GalleryPhoto[]; labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)
  const touchX = useRef<number | null>(null)
  const n = photos.length
  const show = useCallback((k: number) => setI(((k % n) + n) % n), [n])
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const current = photos[i]
  return (
    <>
      <div className="hh-gallery">
        {photos.map((ph, k) => (
          <figure key={k}>
            <a
              className="hh-gallery-link"
              href={ph.full}
              onClick={(e) => {
                e.preventDefault()
                show(k)
                setOpen(true)
              }}
            >
              <img src={ph.src} alt={ph.alt} loading="lazy" decoding="async" srcSet={ph.srcset} sizes={ph.sizes} width={ph.w} height={ph.h} />
            </a>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="hh-lightbox"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') show(i + 1)
          if (e.key === 'ArrowLeft') show(i - 1)
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (dx > 40) show(i - 1)
          else if (dx < -40) show(i + 1)
        }}
      >
        <button className="hh-lb-close" type="button" aria-label={labels.close} onClick={() => setOpen(false)}>
          ×
        </button>
        {n > 1 && (
          <button className="hh-lb-prev" type="button" aria-label={labels.previous} onClick={() => show(i - 1)}>
            ‹
          </button>
        )}
        <figure>
          {open && current ? <img src={current.full} alt={current.alt} /> : null}
          <figcaption>{open && current ? current.alt : ''}</figcaption>
        </figure>
        {n > 1 && (
          <button className="hh-lb-next" type="button" aria-label={labels.next} onClick={() => show(i + 1)}>
            ›
          </button>
        )}
      </dialog>
    </>
  )
}
