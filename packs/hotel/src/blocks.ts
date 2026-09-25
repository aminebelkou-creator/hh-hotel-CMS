import type { Block, Field } from 'payload'

/** Same shape as the core's provenance group (rule 7); generation writes these blocks too. */
const provenance: Field = {
  name: 'provenance',
  type: 'group',
  admin: { description: 'Who last shaped this content. Regeneration never overwrites human edits.' },
  fields: [
    { name: 'origin', type: 'select', defaultValue: 'human', options: ['generated', 'human', 'locked'] },
    { name: 'sourceFact', type: 'text' },
  ],
}

/** Page block: the hotel's room types as cards. Empty `limit` shows all of them. */
export const roomsBlock: Block = {
  slug: 'rooms',
  // Distinct type names: the `rooms` collection already owns "Room"/"Rooms" in GraphQL and TypeScript.
  interfaceName: 'RoomsBlock',
  graphQL: { singularName: 'RoomsBlock' },
  labels: { singular: 'Rooms', plural: 'Rooms' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    { name: 'limit', type: 'number', min: 1 },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'cards',
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Detailed', value: 'detailed' },
      ],
    },
    provenance,
  ],
}

/** Page block: current offers (active and within their dates when the page is served). */
export const offersBlock: Block = {
  slug: 'offers',
  interfaceName: 'OffersBlock',
  graphQL: { singularName: 'OffersBlock' },
  labels: { singular: 'Offers', plural: 'Offers' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    { name: 'limit', type: 'number', min: 1 },
    provenance,
  ],
}

/** Page block: hotel policies. Check-in and check-out times come from confirmed facts. */
export const policiesBlock: Block = {
  slug: 'policies',
  interfaceName: 'PoliciesBlock',
  graphQL: { singularName: 'PoliciesBlock' },
  labels: { singular: 'Hotel policies', plural: 'Hotel policies' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'showTimes', type: 'checkbox', defaultValue: true, admin: { description: 'Show check-in and check-out times from the fact base' } },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'text', type: 'textarea', required: true, localized: true },
      ],
    },
    provenance,
  ],
}

export const hotelBlocks: Block[] = [roomsBlock, offersBlock, policiesBlock]
