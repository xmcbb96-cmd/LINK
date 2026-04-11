import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const requiredFiles = [
  'src/entry/preamble.js',
  'src/env/runtime.js',
  'src/env/events.js',
  'src/styles/inject.js',
  'src/network/index.js',
  'src/store/index.js',
  'src/features/acu/index.js',
  'src/features/spoiler/index.js',
  'src/tavern/hooks.js',
  'src/ui/panel.js',
  'src/ui/mount.js',
  'templates/slash-runner.base.json',
];

for (const relative of requiredFiles) {
  await access(path.join(root, relative));
}

const template = JSON.parse(await readFile(path.join(root, 'templates', 'slash-runner.base.json'), 'utf8'));
if (template.type !== 'script') {
  throw new Error('模板 type 必须为 script');
}
if (typeof template.content !== 'string') {
  throw new Error('模板 content 字段必须存在且为字符串');
}

console.log('Check passed');
