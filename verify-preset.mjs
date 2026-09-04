// verify-preset.mjs - one-shot regression checks for the native-harmonyos preset + dsh-hmos-sidebar package
// Usage: node verify-preset.mjs  (DEVECO_CLI_PATH env overrides the default CLI path)
//
// ⚠️ 仅本机工具：以下路径常量默认指向本机（Windows）布局；换机/换平台请用环境变量覆盖：
//   HMOS_PKG / HMOS_PRESET / HMOS_PATCH / HMOS_PROFILE_PKG / HMOS_CLI / MCP_PILL_PKG / TOOL_ADAPT_PKG
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const PKG = process.env.HMOS_PKG || 'D:/Resources/DSH_PRJ/DevPlugins/dsh-hmos-sidebar' // npm 包本体（唯一分发单元）
const PRESET = process.env.HMOS_PRESET || 'C:/Users/CarryWho/.dsh/.agent-presets/native-harmonyos'
const PATCH = process.env.HMOS_PATCH || 'C:/Users/CarryWho/.dsh/profiles/web/cordis.patch.yml'
const PROFILE_PKG = process.env.HMOS_PROFILE_PKG || 'C:/Users/CarryWho/.dsh/profiles/web/package.json'
const CLI = process.env.DEVECO_CLI_PATH || process.env.HMOS_CLI || 'C:/Users/CarryWho/AppData/Roaming/npm/node_modules/@deveco/deveco-cli/dist/cli.js'
let failures = 0
const ok = (m) => console.log('  PASS ' + m)
const fail = (m) => { failures += 1; console.error('  FAIL ' + m) }

function checkFile(f, cond, msg) { try { const s = fs.readFileSync(f, 'utf8'); if (cond(s)) ok(msg); else fail(msg) } catch (e) { fail(msg + ' (' + e.message + ')') } }

console.log('[1] syntax (npm package)')
for (const f of ['lib/index.js', 'lib/dcli-tools.mjs', 'lib/dual-signing.js', 'lib/client.js']) {
  const r = spawnSync(process.execPath, ['--check', path.join(PKG, f)], { stdio: 'ignore' })
  r.status === 0 ? ok('node --check ' + f) : fail('node --check ' + f)
}

