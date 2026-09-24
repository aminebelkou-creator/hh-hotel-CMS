import type { Block } from 'payload'

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
  ],
}

export const hotelBlocks: Block[] = [roomsBlock]
