---
name: Dark/light theme system
description: How the theme toggle works — CSS vars, Tailwind tokens, ThemeContext, logo filter, and CTA button pattern.
---

## Architecture

- **ThemeContext** at `client/src/context/ThemeContext.tsx` — exposes `{ theme, toggleTheme }`. Defaults to `"dark"` (reads from `localStorage.askmigi_theme`). Applies `.dark` class to `document.documentElement` on mount/change.
- **ThemeProvider** wraps everything in `App.tsx` (outermost wrapper, outside QueryClientProvider).
- `darkMode: ["class"]` in `tailwind.config.ts` — `.dark` on `<html>` enables dark variants.

## CSS Variables

Light mode values in `:root`, dark mode in `.dark` — both blocks in `client/src/index.css`.

Key token names:
- `--th-page` — main page background
- `--th-nav` — navbar background  
- `--th-card` — card background
- `--th-card-alt` — alternate card (notice bars, step cards)
- `--th-card-hover` — hover/active card state
- `--th-input` — input field background
- `--th-close` — close button / chip background
- `--th-sidebar` — sidebar / modal background
- `--th-hover` — subtle hover overlay (replaces bg-white/5 etc)
- `--th-border`, `--th-border-md`, `--th-border-strong` — three border opacities
- `--th-text`, `--th-text-90` through `--th-text-30` — text at various opacities

All tokens registered in `tailwind.config.ts` under `theme.extend.colors` as `th-*`.

## Logo filter

White SVG logo is invisible in light mode. Fixed with CSS:
```css
.logo-adaptive { filter: brightness(0); }        /* light: white → black */
.dark .logo-adaptive { filter: none; }            /* dark: stays white */
```
Add `logo-adaptive` class to every logo `<img>` element.

## CTA button pattern (inverted in light mode)

Primary CTA buttons (`bg-white text-black` in dark) become dark in light:
```
bg-[#0f0f11] text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90
```

**Why:** `bg-white text-black` is invisible on the light page background (`#f7f7f8`). The inversion ensures always-readable contrast.

## Tailwind config format

Uses CommonJS `module.exports = {}` syntax in `tailwind.config.ts`. This works fine with PostCSS in Node.js. The Replit IDE cartographer tool shows a `module is not defined` warning (loads the file in browser context) — this is harmless; Tailwind CSS compiles correctly via PostCSS.

## Preloader note

The Preloader (`Preloader.tsx`) runs for ~2.75s on every fresh browser session (uses `localStorage` key to skip on repeat visits). Screenshots taken with the screenshot tool always capture the preloader because the browser session is fresh. This is expected behavior, not a bug.
