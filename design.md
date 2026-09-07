---
version: alpha
name: pusidun's blog design
description: A warm-canvas editorial interface for a personal writing and engineering blog. The system anchors on a tinted cream canvas with serif display headlines, warm coral CTAs, and dark ink surfaces (code windows, demo cards). Visual voltage comes from the cream/coral pairing — deliberately warm and humanist where most developer sites use cool blue and slate. Type voice runs an open-licensed transitional serif for h1/h2 and a humanist sans for body. A small diamond mark anchors the wordmark.

colors:
  primary: "#cc785c"
  primary-active: "#a9583e"
  primary-disabled: "#e6dfd8"
  ink: "#141413"
  body: "#3d3d3a"
  body-strong: "#252523"
  muted: "#6c6a64"
  hairline: "#e6dfd8"
  hairline-soft: "#ebe6df"
  canvas: "#faf9f5"
  surface-soft: "#f5f0e8"
  surface-card: "#efe9de"
  surface-cream-strong: "#e8e0d2"
  surface-dark: "#181715"
  surface-dark-elevated: "#252320"
  surface-dark-soft: "#1f1e1b"
  on-primary: "#ffffff"
  on-coral: "#141413"
  on-coral-soft: "#36231e"
  on-dark: "#faf9f5"
  on-dark-soft: "#a09d96"
  accent-teal: "#5db8a6"
  accent-amber: "#e8a55a"
  success: "#5db872"
  warning: "#d4a017"
  error: "#c64545"

typography:
  display-xl:
    fontFamily: "Newsreader, Source Serif 4, Georgia, serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.5px
  display-lg:
    fontFamily: "Newsreader, Source Serif 4, Georgia, serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1px
  display-md:
    fontFamily: "Newsreader, Source Serif 4, Georgia, serif"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-sm:
    fontFamily: "Newsreader, Source Serif 4, Georgia, serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.3px
  title-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.5px
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-secondary-on-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary-active}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  post-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  demo-card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  code-window-card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 24px
  callout-card-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-coral}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 48px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  badge-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  cta-band-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-coral}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  cta-band-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