console.log('[2] profile static (bundles + patch)')
const profile = (() => { try { return JSON.parse(fs.readFileSync(PROFILE_PKG, 'utf8')) } catch { return {} } })()
const deps = profile.dependencies || {}
const bundles = (profile.dsh && profile.dsh.profile && profile.dsh.profile.bundles) || []
deps['dsh-hmos-sidebar'] ? ok('profile depends on dsh-hmos-sidebar') : fail('profile depends on dsh-hmos-sidebar')
bundles.includes('dsh-hmos-sidebar') ? ok('profile bundles dsh-hmos-sidebar') : fail('profile bundles dsh-hmos-sidebar')
deps['dsh-mcp-pill'] ? ok('profile depends on dsh-mcp-pill') : fail('profile depends on dsh-mcp-pill')
bundles.includes('dsh-mcp-pill') ? ok('profile bundles dsh-mcp-pill') : fail('profile bundles dsh-mcp-pill')
deps['dsh-tool-adapt'] ? ok('profile depends on dsh-tool-adapt') : fail('profile depends on dsh-tool-adapt')
bundles.includes('dsh-tool-adapt') ? ok('profile bundles dsh-tool-adapt') : fail('profile bundles dsh-tool-adapt')
checkFile(PATCH, (s) => s.includes('!!js process.execPath'), 'patch uses process.execPath')
checkFile(PATCH, (s) => !s.includes('- id: dcli-tools'), 'patch no longer inserts dcli-tools (migrated)')
checkFile(PATCH, (s) => s.includes('mcp-deveco') && s.includes('# - insert'), 'patch retires mcp-deveco (commented)')
// 两个 pill 已迁移为官方 bundle 包：profile patch 不再直接 insert 本地文件，
// 挂载行由各包的 cordis.patch.yml 提供（profile bundles 装载时合并）。
// profile patch 只允许对 bundle 条目做 id 定向 config 覆盖（如 mcp-pill 的
// patchFile 绝对路径热修复），不允许 insert 本地插件文件。
checkFile(PATCH, (s) => !s.includes('./plugins/mcp-pill.mjs') && (!s.includes('- id: mcp-pill') || s.includes("name: 'dsh-mcp-pill'")), 'profile patch mounts mcp-pill only via bundle (config override allowed, no local file insert)')
checkFile(PATCH, (s) => !s.includes('- id: tool-adapt') && !s.includes('./plugins/dsh-tool-adapt.mjs'), 'profile patch no longer inserts local tool-adapt file')
{
  const mcpPkg = process.env.MCP_PILL_PKG || 'D:/Resources/DSH_PRJ/DevPlugins/dsh-mcp-pill'
  const adaptPkg = process.env.TOOL_ADAPT_PKG || 'D:/Resources/DSH_PRJ/DevPlugins/dsh-tool-adapt'
  for (const p of [mcpPkg, adaptPkg]) {
    for (const f of ['lib/index.js', 'lib/client.js']) {
      const r = spawnSync(process.execPath, ['--check', path.join(p, f)], { stdio: 'ignore' })
      r.status === 0 ? ok('node --check ' + path.basename(p) + '/' + f) : fail('node --check ' + path.basename(p) + '/' + f)
    }
  }
  checkFile(path.join(mcpPkg, 'cordis.patch.yml'), (s) => s.includes('- id: mcp-pill') && s.includes("name: 'dsh-mcp-pill'"), 'mcp-pill package patch mounts itself')
  checkFile(path.join(adaptPkg, 'cordis.patch.yml'), (s) => s.includes('- id: tool-adapt') && s.includes("name: 'dsh-tool-adapt'"), 'tool-adapt package patch mounts itself')
  // official bundle form: client rides __ModuleLoader__, host no longer taps index.html
  checkFile(path.join(mcpPkg, 'lib', 'client.js'), (s) => s.includes('window.__ModuleLoader__.load') && s.includes('exports.apply = apply'), 'mcp-pill client is a __ModuleLoader__ bundle')
  checkFile(path.join(mcpPkg, 'lib', 'index.js'), (s) => !s.includes('.tapIndex') && !s.includes('/ui.js'), 'mcp-pill host has no tapIndex / ui route')
  checkFile(path.join(adaptPkg, 'lib', 'client.js'), (s) => s.includes('window.__ModuleLoader__.load') && s.includes('exports.apply = apply'), 'tool-adapt client is a __ModuleLoader__ bundle')
  checkFile(path.join(adaptPkg, 'lib', 'index.js'), (s) => !s.includes('.tapIndex') && !s.includes('/ui.js'), 'tool-adapt host has no tapIndex / ui route')
  checkFile(path.join(adaptPkg, 'lib', 'index.js'), (s) => s.includes('tools/execute') && s.includes('tools/post-execute') && s.includes('adapt:conventions') && s.includes('system-prompt/assemble') && s.includes('requestHeader') && s.includes('requestContext') && s.includes('escalationDeadState') && s.includes('removeEscalationParams') && s.includes('stripEscalationArgs') && !s.includes('fullAccessText'), 'tool-adapt one-rule guard wired (assemble removal + execute strip + dead-state predicate); legacy P1 deny texts removed')
  checkFile(path.join(adaptPkg, 'lib', 'client.js'), (s) => s.includes('ANCHOR_KEY') && s.includes('data-composer-card') && s.includes('findComposer') && s.includes('MutationObserver') && s.includes('ResizeObserver') && s.includes("anchor = (topSide ? 't' : 'b')") && s.includes('cursor:grab') && !s.includes('POS_KEY') && !s.includes('flip'), 'tool-adapt pill drags to snap on one of the composer four corners; no flip button')
  // 层级同输入框：挂载到 [data-composer-seat]（与输入框同级容器），z-index 用正常值
  // （DSH 弹窗 1000/1100 可遮蔽胶囊），禁止 body 顶层 + 214748xxxx 的极端 z-index。
  checkFile(path.join(adaptPkg, 'lib', 'client.js'), (s) => s.includes('mountTarget') && s.includes('ensureMounted') && s.includes('[data-composer-seat]') && s.includes('z-index:1') && !s.includes('214748'), 'tool-adapt pill mounts beside composer at input stacking level (no body-top z-index)')
  checkFile(path.join(mcpPkg, 'lib', 'client.js'), (s) => s.includes('mountTarget') && s.includes('ensureMounted') && s.includes('[data-composer-seat]') && s.includes('z-index:1') && !s.includes('214748'), 'mcp-pill pill mounts beside composer at input stacking level (no body-top z-index)')
  checkFile(path.join(adaptPkg, 'lib', 'index.js'), (s) => s.includes("SETTINGS_NS") && s.includes("settings.register") && s.includes('applies: \'live\''), 'tool-adapt host registers official settings namespace')
  checkFile(path.join(adaptPkg, 'lib', 'client.js'), (s) => s.includes("settings.plugin.item") && s.includes("key: NS") && s.includes("SettingsCard") && s.includes("dtaCard") && s.includes("e('li'") && s.includes("未保存") && s.includes("放弃修改"), 'tool-adapt client registers official-style expandable Settings Card')
  checkFile(path.join(mcpPkg, 'lib', 'client.js'), (s) => s.includes('ANCHOR_KEY') && s.includes('data-composer-card') && s.includes('findComposer') && s.includes('MutationObserver') && s.includes('ResizeObserver') && s.includes("anchor = (topSide ? 't' : 'b')") && s.includes('cursor:grab') && !s.includes('POS_KEY') && !s.includes('flip'), 'mcp-pill drags to snap on one of the composer four corners; no flip button')
}

