import React from 'react'
import { pick, type Localized } from '../types'

type Props = {
  block: { heading?: Localized<string>; showTimes?: boolean | null; items?: { title: Localized<string>; text: Localized<string> }[] }
  locale: string
  defaultLocale: string
  checkIn?: string
  checkOut?: string
}

const T = { fr: { checkIn: 'Arrivée', checkOut: 'Départ', from: 'à partir de', by: 'avant' }, en: { checkIn: 'Check-in', checkOut: 'Check-out', from: 'from', by: 'by' } }

/** Hotel policies: times from confirmed facts, then the hotel's own rules. */
export function PoliciesBlock({ block, locale, defaultLocale, checkIn, checkOut }: Props) {
  const p = <V,>(v: Localized<V> | null | undefined) => pick(v, locale, defaultLocale)
  const t = locale === 'fr' ? T.fr : T.en
  const rows: { title: string; text: string }[] = []
  if (block.showTimes !== false && checkIn) rows.push({ title: t.checkIn, text: `${t.from} ${checkIn}` })
  if (block.showTimes !== false && checkOut) rows.push({ title: t.checkOut, text: `${t.by} ${checkOut}` })
  for (const it of block.items ?? []) rows.push({ title: p(it.title) ?? '', text: p(it.text) ?? '' })
  if (!rows.length) return null
  return (
    <section className="hh-section">
      <div className="hh-wrap">
        {p(block.heading) && <h2 className="hh-section-title">{p(block.heading)}</h2>}
        <dl className="hh-policies">
          {rows.map((r, i) => (
            <div key={i}>
              <dt>{r.title}</dt>
              <dd>{r.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
