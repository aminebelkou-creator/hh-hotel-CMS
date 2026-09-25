'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Labels = { close: string; previous: string; next: string }
type Photo = { full: string; alt: string }

/* eslint-disable @next/next/no-img-element */
/**
 * One photo viewer for the whole page. Any `<a data-lightbox="group" href="full.webp"><img alt></a>`
 * rendered by a block (gallery, text-and-image, room photos and thumbnails) opens here instead of
 * navigating; photos sharing a group value are browsed together (arrows, swipe). Without
 * JavaScript the link simply opens the full-size file. The large file is fetched only when the
 * viewer opens, so marking a photo as viewable costs nothing at page load.
 */
export function Lightbox({ labels }: { labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)
  const touchX = useRef<number | null>(null)
  const n = photos.length
  const show = useCallback((k: number) => setI(((k % n) + n) % n), [n])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[data-lightbox]') as HTMLAnchorElement | null
      if (!a) return
      const group = a.dataset.lightbox ?? ''
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')).filter((l) => l.dataset.lightbox === group)
      e.preventDefault()
      setPhotos(links.map((l) => ({ full: l.href, alt: l.querySelector('img')?.alt ?? '' })))
      setI(Math.max(0, links.indexOf(a)))
      setOpen(true)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const current = photos[i]
  return (
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
      <button className="hh-lb-prev" type="button" aria-label={labels.previous} hidden={n < 2} onClick={() => show(i - 1)}>
        ‹
      </button>
      <figure>
        {open && current ? <img src={current.full} alt={current.alt} /> : null}
        <figcaption>{open && current ? current.alt : ''}</figcaption>
      </figure>
      <button className="hh-lb-next" type="button" aria-label={labels.next} hidden={n < 2} onClick={() => show(i + 1)}>
        ›
      </button>
    </dialog>
  )
}