console.log('[3] preset static')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => s.includes('dcli__'), 'preset mentions dcli tools')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => s.includes('- id: tool-presentation') && s.includes('@deepseek-ai/dsh-agent-tool-presentation') && s.includes('mode: code'), 'preset selects PTC Mode through underlying mode: code')
checkFile(path.join(PRESET, 'preset.yml'), (s) => s.includes('PTC') && !s.includes('Plan-Track-Code'), 'preset metadata mentions PTC without unofficial Plan-Track-Code expansion')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => !s.includes('Plan-Track-Code') && s.includes('run_code'), 'preset keeps run_code and drops unofficial Plan-Track-Code expansion')
checkFile(path.join(PRESET, 'preset.yml'), (s) => s.includes('40'), 'preset metadata current')
checkFile(path.join(PRESET, 'skills/arkui-state/SKILL.md'), (s) => s.includes('@ComponentV2'), 'arkui-state uses @ComponentV2')
checkFile(path.join(PRESET, 'skills/hmos-system-capabilities/SKILL.md'), (s) => !s.includes('@ohos.notificationManager'), 'system-capabilities uses Kit names')

console.log('[4] package tools')
const mod = await import('file:///' + path.join(PKG, 'lib', 'dcli-tools.mjs').replace(/\\/g, '/'))
const TOOLS = mod.TOOLS
TOOLS.length === 41 ? ok('tools exactly 41 (' + TOOLS.length + ')') : fail('tools exactly 41 (' + TOOLS.length + ')')
const names = TOOLS.map((t) => t.name)
new Set(names).size === names.length ? ok('names unique') : fail('names unique')
names.every((n) => n.startsWith('dcli__')) ? ok('all dcli__ prefixed') : fail('all dcli__ prefixed')
for (const n of ['dcli__emulator_start','dcli__emulator_stop','dcli__emulator_fold','dcli__emulator_battery','dcli__emulator_sensor','dcli__list_emulators','dcli__update_cli','dcli__install_hap','dcli__check_lint','dcli__check_compat','dcli__check_compat_versions','dcli__start_app','dcli__api_lookup','dcli__agents_md','dcli__configure_dual_signing','dcli__ui_screenshot','dcli__ui_layout','dcli__ui_click','dcli__ui_swipe','dcli__ui_text','dcli__lsp_check','dcli__lsp_restart']) {
  names.includes(n) ? ok('tool ' + n) : fail('tool ' + n)
}
const battery = TOOLS.find((t) => t.name === 'dcli__emulator_battery')
try { battery.buildArgs({ level: '999' }); fail('battery level negative') } catch (e) { ok('battery level negative (' + e.message + ')') }
const create = TOOLS.find((t) => t.name === 'dcli__create_project')
try { create.buildArgs({ appName: '   ' }); fail('appName empty negative') } catch (e) { ok('appName empty negative (' + e.message + ')') }
const start = TOOLS.find((t) => t.name === 'dcli__emulator_start')
try { start.buildArgs({}); fail('emulator_start required negative') } catch (e) { ok('emulator_start required negative') }
const lookup = TOOLS.find((t) => t.name === 'dcli__api_lookup')
lookup && lookup.kind === 'lookup' && lookup.parameters.name && lookup.parameters.name.required === true ? ok('api_lookup kind/name required') : fail('api_lookup kind/name required')
const scopes = lookup && lookup.parameters.scope && lookup.parameters.scope.enum
scopes && ['component','api','kits','arkts','hms','docs'].every((x) => scopes.includes(x)) ? ok('api_lookup scope enum') : fail('api_lookup scope enum')
const agents = TOOLS.find((t) => t.name === 'dcli__agents_md')
agents && agents.kind === 'agents-md' ? ok('agents_md kind') : fail('agents_md kind')
const dualSigning = TOOLS.find((t) => t.name === 'dcli__configure_dual_signing')
dualSigning && dualSigning.kind === 'dual-signing' && dualSigning.parameters.apply && dualSigning.parameters.apply.type === 'boolean' ? ok('configure_dual_signing kind/apply') : fail('configure_dual_signing kind/apply')
const lspCheck = TOOLS.find((t) => t.name === 'dcli__lsp_check')
lspCheck && lspCheck.kind === 'lsp' && lspCheck.parameters.files && lspCheck.parameters.files.required === true ? ok('lsp_check kind/files required') : fail('lsp_check kind/files required')
const lspRestart = TOOLS.find((t) => t.name === 'dcli__lsp_restart')
lspRestart && lspRestart.kind === 'lsp-restart' && lspRestart.parameters.target && lspRestart.parameters.target.enum ? ok('lsp_restart kind/target enum') : fail('lsp_restart kind/target enum')

