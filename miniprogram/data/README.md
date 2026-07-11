# 知识包格式说明

每个知识包放在 `miniprogram/data/packs/<packId>/` 下：

- `manifest.json`：包元信息（id、标题、学科、年级、版本）
- `items.json`：条目数组

## manifest 示例

```json
{
  "id": "poetry-g1-g2",
  "title": "古诗词 · 1～2 年级",
  "subject": "语文",
  "grades": [1, 2],
  "version": "1.0.0",
  "description": "…",
  "itemCount": 13
}
```

## 诗词条目 schema

```json
{
  "id": "poetry_g1_yong_e",
  "type": "poetry",
  "grade": 1,
  "title": "咏鹅",
  "author": "骆宾王",
  "dynasty": "唐",
  "lines": ["鹅鹅鹅", "曲项向天歌", "白毛浮绿水", "红掌拨清波"],
  "tags": ["必背", "上册"]
}
```

## 新增知识包步骤

1. 新建目录 `packs/<新包id>/`
2. 写入 `manifest.json` 与 `items.json`
3. 在 [`registry.ts`](../utils/registry.ts) 的 `PACK_IDS` 中注册
4. 若条目 `type` 不是 `poetry`，需在出题引擎中增加对应题型模板

首期仅注册 `poetry-g1-g2`。资料来源见仓库 `doc/`，抽取脚本：`npm run extract:poetry`。
