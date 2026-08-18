<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Everplans — project conventions

Everplans is a digital planning platform. The codebase currently covers the
**public website only**: Home, Planners, Categories, Blog, Contact, About,
Sign In, Sign Up. Customer workspaces, planner functionality, product
catalogues and commerce are future work and are deliberately absent — do not
add scaffolding for them ahead of time.

## Source layout

```
src/
  app/            App Router. Routes only — no business logic.
    (site)/       Public content routes. Shares the site shell.
    (auth)/       Account entry routes. Narrow, focused frame, no site chrome.
  components/     Reusable UI, shared across more than one route.
  config/         Static, non-secret application constants.
  lib/            Utilities and integrations. `lib/supabase/` holds the clients.
  styles/         Global CSS. `globals.css` is the single stylesheet entry point.
```

Route groups (`(site)`, `(auth)`) organise layouts without affecting URLs.
Colocate anything that belongs to exactly one route inside that route's folder
using a `_private` folder; promote to `src/components/` once a second route
needs it.

`src/types/` is the home for types shared across features. It does not exist
yet because nothing has needed it — create it when something does, rather than
leaving it empty. The same rule applies generally: no folder without a file
that earns it.

## Naming

- Files and folders: `kebab-case` (`route-placeholder.tsx`).
- Components: `PascalCase`, named exports. Page components are
  `<Name>Page`.
- Functions and variables: `camelCase`. Factories read `create<Thing>`.
- Types: `PascalCase`, declared next to what they describe.

## Imports

Use the `@/` alias for anything outside the current folder; relative imports
only for true siblings. Group as: node/external, then `@/`, then relative —
blank line between groups.

## Styling

Tailwind CSS v4. Tokens are declared in CSS via `@theme`, not in a JS config
file.

- `src/styles/tokens.css` — primitive color scales (`--ep-neutral-*`,
  `--ep-secondary-*`, status hues). Never used directly by UI.
- `src/styles/globals.css` — semantic tokens on `:root` (one fixed value
  each — see "Color system" below, no per-theme swapping), the `@theme
  inline` block that aliases them into Tailwind's utility namespace, and
  the base layer (Preflight extras, focus-visible, reduced-motion).

Components consume the semantic utilities only: `bg-canvas`, `bg-surface`,
`bg-surface-muted`, `bg-deep`, `text-ink` / `text-ink-muted` / `text-ink-faint`,
`text-ink-on-brand` / `text-ink-on-deep` / `text-ink-on-accent`,
`border-line` / `border-line-subtle` / `border-line-strong`,
`bg-brand` / `bg-brand-hover` / `bg-brand-active`, `bg-accent` /
`bg-accent-subtle`, `text-success` / `text-warning` / `text-error` (+
`-subtle` backgrounds), `outline-focus-ring`. Never reach for an `--ep-*`
primitive or a raw hex value from a component.

### Color system (2026-08-18)

Light mode only — no dark mode, no theme toggle. Exactly three brand colors:

- `#FFFFFF` — primary/light foundation (`bg-canvas`, `bg-surface`)
- `#000814` — strong text (`text-ink`) **and** a deliberate dark surface
  (`bg-deep` — hero bands, closing statements; paired text is
  `text-ink-on-deep`/`text-ink-on-deep-muted`, never plain `ink`)
- `#415A77` — the one interactive/brand hue (`bg-brand`, `text-brand`,
  focus rings); `bg-accent`/`bg-accent-subtle` are lighter tints of this
  same color, not a fourth hue

**Contrast trap:** `#415A77` on `#000814` measures ~2.8:1 — well short of
the 4.5:1 text minimum and even the 3:1 UI minimum. Never use `text-brand`
or a meaningful `border-brand` directly on `bg-deep`. `bg-brand` as a
*button fill* on a deep section is fine (its own white label clears 7:1);
it's `brand` used as *text or a border* against `deep` that fails. Where a
dark-band section needs a strong CTA, use `variant="secondary"` (light
fill) rather than `variant="primary"` (brand fill) — see Hero and
FinalCta's Home sections for the pattern.

Previous palette (four colors, light/dark theme) is fully retired —
`#E7ECEF`, `#001219`, `#CAF0F8`, `#003049` should not appear anywhere.

