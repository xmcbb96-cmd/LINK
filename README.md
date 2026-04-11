# LINK 联机脚本

这是一个面向 **JS-Slash-Runner / 酒馆助手** 的 SillyTavern 联机脚本项目。

当前仓库已经从“单个大 `index.js` 文件”重构为“模块化源码 + 构建产物”的结构，最终仍输出可导入酒馆助手的 JSON 脚本包。

## 当前状态

- 源码已模块化拆分到 `src/`
- 构建脚本位于 `scripts/`
- 产物输出到 `dist/`
- 原版参考文件已移动到 `old/`，仅作为过渡期备份，不参与当前构建

## 目录结构

```text
LINK/
├─ dist/                     # 构建产物
│  ├─ index.js
│  └─ link.plugin.json
├─ old/                      # 原版备份文件，不参与构建
├─ scripts/                  # 构建与检查脚本
│  ├─ build.mjs
│  ├─ build-json.mjs
│  └─ check.mjs
├─ src/
│  ├─ entry/
│  ├─ env/
│  ├─ styles/
│  ├─ network/
│  ├─ store/
│  ├─ features/
│  ├─ tavern/
│  └─ ui/
├─ templates/
│  └─ slash-runner.base.json
├─ package.json
└─ README.md
```

## 模块说明

### 入口
- `src/entry/index.js`：模块加载入口
- `src/entry/preamble.js`：保留原始入口前导内容

### 运行环境
- `src/env/runtime.js`：父窗口、Vue、jQuery 等运行时获取
- `src/env/events.js`：事件注册、追踪与清理

### 样式
- `src/styles/inject.js`：样式注入逻辑

### 核心业务
- `src/network/index.js`：大厅 API、本地频道、WebSocket 客户端
- `src/store/index.js`：Pinia 状态管理、设置持久化

### 功能模块
- `src/features/acu/index.js`：ACU 数据同步
- `src/features/spoiler/index.js`：剧透遮罩渲染
- `src/tavern/hooks.js`：SillyTavern 原生事件桥接

### UI
- `src/ui/panel.js`：主面板组件
- `src/ui/mount.js`：挂载、卸载与初始化流程

## 构建方式

安装依赖：

```bash
npm install
```

执行检查：

```bash
npm run check
```

构建 JS 和 JSON 导入包：

```bash
npm run build
```

仅构建 JS：

```bash
npm run build:js
```

仅生成 JSON 导入包：

```bash
npm run build:json
```

## 构建产物

### `dist/index.js`
模块化源码按固定顺序拼接后的浏览器脚本产物。

### `dist/link.plugin.json`
最终给 JS-Slash-Runner / 酒馆助手导入的 JSON 包。

## 导入使用

1. 执行 `npm run build`
2. 取出 `dist/link.plugin.json`
3. 在酒馆助手 / JS-Slash-Runner 中导入该 JSON
4. 启用脚本并刷新页面

## old 目录说明

`old/` 中保存的是当前构建版不再直接使用的原版文件备份，例如：
- 原版单文件入口
- 原版主题文件
- 原版 JSON 导入包

这些文件当前仅用于人工回溯、临时对比和过渡期验证。

## 注意事项

- 当前构建采用“按模块顺序拼接”的低风险策略，目标是尽量保持原逻辑不变
- 当前构建版与原版 `content` 在文本上可能存在少量注释/空行差异，但外层 JSON 结构和核心逻辑保持一致
- 如需进一步追求与原版 `content` 的字符级一致，可继续精修构建脚本

## 当前建议工作流

- 日常开发只改 `src/` 下源码
- 不再直接修改 `old/` 中原版文件
- 修改后执行：

```bash
npm run build
npm run check
```

确认通过后，再导入 `dist/link.plugin.json` 做酒馆内验证
