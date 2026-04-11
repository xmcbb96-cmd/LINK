import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const templatePath = path.join(root, 'templates', 'slash-runner.base.json');
const jsPath = path.join(distDir, 'index.js');
const outputPath = path.join(distDir, 'link.plugin.json');

const template = JSON.parse(await readFile(templatePath, 'utf8'));
const content = await readFile(jsPath, 'utf8');

template.content = content;

await mkdir(distDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
console.log('Built dist/link.plugin.json');
