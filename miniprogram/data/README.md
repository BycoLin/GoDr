# 知识包格式说明

每个知识包放在 `miniprogram/data/packs/<packId>/` 下：

- `manifest.js`：包元信息（`module.exports`）
- `items.js`：条目数组（`module.exports`）

> 微信小程序不能直接 `require` `.json`，知识包需用 JS 模块导出。

## manifest 示例

```js
module.exports = {
  id: 'poetry-g1-g2',
  title: '古诗词 · 1～2 年级',
  subject: '语文',
  grades: [1, 2],
  version: '1.0.0',
  description: '…',
  itemCount: 13,
};
```

## 诗词条目 schema

```js
{
  id: 'poetry_g1_yong_e',
  type: 'poetry',
  grade: 1,
  title: '咏鹅',
  author: '骆宾王',
  dynasty: '唐',
  lines: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'],
  tags: ['必背', '上册'],
}
```

## 新增知识包步骤

1. 新建目录 `packs/<新包id>/`
2. 写入 `manifest.js` 与 `items.js`（均用 `module.exports`）
3. 在 [`registry.ts`](../utils/registry.ts) 的 `PACK_IDS` 中注册并 `require`
4. 若条目 `type` 不是 `poetry`，需在出题引擎中增加对应题型模板

首期注册 `poetry-g1-g2`（语文）与 `math-g1-g2`（数学）。诗词资料见仓库 `doc/`，抽取脚本：`npm run extract:poetry`。

## 数学条目 schema

```js
{
  id: 'math_g1_add10',
  type: 'math',
  grade: 1,
  title: '10以内加法',
  subtitle: '速算入门',
  skill: 'add', // add | sub | mix | compare | missing
  max: 10,
  tags: ['速算', '加法'],
}
```
