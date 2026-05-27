/**
 * Completa el split frontend/ + backend/. Ejecutar una vez desde la raíz:
 *   node monorepo-split.mjs
 * o doble clic en RUN-SPLIT.cmd
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) {
      rmrf(path.join(target, name));
    }
    fs.rmdirSync(target);
  } else {
    fs.unlinkSync(target);
  }
}

function move(src, dest) {
  const from = path.join(root, src);
  const to = path.join(root, dest);
  if (!fs.existsSync(from)) {
    return;
  }
  if (fs.existsSync(to)) {
    rmrf(from);
    console.log('removed duplicate:', src);
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  console.log('moved:', src, '->', dest);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(path.join(root, 'backend', 'scripts'));
ensureDir(path.join(root, 'frontend'));

move('supabase', 'backend/supabase');
if (fs.existsSync(path.join(root, 'scripts', 'build-remote-setup.ps1'))) {
  move('scripts/build-remote-setup.ps1', 'backend/scripts/build-remote-setup.ps1');
}

const toFrontend = [
  'app',
  'src',
  'assets',
  'tests',
  'package-lock.json',
  'app.json',
  'app.config.ts',
  'metro.config.js',
  'babel.config.js',
  'jest.config.js',
  'eas.json',
  'expo-env.d.ts',
  '.env.example',
  '.env.template',
  '.env',
];

for (const item of toFrontend) {
  move(item, `frontend/${item}`);
}

// package.json: quitar raíz antigua si frontend ya tiene el suyo
const rootPkg = path.join(root, 'package.json');
const frontPkg = path.join(root, 'frontend', 'package.json');
if (fs.existsSync(rootPkg) && fs.existsSync(frontPkg)) {
  try {
    const rootContent = fs.readFileSync(rootPkg, 'utf8');
    if (rootContent.includes('"expo-router/entry"')) {
      // todavía es el package del app en raíz — se reemplaza al final
    }
  } catch {
    /* ignore */
  }
}

const scriptsDir = path.join(root, 'scripts');
if (fs.existsSync(scriptsDir)) {
  const left = fs.readdirSync(scriptsDir);
  if (left.length === 0) {
    fs.rmdirSync(scriptsDir);
  } else if (left.length === 1 && left[0] === 'generate-assets.js') {
    move('scripts', 'frontend/scripts');
  } else if (left.includes('generate-assets.js')) {
    ensureDir(path.join(root, 'frontend', 'scripts'));
    move('scripts/generate-assets.js', 'frontend/scripts/generate-assets.js');
    if (fs.readdirSync(scriptsDir).length === 0) fs.rmdirSync(scriptsDir);
  }
}

// Raíz: package.json monorepo
fs.writeFileSync(
  path.join(root, 'package.json'),
  JSON.stringify(
    {
      name: 'couple-app-monorepo',
      private: true,
      scripts: {
        start: 'npm run start --prefix frontend',
        android: 'npm run android --prefix frontend',
        ios: 'npm run ios --prefix frontend',
        lint: 'npm run lint --prefix frontend',
        test: 'npm run test --prefix frontend',
        typecheck: 'npm run typecheck --prefix frontend',
        'generate-assets': 'npm run generate-assets --prefix frontend',
        'supabase:bundle-sql':
          'powershell -ExecutionPolicy Bypass -File backend/scripts/build-remote-setup.ps1',
        split: 'node monorepo-split.mjs',
      },
    },
    null,
    2,
  ) + '\n',
);

// frontend package sin supabase:bundle-sql
if (fs.existsSync(frontPkg)) {
  const pj = JSON.parse(fs.readFileSync(frontPkg, 'utf8'));
  delete pj.scripts?.['supabase:bundle-sql'];
  fs.writeFileSync(frontPkg, JSON.stringify(pj, null, 2) + '\n');
}

// tsconfig / eslint frontend
const tsc = path.join(root, 'frontend/tsconfig.json');
if (fs.existsSync(tsc)) {
  const lines = fs.readFileSync(tsc, 'utf8').split('\n').filter((l) => !l.includes('supabase'));
  fs.writeFileSync(tsc, lines.join('\n'));
}

const esl = path.join(root, 'frontend/.eslintrc.cjs');
if (fs.existsSync(esl)) {
  let ec = fs.readFileSync(esl, 'utf8');
  ec = ec.replace(/,?\s*['"]supabase\/functions\/['"]/g, '');
  ec = ec.replace(/supabase\/functions\/,?\s*/g, '');
  fs.writeFileSync(esl, ec);
}

// README
const readmePath = path.join(root, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(
    /## Configuración local[\s\S]*?## Estructura/,
    `## Configuración local

1. Si aún ves \`app/\` en la raíz, ejecuta una vez: \`node monorepo-split.mjs\` (o \`RUN-SPLIT.cmd\`).

2. Copia \`frontend/.env.example\` → \`frontend/.env\` y completa:

\`\`\`env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
\`\`\`

3. Aplica migraciones en Supabase (desde \`backend/\`):

\`\`\`bash
cd backend
supabase db push
# o ejecuta backend/supabase/migrations/*.sql y seed.sql
\`\`\`

4. Instala y arranca el frontend:

\`\`\`bash
cd frontend
npm install --legacy-peer-deps
npm run generate-assets
npx expo start
\`\`\`

Desde la raíz también puedes usar: \`npm start\` (delega al frontend).

## Estructura`,
  );
  readme = readme.replace(
    /- `app\/`[\s\S]*?- `supabase\/`[^\n]*/,
    `- \`frontend/app/\` — pantallas (Expo Router)
- \`frontend/src/\` — components, hooks, services, repositories
- \`backend/supabase/\` — migraciones, seed, Edge Function push`,
  );
  fs.writeFileSync(readmePath, readme);
}

// docs
const doc = path.join(root, 'docs/SUPABASE-REMOTO.md');
if (fs.existsSync(doc)) {
  let d = fs.readFileSync(doc, 'utf8');
  d = d.replace(/(?<![/\\])supabase\//g, 'backend/supabase/');
  d = d.replace(
    'cd C:\\Users\\yareli.camacho\\Downloads\\my-Project',
    'cd backend   # desde la raíz del repo',
  );
  d = d.replace(
    '.\\scripts\\build-remote-setup.ps1',
    '.\\backend\\scripts\\build-remote-setup.ps1',
  );
  d = d.replace('Copia `.env.example` → `.env`', 'Copia `frontend/.env.example` → `frontend/.env`');
  d = d.replace('npm run generate-assets\nnpx expo start', 'cd frontend\nnpm run generate-assets\nnpx expo start');
  fs.writeFileSync(doc, d);
}

console.log('\nSplit completado.');
console.log('Siguiente: cd frontend && npm install --legacy-peer-deps && npx expo start');