This is a warm, editorial reading surface for a personal blog about software, infrastructure, and tooling. The base atmosphere is a **tinted cream canvas** (`{colors.canvas}` — #faf9f5) — distinctly warm, deliberately not the cool gray-white that most developer sites default to. Headlines run an **open-licensed transitional serif** (Newsreader / Source Serif 4) at weight 400 with negative letter-spacing, paired with **Inter** body sans. The combination should feel like a literary publication, not a SaaS marketing page.

Visual voltage comes from the **cream + coral pairing** — coral (`{colors.primary}` — #cc785c) is the site's single accent, used on every primary CTA, on the diamond mark, and on full-bleed callout cards and CTA bands. The coral is warm and slightly muted, never cyan or blue: a deliberate step away from the cool slate and saturated blue that dominate technical writing sites.

The system has three surface modes that alternate down the page:
1. **Cream canvas** (`{colors.canvas}`) — default body floor
2. **Light cream cards** (`{colors.surface-card}`) — post card and content card backgrounds
3. **Dark ink surfaces** (`{colors.surface-dark}`) — code windows, demo cards, pre-footer CTAs, the footer itself

The dark surfaces are where the blog shows real material — code blocks, terminal output, benchmark tables, architecture diagrams. The cream-to-dark contrast is the page's pacing rhythm.

**Key Characteristics:**
- Warm cream canvas (`{colors.canvas}` — #faf9f5) with dark warm-ink text (`{colors.ink}` — #141413). The defining color choice.
- Coral primary CTA (`{colors.primary}` — #cc785c). Used scarcely on individual buttons, generously on full-bleed coral callout cards.
- Serif display headlines at weight 400 with negative letter-spacing. Pairs with humanist sans body for a literary editorial voice.
- Dark demo cards (`{colors.surface-dark}` — #181715) carrying code blocks, terminal panels, and comparison data — the blog shows the actual artifact rather than abstract illustration.
- Light cream post cards (`{colors.surface-card}` — #efe9de) — slightly darker than canvas, used for article listings and content-driven explanations.
- A small diamond mark (a filled square rotated 45°) sits before the wordmark and doubles as an inline section marker.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for content + demo cards, `{rounded.xl}` (16px) for the hero code window, `{rounded.pill}` for badges.
- Section rhythm `{spacing.section}` (96px). Internal card padding stays generous at `{spacing.xl}` (32px).

## Colors

### Brand & Accent
- **Coral / Primary** (`{colors.primary}` — #cc785c): The site's warm coral. Primary CTA backgrounds, the `callout-card-coral` and `cta-band-coral` surfaces, the diamond mark, the nav underline and the focus ring. The single recognizable accent of the whole system.
  Coral is a **surface and a marker colour, not a text colour**: at 3.11:1 on canvas it clears the 3:1 bar for focus rings and borders but fails the 4.5:1 bar for body text. Text links therefore use `{colors.primary-active}` (4.80:1).
- **Coral Active** (`{colors.primary-active}` — #a9583e): The press / active darker variant, and the colour of every coral *text* element — links, `.clear-filter`, the hero's emphasised phrase, in-article links.
- **Coral Disabled** (`{colors.primary-disabled}` — #e6dfd8): A desaturated cream-tinted disabled state.
- **Accent Teal** (`{colors.accent-teal}` — #5db8a6): Used sparingly on dark surfaces (terminal status indicators, "live" dots on the projects page).
- **Accent Amber** (`{colors.accent-amber}` — #e8a55a): A small companion warm-tone used on category badges and inline highlights.

### Surface
- **Canvas** (`{colors.canvas}` — #faf9f5): The default page floor. Tinted cream — warm, deliberately not pure white.
- **Surface Soft** (`{colors.surface-soft}` — #f5f0e8): Section dividers, very-soft band backgrounds.
- **Surface Card** (`{colors.surface-card}` — #efe9de): Post cards, content cards. One step darker than canvas.
- **Surface Cream Strong** (`{colors.surface-cream-strong}` — #e8e0d2): A strongest-cream variant used on selected category tabs and emphasized section bands.
- **Surface Dark** (`{colors.surface-dark}` — #181715): Code windows, demo cards, footer. The dominant dark surface.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #252320): Elevated panels inside dark bands (toolbars, output headers).
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #1f1e1b): Slightly lighter dark, used for code block backgrounds inside larger dark cards.
- **Hairline** (`{colors.hairline}` — #e6dfd8): The 1px border tone on cream surfaces. Same hex as `{colors.primary-disabled}` — borders read as one elevation step rather than ink lines.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebe6df): Barely-visible divider used inside the same band.

### Text
- **Ink** (`{colors.ink}` — #141413): All headlines and primary text. Warm dark, slightly off-pure-black.
- **Body Strong** (`{colors.body-strong}` — #252523): Emphasized paragraphs, article lead text.
- **Body** (`{colors.body}` — #3d3d3a): Default running-text color.
- **Muted** (`{colors.muted}` — #6c6a64): Sub-headings, breadcrumbs, post dates, footer-adjacent secondary text.
- **On Primary** (`{colors.on-primary}` — #ffffff): Text on coral buttons. **Known contrast gap:** white on coral is 3.28:1, under the 4.5:1 AA threshold for the 14px button label. Left as-is because it is the signature button; fix by darkening the coral or switching the label to `{colors.on-coral}`.
- **On Coral** (`{colors.on-coral}` — #141413): Text on coral *surfaces* (callout cards, CTA bands) — 5.63:1. Cream on coral is only 3.11:1, so coral surfaces take ink, not cream.
- **On Coral Soft** (`{colors.on-coral-soft}` — #36231e): Secondary paragraphs on coral surfaces — 4.53:1, the lightest warm tone that still clears AA.
- **On Dark** (`{colors.on-dark}` — #faf9f5): Cream-tinted white used on dark surfaces (echoes the canvas tone).
- **On Dark Soft** (`{colors.on-dark-soft}` — #a09d96): Footer body text, secondary labels in dark cards.

### Semantic
- **Success** (`{colors.success}` — #5db872): Green status dots, "build passing" indicators.
- **Warning** (`{colors.warning}` — #d4a017): Warning callouts inside articles.
- **Error** (`{colors.error}` — #c64545): Validation errors, "deprecated" markers.

## Typography

### Font Family
The system runs **Newsreader** (or **Source Serif 4** as substitute) as the serif display face for headlines, and **Inter** as the humanist sans for body, navigation, and UI labels. Code uses the platform monospace stack. The fallback stack walks `Source Serif 4, Georgia, "Times New Roman", serif` for display and `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` for body. All named faces are open-licensed and self-hostable.

The display/body split is editorial:
- Serif (weight 400, negative tracking) → h1, h2, h3, hero display
- Inter (weight 400–500) → body, navigation, buttons, captions, labels
- Platform monospace → all code blocks and terminal text

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 400 | 1.05 | -1.5px | Home h1 ("Notes on building things") — serif |
| `{typography.display-lg}` | 48px | 400 | 1.1 | -1px | Article titles, section heads — serif |
| `{typography.display-md}` | 36px | 400 | 1.15 | -0.5px | In-article h2, sub-section heads — serif |
| `{typography.display-sm}` | 28px | 400 | 1.2 | -0.3px | Callout headlines, in-article h3 — serif |
| `{typography.display-xs}` | 32px | 400 | 1.2 | -0.5px | Project + timeline card headings, and every display heading under 768px — serif |
| `{typography.title-lg}` | 22px | 500 | 1.3 | 0 | In-article h4, list labels — Inter |
| `{typography.title-md}` | 18px | 500 | 1.4 | 0 | Post card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | List labels, small card titles |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text — Inter |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print, post meta |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, figure captions |
| `{typography.caption-uppercase}` | 12px | 500 | 1.4 | 1.5px | Category tags, "NEW" badges |
| `{typography.code}` | 14px | 400 | 1.6 | 0 | Code blocks — monospace |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### CJK Line Height
The site is written in Chinese with an English translation layer, and CJK sets denser than Latin at the same leading — the `body-md` line-height of 1.55 reads cramped once a paragraph is mostly Han characters. Running text therefore uses two CJK-specific values, tokenised as `--lh-cjk-body` and `--lh-cjk-prose`:

| Token | Value | Use |
|---|---|---|
| `--lh-cjk-body` | 1.8 | Standfirsts, card excerpts, project + band paragraphs |
| `--lh-cjk-prose` | 1.9 | Long-form article body |

Display headings keep the Latin scale's tighter leading (1.05–1.2) — the looser value is for paragraphs only. This is a deliberate departure from `{typography.body-md}`, not drift.

### Principles
Display sizes use weight 400 (regular), never bold. Negative letter-spacing (-0.3 to -1.5px) is essential — the serif without it reads loose and off-system. The serif character is what gives the blog its considered, literary voice; a sans display would make it look like every other engineering site.

Body type stays at weight 400 for paragraphs, weight 500 for labels and emphasized phrases. The sans body is humanist (Inter) — never geometric. Article body measure caps at roughly 70 characters per line.

### Note on Font Substitutes
If Newsreader is unavailable, **Source Serif 4** is the closest match at weight 400. **EB Garamond** or **Cormorant Garamond** at weight 500 with -0.02em letter-spacing are acceptable warmer alternatives. For the sans, **IBM Plex Sans** and **Public Sans** are the closest open substitutes; both keep the humanist proportions. Helvetica or Arial would be too neutral and break the warm-editorial feel.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px).
- **Card internal padding:** `{spacing.xl}` (32px) for post, project and content cards; `{spacing.lg}` (24px) for code-window cards.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) inside `callout-card-coral` and `cta-band-dark`; 64px inside `cta-band-coral`.
- **Sticky-nav geometry:** the nav is 64px (`--nav-height`). Two derived values are 64 + 8: `--main-top` 72px, the top padding of `.site-main`, and `--scroll-offset` 88px, used for `scroll-padding-top` and heading `scroll-margin-top` so anchored headings clear the sticky bar. Both are real tokens, not stray numbers.

### Grid & Container
- **Max content width:** ~1200px centered.
- **Article body:** Single 12-column grid; the reading column occupies 8 of 12, with figures and code windows allowed to break out to the full 12.
- **Home hero:** 6/6 split (h1 left, code window right).
- **Post card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Project grid:** 2-up at desktop, 1-up at mobile.

### Whitespace Philosophy
The cream canvas + serif display + generous internal padding create an editorial pacing — the blog should read like a long-form magazine column rather than a documentation template. Whitespace between bands stays uniform at 96px; whitespace inside cards is generous (32px), letting type breathe.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, hero bands |
| Sticky nav | `{colors.canvas}` background, 1px `{colors.hairline-soft}` bottom border, `z-index: 30` | Top nav. It stays put on a long-scrolling archive, and the hairline keeps it legible over cream cards. Consequence: `scroll-padding-top` and heading `scroll-margin-top` are 88px (the 64px nav + 8px), so anchor links do not land under it. |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, sub-nav, occasionally on cards |
| Cream card | `{colors.surface-card}` background — no shadow | Post cards, content cards |
| Dark surface card | `{colors.surface-dark}` background — no shadow | Code windows, demo cards |
| Subtle drop shadow | Faint shadow at low alpha | Active-elevated states (the system uses `0 1px 3px rgba(20,20,19,0.08)` rarely) |

The elevation philosophy is **color-block first, shadow rare**. Most depth comes from the cream-vs-dark surface contrast. Shadows are minimal. Dark cards carry their own internal chrome (code scrollbars, line numbers, syntax highlighting) which adds detail without needing external shadows.

### Decorative Depth
- The diamond mark (a filled square rotated 45°) appears in the wordmark and inline as a section marker.
- Code windows carry their own internal depth: syntax highlighting from the `--code-*` ramp (see Code & Syntax below), line numbers in `--code-linenum`, a status bar at the bottom in `{colors.surface-dark-elevated}`.

## Shapes

### Border Radius Scale

`rounded.xs` (4px) is used by inline `<code>` spans; it exists as `--radius-xs` in `global.css`.

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved for badge accents and tiny dropdowns |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards (post, project, code-window, coral callout) |
| `{rounded.xl}` | 16px | Hero code window, larger marquee components |
| `{rounded.pill}` | 9999px | Badge pills, "NEW" tags |
| `{rounded.full}` | 9999px / 50% | Author avatar, icon buttons |

### Photography & Illustrations
The site uses no photography and no illustration. The hero's visual is a code window — monospace on `{colors.surface-dark}` with the `--code-*` ramp — and that is the only decorative artifact in the system. Article images come from post Markdown and take `{rounded.md}`.

The one raster asset is the WeChat QR on /about, at 160px with `{rounded.md}`; it is decoded in the browser from the private-profile payload rather than shipped as a static file.

## Components

### Top Navigation

**`top-nav`** — Cream nav bar, `position: sticky` at the top of every page. 64px tall, `{colors.canvas}` background, 1px `{colors.hairline-soft}` bottom border. Carries the diamond mark + "pusidun" wordmark at left, the menu (文章 / 项目 / 履历 / 关于) at right, then the language toggle and a GitHub text-link. Menu items in `{typography.nav-link}` (Inter 14px / 500); the current page is underlined in coral at 8px offset. Collapses to a full-screen `dialog` sheet under 768px.

### Buttons

**`button-primary`** — The coral CTA. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), type `{typography.button}` (Inter 14px / 500), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). Active state `button-primary-active` darkens to `{colors.primary-active}` (#a9583e).

**`button-secondary`** — Cream button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, same padding + height + radius as primary.

**`button-secondary-on-dark`** — Used over `{colors.surface-dark}` cards. Background `{colors.surface-dark-elevated}` (#252320), text `{colors.on-dark}`. Stays dark — the system never inverts to a light secondary on dark surfaces.

**`button-on-coral`** — The inverse case, used over `callout-card-coral` and `cta-band-coral`. Background `{colors.canvas}`, text `{colors.ink}`. Coral surfaces do invert their button, because a dark-on-coral button would disappear into the fill.

**`button-text-link`** — Inline text button, no background. Used for the GitHub link in the top nav and inline CTA links.

**`text-link`** — Inline body links in `{colors.primary-active}` (#a9583e), underlined at 4px offset. Not `{colors.primary}`: the lighter coral is 3.11:1 on canvas and fails AA for text. The coral inline link is one of the system's most distinctive small details, and it does a lot of work inside long article text.

### Cards & Containers

**`hero-band`** — Cream-canvas hero with a 6-6 grid: h1 + standfirst + button row on the left, the code window on the right. Vertical padding `{spacing.section}` (96px).

**`post-card`** — Used in 3-up article listing grids. Background `{colors.surface-card}` (#efe9de — slightly darker cream), rounded `{rounded.lg}` (12px), internal padding `{spacing.xl}` (32px). Carries a type / tag line at top, a `{typography.title-md}` post title, a three-line excerpt, a tag row, and a date line in `{typography.body-sm}` / `{colors.muted}`. There is no read-time.

**`demo-card-dark`** — Dark card showing a running artifact: a terminal session, a diff, a small interactive demo. Background `{colors.surface-dark}`, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px). Labels in `{colors.on-dark}`, output fragments below.

**`code-window-card`** — A specialized dark card showing a code editor with line numbers, syntax-highlighted code in `{typography.code}`, and sometimes a terminal output panel below. Background `{colors.surface-dark}` with `{colors.surface-dark-soft}` for the inner code block, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). The signature visual element of the blog's engineering posts.

#### Code & Syntax

One warm-leaning ramp serves both the hero's hand-written code window and Shiki's output in articles, so the two are the same theme rather than two unrelated ones. The Shiki theme is defined in `astro.config.mjs` and mirrors these values; `{colors.accent-teal}` and `{colors.accent-amber}` are **not** used here — they are reserved for status dots and category badges.

| Token | Value | Use |
|---|---|---|
| `--code-text` | #d6d3cb | Default code foreground |
| `--code-comment` | #6f6b62 | Comments (italic) |
| `--code-keyword` | #d68f6f | Keywords, storage, tags |
| `--code-string` | #93b8a6 | Strings, character literals |
| `--code-number` | #d9b168 | Numerics, constants, type names |
| `--code-fn` | #9fb4c9 | Function names, attributes |
| `--code-punct` | #8e8b82 | Punctuation, operators |
| `--code-linenum` | #55524b | Line numbers |

**`callout-card-coral`** — A full-bleed coral card carrying a major call-to-action. Background `{colors.primary}` (#cc785c), text `{colors.on-coral}` (ink — cream on coral fails contrast), rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). The coral surface IS the voltage; the CTA inside is `button-on-coral` (cream fill, ink label). Built: the "更多代码与探索" block on /projects.

### Inputs & Forms

**`text-input`** — Standard text input. Used for the article search field. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border in `{colors.hairline}`.

**`text-input-focused`** — Focus state. Border shifts to `{colors.primary}` (coral) for emphasis, with a 3px coral-at-15%-alpha outer ring. The ring is the keyboard-focus indicator and is never removed.

**`blockquote`** — Article pull quote. `{colors.surface-soft}` fill with a 3px `{colors.primary}` left border, 8px × 24px padding, radius `0 {rounded.md} {rounded.md} 0`, 32px block margin. The one place the lighter coral is load-bearing at scale, and it works because it is a border, not text.

### Tags / Badges

**`badge-pill`** — Small pill label used for post categories. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used in the filter row above article listings. Inactive: transparent background, `{colors.muted}` text. Active: `{colors.surface-card}` background, `{colors.ink}` text. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-coral`** — A full-width coral band closing a page. Coral fill, ink type, rounded `{rounded.lg}`, padding 64px (32px under 768px). Carries an eyebrow, an h2 in `{typography.display-sm}` (still serif), a short paragraph and a `button-on-coral`. Built: the "Open source" band on /about. Alternates with `cta-band-dark` so no two consecutive pages close on the same surface.

**`cta-band-dark`** — The dark counterpart, and the default. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding 48px. Implemented as `.feature-band.dark-card`; built on / and /cv.

**`footer`** — Dark footer that closes every page. Background `{colors.surface-dark}` (#181715), text `{colors.on-dark-soft}`. 4-column link list at desktop covering Writing / Projects / Elsewhere / Meta. Vertical padding 64px. The diamond mark + "pusidun" wordmark sits at the top in `{colors.on-dark}`. The footer never inverts.

## Do's and Don'ts

### Do
- Anchor every page on the cream canvas. Pure white reads as a default template; the warm tint is the whole point.
- Use the serif for every display headline. Pair with Inter body. Negative letter-spacing on display sizes is non-negotiable.
- Reserve coral for primary CTAs, the diamond mark, focus rings and full-bleed `{component.callout-card-coral}` / `{component.cta-band-coral}` moments. Inline links take `{colors.primary-active}`, the darker variant, for contrast. Don't paint other accents coral.
- Use `{component.demo-card-dark}` and `{component.code-window-card}` to show real output. Don't illustrate code when you can show it.
- Pair `{component.post-card}` (cream) with `{component.demo-card-dark}` (dark) in alternating bands. The cream-to-dark rhythm is the pacing mechanism.
- Use the diamond mark as the wordmark prefix. Keep it a single flat shape at every size.
- Apply `{spacing.section}` (96px) between major bands.

### Don't
- Don't use cool grays or pure white for canvas. Cream is the floor.
- Don't bold the serif display weight. At 700 it reads bombastic; the system stays at 400.
- Don't use cool blue or saturated cyan as an accent. The coral is the only accent.
- Don't put coral everywhere. It stays scarce on individual elements and generous only on full-bleed coral cards.
- Don't use Inter for display headlines. The serif character is the voice.
- Don't repeat the same surface mode in two consecutive bands. The pacing alternates: cream → cream-card → dark-demo → cream → coral-callout → dark-footer.
- Don't add hover state styling beyond what the system already encodes — primary darkens on press; nothing else changes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; the code window stacks below content; post + project grids 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; post cards 2-up |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up post cards; 2-up project cards |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` at minimum 40 × 40px.
- `{component.button-icon-circular}` at exactly 36 × 36 — slightly under the WCAG 44px guideline but visually centered; pad the surrounding hit area where it stands alone.
- `{component.text-input}` height is 40px.
- The whole post card is a link; effective tap area >> 44px.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen cream sheet.
- Hero band's 6-6 grid collapses to single-column on mobile — h1 + standfirst + buttons first, then the code window below.
- Post grids reduce columns rather than scaling cards down.
- Project cards collapse 2 → 1; the featured dark surface stays visually distinct at every breakpoint.
- Code-window cards retain code legibility at every breakpoint by allowing horizontal scroll within the card rather than wrapping code lines.

### Image Behavior
- Code blocks inside dark cards stay at fixed font-size; horizontal scroll on mobile rather than wrapping.
- Author avatar crops to a circle at every breakpoint.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.post-card}`, `{component.code-window-card}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay serif 400 with negative tracking. Body stays Inter 400. The split is unbreakable.
6. Cream + coral + dark ink is the trinity. Don't introduce a fourth surface tone (no purple cards, no green sections).
7. When in doubt about emphasis: bigger serif before bolder weight.

## Known Gaps

- The diamond mark is an inline SVG asset and is not formalized as a system token here.
- Animation and transition timings (nav sheet open, code block copy confirmation, TOC scroll-spy highlighting) are not in scope.
- Form validation states beyond `{component.text-input-focused}` are not extracted. The only form on the site is the article search field, which has no invalid state.
- Long-form article internals (footnotes, figure captions, inline math, the sticky table-of-contents rail) share the tokens above but need their own component entries. Blockquotes, code blocks and tables are now specified.
- Dark reading mode is not specified. The dark surface tones exist, but a full inverted reading surface would need its own text and hairline ramp.
