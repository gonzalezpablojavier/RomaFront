import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const IMPORT =
  "import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../session/sessionStore';";
const IMPORT_DEPTH2 =
  "import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';";

const USER_CODE_RE =
  /\(\(localStorage\.getItem\('user'\) \? JSON\.parse\(localStorage\.getItem\('user'\)!?\) : null\) as \{ user_code: string \| null \}\)\?\.user_code/g;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

function importLine(file) {
  const rel = path.relative(path.dirname(file), path.join(ROOT, 'session', 'sessionStore'));
  const normalized = rel.split(path.sep).join('/');
  const prefix = normalized.startsWith('.') ? '' : './';
  return `import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '${prefix}${normalized}';`;
}

const skip = new Set([
  path.join(ROOT, 'session', 'sessionStore.ts'),
  path.join(ROOT, 'api', 'api_auth.ts'),
  path.join(ROOT, 'context', 'AuthContext.tsx'),
  path.join(ROOT, 'config', 'api_empresa.ts'),
  path.join(ROOT, 'router', 'EmpresaPrivateRoute.tsx'),
]);

let changed = 0;

for (const file of walk(ROOT)) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes("localStorage.getItem('user')") &&
      !src.includes("localStorage.getItem('l_empresa_id')") &&
      !src.includes('localStorage.getItem("user")') &&
      !src.includes('localStorage.getItem("l_empresa_id")')) {
    continue;
  }

  const original = src;
  src = src.replace(USER_CODE_RE, 'getSessionUserId()');
  src = src.replace(
    /localStorage\.getItem\('user'\)\s*\?\s*JSON\.parse\(localStorage\.getItem\('user'\)!?\)\s*:\s*null/g,
    'getSessionUser()',
  );
  src = src.replace(
    /JSON\.parse\(localStorage\.getItem\('user'\)!?\)/g,
    'getSessionUser()',
  );
  src = src.replace(
    /localStorage\.getItem\('user'\)/g,
    "(() => { throw new Error('use getSessionUser()'); })()",
  );
  src = src.replace(
    /localStorage\.getItem\('l_empresa_id'\)\s*\|\|\s*'default'/g,
    "getSessionEmpresaId() ?? 'default'",
  );
  src = src.replace(
    /localStorage\.getItem\('l_empresa_id'\)\s*\?\?\s*''/g,
    "getSessionEmpresaId() ?? ''",
  );
  src = src.replace(
    /localStorage\.getItem\('l_empresa_id'\)/g,
    'getSessionEmpresaId()',
  );

  if (src === original) continue;

  if (!src.includes('session/sessionStore')) {
    const lines = src.split('\n');
    let insertAt = 0;
    while (insertAt < lines.length && /^import /.test(lines[insertAt])) insertAt++;
    lines.splice(insertAt, 0, importLine(file));
    src = lines.join('\n');
  }

  fs.writeFileSync(file, src);
  changed++;
  console.log('updated', path.relative(process.cwd(), file));
}

console.log(`Done. ${changed} files updated.`);