Two type families, both self-hosted via `next/font` and set on `<html>` in
`src/app/layout.tsx`: **Fraunces** (`font-display`, a soft-serif with an
optical-size axis) for `display`/`h1`/`h2` headline moments, **Inter**
(`font-sans`, the default) for `h3` down through body copy and UI. Don't mix
a third family in. Semantic type levels (`text-display`, `text-h1`…`text-h4`,
`text-body-lg`, `text-body`, `text-body-sm`, `text-caption`, `text-label`)
are real Tailwind utilities via `@theme`; reach for the `Heading`/`Text`/
`Eyebrow` components in `src/components/ui/typography.tsx` rather than
applying them directly, so semantic heading level (`as`) and visual size
(`size`) stay decoupled.

Motion durations use Tailwind's plain numeric scale, **not** a named
token — `duration-*` doesn't support named `@theme` entries (unlike `ease-*`,
which does: `ease-standard`/`ease-emphasized` are real). Convention: fast =
`duration-150`, standard = `duration-200`, emphasized = `duration-300`.

**Tailwind gotcha:** class names must appear as complete literal strings
somewhere in source — the scanner does not execute JS. Never build a class
via template literal (`` `items-${align}` ``); use an explicit
`Record<Variant, string>` lookup map instead (see `container.tsx`'s
`alignClass`/`justifyClass` for the pattern). `class-variance-authority` is
used for multi-variant components (Button, Badge, Alert, Card) for the same
reason — it forces every variant's full class string to be written out.

## Component library

`src/components/ui/` (barrel-exported from `index.ts`): `Heading`, `Text`,
`Eyebrow`, `Container`, `Section`, `Stack`, `Button`, `Link`, `Card` (+
`CardHeader`/`CardTitle`/`CardDescription`/`CardFooter`), `Badge`, `Icon`,
`VisuallyHidden`, `Alert`, `Spinner`, `EmptyState`, and `form/` (`Label`,
`Input`, `Textarea`, `Select`, `FormField`). `FormField` wires label/control/
hint/error together via `cloneElement` + `useId` — pass it a single control
as `children` rather than wiring `id`/`aria-describedby` by hand.

Icons come from `lucide-react` (the one icon library) via the `Icon` wrapper
in `icon.tsx`, which standardizes stroke width and size. Import icons
individually (`import { Star } from "lucide-react"`) — never a barrel import
of the whole set.

`cn()` in `src/lib/cn.ts` (clsx + tailwind-merge) is how every component
merges its own classes with a consumer-supplied `className`; always spread
the consumer's class last so it can override.

## Site shell

`src/components/site/` — `Header` (desktop nav + auth CTAs + `MobileMenu`),
`Footer`, `Logo`, `NavLink` (the only client-side piece of the desktop nav —
isolated because `usePathname()` is the only thing in the header that needs
the browser), `MobileMenu` (self-contained: focus trap, Escape-to-close,
scroll lock, focus restore to trigger), `SkipLink`. Nav items live in
`src/config/navigation.ts` (`primaryNav`, `authNav`) — header, mobile menu,
and footer all read from it; don't hardcode a nav link list a second time.

The header is `h-16` (64px), `sticky top-0`. `MobileMenu`'s panel/backdrop
position (`top-16`, `calc(100dvh-4rem)`) is hardcoded to match — if the
header height ever changes, update both files.

