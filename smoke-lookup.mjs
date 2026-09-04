// smoke-lookup.mjs — 诊断脚本（非正式验收）
//
// 用 stub ctx 挂载 dsh-hmos-sidebar/tools，验证 dcli__api_lookup 的结构与输出。
// 不依赖真实 devecocli / DevEco Studio 才能运行：subprocess 用 stub，SDK 扫描只读
// 文件系统（HMOS_DEVECO_HOME 指向的 SDK 目录存在与否决定 SDK 命中数量）。
//
// 环境变量（HMOS_* 可覆盖默认；HMOS_PKG 必填）：
//   HMOS_PKG          dsh-hmos-sidebar 包根目录（必填）
//   HMOS_CLI          deveco-cli 入口 cli.js（可选，仅用于 apply config，不会实际 spawn）
//   HMOS_PROJECT      工程根（可选，仅用于 apply config 的 projectPath）
//   HMOS_DEVECO_HOME  DevEco Studio 安装根（可选，用于 SDK 扫描；缺省走自动探测）
//
// 退出码：0 全部断言通过；1 任一断言失败或环境缺失。

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const PKG = process.env.HMOS_PKG
if (!PKG) {
  console.error('FAIL: 需要环境变量 HMOS_PKG 指向 dsh-hmos-sidebar 包根目录')
  process.exit(1)
}
const modUrl = pathToFileURL(path.join(PKG, 'lib', 'dcli-tools.mjs')).href
const { apply, TOOLS, toolsSupportedOn } = await import(modUrl)
const { resolveEnv } = await import(pathToFileURL(path.join(PKG, 'lib', 'environment.js')).href)

const config = {}
if (process.env.HMOS_CLI) config.cliPath = process.env.HMOS_CLI
if (process.env.HMOS_PROJECT) config.projectPath = process.env.HMOS_PROJECT
if (process.env.HMOS_DEVECO_HOME) config.devEcoHome = process.env.HMOS_DEVECO_HOME

const registered = []
const tools = {
  register: (d) => { registered.push(d); return () => {} },
}
const subprocess = {
  spawn: ({ argv }) => {
    console.log('[spawn stub] ' + argv.join(' '))
    return {
      done: Promise.resolve({ exitCode: 0, signal: null }),
      collected: {
        stdout: { readFrom: () => ({ text: '(docs stub)' }) },
        stderr: { readFrom: () => ({ text: '' }) },
      },
    }
  },
  resolveExecutable: async () => 'node',
}

let failures = 0
const check = (cond, msg) => { if (cond) console.log('PASS ' + msg); else { failures += 1; console.error('FAIL ' + msg) } }

check(TOOLS.length === 40, 'TOOLS exactly 40 (' + TOOLS.length + ')')
check(toolsSupportedOn('win32') === true && toolsSupportedOn('linux') === false, 'toolsSupportedOn Windows-only guard')

apply({ tools, subprocess, effect: (fn) => fn() }, config)
check(registered.length === 40, 'apply registers 40 tools (' + registered.length + ')')

const def = registered.find((d) => d.name === 'dcli__api_lookup')
check(!!def, 'dcli__api_lookup registered')

if (def) {
  const env = resolveEnv(config)
  const hasStudio = env.devEcoOk
  if (hasStudio) {
    const queries = [
      ['Button', 'component'],
      ['@ComponentV2', 'component'],
      ['@ohos.arkui.UIContext', 'api'],
      ['@kit.ArkUI', 'kits'],
      ['@arkts.collections', 'arkts'],
    ]
    for (const [name, scope] of queries) {
      try {
        const r = await def.execute({ name, scope, maxResults: '3' }, { signal: undefined })
        check(r && typeof r.stdout === 'string' && r.stdout.length > 0, 'api_lookup ' + name + ' returns stdout')
        if (r && r.stdout) console.log('---- ' + name + ' (' + scope + ') ----\n' + r.stdout.slice(0, 800))
      } catch (e) {
        failures += 1
        console.error('FAIL api_lookup ' + name + ': ' + (e && e.message ? e.message : String(e)))
      }
    }
  } else {
    console.log('NOTE: 未检测到 DevEco Studio SDK（HMOS_DEVECO_HOME），跳过 SDK 扫描断言')
    try {
      await def.execute({ name: 'Button', scope: 'component' }, { signal: undefined })
      failures += 1
      console.error('FAIL api_lookup should reject when DevEco Studio SDK missing')
    } catch (e) {
      check(/DevEco Studio/i.test(String(e && e.message || e)), 'api_lookup rejects when DevEco Studio SDK missing')
    }
  }
}

if (failures) {
  console.error(failures + ' FAILURE(S)')
  process.exit(1)
}
console.log('ALL PASS')
process.exit(0)
