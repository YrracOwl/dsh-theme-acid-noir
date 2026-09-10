// Acid Noir — cooperative DSH Web theme bundle.
// Registers selectable themes and a Settings row; it never patches DSH files,
// forces a preference, or styles unrelated third-party plugins.
window.__ModuleLoader__.load({
  id: 'dsh-theme-acid-noir',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    const React = require('react')
    // DSH compatibility layer: Client Store replaced the old runtime export in
    // 0.1.2; retain the legacy module for older RC hosts.
    let runtime
    try { runtime = require('@deepseek-ai/dsh-client-store') } catch { runtime = require('@deepseek-ai/dsh-client-runtime/client') }

    const SETTINGS_NS = 'settings.acid-noir'
    const STORAGE_KEY = 'dsh-theme-acid-noir.skin'
    const DEFAULT_SKIN = 'system'
    const STYLE_ID = 'dsh-theme-acid-noir/styles'

    const BASE = {
      '--dsw-alias-bg-base': '#080a0f',
      '--dsw-alias-bg-layer-1': '#10141c',
      '--dsw-alias-bg-layer-2': '#171c26',
      '--dsw-alias-bg-layer-3': '#202734',
      '--dsw-alias-bg-overlay': '#171d28',
      '--dsw-alias-bg-module-platform': '#0d1118',
      '--dsw-alias-bg-multi-select': '#172318',
      '--dsw-alias-bg-skeleton': 'rgba(87, 199, 255, .08)',
      '--dsw-alias-border-l1': 'rgba(126, 158, 190, .12)',
      '--dsw-alias-border-l2-darkmode-thin': 'rgba(126, 158, 190, .18)',
      '--dsw-alias-border-l2': 'rgba(126, 158, 190, .25)',
      '--dsw-alias-border-l3': 'rgba(87, 199, 255, .42)',
      '--dsw-alias-border-l4': 'rgba(202, 239, 85, .62)',
      '--dsw-alias-brand-primary': '#caef55',
      '--dsw-alias-brand-primary-invert': '#080a0f',
      '--dsw-alias-brand-text': '#d6f875',
      '--dsw-alias-button-primary-fill': '#caef55',
      '--dsw-alias-button-primary-hover': '#d9f77b',
      '--dsw-alias-button-primary-dimmed': '#34431b',
      '--dsw-alias-button-info-fill': '#48a8df',
      '--dsw-alias-button-info-hover': '#62c8f5',
      '--dsw-alias-button-elevated-fill': '#1b2230',
      '--dsw-alias-button-floating-fill': '#171d28',
      '--dsw-alias-button-floating-hover': '#252e3d',
      '--dsw-alias-button-ghost-active-border': '#caef55',
      '--dsw-alias-button-ghost-active-fill': 'rgba(202, 239, 85, .12)',
      '--dsw-alias-button-ghost-active-hover': 'rgba(202, 239, 85, .18)',
      '--dsw-alias-interactive-bg-active': 'rgba(202, 239, 85, .16)',
      '--dsw-alias-interactive-bg-hover-accent': 'rgba(87, 199, 255, .14)',
      '--dsw-alias-interactive-bg-hover-danger': 'rgba(255, 84, 130, .14)',
      '--dsw-alias-interactive-bg-hover-solid': '#222b39',
      '--dsw-alias-interactive-bg-hover': 'rgba(126, 184, 226, .08)',
      '--dsw-alias-label-primary': '#edf3f8',
      '--dsw-alias-label-primary-bluish': '#edf8ff',
      '--dsw-alias-label-primary-dimmed': '#d2dce6',
      '--dsw-alias-label-primary-foreground': '#080a0f',
      '--dsw-alias-label-primary-inverted': '#080a0f',
      '--dsw-alias-label-secondary': '#b5c1cd',
      '--dsw-alias-label-tertiary': '#8795a5',
      '--dsw-alias-label-caption': '#718092',
      '--dsw-alias-label-dimmed': '#566273',
      '--dsw-alias-markdown-code-block': '#080b10',
      '--dsw-alias-markdown-code-block-banner': '#111722',
      '--dsw-alias-markdown-inline-code': '#17212c',
      '--dsw-alias-markdown-placeholder': '#131923',
      '--dsw-alias-markdown-tag': '#1a2517',
      '--dsw-alias-scrollbar-bg-l1': '#2b3847',
      '--dsw-alias-scrollbar-bg-l2': '#34485a',
      '--dsw-alias-scrollbar-hover-l1': '#57c7ff',
      '--dsw-alias-scrollbar-hover-l2': '#caef55',
      '--dsw-alias-state-business-primary': '#57c7ff',
      '--dsw-alias-state-business-tertiary': '#102d3a',
      '--dsw-alias-state-success-primary': '#9bdd62',
      '--dsw-alias-state-success-secondary': '#b6eb82',
      '--dsw-alias-state-success-tertiary': '#18331d',
      '--dsw-alias-state-warn-label': '#f5d663',
      '--dsw-alias-state-warn-primary': '#f5d663',
      '--dsw-alias-state-warn-secondary': '#f9e28a',
      '--dsw-alias-state-warn-tertiary': '#392f13',
      '--dsw-alias-state-error-primary': '#ff5482',
      '--dsw-alias-state-error-secondary': '#ff7da0',
      '--dsw-alias-toast-bg': '#1b2230',
      '--dsw-alias-tooltip-bg': '#111722',
      '--dsw-specific-bubble': '#111720',
      '--dsw-specific-bubble-highlight': '#172532',
      '--dsw-specific-input-major': '#0d1118',
      '--dsw-specific-login-input': '#0d1118',
      '--dsw-specific-menu': '#171d28',
      '--dsw-specific-selector': '#1a2230',
      '--dsw-specific-sidebar-fill': '#0b0e14',
      '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(202, 239, 85, .18)',
      '--dsw-specific-sidebar-nav-item-active': 'rgba(202, 239, 85, .12)',
      '--dsw-specific-sidebar-nav-item-hover': 'rgba(87, 199, 255, .08)',
      '--dsw-specific-tip': '#141b25',
    }

    const SIGNAL = {
      ...BASE,
      '--dsw-alias-brand-primary': '#d7ff2f',
      '--dsw-alias-brand-text': '#d7ff2f',
      '--dsw-alias-button-primary-fill': '#d7ff2f',
      '--dsw-alias-button-primary-hover': '#e6ff79',
      '--dsw-alias-state-business-primary': '#35d9ff',
      '--dsw-alias-state-error-primary': '#ff2f66',
      '--dsw-alias-state-warn-primary': '#ffe34a',
      '--dsw-alias-border-l3': 'rgba(53, 217, 255, .52)',
    }

    const SKINS = [
      { id: 'acid-noir', colorScheme: 'dark', tokens: BASE },
      { id: 'acid-noir-signal', colorScheme: 'dark', tokens: SIGNAL },
    ]

    const CSS = `
body[data-acid-noir] {
  --an-accent: #caef55;
  --an-structure: #57c7ff;
  --an-event: #ff5482;
  --an-warning: #f5d663;
  background-image:
    radial-gradient(circle at 78% 16%, rgba(87, 199, 255, .045), transparent 28%),
    linear-gradient(rgba(87, 199, 255, .022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(87, 199, 255, .022) 1px, transparent 1px);
  background-size: auto, 56px 56px, 56px 56px;
}
body[data-acid-noir="signal"] {
  --an-accent: #d7ff2f;
  --an-structure: #35d9ff;
  --an-event: #ff2f66;
  --an-warning: #ffe34a;
}
body[data-acid-noir] [data-pane="sidebar"] {
  border-inline-end: 1px solid rgba(87, 199, 255, .22);
}
body[data-acid-noir] [data-composer-card] {
  border: 1px solid rgba(87, 199, 255, .34);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, .22);
}
body[data-acid-noir] [data-composer-card]:focus-within {
  border-color: var(--an-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--an-accent) 52%, transparent), 0 12px 34px rgba(0, 0, 0, .28);
}
body[data-acid-noir] [data-queue-dock] > div {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
body[data-acid-noir] [data-queue-dock] > div > button {
  font-family: var(--dsw-mono-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  letter-spacing: .02em;
}
/* Composer attachment button: the component paints it with
   --dsw-specific-selector, which the token table leaves light. Target it by its
   stable aria-label so the glyph stays legible instead of depending on a
   CSS-module class hash. */
body[data-acid-noir] button[aria-label][class*="_add"] {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l2);
}
body[data-acid-noir] button[aria-label][class*="_add"]:hover:not(:disabled) {
  color: var(--an-accent);
  background: var(--dsw-alias-interactive-bg-hover-solid);
}
body[data-acid-noir] button[aria-label][class*="_add"]:focus-visible {
  outline: 2px solid var(--an-accent);
  outline-offset: 1px;
}
body[data-acid-noir] [data-tool],
body[data-acid-noir] [data-variant="think"] {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
}
body[data-acid-noir] [data-tool][data-state="ok"] { border-inline-start: 3px solid var(--dsw-alias-state-success-primary); }
body[data-acid-noir] [data-tool][data-state="error"] { border-inline-start: 3px solid var(--an-event); }
body[data-acid-noir] [data-tool][data-state="running"],
body[data-acid-noir] [data-tool][data-state="ongoing"] { border-inline-start: 3px solid var(--an-structure); }
body[data-acid-noir] [data-goal-bar] > * {
  border-color: color-mix(in srgb, var(--an-warning) 36%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 94%, var(--an-warning));
}
body[data-acid-noir] .md-code-block,
body[data-acid-noir] pre {
  border-color: var(--dsw-alias-border-l2);
  border-radius: 8px;
}
body[data-acid-noir] :focus-visible {
  outline: 2px solid var(--an-accent);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: no-preference) {
  body[data-acid-noir] [data-chat-flow-key] { animation: an-enter 180ms ease-out both; }
  body[data-acid-noir] [data-tool], body[data-acid-noir] [data-variant="think"] { transition: border-color 140ms ease, box-shadow 140ms ease; }
  body[data-acid-noir] [data-tool]:hover, body[data-acid-noir] [data-variant="think"]:hover { box-shadow: 0 8px 22px rgba(0, 0, 0, .2); }
}
@keyframes an-enter { from { opacity: .72; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@media (max-width: 760px) {
  body[data-acid-noir] [data-composer-card] { border-radius: 8px; box-shadow: 0 7px 20px rgba(0, 0, 0, .2); }
}
`

    const zh = {
      'title': 'Acid Noir 主题',
      'caption': '可用性优先的赛博编辑风格',
      'default': '默认外观',
      'acid-noir': 'Acid Noir',
      'acid-noir-signal': 'Signal 强调',
    }
    const en = {
      'title': 'Acid Noir theme',
      'caption': 'Usability-first cyber editorial styling',
      'default': 'Default appearance',
      'acid-noir': 'Acid Noir',
      'acid-noir-signal': 'Signal accent',
    }

    const SHARED_KEY = 'dsh.theme.preference.v1'
    function readSharedSkin() {
      try { const raw=localStorage.getItem(SHARED_KEY);const value=raw?JSON.parse(raw):null;return value&&value.version===1&&typeof value.theme==='string'?value.theme:null } catch (_) { return null }
    }
    function readSavedSkin() {
      try { return readSharedSkin() || localStorage.getItem(STORAGE_KEY) || localStorage.getItem('dsh-theme-cutout-clash.skin') } catch (_) { return null }
    }
    function writeSavedSkin(id) {
      try {
        if (id === DEFAULT_SKIN) { localStorage.removeItem(SHARED_KEY);localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('dsh-theme-cutout-clash.skin') }
        else { localStorage.setItem(SHARED_KEY,JSON.stringify({version:1,theme:id,owner:'dsh-theme-acid-noir'}));localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('dsh-theme-cutout-clash.skin') }
      } catch (_) {}
    }

    function isBuiltinChoice(target) {
      const button = target?.closest?.('button')
      if (!button || button.hasAttribute('data-cutout-choice') || button.hasAttribute('data-acid-choice')) return false
      const label = (button.textContent || '').trim().replace(/\s+/g, ' ').toLowerCase()
      return ['浅色', '深色', '跟随系统', 'light', 'dark', 'follow system'].includes(label)
    }

    function createSkinStore() {
      return runtime.defineStore({
        init: () => ({ skin: DEFAULT_SKIN, revision: -1 }),
        actions: { sync: (draft, skin, revision) => {
          if (revision <= draft.revision) return
          draft.skin = skin
          draft.revision = revision
        } },
      })
    }

    const rowStyle = {
      root: { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0', borderBottom: '1px solid var(--dsw-alias-border-l2)' },
      title: { color: 'var(--dsw-alias-label-primary)', fontSize: 14, lineHeight: '22px' },
      caption: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' },
      choices: { display: 'flex', flexWrap: 'wrap', gap: 8 },
      button: { width: 124, padding: 8, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 10, background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', font: 'inherit' },
      selected: { borderColor: 'var(--dsw-alias-brand-primary)', boxShadow: '0 0 0 1px var(--dsw-alias-brand-primary)' },
      swatch: { height: 34, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden', borderRadius: 6, marginBottom: 6 },
      label: { fontSize: 12, lineHeight: '16px' },
    }

    function Choice({ id, active, label, colors, setSkin }) {
      return React.createElement('button', {
        type: 'button',
        'data-acid-choice': 'theme',
        'aria-pressed': active,
        onClick: () => setSkin(id),
        style: { ...rowStyle.button, ...(active ? rowStyle.selected : {}) },
      },
      React.createElement('span', { style: rowStyle.swatch },
        ...colors.map((color, index) => React.createElement('i', { key: index, style: { background: color } }))),
      React.createElement('span', { style: rowStyle.label }, label))
    }

    function SkinRow({ t, setSkin, useStore }) {
      const skin = useStore(state => state.skin)
      const known = skin === DEFAULT_SKIN || SKINS.some(item => item.id === skin)
      const custom = known ? skin : null
      return React.createElement('div', { style: rowStyle.root },
        React.createElement('div', { style: rowStyle.title }, t('title')),
        React.createElement('div', { style: rowStyle.caption }, t('caption')),
        React.createElement('div', { style: rowStyle.choices },
          React.createElement(Choice, { id: DEFAULT_SKIN, active: custom === DEFAULT_SKIN, label: t('default'), colors: ['#f7f7f8', '#80858e', '#17181b'], setSkin }),
          React.createElement(Choice, { id: 'acid-noir', active: custom === 'acid-noir', label: t('acid-noir'), colors: ['#10141c', '#57c7ff', '#caef55'], setSkin }),
          React.createElement(Choice, { id: 'acid-noir-signal', active: custom === 'acid-noir-signal', label: t('acid-noir-signal'), colors: ['#080a0f', '#35d9ff', '#d7ff2f'], setSkin }),
        ))
    }

    const inject = ['slots', 'locale', 'theme']
    function apply(ctx) {
      const unregister = SKINS.map(skin => ctx.theme.register(skin))
      ctx.effect(() => () => { for (const dispose of unregister) dispose() }, 'acid-noir: theme registrations')

      let style = null
      const removeEnhancement = () => {
        if (style) style.remove()
        style = null
        document.body.removeAttribute('data-acid-noir')
      }
      let lastPreference = ctx.theme.getTheme().preference
      let recoveryGeneration = 0
      const syncEnhancement = snapshot => {
        const previous = lastPreference
        lastPreference = snapshot.preference
        const active = SKINS.find(skin => skin.id === snapshot.preference)
        if (!active) {
          const preferred = readSavedSkin()
          if (SKINS.some(skin => skin.id === previous) && SKINS.some(skin => skin.id === preferred) && preferred === previous) {
            const ticket = ++recoveryGeneration
            Promise.resolve().then(() => {
              if (ticket === recoveryGeneration && readSavedSkin() === preferred && !SKINS.some(skin => skin.id === ctx.theme.getTheme().preference)) ctx.theme.setTheme(preferred)
            })
            return
          }
          return removeEnhancement()
        }
        if (!style) {
          style = document.createElement('style')
          style.id = STYLE_ID
          style.dataset.plugin = 'dsh-theme-acid-noir'
          style.textContent = CSS
          document.head.append(style)
        }
        document.body.setAttribute('data-acid-noir', active.id === 'acid-noir-signal' ? 'signal' : 'base')
      }
      ctx.effect(() => () => { recoveryGeneration += 1;removeEnhancement() }, 'acid-noir: enhancement layer')
      ctx.effect(() => ctx.on('theme/change', syncEnhancement), 'acid-noir: active theme sync')
      ctx.effect(() => {
        const onBuiltinChoice = event => { if (isBuiltinChoice(event.target)) writeSavedSkin(DEFAULT_SKIN) }
        document.addEventListener('click', onBuiltinChoice, true)
        return () => document.removeEventListener('click', onBuiltinChoice, true)
      }, 'acid-noir: built-in preference intent')

      const store = createSkinStore()
      let bound
      const syncStore = snapshot => bound?.sync(snapshot.preference, snapshot.revision)
      ctx.effect(() => ctx.on('theme/change', syncStore), 'acid-noir: settings state sync')

      // The built-in theme plugin adopts its Host settings asynchronously after
      // client modules mount. Restore our browser-local choice after that first
      // adoption, otherwise an immediate setTheme() is overwritten by `system`.
      const saved = readSavedSkin()
      let restoreTimer = null
      if (saved && SKINS.some(skin => skin.id === saved)) {
        restoreTimer = window.setTimeout(() => {
          if (readSavedSkin() === saved && ctx.theme.getTheme().preference !== saved) ctx.theme.setTheme(saved)
        }, 300)
      }
      ctx.effect(() => () => { if (restoreTimer !== null) window.clearTimeout(restoreTimer) }, 'acid-noir: deferred preference restore')
      syncEnhancement(ctx.theme.getTheme())

      ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'acid-noir: locale')
      const injected = actions => {
        bound = actions
        syncStore(ctx.theme.getTheme())
        return { setSkin: id => {
          writeSavedSkin(id)
          ctx.theme.setTheme(id)
        } }
      }
      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item', id: 'acid-noir-theme', order: 19,
        store, locale: SETTINGS_NS, inject: injected,
      }, SkinRow))
    }

    exports.DEFAULT_SKIN = DEFAULT_SKIN
    exports.SKINS = SKINS
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
