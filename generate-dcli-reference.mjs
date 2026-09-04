// generate-dcli-reference.mjs — 从 dsh-hmos-sidebar 包的 dcli-tools.mjs 的 TOOLS 表生成技能速查 SKILL.md
// 用法：node generate-dcli-reference.mjs
// 输出：native-harmonyos 预设的 skills/dcli-tools-reference/SKILL.md
//
// ⚠️ 仅本机工具：SRC/OUT 默认指向本机（Windows）布局；换机/换平台请用环境变量覆盖：
//   HMOS_SRC（源 file:// URL） / HMOS_OUT（输出 SKILL.md 路径）
// 说明：生成源是 dsh-hmos-sidebar 包唯一的 dcli 工具定义；生成时会对模型可见文本做脱敏
//       （去掉 mcp__deveco 对照措辞、个人工程路径/设备序列号/包名，统一替换为占位符）。
import fs from 'node:fs'
import path from 'node:path'

const SRC = process.env.HMOS_SRC || 'file:///D:/Resources/DSH_PRJ/DevPlugins/dsh-hmos-sidebar/lib/dcli-tools.mjs'
const OUT = process.env.HMOS_OUT || 'C:/Users/CarryWho/.dsh/.agent-presets/native-harmonyos/skills/dcli-tools-reference/SKILL.md'
const { TOOLS } = await import(SRC)

const BQ = String.fromCharCode(96) // `
const FENCE = BQ.repeat(3)
const nameOf = (name) => 'dcli__' + name.replace(/^dcli__/, '')

// 示例统一用泛化占位符：工程根 / 设备序列号 / 包名 / 模拟器名 / HAP 路径
// （不引入任何个人工程、真实序列号或包名，保证模型可见文本不含私密信息）。
const EXAMPLES = {
  dcli__create_project: { appName: 'MyApp', projectPath: '<project-root>' },
  dcli__sync_project: { projectPath: '<project-root>' },
  dcli__build_project: { projectPath: '<project-root>', product: 'debug', modules: ['entry@debug'], buildMode: 'debug' },
  dcli__clean_project: { projectPath: '<project-root>' },
  dcli__run_app: { projectPath: '<project-root>', device: '<device-serial>' },
  dcli__api_lookup: { name: 'TextInput', scope: 'component', maxResults: '5' },
  dcli__get_device_logs: { device: '<device-serial>', bundleName: '<bundle-name>', tail: '200' },
  dcli__docs_search: { keywords: ['@ComponentV2', '状态管理'] },
  dcli__auth_status: {},
  // 双签名工具包含密码参数，不生成会进入模型可见文本的调用示例。
  dcli__configure_dual_signing: undefined,
  dcli__check_lint: { projectPath: '<project-root>', path: 'entry/src/main/ets' },
  dcli__check_compat: { projectPath: '<project-root>', sourceVersion: '6.1.0(23)', targetVersion: '6.1.1(24)' },
  dcli__start_app: { bundleName: '<bundle-name>', moduleName: 'entry', device: '<device-serial>' },
  dcli__install_hap: { hapPath: '<project-root>/entry/build/debug/outputs/debug/entry-debug-signed.hap', device: '<device-serial>', bundleName: '<bundle-name>' },
  dcli__emulator_start: { names: ['<emulator-name>'] },
  dcli__emulator_fold: { state: 'open', target: '<emulator-name>' },
}

// 模型可见文本脱敏：
//  - 去掉 mcp__deveco 对照措辞（等价 mcp__deveco__check / 对应 mcp__deveco__restart 等）
//  - 去掉"serve mcp"对照，只保留行为
//  - 去除任何指向外部工具/服务的对照引用（MCP、uiverify、verifyUI）
// 个人工程路径 / 设备序列号 / 包名（模型可见文本中一律替换为泛化占位符）。
// 这些值仅可能残留在工具/参数描述示例里；生成源本身不附带真实设备，只防备忘串泄漏。
const PRIVATE_RE = [
  [/D:[\\/]Resources[\\/]DevecoCode_PRJ[\\/]LingJingZhiTong/g, '<project-root>'],
  [/D:[\\/]Resources[\\/]DSH_PRJ[\\/]DevHarmonyOS/g, '<project-root>'],
  [/D:[\\/]Resources[\\/]HMOS_PRJ[\\/]\w+/g, '<project-root>'],
  [/D:[\\/]Projects/g, '<project-root>'],
  [/2PM0223B07000109/g, '<device-serial>'],
  [/com\.yrracowl\.lingleap/g, '<bundle-name>'],
  [/Pura X Max/g, '<emulator-name>'],
  // 任意盘符 + 分隔符的临时目录示例（如 D:/tmp/shot1.png）→ 泛化输出目录，避免生成文本携带盘符
  [/[A-Za-z]:[\\/]tmp[\\/][\w.]+/g, '<output-dir>/shot1.png'],
  [/[A-Za-z]:[\\/]tmp/g, '<output-dir>'],
]

