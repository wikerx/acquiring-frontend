import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const sourceRoots = [
    resolve(repositoryRoot, 'apps/admin-system/src'),
    resolve(repositoryRoot, 'apps/merchant-portal/src'),
];
const today = new Date().toISOString().slice(0, 10);

// Existing endpoints may remain only as time-bounded compatibility adapters while their binary
// assets are registered in Template Center. New exceptions are forbidden.
const legacyAdapters = [
    {
        endpoint: /^\/admin\/risk\/\$\{moduleType\}\/\$\{functionCode\}\/template$/,
        removeAfter: '2026-12-31',
        owner: 'apps/admin-system/src/api/risk/index.ts',
    },
    {
        endpoint: /^\/admin\/risk\/trade-black\/template$/,
        removeAfter: '2026-12-31',
        owner: 'apps/admin-system/src/api/risk/index.ts',
    },
];

const sourceFiles = [];
for (const sourceRoot of sourceRoots) await collectSourceFiles(sourceRoot, sourceFiles);

const violations = [];
let adminManagedEndpointFound = false;
let merchantManagedEndpointFound = false;

for (const file of sourceFiles) {
    const content = await readFile(file, 'utf8');
    const fileName = relative(repositoryRoot, file);
    if (content.includes('/admin/system/file-templates/') && content.includes('/download')) {
        adminManagedEndpointFound = true;
    }
    if (content.includes('/merchant/system/file-templates/') && content.includes('/download')) {
        merchantManagedEndpointFound = true;
    }

    const downloadCall = /download(?:Blob|Excel)\s*\(\s*([`'"])(.*?)\1/gs;
    for (const match of content.matchAll(downloadCall)) {
        const endpoint = match[2];
        if (!endpoint.toLowerCase().includes('template')) continue;
        if (isManagedEndpoint(endpoint) || isDataExport(endpoint)) continue;
        const legacy = legacyAdapters.find(item => item.endpoint.test(endpoint));
        if (!legacy) {
            violations.push(`${fileName}: unmanaged template download endpoint ${endpoint}`);
            continue;
        }
        if (legacy.owner !== fileName) {
            violations.push(`${fileName}: legacy template adapter moved outside its registered owner`);
        }
        if (legacy.removeAfter < today) {
            violations.push(`${fileName}: legacy template adapter expired on ${legacy.removeAfter}`);
        }
    }
}

if (!adminManagedEndpointFound) violations.push('Admin managed template download API is missing');
if (!merchantManagedEndpointFound) violations.push('Merchant managed template download API is missing');

if (violations.length) {
    console.error('File template governance verification failed:');
    violations.forEach(item => console.error(`- ${item}`));
    process.exit(1);
}

console.log(`File template governance verified across ${sourceFiles.length} frontend source files.`);

function isManagedEndpoint(endpoint) {
    return /\/(admin|merchant)\/system\/file-templates\/.+\/download$/.test(endpoint);
}

function isDataExport(endpoint) {
    // This exports template-definition records, not a reusable upload/input file template.
    return endpoint === '/admin/fees/templates/export';
}

async function collectSourceFiles(directory, output) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
            await collectSourceFiles(fullPath, output);
        } else if (['.ts', '.vue'].includes(extname(entry.name))) {
            output.push(fullPath);
        }
    }
}