`(site)` routes get the full Header + Footer via `src/app/(site)/layout.tsx`.
`(auth)` routes (`/sign-in`, `/sign-up`) get no primary nav and no auth CTAs
(they'd be redundant on the pages that are those CTAs) — `src/app/(auth)/layout.tsx`
itself only renders `SkipLink` + the `#main` landmark; each page composes
`AuthCard` (`src/components/auth/auth-card.tsx`), the shared single centered
card (max-w-md, on a `bg-surface-muted` page background) both auth pages use
for visual consistency. A two-column split-screen with a dark brand panel
was tried and deliberately reverted (2026-08-18) — too much chrome for a
form this size. This split from `(site)` is deliberate; don't unify them.

## Supabase

Two clients, and the distinction matters:

- `src/lib/supabase/client.ts` — browser. Import from Client Components only.
- `src/lib/supabase/server.ts` — Server Components, Server Actions, Route
  Handlers. Marked `import "server-only"`; importing it from a Client
  Component fails the build by design.

Create a client per request or per component. Never share an instance across
requests — that leaks one visitor's session into another's render.

Both clients use the publishable key, so Row Level Security governs every
query. If a future feature genuinely needs to bypass RLS, put the secret key
behind `server-only` and never in a `NEXT_PUBLIC_` variable.

## Environment

Read environment values through `src/lib/env.ts`, which validates them and
fails loudly when one is missing. `process.env.NEXT_PUBLIC_*` must be written
as a full literal or Next.js will not inline it.

`.env.example` is the committed template and never carries a value.
`.env.local` holds real local values and is git-ignored. Preview and
production values live in Vercel project settings.

## Authentication

Sign in/up (`src/app/(auth)/`) use Supabase Auth exclusively via Server
Actions (`actions.ts` in each route), never a client-side `auth.*` call —
this keeps the resulting session cookies flowing through the server
client's `setAll` handler correctly. `src/components/auth/oauth-buttons.tsx`
("Continue with Google" — the one social option the single-card layout
kept) is the one deliberate exception: OAuth has to start with a
client-side redirect to the provider, there's no server-action equivalent
for that first hop. The session itself still gets created server-side, in
`src/app/auth/callback/route.ts`, through the same server client. Whether
an OAuth click actually reaches Google depends on that provider being
enabled in the Supabase project's Auth settings — pending backend
configuration, same situation as the contact form's migration, not a fake
button.

Sign-up email confirmation follows the same "code is real, dashboard
config is pending" pattern. `src/app/auth/confirm/route.ts` verifies a
confirmation link's `token_hash` server-side and creates the session — the
email counterpart to `/auth/callback`'s OAuth `code` exchange, using
Supabase's separate `verifyOtp` mechanism rather than
`exchangeCodeForSession`. `src/app/(auth)/actions.ts` holds
`resendConfirmationEmail`, shared by Sign Up's "confirmation-required"
screen and Sign In's "email not confirmed" error
(`src/components/auth/resend-confirmation-button.tsx`) so neither is a
dead end. None of this fires correctly until the Supabase project's
"Confirm signup" email template is repointed at `/auth/confirm` — see
`supabase/email-templates/confirm-signup.html`.

Password reset (`/forgot-password` → email → `/auth/confirm?type=recovery`
→ `/reset-password`) reuses the same `/auth/confirm` route with Supabase's
`recovery` OTP type instead of `signup` — no new verification code needed,
only the new pages either side of it. `forgot-password`'s Server Action
always returns the same "check your inbox" state whether or not the email
belongs to a real account, matching the account-enumeration-avoidance
`auth-errors.ts` already applies elsewhere; `reset-password` is
session-gated (redirects to `/forgot-password` if visited without the
session the recovery link creates) rather than a form with nothing to
submit against. `supabase/email-templates/reset-password.html` is this
flow's dashboard template, same "prepared for you to paste" situation as
`confirm-signup.html` and the contact form's migration.

`src/proxy.ts` refreshes the session on every request (Next 16 renamed
`middleware.ts` → `proxy.ts`; the exported function is `proxy`, not
`middleware`). Auth error text goes through `src/lib/auth-errors.ts` — an
allowlist, not a raw pass-through — so unrecognized Supabase errors never
leak internal detail, and known ones (e.g. "Invalid login credentials")
stay deliberately generic to avoid account enumeration. Both auth pages
redirect to `/` (the only honest destination — no dashboard exists) and
redirect away to `/` if already signed in.

## SEO / metadata

Root layout sets `metadataBase`, a title template, and site-wide
OpenGraph/Twitter defaults; a page only needs to export its own `title` +
`description` and Next fills in `og:title`/`twitter:title`/etc. from those
automatically — don't hand-write per-page `openGraph`/`twitter` blocks
unless a page genuinely needs different image/type. `src/app/robots.ts` and
`src/app/sitemap.ts` are file-convention routes (not pages) — the sitemap
pulls article URLs from the same `getArticles()` the blog listing uses, so
it can never list a fake or stale article. `/sign-in` and `/sign-up` carry
per-page `noindex` and are deliberately excluded from the sitemap — do not
`Disallow` them in robots.ts too; that would stop crawlers from ever
fetching the page and seeing the `noindex` tag in the first place.
`src/app/opengraph-image.tsx` is one site-wide generated image (brand only,
not page content) via `next/og`'s `ImageResponse` — Satori/ImageResponse
renders plain style objects, not Tailwind classes or CSS variables, so its
colors are literal brand hex values, not design-system tokens.

## Contact form data

`contact_submissions` (used by `/contact`) is defined in
`supabase/migrations/20260818000000_contact_submissions.sql` but the
migration has not been applied to the live project — the assistant that
built this doesn't hold elevated Supabase credentials in this environment.
Until it's applied, the form fails honestly rather than faking success (see
`src/app/(site)/contact/actions.ts`). Apply via `supabase db push` or the
SQL Editor at supabase.com/dashboard.

## Checks

```
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # production build; also runs TypeScript
```

All three must pass before a phase is considered done.
