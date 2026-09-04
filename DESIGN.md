# Acid Noir Product Design

## Principle

The theme must remain a productivity interface. Visual identity may reinforce hierarchy and state, but must not cover controls, rewrite layout, alter unrelated plugins, or reduce text contrast.

## Palette roles

| Role | Acid Noir | Signal | Purpose |
|---|---:|---:|---|
| Canvas | `#080a0f` | `#080a0f` | stable dark substrate |
| Surface | `#10141c` | `#10141c` | cards and tool rows |
| Action | `#caef55` | `#d7ff2f` | selection and primary action |
| Structure | `#57c7ff` | `#35d9ff` | focus, running, borders |
| Warning | `#f5d663` | `#ffe34a` | warning and goal context |
| Event/error | `#ff5482` | `#ff2f66` | interruption and failure |
| Text | `#edf3f8` | `#edf3f8` | primary readable copy |

## Architecture

1. Theme Runtime owns colors: two registered `ThemeDefinition` objects.
2. Settings Slot owns user selection: Default, Acid Noir, Signal.
3. localStorage only stores the selected theme id.
4. Enhancement CSS is mounted only when an Acid Noir preference is active.
5. Every registration, listener, body attribute and style node has a disposer.

## Enhancement budget

- Sidebar: one subtle structural separator.
- Composer: border, focus ring and restrained elevation.
- Tool/Think: surface, radius and semantic status rail.
- Goal: subtle warning-tinted border/surface.
- Messages: one 180 ms, 3 px entrance under `prefers-reduced-motion: no-preference`.
- Code: radius and semantic border only.

No global heading rewrites, no full-screen pseudo overlays, no forced labels, no sound, no third-party filters, and no continuous decorative animation.

## Reference lessons

- Adopted from mature theme plugins: Theme Runtime registration, Settings Slot, persisted selection, conditional enhancement, and exhaustive cleanup.
- Avoided from immersive reference themes: forced activation, unowned DOM appendages, external CDN fonts, broad CSS-module substring selectors, and leaked theme/style registrations.
