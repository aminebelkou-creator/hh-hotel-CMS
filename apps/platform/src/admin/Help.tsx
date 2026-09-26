import React from 'react'
import { HelpBox } from './ui'

/** Help at the top of Website settings. */
export function SiteHelp() {
  return (
    <HelpBox title="How website settings work">
      <ul>
        <li>
          <strong>Hotel</strong>: the name, tagline and languages of your website.
        </li>
        <li>
          <strong>Look</strong>: the design. Your texts and photos stay the same whatever you choose.
        </li>
        <li>
          <strong>Booking</strong>: where the Book buttons go. Add your booking engine once; every button uses it.
        </li>
        <li>
          <strong>Side panel</strong>: publish the website, undo the last publish, import facts from your current site, get a suggested look or a draft blog post.
        </li>
      </ul>
      <p>Press Save to keep your changes, then Publish site to put them online. Texts marked with a language (— fr, — en) are written once per language: switch language at the top right.</p>
    </HelpBox>
  )
}

/** Help at the top of a page. */
export function PageHelp() {
  return (
    <HelpBox title="How to edit a page">
      <ol>
        <li>A page is a stack of sections (“blocks”): a big photo at the top, text and photo, rooms, reviews, a Book band… Open a block to change its words or photo.</li>
        <li>
          <strong>Add a block</strong> at the bottom; drag the ⋮⋮ handle to change the order; use the … menu to copy or remove one.
        </li>
        <li>Write each language separately: switch language at the top right. A block left empty in a language shows the main language.</li>
        <li>
          <strong>Publish changes</strong> saves this page; then <strong>Publish site</strong> (side panel) puts it online. Use the preview button (square with an arrow) to see it first.
        </li>
      </ol>
      <p>Links: write a page’s short name (contact), “book” for your booking engine, a full address, tel:+33… or mailto:…</p>
    </HelpBox>
  )
}

/** Help above a room type. */
export function RoomHelp() {
  return (
    <HelpBox title="About room types">
      <p>One entry per category of room (e.g. Superior, Comfort), not per room number. The Rooms page lists them in this order with their photos; each gets a Book button to your booking engine. Prices and availability stay in your booking engine.</p>
    </HelpBox>
  )
}

/** Help above a blog post. */
export function PostHelp() {
  return (
    <HelpBox title="Writing a post">
      <p>Separate paragraphs with an empty line. Start a line with “## ” for a subheading and “- ” for a list. A post appears on the site once its status is Published and the site is published again. Posts suggested from your facts start as drafts marked “generated”; your first edit makes them yours.</p>
    </HelpBox>
  )
}

/** Help above a guest review. */
export function ReviewHelp() {
  return (
    <HelpBox title="Adding a guest review">
      <p>Copy the guest’s words exactly, in their language: never translate or improve them. Give the first name and initial only, the site it comes from and, if you can, its link. Only published reviews appear, on the pages that have a Reviews block.</p>
    </HelpBox>
  )
}
