import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'packages/shared/src/assets/transaction-icons/stages');
const failures = [];
const fields = '(channelMatchStatus|reconciliationStatus|settlementStatus)';
let sourceCount = 0;

for (const app of ['admin-system', 'merchant-portal']) {
    scan(path.join(root, 'apps', app, 'src'));
}
const icons = fs.readdirSync(assets).filter((name) => name.endsWith('.svg'));
if (icons.length !== 13) failures.push(`expected 13 stage status icons, found ${icons.length}`);
for (const icon of icons) {
    const svg = fs.readFileSync(path.join(assets, icon), 'utf8');
    if (!svg.includes('viewBox="0 0 64 64"') || /<script\b|(?:href|src)=["']https?:/i.test(svg)) {
        failures.push(`invalid or externally linked SVG: ${icon}`);
    }
}
if (failures.length) {
    console.error('Transaction stage status governance failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}
console.log(`Transaction stage status governance verified across ${sourceCount} Vue files and ${icons.length} SVG assets.`);

function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) scan(file);
        else if (file.endsWith('.vue')) {
            sourceCount++;
            const source = fs.readFileSync(file, 'utf8');
            const template = source.slice(source.indexOf('<template>'), source.indexOf('<script'));
            const rawTags = template.match(/<el-tag\b[^>]*>(?:(?!<\/el-tag\s*>)[\s\S])*<\/el-tag\s*>/g) || [];
            if (rawTags.some((tag) => new RegExp(`\\.${fields}\\b`).test(tag))) {
                failures.push(`${relative(file)} renders a transaction stage status with a raw el-tag`);
            }
            if (new RegExp(`<el-select\\b[^>]*v-model=["'][^"']*\\.${fields}["']`).test(template)) {
                failures.push(`${relative(file)} must use TransactionStageStatusSelect for stage status filters`);
            }
            if (new RegExp(`{{\\s*(tagText|optionText|statusText|settlementStatusText)\\([^}]*\\.${fields}\\b[^}]*}}`).test(template)) {
                failures.push(`${relative(file)} renders a transaction stage status as plain text`);
            }
        }
    }
}

function relative(file) { return path.relative(root, file); }