function sanitize(text) {
  let out = String(text)
    .replace(/（原生封装，等价 mcp__deveco__check 但可指定工程）/g, '（原生封装，可指定工程）')
    .replace(/（对应 mcp__deveco__restart 的原生封装）/g, '（原生封装）')
    .replace(/mcp__deveco__\w+/g, '')
    .replace(/，等价 mcp__deveco__check\b/g, '')
    .replace(/（MCP 不封装交互命令）/g, '')
    .replace(/（devecocli init 只是安装 skill\/MCP 配置，非同步）/g, '（devecocli init 只安装 skill 级配置，非工程同步）')
    .replace(/serve mcp/g, 'LSP 常驻实例')
    .replace(/LSP 常驻实例 实例/g, 'LSP 常驻实例')
    .replace(/常驻 LSP 常驻实例/g, '常驻 LSP 实例')
    .replace(/（非 MCP）/g, '')
    .replace(/\s*（原生封装，可指定工程）\s*/g, '（原生封装，可指定工程）')
  for (const [re, rep] of PRIVATE_RE) out = out.replace(re, rep)
  return out.trim()
}

function typeOf(p) {
  if (p.type === 'array') return 'array'
  if (p.type === 'boolean') return 'boolean'
  if (p.enum) return 'string（' + p.enum.join('/') + '）'
  return 'string'
}

function paramTable(tool) {
  const keys = Object.keys(tool.parameters || {})
  if (!keys.length) return '无参数。'
  const rows = keys.map((k) => {
    const p = tool.parameters[k]
    const req = p.required === true ? '**是**' : '否'
    const esc = (v) => String(v).replace(/\|/g, '\\|')
    return '| `' + k + '` | ' + req + ' | ' + typeOf(p) + ' | ' + esc(sanitize(p.description || '')) + ' |'
  })
  return '| 参数 | 必填 | 类型/约束 | 说明 |\n|---|---|---|---|\n' + rows.join('\n')
}

function exampleFor(tool) {
  const ex = EXAMPLES[tool.name]
  if (ex === undefined) return ''
  return '示例：' + FENCE + 'json\n' + JSON.stringify(ex, null, 2).replace(/\n/g, '\n') + '\n' + FENCE
}

const head = `---
name: dcli-tools-reference
description: dcli 工具参数速查：${TOOLS.length} 个原生工具的完整参数、必填项、枚举与高频示例。构建、装真机、查日志、查 API 签名、查文档前先查本技能确认参数，避免臆造。
---

# dcli 工具参数速查（原生插件）

所有 dcli__* 工具均为原生注册的结构化工具，调用时直接传 JSON 参数；projectPath 默认当前会话工程，跨工程传真实工程根。

## 使用原则

- **多工程**：构建/安装/运行/日志类工具传 projectPath 指向要操作的真实工程根；单工程会话可省略（默认当前工程）。
- **真机安装**：只装 debug 签名包（entry-debug-signed.hap），勿装 default/release 签名包（报错 9568322）。
- **双 product 工程**：debug 调试签名 = product "debug" + modules "entry@debug"；发布 = product "default"。
- **hdc 类工具**（install_hap/start_app）与 api_lookup：需要 devEcoHome（解析链：patch config.devEcoHome → DEVECO_HOME → DEVECO_SDK_HOME 父目录 → 常见安装目录探测）；hapPath 传绝对路径。
- **查 API 统一入口**：dcli__api_lookup 一次查询 SDK .d.ts 精确签名（component/api/kits/arkts/hms 五区）+ 本地文档库命中，多源印证；文档全文用 dcli__docs_read（documentId 来自 docs_search）。
- **代码静态检查**用 dcli__lsp_check（常驻实例，可指定工程；卡死用 dcli__lsp_restart）；规范检查用 dcli__check_lint。

`

const sections = TOOLS.map((tool) => {
  const desc = sanitize(tool.description)
  return '### `' + nameOf(tool.name) + '`\n\n' + desc + '\n\n' + paramTable(tool) + '\n' + (exampleFor(tool) ? '\n' + exampleFor(tool) + '\n' : '')
})

fs.writeFileSync(OUT, head + sections.join('\n'))
console.log('written', OUT, 'tools:', TOOLS.length, 'source:', SRC)
