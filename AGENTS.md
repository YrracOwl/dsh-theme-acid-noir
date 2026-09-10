# dsh-theme-acid-noir Maintenance Guide

## Purpose

Restrained, usability-first dark theme family:

- `acid-noir`
- `acid-noir-signal`

This package is a selectable DSH theme bundle, not a shell replacement. It must remain independently installable from Cutout Clash.

## Key Files

- `lib/client.js`: Theme definitions, small semantic enhancement stylesheet, Settings row, shared preference bridge, lifecycle cleanup.
- `lib/index.js`: Host bundle anchor only.
- `DESIGN.md`: visual and architectural rationale.
- `test/package.test.mjs`: package/lifecycle/selector regressions.
- `verify-preset.mjs` and `generate-dcli-reference.mjs`: local cross-project maintenance utilities; their defaults use the canonical `DevPlugins` root and remain overridable by environment variables.

## Theme Invariants

- Register themes through `ctx.theme.register`; do not patch DSH files or force a theme merely because the package mounted.
- Load enhancement CSS only while an Acid theme is active; remove style and `data-acid-noir` on switch/unload.
- Coordinate custom selection through versioned browser key `dsh.theme.preference.v1`. Default appearance clears the shared/legacy records.
- Settings saves can make the official Theme Runtime re-adopt `light`/`dark`/`system`. Recover the still-selected custom theme, but never fight an explicit built-in or Default click.
- Write browser preference intent before calling synchronous `ctx.theme.setTheme(id)`.
- Use Theme tokens first and stable semantic selectors second. Do not style unrelated SSH, MCP, Pet, or plugin UI.
- The composer attachment button is `button[aria-label][class*="_add"]` (ARIA label plus a class substring, never the module hash) and the queued-message banner is `div[data-queue-dock] > div[panel]`; `[data-dsh-part="queue-dock"]` does not exist in DSH and silently styled nothing.
- Both components paint their own surface from `--dsw-specific-selector` / `--dsw-specific-tip`, so override the color rather than assuming those tokens match a label or layer token. `test/package.test.mjs` asserts WCAG contrast for both; keep it in sync when tokens change.

## Validation

```powershell
npm run check
npm pack --dry-run
```

For visual changes, reconcile the package, refresh `http://127.0.0.1:3080`, select both variants, and inspect real computed styles. Verify switching to built-in appearance clears markers and shared preference.

## Pitfalls

- The official Theme Runtime persists only built-in preferences on Host; custom themes require the shared browser bridge.
- `theme/change` is synchronous. Ordering preference writes after `setTheme()` creates a recovery race.
- Source assertions do not prove contrast or selector coverage; inspect rendered DOM.
- Historical artifacts can contain old workspace paths. Do not rewrite evidence, but do not copy those paths into active scripts.
