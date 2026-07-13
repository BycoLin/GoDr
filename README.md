# GoDr 小博士练习

**GoDr 小博士练习**是一款面向小学生的免费学习微信小程序，提供语文、数学、英语的趣味自测与进度记录，帮助巩固课内知识。

当前内容：古诗词默写练习、口算自测、英语单词认读（面向 **1～2 年级**），进度仅保存在本地。

## 建议上架信息（教育信息展示）

**推荐类目（个人主体）**：教育服务 → **教育信息展示**

> 说明：该类目适合无培训资质的个人主体；不保证必定过审。产品定位请保持「信息展示 + 趣味自测练习」，避免写成培训/网课/游戏。

**小程序名称建议**：小博士练习（若重名可微调）

**简介（可粘贴）**：

```
面向小学生的免费本地练习工具。提供语文古诗词、数学口算、英语单词趣味自测与进度记录，支持错题复习与每日自测。无需登录，不收集个人信息。
```

**审核说明（可粘贴）**：

```
本小程序为教育信息展示与趣味自测工具，非培训机构、不提供网课/直播/付费课程，无内购与广告。
功能：课内知识自测练习、本地进度记录、错题复习、每日限时自测。
测试账号：无需登录，打开即可使用。
类目依据：教育服务-教育信息展示。
```

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开本仓库根目录（含 `project.config.json`）
3. AppID 可先用测试号 / `touristappid`；上架需换成正式 AppID
4. 确认已开启 TypeScript 编译插件（`project.config.json` → `useCompilerPlugins: ["typescript"]`）

## 目录结构

```
miniprogram/
  data/packs/poetry-g1-g2/   # 语文诗词包
  data/packs/math-g1-g2/     # 数学速算包
  data/packs/english-g1-g2/  # 英语单词包
  pages/                     # home / games / progress / mine / pack / level / play / result / wrongbook
  assets/tab/                # 底部菜单图标
  utils/                     # registry / quiz / quiz-math / quiz-english / progress / wrongbook / wallet / badges / daily
scripts/extract-poetry.mjs   # 从 doc 粗抽文本（需 antiword）
doc/                         # 原始资料（不打包上传）
```

## 更新知识包

1. 校对或编辑 `miniprogram/data/packs/poetry-g1-g2/items.js`
2. 新增知识包：见 [`miniprogram/data/README.md`](miniprogram/data/README.md)，并在 `utils/registry.ts` 注册
3. 可选：`npm run extract:poetry` 从 DOC 导出粗抽文本便于对照

## 功能说明

- 底部菜单：首页 / 练习 / 进度 / 我的
- 知识内容：语文古诗词、数学口算、英语单词（1～2 年级）
- 循序练习：选内容包 → 选年级 → 按关卡练习
- 趣味练习：综合自测、专项练习、错题复习、每日自测
- 本地积分与练习成就（无付费）
