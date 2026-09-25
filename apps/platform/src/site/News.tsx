import React from 'react'
import { pick, type SiteSnapshot, type SnapshotPage, type SnapshotPost } from '@/releases/snapshot'
import { pageHref } from './routing'
import type { Labels } from './i18n'
import { Img, fullSizeOf } from './Img'
import { Lightbox } from './Lightbox'

/**
 * The blog: posts live under the page whose news block lists them all (its slug is the blog's
 * address, e.g. /blog/<post>). Without such a page, cards still show but link nowhere.
 */
export const blogPageOf = (s: SiteSnapshot): SnapshotPage | undefined =>
  s.pages.find((p) => p.blocks.some((b) => b.blockType === 'news' && b.layout === 'list'))

export const postPath = (s: SiteSnapshot, post: SnapshotPost) => {
  const blog = blogPageOf(s)
  return blog ? `${blog.slug}/${post.slug}` : null
}

/** A path "<blog>/<post>" to its post, or null. */
export function findPost(s: SiteSnapshot, slug: string): { blog: SnapshotPage; post: SnapshotPost } | null {
  const i = slug.indexOf('/')
  if (i < 1) return null
  const blog = blogPageOf(s)
  if (!blog || slug.slice(0, i) !== blog.slug) return null
  const post = (s.posts ?? []).find((p) => p.slug === slug.slice(i + 1))
  return post ? { blog, post } : null
}

export function formatDate(iso: string, locale: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
}

/** Post text: blank lines separate paragraphs, "## " starts a subheading, "- " lines make a list. */
export function PostBody({ text }: { text: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return (
    <>
      {parts.map((para, k) => {
        if (para.startsWith('## ')) return <h2 key={k}>{para.slice(3)}</h2>
        const lines = para.split('\n')
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={k}>
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={k}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </>
  )
}

type Ctx = { snapshot: SiteSnapshot; locale: string; t: Labels }

/** Post cards: photo, date, title (the one link, stretched over the card), excerpt. */
export function PostCards({ posts, ctx, headingLevel = 'h3' }: { posts: SnapshotPost[]; ctx: Ctx; headingLevel?: 'h2' | 'h3' }) {
  const { snapshot, locale } = ctx
  const d = snapshot.site.defaultLocale
  const H = headingLevel
  return (
    <ul className="hh-news-grid">
      {posts.map((post) => {
        const path = postPath(snapshot, post)
        const href = path ? pageHref(snapshot, locale, path) : null
        const title = pick(post.title, locale, d) ?? ''
        return (
          <li key={post.id} className="hh-news-card">
            {post.imageUrl && (
              <div className="hh-news-media">
                <Img snapshot={snapshot} src={post.imageUrl} alt="" sizes="card" />
              </div>
            )}
            <div className="hh-news-body">
              <p className="hh-news-date">
                <time dateTime={post.publishedAt.slice(0, 10)}>{formatDate(post.publishedAt, locale)}</time>
              </p>
              <H className="hh-news-title">{href ? <a className="hh-news-link" href={href}>{title}</a> : title}</H>
              {pick(post.excerpt, locale, d) && <p className="hh-news-excerpt">{pick(post.excerpt, locale, d)}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** The news block: the latest few posts, or every post on the blog page. Hidden while there is none. */
export function NewsBlock({ block, ctx, headingLevel }: { block: Record<string, unknown>; ctx: Ctx; headingLevel: 'h1' | 'h2' }) {
  const { snapshot, locale } = ctx
  const d = snapshot.site.defaultLocale
  const p = (v: unknown) => pick(v as never, locale, d) as string | undefined
  const all = snapshot.posts ?? []
  const list = block.layout === 'list'
  if (!all.length && !list) return null
  const posts = list ? all : all.slice(0, Number(block.limit) || 3)
  const Heading = headingLevel
  const link = typeof block.linkHref === 'string' && block.linkHref ? pageHref(snapshot, locale, block.linkHref.replace(/^\/+|\/+$/g, '') || 'home') : null
  const head = (
    <>
      {p(block.heading) && <Heading className="hh-section-title">{p(block.heading)}</Heading>}
      {p(block.intro) && <p className="hh-lead">{p(block.intro)}</p>}
    </>
  )
  return (
    <section className="hh-section hh-news">
      <div className="hh-wrap">
        {link && p(block.linkLabel) ? (
          <div className="hh-section-head hh-section-head--split">
            <div>{head}</div>
            <a className="hh-link-arrow" href={link}>
              {p(block.linkLabel)}
            </a>
          </div>
        ) : (
          head
        )}
        {posts.length > 0 && <PostCards posts={posts} ctx={ctx} headingLevel={headingLevel === 'h1' ? 'h2' : 'h3'} />}
      </div>
    </section>
  )
}

/** One post's page: back link, title, date, cover (opens in the lightbox), text, then more posts. */
export function PostView({ blog, post, ctx }: { blog: SnapshotPage; post: SnapshotPost; ctx: Ctx }) {
  const { snapshot, locale, t } = ctx
  const d = snapshot.site.defaultLocale
  const others = (snapshot.posts ?? []).filter((x) => x.id !== post.id).slice(0, 3)
  return (
    <>
      <article className="hh-post">
        <header className="hh-wrap hh-post-head">
          <p className="hh-post-back">
            <a href={pageHref(snapshot, locale, blog.slug)}>{t.backToBlog}</a>
          </p>
          <h1>{pick(post.title, locale, d)}</h1>
          <p className="hh-news-date">
            <time dateTime={post.publishedAt.slice(0, 10)}>{formatDate(post.publishedAt, locale)}</time>
          </p>
          {pick(post.excerpt, locale, d) && <p className="hh-lead">{pick(post.excerpt, locale, d)}</p>}
        </header>
        {post.imageUrl && (
          <figure className="hh-wrap hh-post-cover">
            <a className="hh-photo-link" href={fullSizeOf(snapshot, post.imageUrl)} data-lightbox="post">
              <Img snapshot={snapshot} src={post.imageUrl} alt={pick(post.imageAlt ?? undefined, locale, d) ?? ''} sizes="full" eager />
            </a>
          </figure>
        )}
        <div className="hh-wrap hh-prose hh-post-body">
          <PostBody text={pick(post.body, locale, d) ?? ''} />
        </div>
      </article>
      {others.length > 0 && (
        <section className="hh-section hh-news">
          <div className="hh-wrap">
            <h2 className="hh-section-title">{t.morePosts}</h2>
            <PostCards posts={others} ctx={ctx} />
          </div>
        </section>
      )}
      <Lightbox labels={{ close: t.close, previous: t.previous, next: t.next }} />
    </>
  )
}
