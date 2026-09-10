import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('package is a standalone DSH bundle', async () => {
  const pkg = JSON.parse(await read('../package.json'))
  assert.equal(pkg.name, 'dsh-theme-acid-noir')
  assert.equal(pkg.version, '0.4.5')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.equal(pkg.dsh.client.immediately, true)
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-theme'))
  assert.equal(pkg.exports['./client'], './lib/client.js')
})

test('client registers selectable themes and settings slot', async () => {
  const source = await read('../lib/client.js')
  assert.match(source, /window\.__ModuleLoader__\.load/)
  assert.match(source, /ctx\.theme\.register/)
  assert.match(source, /settings\.general\.item/)
  assert.match(source, /ctx\.slots\.register/)
  assert.match(source, /ctx\.locale\.register/)
  assert.match(source, /acid-noir-signal/)
})

test('mount does not hijack the user theme', async () => {
  const source = await read('../lib/client.js')
  const applyStart = source.indexOf('function apply(ctx)')
  const recoveryStart = source.indexOf('const syncEnhancement = snapshot =>', applyStart)
  const beforeRecovery = source.slice(applyStart, recoveryStart)
  assert.doesNotMatch(beforeRecovery, /ctx\.theme\.setTheme/)
  assert.match(source, /if \(saved && SKINS\.some/)
})

test('settings refresh recovers the selected skin without fighting explicit built-in choices', async () => {
  const source = await read('../lib/client.js')
  assert.match(source, /const preferred = readSavedSkin\(\)/)
  assert.match(source, /preferred === previous/)
  assert.match(source, /Promise\.resolve\(\)\.then/)
  assert.match(source, /ticket === recoveryGeneration/)
  assert.match(source, /ctx\.theme\.setTheme\(preferred\)/)
  assert.match(source, /isBuiltinChoice/)
  assert.match(source, /document\.addEventListener\('click', onBuiltinChoice, true\)/)
  assert.match(source, /writeSavedSkin\(DEFAULT_SKIN\)/)
  assert.ok(source.indexOf('writeSavedSkin(id)', source.indexOf('return { setSkin')) < source.indexOf('ctx.theme.setTheme(id)', source.indexOf('return { setSkin')))
})

test('theme families clear each other’s stale saved preference', async () => {
  const source = await read('../lib/client.js')
  assert.match(source, /const SHARED_KEY = 'dsh\.theme\.preference\.v1'/)
  assert.match(source, /localStorage\.getItem\('dsh-theme-cutout-clash\.skin'\)/)
  assert.match(source, /localStorage\.removeItem\('dsh-theme-cutout-clash\.skin'\)/)
  assert.match(source, /owner:'dsh-theme-acid-noir'/)
})

test('another theme family does not mark Acid Noir default as selected', async () => {
  const source = await read('../lib/client.js')
  assert.match(source, /const known = skin === DEFAULT_SKIN \|\| SKINS\.some/)
  assert.match(source, /const custom = known \? skin : null/)
})

test('all theme-owned effects are reversible', async () => {
  const source = await read('../lib/client.js')
  assert.match(source, /for \(const dispose of unregister\) dispose\(\)/)
  assert.match(source, /style\.remove\(\)/)
  assert.match(source, /removeAttribute\('data-acid-noir'\)/)
  assert.match(source, /ctx\.effect\(\(\) => ctx\.on\('theme\/change'/)
})

test('enhancements use stable DSH hooks and avoid unrelated plugins', async () => {
  const source = await read('../lib/client.js')
  for (const selector of ['[data-composer-card]', '[data-tool]', '[data-variant="think"]', '[data-goal-bar]', '[data-chat-flow-key]', '[data-queue-dock]']) {
    assert.ok(source.includes(selector), `missing ${selector}`)
  }
  assert.doesNotMatch(source, /dsh-mcp-pill|data-dsh-plugin="ssh"|data-dsh-plugin="pet"/)
  assert.doesNotMatch(source, /Persona 5|Atlus|Phantom Thieves/)
})

/**
 * Relative luminance and WCAG contrast from a `#rgb`/`#rrggbb` literal — the
 * same arithmetic the browser performs on the computed colors.
 */
function luminance(hex) {
  let body = String(hex).replace('#', '')
  if (body.length === 3) body = body.split('').map(c => c + c).join('')
  const value = parseInt(body, 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Read one `const NAME = { ... }` token table. */
function tokenTable(source, name) {
  const head = new RegExp(`const ${name} = \\{`).exec(source)
  if (head === null) throw new Error(`token table ${name} not found`)
  const open = source.indexOf('{', head.index)
  let depth = 0
  let end = open
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) { end = i; break }
    }
  }
  const tokens = {}
  const pair = /'(--[a-z0-9-]+)':\s*'(#[0-9a-fA-F]{3,8})'/g
  let match
  while ((match = pair.exec(source.slice(open + 1, end))) !== null) tokens[match[1]] = match[2]
  // `SIGNAL` and other variants spread a base table, so resolve the spread or
  // the variant only carries its own overrides.
  const spread = /\.\.\.([A-Z][A-Z0-9_]*)/.exec(source.slice(open + 1, end))
  if (spread !== null) return { ...tokenTable(source, spread[1]), ...tokens }
  return tokens
}

test('composer attachment button and queued-message dock stay readable', async () => {
  const source = await read('../lib/client.js')

  // DSH renders the queue banner as div[data-queue-dock] > div[panel]; the
  // previous [data-dsh-part="queue-dock"] selector matched nothing at all.
  assert.match(source, /\[data-queue-dock\] > div \{/)
  assert.doesNotMatch(source, /data-dsh-part="queue-dock"/)

  // The attachment button glyph must not depend on a CSS-module class hash.
  assert.match(source, /button\[aria-label\]\[class\*="_add"\]/)
  assert.doesNotMatch(source, /\.uV2eYG_add|\._7yHdaG_/)

  for (const [label, table, accentRule] of [
    ['acid-noir', 'BASE', "body\\[data-acid-noir\\] \\{"],
    ['acid-noir-signal', 'SIGNAL', 'body\\[data-acid-noir="signal"\\] \\{'],
  ]) {
    const tokens = tokenTable(source, table)

    // `--an-accent` is declared by the CSS layer's body rule, not by the token
    // table: read the literal the variant actually paints with.
    const rule = new RegExp(accentRule).exec(source)
    assert.ok(rule, `${label}: body rule missing`)
    const accentMatch = /--an-accent\s*:\s*(#[0-9a-fA-F]{3,8})/.exec(source.slice(rule.index, rule.index + 160))
    assert.ok(accentMatch, `${label}: --an-accent missing from the body rule`)
    const accent = accentMatch[1]

    // The component paints the button with --dsw-specific-selector; this theme
    // overrides it through the CSS layer with --dsw-alias-bg-layer-1.
    const pairs = [
      ['queue banner count/rows', tokens['--dsw-alias-label-primary'], tokens['--dsw-alias-bg-layer-1']],
      ['queue banner lead icon', tokens['--dsw-alias-label-tertiary'], tokens['--dsw-alias-bg-layer-1']],
      ['attachment button glyph', tokens['--dsw-alias-label-primary'], tokens['--dsw-alias-bg-layer-1']],
      ['attachment button hover glyph', accent, tokens['--dsw-alias-interactive-bg-hover-solid']],
    ]
    for (const [what, fg, bg] of pairs) {
      const ratio = contrast(fg, bg)
      assert.ok(ratio >= 4.5, `${label}: ${what} is ${ratio.toFixed(2)}:1 (${fg} on ${bg})`)
    }
  }
})
