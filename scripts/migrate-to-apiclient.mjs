import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');
const targets = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(name)) targets.push(full);
  }
}
walk(root);

const skip = new Set([
  path.join(root, 'api', 'apiClient.ts'),
  path.join(root, 'api', 'api_auth.ts'),
  path.join(root, 'services', 'desempenoService.ts'),
]);

let changed = 0;

for (const file of targets) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('axios') && !src.includes('fetch(`${') && !src.includes("fetch(`${")) continue;
  if (file.includes('api_mundial.ts')) continue;

  const original = src;
  const depth = path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const importPath = `${'../'.repeat(depth)}api/apiClient`;

  if (/import axios from ['"]axios['"]/.test(src) && !src.includes('apiClient')) {
    src = src.replace(/import axios from ['"]axios['"];?\r?\n/, `import { apiClient } from '${importPath}';\n`);
  }

  src = src.replace(/\baxios\./g, 'apiClient.');
  src = src.replace(/\$\{API_URL\}\//g, '/');
  src = src.replace(/\$\{apiUrl\}\//g, '/');
  src = src.replace(/`\$\{import\.meta\.env\.VITE_API_DISTRI_API\}\//g, '`/');

  src = src.replace(/,\s*\{\s*headers:\s*\{[^}]*'x-empresa-id'[^}]*\}\s*\}/g, '');
  src = src.replace(/,\s*\{\s*headers:\s*headers\(\)\s*\}/g, '');

  src = src.replace(/const API_URL = [`'"]?\$\{import\.meta\.env\.VITE_API_DISTRI_API\}[`'"]?;?\r?\n/g, '');
  src = src.replace(/const API_URL = import\.meta\.env\.VITE_API_DISTRI_API;?\r?\n/g, '');

  if (src !== original) {
    fs.writeFileSync(file, src, 'utf8');
    changed++;
    console.log('updated', path.relative(process.cwd(), file));
  }
}

console.log(`[migrate] ${changed} archivos actualizados`);
