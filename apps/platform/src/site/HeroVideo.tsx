'use client'
import React, { useEffect, useRef, useState } from 'react'

type Labels = { pauseVideo: string; playVideo: string }

/**
 * A silent looping video over the hero photo. The photo stays the first paint (fast, and what
 * search engines and slow phones see); the video is fetched only after the page has loaded,
 * never with reduced motion or data saver on, in a portrait cut on phones, and fades in once
 * it plays. A pause button is shown while it plays (WCAG 2.2.2: moving content can be stopped).
 */
export function HeroVideo({ src, mobileSrc, labels }: { src: string; mobileSrc?: string | null; labels: Labels }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (reduce || saveData) return
    const start = () => {
      const portrait = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches
      v.src = portrait && mobileSrc ? mobileSrc : src
      v.muted = true
      void v.play().catch(() => {})
    }
    if (document.readyState === 'complete') start()
    else {
      window.addEventListener('load', start, { once: true })
      return () => window.removeEventListener('load', start)
    }
  }, [src, mobileSrc])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  return (
    <>
      <video
        ref={ref}
        className={playing ? 'hh-hero-video is-playing' : 'hh-hero-video'}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
      />
      {playing && (
        <button type="button" className="hh-hero-video-toggle" onClick={toggle} aria-label={paused ? labels.playVideo : labels.pauseVideo} aria-pressed={paused}>
          <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
        </button>
      )}
    </>
  )
}
