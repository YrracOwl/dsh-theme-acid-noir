# Acid Noir — DSH Web Theme Plugin

## English

Acid Noir is a selectable, usability-first cyber-editorial theme bundle for DeepSeek Harness Web. It provides dark productivity themes, official Settings integration, reversible lifecycle effects, and a DSH 0.1.2-compatible Client Store path with a legacy runtime fallback. It never patches Harness files or forces a theme on installation.

## 中文

Acid Noir 是面向 DeepSeek Harness Web 的可选择、重可用性的赛博编辑风格主题包，提供深色生产力主题、官方设置集成、可逆生命周期效果，并兼容 DSH 0.1.2 的 Client Store，同时保留旧版 runtime 回退。插件不会修改 Harness 文件，也不会在安装时强制切换主题。

Acid Noir 0.4.2 is a **selectable, usability-first cyber editorial theme plugin** for DeepSeek Harness Web. It is a normal DSH bundle: no Harness source patching, no manual profile overlay, and no forced theme switch on installation.

## Themes

- **Acid Noir** — restrained dark productivity palette with lime actions and cyan structure.
- **Acid Noir Signal** — stronger cyan/lime signal colors while retaining the same readable layout.
- **Default appearance** — immediately returns to the built-in DSH appearance.

Choose the skin in **Settings → General → Acid Noir theme**. The selection is persisted in this browser and synchronized with the DSH Theme Runtime.

## Product behavior

- Registers both skins through `ctx.theme.register()`.
- Adds a real Settings row through `settings.general.item`.
- Does not change the active theme merely because the package was installed.
- Recovers the active Acid Noir skin immediately when saving another Settings section makes DSH re-adopt its built-in Host appearance preference; no F5 is needed.
- Explicit built-in appearance and Default-theme choices clear the custom preference before switching, so recovery never overrides user intent.
- Loads the enhancement stylesheet only while an Acid Noir skin is selected.
- Removes themes, stylesheet, body attributes and listeners when disabled or uninstalled.
- Uses stable DSH hooks for Composer, Tool, Think, Goal and message entrances.
- Does not restyle SSH, MCP, Pet or other unrelated plugins.
- Uses no network fonts, images, audio, copyrighted game assets or external runtime resources.

## Install

```powershell
dsh plugin --profile web add .
```

For a published package:

```powershell
dsh plugin --profile web add dsh-theme-acid-noir
```

Restart `dsh web` after the first installation so the Host discovers the new client bundle. Subsequent local client edits are visible through the existing client-plugin HMR receiver when the bundle route revision updates; otherwise refresh the page.

## Uninstall

First select **Default appearance**, then:

```powershell
dsh plugin --profile web remove dsh-theme-acid-noir
```

No DSH application files need to be restored.

## Development

```powershell
npm run check
npm pack --dry-run
```

The browser half is dependency-free plain JavaScript in DSH `window.__ModuleLoader__` format. The package's DSH dependencies are peers so installing it does not create duplicate client runtimes.

## Compatibility policy

Semantic `--dsw-*` tokens provide the complete base theme. The optional enhancement layer is intentionally small and only targets stable attributes such as `data-composer-card`, `data-tool`, `data-variant="think"`, `data-goal-bar`, and `data-chat-flow-key`. If upstream markup changes, the color theme remains usable even when an enhancement no longer matches.
