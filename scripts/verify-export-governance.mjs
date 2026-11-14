import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const appRoots = [
  path.join(root, 'apps/admin-system/src'),
  path.join(root, 'apps/merchant-portal/src'),
];
const viewRoots = [
  path.join(root, 'apps/admin-system/src/views'),
  path.join(root, 'apps/merchant-portal/src/pages'),
  path.join(root, 'apps/merchant-portal/src/components'),
];
const allowedBlobFiles = new Set([
  'apps/admin-system/src/utils/download.ts',
  'apps/merchant-portal/src/utils/download.ts',
]);

const failures = [];
let asyncSubmitterCount = 0;
let blobConfigCount = 0;
const blobFiles = new Set();

for (const appRoot of appRoots) {
  walk(appRoot, (file) => {
    if (!/\.(ts|vue)$/.test(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    const relativeFile = relative(file);
    const blobMatches = source.match(/responseType\s*:\s*['"]blob['"]/g) || [];
    blobConfigCount += blobMatches.length;
    if (blobMatches.length > 0) blobFiles.add(relativeFile);
    if (blobMatches.length > 0 && !allowedBlobFiles.has(relativeFile)) {
      failures.push(`${relativeFile} configures a Blob response outside the shared download utility`);
    }

    for (const match of source.matchAll(/export\s+async\s+function\s+(submit[A-Za-z0-9_]*Export(?:Task)?)\b/g)) {
      asyncSubmitterCount += 1;
      const functionStart = match.index ?? 0;
      const nextExport = source.indexOf('\nexport ', functionStart + 1);
      const functionSource = source.slice(
        functionStart,
        nextExport < 0 ? source.length : nextExport,
      );
      if (!/\/export-task(?:s)?(?:[/'"`]|$)/.test(functionSource)) {
        failures.push(
          `${relativeFile}#${match[1]} is named as an asynchronous export submitter but does not call an export-task endpoint`,
        );
      }
    }
  });
}

for (const viewRoot of viewRoots) {
  walk(viewRoot, (file) => {
    if (!file.endsWith('.vue')) return;
    const source = fs.readFileSync(file, 'utf8');
    for (const importMatch of source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*['"]@\/api\/[^'"]+['"]/g)) {
      const names = importMatch[1]
        .split(',')
        .map((name) => name.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);
      for (const name of names) {
        if (/^export[A-Z]/.test(name) && !/^exportTask/.test(name)) {
          failures.push(
            `${relative(file)} imports legacy synchronous export API ${name}; high-volume page exports must submit an asynchronous task`,
          );
        }
      }
    }
  });
}

if (asyncSubmitterCount === 0) {
  failures.push('no asynchronous export submitter was discovered');
}
for (const allowedBlobFile of allowedBlobFiles) {
  if (!blobFiles.has(allowedBlobFile)) {
    failures.push(`${allowedBlobFile} no longer owns a Blob download transport`);
  }
}

if (failures.length > 0) {
  console.error('Export governance check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Export governance check passed for ${asyncSubmitterCount} asynchronous submitters; ${blobConfigCount} Blob configurations remain centralized in ${blobFiles.size} download utilities and no page imports a legacy synchronous export API.`,
);

function walk(directory, visitor) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, visitor);
    else if (entry.isFile()) visitor(target);
  }
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}
