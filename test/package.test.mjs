import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('package is a standalone DSH bundle', async () => {
  const pkg = JSON.parse(await read('../package.json'))
  assert.equal(pkg.name, 'dsh-theme-acid-noir')
  assert.equal(pkg.version, '0.4.2')
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
  for (const selector of ['[data-composer-card]', '[data-tool]', '[data-variant="think"]', '[data-goal-bar]', '[data-chat-flow-key]', '[data-dsh-part="queue-dock"]']) {
    assert.ok(source.includes(selector), `missing ${selector}`)
  }
  assert.doesNotMatch(source, /dsh-mcp-pill|data-dsh-plugin="ssh"|data-dsh-plugin="pet"/)
  assert.doesNotMatch(source, /Persona 5|Atlus|Phantom Thieves/)
})
