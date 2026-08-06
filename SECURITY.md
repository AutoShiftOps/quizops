# Security

## Dependency vulnerability status

Last audited: 2026-08-06, via `npm audit` against the npm registry advisory
database.

### Summary

`npm audit` reports **5 high-severity vulnerabilities**, all rooted in three
packages, all requiring a Next.js major-version upgrade (14 → 16) to fully
resolve. `npm audit fix` (non-breaking) found nothing it could change —
every available patch is a breaking change and requires
`npm audit fix --force`.

> Note: GitHub's Dependabot tab on this repo currently shows a different
> count (11 high / 13 moderate / 2 low = 26 alerts). That's Dependabot's own
> advisory sync, which tracks alert history (including alerts on paths no
> longer installed) differently from a fresh local `npm audit` run. This
> document reflects what `npm audit` reports right now against the
> lockfile actually in use; if you want the two reconciled 1:1, cross-check
> the Dependabot tab directly.

### Remaining vulnerabilities (require manual review)

| Package | Severity | Direct/Transitive | Fix available |
|---|---|---|---|
| `next` | High | Direct (`package.json` — pinned `14.2.35`) | Yes, but only via `next@16.3.0` (breaking) |
| `eslint-config-next` | High (via transitive `glob`) | Direct devDependency (`package.json` — pinned `14.2.35`) | Yes, but only via `eslint-config-next@16.3.0` (breaking) |
| `postcss` (nested copy) | High | Transitive — bundled *inside* `next`'s own `node_modules/next/node_modules/postcss@8.4.31`, separate from our top-level `postcss@8.5.25` (already patched, used by our own Tailwind pipeline) | Yes, resolves automatically once `next` is upgraded |

**What each affects:**

- **`next` (21 advisories, e.g. GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf,
  GHSA-ggv3-7p47-pfv8, and others)** — a broad set of DoS, SSRF, HTTP
  request smuggling, cache-poisoning, and XSS issues spanning Next.js
  versions 9.3.4-canary through 16.3.0-preview.10. This is the core
  framework the whole app runs on (both the public quiz pages and every
  `/api/*` route).
- **`eslint-config-next` → `glob` (GHSA-5j98-mcp5-4vw2)** — command
  injection in `glob`'s CLI (`-c`/`--cmd` with `shell:true`). `glob` is
  pulled in transitively as a *library* dependency of
  `@next/eslint-plugin-next`, not invoked as a CLI here — this only runs
  during `npm run lint` / `next build`'s lint step, never in the deployed
  app.
- **`postcss` (nested, `8.4.31`)** — XSS via unescaped `</style>` in
  stringified CSS output, and arbitrary `.map` file disclosure via
  `sourceMappingURL`. This is Next's own internal build-time CSS handling,
  not the `postcss`/Tailwind pipeline this project configures directly
  (that copy, `8.5.25`, is already unaffected).

### Why these weren't auto-fixed or bumped in this pass

Step 5 of this task calls for `npm install [package]@latest` "where a clear
safe upgrade path exists." A Next.js 14 → 16 jump is a two-major-version
upgrade to the framework the entire app is built on (App Router behavior,
`next.config.js` shape, middleware/edge runtime changes, etc., all changed
across 15 and 16) — that is not a safe unattended change, and doing it as
a side effect of a dependency-audit pass risks breaking the app with no
real regression coverage. It needs its own dedicated upgrade + full
regression pass (this app already has `LIVE_TEST_PLAN.md` covering the
current build), not a same-PR `npm install next@latest`.

**Recommendation:** track the Next.js 16 upgrade as its own follow-up task,
run the full `LIVE_TEST_PLAN.md` sweep against it in a preview deployment
before promoting to production, then this whole vulnerability set clears
in one move (the `eslint-config-next`/`glob` and nested `postcss` issues
are both downstream of the same `next` version and resolve automatically
alongside it).

### Exploitability in QuizOps's actual usage

Checked against this app's actual code (`next.config.js`, routes,
components) rather than treating every advisory as equally live:

| Advisory theme | Applicable here? |
|---|---|
| Image Optimizer DoS / unbounded disk cache via `remotePatterns` | **No** — `next/image` is not used anywhere in the app, and `next.config.js` sets no `images.remotePatterns`. Also both advisories explicitly scope to *self-hosted* deployments; this app is hosted on Vercel. |
| Middleware/Proxy cache poisoning, i18n bypass | **No** — no `middleware.ts` exists (this app deliberately uses a client-side-only auth pattern with no middleware), and no `i18n` config is set. |
| Server Actions DoS / SSRF | **No** — no `'use server'` directives anywhere; all server logic is plain Route Handlers under `app/api/*`, not Server Actions. |
| XSS via CSP nonces / `beforeInteractive` scripts | **No** — no CSP nonce handling and no `next/script` usage in the app. |
| WebSocket upgrade SSRF | **Low** — no app-level WebSocket routes are defined, but this is a framework request-handling issue rather than a feature the app opts into, so it can't be fully ruled out at the framework layer. Vercel's hosting layer sits in front of the app and is a partial mitigating factor here, same as with the image-optimizer issues. |
| RSC cache poisoning / cache confusion / request smuggling / HTTP deserialization DoS | **Low–Medium** — these are internal to how Next.js parses and caches requests/responses and apply regardless of which app features are used. This is the more realistic residual exposure of staying on 14.2.35, and the main reason the upgrade above is worth prioritizing rather than indefinitely deferring. |
| `glob` CLI command injection | **No** — only reachable via `glob`'s CLI with `shell:true`; this project never invokes `glob` as a CLI, only as a linter's internal library dependency. |
| Nested `postcss` XSS / sourcemap file disclosure | **Low** — exercised only through Next's own internal build-time CSS handling, not through user-controllable input at runtime. |

**Net assessment:** none of the vulnerable *feature-specific* code paths
(Image Optimizer, Middleware, Server Actions, CSP nonces, i18n) are reachable
in QuizOps today, and the `glob`/nested-`postcss` issues aren't reachable at
all in how this app uses them. The residual risk is the framework-level
request-handling class of issues, which is real but lower-severity in
practice than the advisory list looks at a glance — and is the reason to
schedule (not ignore) the Next.js 16 upgrade rather than treat this as
closed.
