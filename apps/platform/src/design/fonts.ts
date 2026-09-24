import localFont from 'next/font/local'

/**
 * Self-hosted fonts (SIL Open Font License, files and licences in ./fonts, from Fontsource
 * 5.3.0, Latin subset: covers French, English, German, Spanish and Italian). Served from our
 * own domain: no request to Google or any font CDN. Declared for every template; browsers
 * download only the families a page actually uses.
 */
export const inter = localFont({
  src: [
    { path: './fonts/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/inter-latin-wght-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--hh-f-inter',
  display: 'swap',
  preload: false,
})

export const manrope = localFont({
  src: [{ path: './fonts/manrope-latin-wght-normal.woff2', weight: '200 800', style: 'normal' }],
  variable: '--hh-f-manrope',
  display: 'swap',
  preload: false,
})

export const playfair = localFont({
  src: [
    { path: './fonts/playfair-display-latin-wght-normal.woff2', weight: '400 900', style: 'normal' },
    { path: './fonts/playfair-display-latin-wght-italic.woff2', weight: '400 900', style: 'italic' },
  ],
  variable: '--hh-f-playfair',
  display: 'swap',
  preload: false,
})

export const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin-wght-normal.woff2', weight: '300 700', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-wght-italic.woff2', weight: '300 700', style: 'italic' },
  ],
  variable: '--hh-f-cormorant',
  display: 'swap',
  preload: false,
})

export const fontVariables = [inter.variable, manrope.variable, playfair.variable, cormorant.variable].join(' ')
