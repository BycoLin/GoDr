/**
 * 从 package.json 同步版本号到 miniprogram/utils/app-version.ts
 * 小程序运行时无法读取 package.json，需生成可 import 的模块。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = String(pkg.version || '0.0.0');

const out = join(root, 'miniprogram/utils/app-version.ts');
const content = `/** 自动生成：npm run sync:version（勿手改，改 package.json 即可） */
export const APP_VERSION = '${version}';
`;

writeFileSync(out, content, 'utf8');
console.log(`app-version.ts ← package.json v${version}`);
