# GoDr 闯关小博士

**GoDr 闯关小博士**是一款面向小学生的免费学习微信小程序，通过闯关答题的形式，覆盖数学、语文、英语等学科知识，让学习变得像玩游戏一样有趣。

当前 MVP 先落地语文古诗词：用统编版 **1～2 年级上册** 古诗词做轻量闯关（下一句、配对、选诗名），本地保存进度。

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开本仓库根目录（含 `project.config.json`）
3. AppID 可先用测试号 / `touristappid`
4. 确认已开启 TypeScript 编译插件（`project.config.json` → `useCompilerPlugins: ["typescript"]`）

## 目录结构

```
miniprogram/
  data/packs/poetry-g1-g2/   # 知识包（manifest + items）
  pages/                     # home / pack / level / play / result / progress
  utils/                     # registry / quiz / progress / types
scripts/extract-poetry.mjs   # 从 doc 粗抽文本（需 antiword）
doc/                         # 原始资料（不打包上传）
```

## 更新知识包

1. 校对或编辑 `miniprogram/data/packs/poetry-g1-g2/items.json`
2. 新增知识包：见 [`miniprogram/data/README.md`](miniprogram/data/README.md)，并在 `utils/registry.ts` 注册
3. 可选：`npm run extract:poetry` 从 DOC 导出粗抽文本便于对照

## 玩法说明

- 选知识包 → 选年级 → 按诗闯关（需先通关上一首）
- 每局 5 题：选下一句 / 上下句配对 / 选诗名（或作者）
- 正确率换算星级并写入本地 `progress:{packId}`