console.log('[5] skills content')
const refSkill = path.join(PRESET, 'skills/dcli-tools-reference/SKILL.md')
checkFile(refSkill, (s) => s.includes('dcli__api_lookup') && s.includes('dcli__agents_md') && s.includes('dcli__configure_dual_signing') && s.includes('```json'), 'dcli-tools-reference covers lookup/agents_md/dual-signing with fences')
checkFile(path.join(PRESET, 'skills/hmos-doc-research/SKILL.md'), (s) => s.includes('dcli__api_lookup'), 'hmos-doc-research leads with api_lookup')
checkFile(path.join(PRESET, 'skills/hmos-agents-md/SKILL.md'), (s) => s.includes('dcli__agents_md') && s.includes('pre-step'), 'hmos-agents-md covers tool + injection timing')
checkFile(path.join(PRESET, 'skills/hmos-agents-md/SKILL.md'), (s) => !s.includes('借鉴') && !s.includes('OpenCode'), 'hmos-agents-md has no provenance wording')
checkFile(path.join(PRESET, 'skills/hmos-code-review/SKILL.md'), (s) => s.includes('P0') && s.includes('dcli__lsp_check'), 'hmos-code-review covers grading + machine checks')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => s.includes('dcli-tools-reference'), 'persona lists dcli-tools-reference')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => s.includes('hmos-code-review'), 'persona lists hmos-code-review')
checkFile(path.join(PRESET, 'skills/sdd-feature/SKILL.md'), (s) => s.includes('Acceptance scenarios') && s.includes('docs/feature-contracts'), 'sdd-feature uses feature-contract format')
checkFile(path.join(PRESET, 'skills/sdd-feature/SKILL.md'), (s) => !s.includes('禁止跳阶段') && !s.includes('五阶段') && !s.includes('ui_click#') && !s.includes('specs/changes') && !s.includes('OpenSpec'), 'sdd-feature has no waterfall/fake-tool/OpenSpec remnants')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => !s.includes('五阶段'), 'persona has no waterfall wording')
checkFile(path.join(PRESET, 'preset.yml'), (s) => !s.includes('五阶段'), 'preset metadata no waterfall')
checkFile(path.join(PRESET, 'skills/native-harmonyos/SKILL.md'), (s) => !s.includes('五阶段') && !s.includes('Spec 已定') && !s.includes('Build/Verify'), 'native-harmonyos skill no stage wording')
checkFile(path.join(PRESET, 'skills/hmos-code-review/SKILL.md'), (s) => !s.includes('五阶段') && !s.includes('Spec/'), 'code-review no stage wording')
checkFile(path.join(PRESET, 'skills/hmos-agents-md/SKILL.md'), (s) => !s.includes('specs/changes'), 'agents-md uses feature-contracts path')
checkFile(path.join(PRESET, 'skills/hmos-code-review/SKILL.md'), (s) => !s.includes('specs/changes'), 'code-review uses feature-contracts path')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => !s.includes('连续失败') && !s.includes('~/.dsh/AGENTS.md'), 'persona no stale tool-failure-counting rule')

