import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoots = [path.join(root, 'apps'), path.join(root, 'packages')];
const governedAppRoots = [
  path.join(root, 'apps/admin-system/src'),
  path.join(root, 'apps/merchant-portal/src'),
];

const axiosClients = [];
const governedSources = [];
for (const sourceRoot of sourceRoots) {
  walk(sourceRoot, (file) => {
    if (!/\.(ts|vue)$/.test(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    if (source.includes('axios.create(')) {
      axiosClients.push({ file, source });
    }
  });
}

for (const appRoot of governedAppRoots) {
  walk(appRoot, (file) => {
    if (!/\.(ts|vue)$/.test(file)) return;
    governedSources.push({ file, source: fs.readFileSync(file, 'utf8') });
  });
}

const failures = [];
for (const client of axiosClients) {
  if (!client.source.includes('createDuplicateSubmissionGuard')) {
    failures.push(
      `${relative(client.file)} creates an Axios client without the shared submission guard`,
    );
  }
  if (!client.source.includes('.acquire(config)')) {
    failures.push(
      `${relative(client.file)} does not acquire the submission guard in its request interceptor`,
    );
  }
  if (
    !client.source.includes('.release(response.config)') ||
    !client.source.includes('.release(error.config)')
  ) {
    failures.push(
      `${relative(client.file)} does not release the submission guard on both success and failure`,
    );
  }
}

if (axiosClients.length === 0) {
  failures.push('no Axios client was discovered');
}

const directTransportPatterns = [
  { label: 'direct fetch transport', pattern: /\bfetch\s*\(/g },
  { label: 'direct XMLHttpRequest transport', pattern: /\bnew\s+XMLHttpRequest\s*\(/g },
  { label: 'direct axios mutation', pattern: /\baxios\s*\.\s*(post|put|patch|delete)\s*[<(]/gi },
];

let mutationCallCount = 0;
const mutationCountsByApp = new Map();
for (const item of governedSources) {
  const app = relative(item.file).startsWith('apps/admin-system/')
    ? 'admin-system'
    : 'merchant-portal';
  const mutations = item.source.match(/\.(post|put|patch|delete)\s*[<(]/gi) || [];
  mutationCallCount += mutations.length;
  mutationCountsByApp.set(app, (mutationCountsByApp.get(app) || 0) + mutations.length);

  for (const { label, pattern } of directTransportPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(item.source)) {
      failures.push(`${relative(item.file)} uses a ${label} outside the governed clients`);
    }
  }

  if (/allowDuplicateSubmission\s*:\s*true/.test(item.source)) {
    failures.push(
      `${relative(item.file)} bypasses duplicate-submission protection without a reviewed governance exception`,
    );
  }
}

for (const app of ['admin-system', 'merchant-portal']) {
  if (!mutationCountsByApp.get(app)) {
    failures.push(`${app} has no discovered mutation calls; the governance scan is likely misconfigured`);
  }
}

if (failures.length > 0) {
  console.error('Submission governance check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Submission governance check passed for ${axiosClients.length} Axios client factories and ${mutationCallCount} Admin/Merchant mutation calls (${Array.from(mutationCountsByApp.entries())
    .map(([app, count]) => `${app}: ${count}`)
    .join(', ')}).`,
);

function walk(directory, visitor) {
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
