# Deploying to Cloudflare Pages

The interactive book is a static Docusaurus site with one keyless Pages Function.

## Build settings (Cloudflare Pages dashboard)

- **Framework preset:** None / Docusaurus
- **Build command:** `pnpm install && pnpm build`
- **Build output directory:** `interactive-book/build`
- **Root directory:** repository root (the build command `cd`s as needed) or `interactive-book` if configured per-package.

## Functions

`functions/api/score.ts` is auto-deployed as the `/api/score` route. It is a
**keyless** CORS pass-through: it forwards the visitor's own `Authorization`
header and request body to the provider URL in the `X-Target` header and stores
nothing.

## Secrets / environment

**None.** Do not add any API key, KV namespace, or environment variable. Access
is bring-your-own-key: each visitor enters their own OpenAI-compatible key in the
practice page, stored only in their browser's `localStorage`.

## Local preview of the Function

```bash
cd interactive-book && pnpm build && npx wrangler pages dev build
```