console.log('[6] preset/generation hygiene (native-harmonyos + dsh-hmos-sidebar)')
// 1) taste-skill 整个目录不存在
;(() => {
  const t = path.join(PRESET, 'skills', 'taste-skill')
  const gone = !fs.existsSync(t)
  gone ? ok('taste-skill directory removed') : fail('taste-skill directory removed')
})()
// 2) 模型可见文本无个人路径 / 设备序列号 / 包名（技能 + persona + preset 元数据）
;(() => {
  const targets = []
  targets.push(path.join(PRESET, 'agent.cordis.yml'))
  targets.push(path.join(PRESET, 'preset.yml'))
  for (const d of fs.readdirSync(path.join(PRESET, 'skills'))) {
    targets.push(path.join(PRESET, 'skills', d, 'SKILL.md'))
  }
  const forbidden = [
    'LingJingZhiTong', 'DevecoCode_PRJ', 'HMOS_PRJ', 'com.yrracowl', '2PM0223',
    'Pura X Max', 'D:/Projects',
  ]
  let dirty = []
  for (const f of targets) {
    if (!fs.existsSync(f)) continue
    const s = fs.readFileSync(f, 'utf8')
    for (const tok of forbidden) if (s.includes(tok)) { dirty.push(path.basename(path.dirname(f)) === 'skills' ? path.basename(f) : path.basename(f)); }
  }
  // simple one-line dedup
  dirty = [...new Set(dirty)]
  dirty.length === 0 ? ok('model-visible preset texts have no personal path/serial/bundle') : fail('model-visible preset texts have no personal path/serial/bundle -> ' + dirty.join(','))
})()
// 3) 模型可见文本无 mcp__deveco / serve mcp / verifyUI 对照
;(() => {
  const targets = [path.join(PRESET, 'agent.cordis.yml'), path.join(PRESET, 'preset.yml')]
  for (const d of fs.readdirSync(path.join(PRESET, 'skills'))) targets.push(path.join(PRESET, 'skills', d, 'SKILL.md'))
  const bad = []
  for (const f of targets) {
    if (!fs.existsSync(f)) continue
    const s = fs.readFileSync(f, 'utf8')
    if (/mcp__deveco|serve mcp|verifyUI|\bMCP\b/.test(s)) bad.push(f)
  }
  bad.length === 0 ? ok('no deprecated-mcp/verifyUI/MCP wording in model-visible preset text') : fail('no deprecated-mcp/verifyUI/MCP wording -> ' + bad.join(','))
})()
// 4) 生成器源正确（指向 dsh-hmos-sidebar 包的 dcli-tools.mjs）
checkFile(path.join(ROOT, 'generate-dcli-reference.mjs'), (s) => s.includes('dsh-hmos-sidebar/lib/dcli-tools.mjs') && s.includes('file:///'), 'generator sources dsh-hmos-sidebar/lib/dcli-tools.mjs')
checkFile(path.join(ROOT, 'generate-dcli-reference.mjs'), (s) => !s.includes('plugins/dcli-tools.mjs'), 'generator no longer reads retired plugins/dcli-tools.mjs')
// 4b) AGENTS 模板用 dcli__lsp_check 与"managed/自定义节保留"标记，且无 mcp__deveco 对照
;(() => {
  const f = path.join(PRESET, 'skills/hmos-agents-md/SKILL.md')
  const s = fs.readFileSync(f, 'utf8')
  const checks = [
    [s.includes('`dcli__lsp_check`'), 'agents-md template uses dcli__lsp_check'],
    [s.includes('非模板节') && s.includes('自定义节'), 'agents-md marks managed/non-template sections'],
    [s.includes('<!-- DSH-HMOS-MANAGED:START -->') && s.includes('<!-- DSH-HMOS-MANAGED:END -->'), 'agents-md documents literal managed markers'],
    [!s.includes('mcp__deveco'), 'agents-md template has no mcp__deveco wording'],
  ]
  for (const [pass, msg] of checks) pass ? ok(msg) : fail(msg)
})()
// 4c) 验收契约索引放在非模板自定义节（当前验收契约），刷新不被覆盖
;(() => {
  const f = path.join(PRESET, 'skills/hmos-agents-md/SKILL.md')
  const s = fs.readFileSync(f, 'utf8')
  s.includes('## 当前验收契约') && s.includes('Active contract:') ? ok('agents-md defines 当前验收契约 custom index') : fail('agents-md defines 当前验收契约 custom index')
  const sd = fs.readFileSync(path.join(PRESET, 'skills/sdd-feature/SKILL.md'), 'utf8')
  sd.includes('## 当前验收契约') ? ok('sdd-feature points contract index to custom section') : fail('sdd-feature points contract index to custom section')
})()
// 4d) dcli-tools-reference 本体由生成器产出且无生成来源/个人项目/旧对照引用
;(() => {
  const f = path.join(PRESET, 'skills/dcli-tools-reference/SKILL.md')
  const s = fs.readFileSync(f, 'utf8')
  const checks = [
    [!s.includes('从宿主插件 dcli-tools.mjs 的 TOOLS 表生成'), 'tool-reference body has no generation-origin wording'],
    [!/LingJingZhiTong|DevecoCode_PRJ|HMOS_PRJ|com\.yrracowl|2PM0223/.test(s), 'tool-reference has no private examples'],
    [!s.includes('mcp__deveco') && !s.includes('serve mcp'), 'tool-reference has no mcp comparison wording'],
  ]
  for (const [pass, msg] of checks) pass ? ok(msg) : fail(msg)
})()
// 5) 预设有 dsh-hmos-sidebar/tools 普通 consumer row（不加 isolate、不硬编码 config 或个人路径，依赖 env/自动探测）
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => s.includes("- id: tool-hmos-tools") && s.includes("name: 'dsh-hmos-sidebar/tools'"), 'preset mounts dsh-hmos-sidebar/tools consumer row')
checkFile(path.join(PRESET, 'agent.cordis.yml'), (s) => !/isolate\s*:/.test(s.split('- id: tool-hmos-tools')[1] || ''), 'dsh-hmos-sidebar/tools row has no isolate realm')
;(() => {
  const s = fs.readFileSync(path.join(PRESET, 'agent.cordis.yml'), 'utf8')
  // 取 tool-hmos-tools 到下一个 `- id:` 之前的完整行块
  const fromRow = s.indexOf('- id: tool-hmos-tools')
  if (fromRow === -1) { fail('tool-hmos-tools row block extracted'); return }
  const nextRow = s.indexOf('\n- id:', fromRow + 10)
  const block = nextRow === -1 ? s.slice(fromRow) : s.slice(fromRow, nextRow)
  const checks = [
    [!/\bconfig\s*:/.test(block), 'tool-hmos-tools block has no config'],
    [!block.includes('CarryWho'), 'tool-hmos-tools block has no CarryWho path'],
    [!/[A-Za-z]:[\\/]/.test(block), 'tool-hmos-tools block has no absolute drive path'],
  ]
  for (const [pass, msg] of checks) pass ? ok(msg) : fail(msg)
})()
// 6) 主包 index 不再全局 applyDcliTools（由包侧代理落地；此处断言目标态）
checkFile(path.join(PKG, 'lib', 'index.js'), (s) => !/applyDcliTools\(ctx/.test(s), 'package lib/index.js does not applyDcliTools globally')
// 7) 全维度审计应修项：非 win32 运行时守卫 + 路径围栏接线 + logs tail 钳制
checkFile(path.join(PKG, 'lib', 'dcli-tools.mjs'), (s) => s.includes('toolsSupportedOn') && s.includes('process.platform'), 'dcli-tools has Windows-only runtime guard')
checkFile(path.join(PKG, 'lib', 'index.js'), (s) => s.includes('withinTrusted') && (s.match(/trustedRoots\(config\)/g) || []).length >= 2, 'path fence wired into install/hap-info handlers')
checkFile(path.join(PKG, 'lib', 'index.js'), (s) => s.includes('sanitizeTail'), 'logs tail clamped via sanitizeTail')
checkFile(path.join(PKG, 'lib', 'client.js'), (s) => s.includes("ctx.slots.inject('shell.overlay'") && s.includes('snapshot.byId[current]') && s.includes("api('hmos/probe', { path: requestedPath || undefined })"), 'HMOS overlay probes current session cwd through official slot')
checkFile(path.join(PKG, 'lib', 'client.js'), (s) => s.includes('.hmos-panel{position:fixed;z-index:2147482999;width:430px') && s.includes('color-mix(in srgb, var(--dsw-alias-bg-layer-1,#222) 92%, transparent)') && s.includes('backdrop-filter:blur(14px)') && s.includes('border-radius:16px'), 'HMOS panel uses the same frosted background style as dsh-tool-adapt')
checkFile(path.join(PKG, 'package.json'), (s) => /"@deepseek-ai\/dsh-tools": "\^0\.1\.0-rc\.(?:[7-9]|\d{2,})"/.test(s), 'HMOS dsh-tools dependency is rc.7 or newer')
checkFile(path.join(PKG, 'lib', 'dcli-tools.mjs'), (s) => s.includes('PTC Mode') && s.includes('run_code'), 'dcli-tools documents PTC Mode over underlying run_code')
checkFile(path.join(PKG, 'lib', 'client.js'), (s) => s.includes('--popup-bg') && s.includes('--popup-text') && s.includes('getPopupTheme') && s.includes('select.hmos-input option'), 'HMOS select popup uses adaptive background and text colors')
checkFile(path.join(PKG, 'lib', 'index.js'), (s) => s.includes('findHarmonyProjectRoots') && s.includes('const starts = [root, ...env().projectRoots]'), 'HMOS probe scans current workspace plus configured roots')

console.log('[7] security & hygiene (package-level key assertions)')
// 关键复现：路径围栏拒绝 drive/UNC .. 逃逸；显式可信根不含 cwd；恶意 bundleName 不进 argv。
const idxMod = await import('file:///' + path.join(PKG, 'lib', 'index.js').replace(/\\/g, '/'))
idxMod.isWithinAny('C:\\proj\\..\\outside\\x.hap', ['C:\\proj']) === false ? ok('isWithinAny rejects drive .. escape') : fail('isWithinAny rejects drive .. escape')
idxMod.isWithinAny('\\\\server\\share\\proj\\..\\..\\outside\\x.hap', ['\\\\server\\share\\proj']) === false ? ok('isWithinAny rejects UNC .. escape') : fail('isWithinAny rejects UNC .. escape')
;(() => {
  const prev = process.env.PROJECT_PATH
  delete process.env.PROJECT_PATH
  try {
    const roots = idxMod.trustedRoots({})
    roots.length === 0 ? ok('trustedRoots({}) empty without PROJECT_PATH (no cwd leak)') : fail('trustedRoots({}) empty without PROJECT_PATH -> ' + JSON.stringify(roots))
  } finally {
    if (prev === undefined) delete process.env.PROJECT_PATH
    else process.env.PROJECT_PATH = prev
  }
})()
const startTool = TOOLS.find((t) => t.name === 'dcli__start_app')
try { startTool.buildArgs({ bundleName: 'com.example;rm -rf /' }); fail('start_app rejects injection bundleName') } catch (e) { ok('start_app rejects injection bundleName') }
const syncTool = TOOLS.find((t) => t.name === 'dcli__sync_project')
!/\bMCP\b/i.test(syncTool.description) ? ok('sync_project description has no MCP') : fail('sync_project description has no MCP')

console.log(failures === 0 ? String.fromCharCode(10) + 'ALL PASS' : String.fromCharCode(10) + failures + ' FAILURE(S)')
process.exit(failures === 0 ? 0 : 1)
// adapt-check: 2026-08-16
// adapt-check: 2026-08-16
// adapt-check: 2026-08-17
