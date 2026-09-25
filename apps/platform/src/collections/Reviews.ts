import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

export const REVIEW_SOURCES = ['google', 'booking', 'tripadvisor', 'expedia', 'direct', 'other'] as const

/**
 * Review: a real guest's words, typed in by the hotel exactly as the guest wrote them (rule 9:
 * the platform never writes, edits or translates a review). Shown by the `reviews` block.
 * Deliberately no schema.org Review/AggregateRating markup: search engines treat reviews a
 * business publishes about itself as self-serving and ignore or penalise them.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Guest review', plural: 'Guest reviews' },
  admin: {
    useAsTitle: 'author',
    group: 'Website',
    defaultColumns: ['author', 'source', 'rating', 'visitedAt', 'status'],
    description: 'Real reviews only, copied word for word from the guest (Google, Booking, TripAdvisor, a letter…). Shown once Published and the site is published again.',
  },
  defaultSort: 'order',
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: { description: 'Exactly as the guest wrote it, in their language. Shortening is fine with "…"; rewording is not.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'language', type: 'select', required: true, defaultValue: 'fr', options: ['fr', 'en', 'de', 'es', 'it', 'nl', 'pt', 'other'], admin: { description: 'Language of the text' } },
        { name: 'author', type: 'text', required: true, admin: { description: 'As shown on the review, e.g. "Marie L." — never a full surname without consent' } },
        { name: 'origin', type: 'text', admin: { description: 'Optional, e.g. "Lyon" or "Canada"' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'source', type: 'select', required: true, defaultValue: 'google', options: [...REVIEW_SOURCES] },
        { name: 'sourceUrl', type: 'text', admin: { description: 'Link to the review, when public' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'rating', type: 'number', min: 0, admin: { description: 'The score as given, e.g. 5 or 9.2 (optional)' } },
        { name: 'ratingScale', type: 'number', defaultValue: 5, admin: { description: '5 for Google/TripAdvisor, 10 for Booking' } },
        { name: 'visitedAt', type: 'date', admin: { description: 'Month of the review', date: { pickerAppearance: 'monthOnly', displayFormat: 'MMMM yyyy' } } },
      ],
    },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower first' } },
  ],
}
