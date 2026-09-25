import React from 'react'

/**
 * A small built-in line-icon set for feature items (design contract §5). Drawn in the
 * Lucide style (24-box, 1.5 stroke, currentColor) from our own paths, so every site may
 * use them; rendered inline, aria-hidden. Add an id here and in ICON_IDS to extend the set.
 */
export const ICON_IDS = ['clock', 'phone', 'coffee', 'tablet', 'wifi', 'paw', 'bed', 'user', 'key', 'car', 'lift', 'leaf', 'star', 'pin', 'sun', 'shield', 'sparkle', 'utensils', 'bath', 'snowflake'] as const
export type IconId = (typeof ICON_IDS)[number]

const PATHS: Record<IconId, string> = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  coffee: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>',
  tablet: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>',
  wifi: '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5 12a10 10 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/>',
  paw: '<circle cx="5" cy="10" r="1.8"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="19" cy="10" r="1.8"/><path d="M12 12c-3 0-5 3-5 5.5 0 1.5 1.2 2.5 2.7 2.5 1 0 1.5-.5 2.3-.5s1.3.5 2.3.5c1.5 0 2.7-1 2.7-2.5C17 15 15 12 12 12z"/>',
  bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 15h18"/><path d="M6 9V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V9"/><path d="M3 18v2M21 18v2"/>',
  user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6.5 6.5 0 0 1 11 0"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M16 5l3 3M18 3l3 3"/>',
  car: '<path d="M5 17h14"/><path d="M3 12l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v5H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  lift: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18"/><path d="M8 11l0-3M8 8l-1.5 1.5M8 8l1.5 1.5"/><path d="M16 13v3M16 16l-1.5-1.5M16 16l1.5-1.5"/>',
  leaf: '<path d="M4 20c0-8 4-14 16-16 0 10-4 16-12 16"/><path d="M4 20c4-6 8-9 12-11"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  utensils: '<path d="M6 3v8a2 2 0 0 0 2 2v8M8 3v6"/><path d="M10 3v8"/><path d="M17 3c-2 0-3 3-3 6v3h3v9"/>',
  bath: '<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 20v1M17 20v1"/>',
  snowflake: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>',
}

export const isIconId = (v: unknown): v is IconId => typeof v === 'string' && (ICON_IDS as readonly string[]).includes(v)

export function Icon({ id }: { id: IconId }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: PATHS[id] }} />
  )
}
