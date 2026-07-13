# GoDr 闯关小博士

**GoDr 闯关小博士**是一款面向小学生的免费学习微信小程序，通过闯关答题的形式，覆盖数学、语文、英语等学科知识，让学习变得像玩游戏一样有趣。

当前 MVP：语文古诗词 + 数学速算（统编向 **1～2 年级**），本地保存进度。

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开本仓库根目录（含 `project.config.json`）
3. AppID 可先用测试号 / `touristappid`
4. 确认已开启 TypeScript 编译插件（`project.config.json` → `useCompilerPlugins: ["typescript"]`）

## 目录结构

```
miniprogram/
  data/packs/poetry-g1-g2/   # 语文诗词包
  data/packs/math-g1-g2/     # 数学速算包
  pages/                     # home / games / progress / mine / pack / level / play / result / wrongbook
  assets/tab/                # 底部菜单图标
  utils/                     # registry / quiz / quiz-math / progress / wrongbook / wallet / badges / daily
scripts/extract-poetry.mjs   # 从 doc 粗抽文本（需 antiword）
doc/                         # 原始资料（不打包上传）
```

## 更新知识包

1. 校对或编辑 `miniprogram/data/packs/poetry-g1-g2/items.js`
2. 新增知识包：见 [`miniprogram/data/README.md`](miniprogram/data/README.md)，并在 `utils/registry.ts` 注册
3. 可选：`npm run extract:poetry` 从 DOC 导出粗抽文本便于对照

## 玩法说明

- 底部菜单：首页 / 游戏 / 进度 / 我的
- 知识库：语文古诗词、数学速算（1～2 年级）
- 诗词闯关：选知识包 → 选年级 → 按诗/关卡闯关（需先通关上一关）
- 数学闯关：加减口算、比大小、填空；游戏厅可选语文/数学科目
- 游戏厅：随机挑战、专项玩法、错题 Boss、每日限时
- 连击加分与规则型自适应难度；积分与成就徽章（本地）
