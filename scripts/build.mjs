import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

const parts = [
  path.join(root, 'src', 'entry', 'preamble.js'),
  path.join(root, 'src', 'env', 'runtime.js'),
  path.join(root, 'src', 'env', 'events.js'),
  path.join(root, 'src', 'styles', 'inject.js'),
  path.join(root, 'src', 'network', 'index.js'),
  path.join(root, 'src', 'store', 'index.js'),
  path.join(root, 'src', 'features', 'acu', 'index.js'),
  path.join(root, 'src', 'features', 'spoiler', 'index.js'),
  path.join(root, 'src', 'tavern', 'hooks.js'),
  path.join(root, 'src', 'ui', 'panel.js'),
  path.join(root, 'src', 'ui', 'mount.js'),
];

const banner = `/**\n * LINK build output\n * Source: modularized project layout with lossless concatenation build\n * Generated at: ${new Date().toISOString()}\n */\n\n`;

const contents = [];
for (const file of parts) {
  const source = await readFile(file, 'utf8');
  contents.push(`// --- ${path.relative(root, file).replace(/\\/g, '/')} ---\n${source.trimEnd()}\n`);
}

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, 'index.js'), banner + contents.join('\n'), 'utf8');
console.log('Built dist/index.js');
