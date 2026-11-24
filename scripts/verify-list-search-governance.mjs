import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const root = path.resolve(import.meta.dirname, '..');
const appNames = ['admin-system', 'merchant-portal'];
const sharedStyle = 'packages/shared/src/styles/list-search.css';
const failures = [];
let checkedForms = 0;

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

for (const appName of appNames) {
  const app = path.join(root, 'apps', appName, 'src');
  const entry = fs.readFileSync(path.join(app, 'main.ts'), 'utf8');
  if (!entry.includes(sharedStyle)) {
    failures.push(`${appName} does not load the shared list-search stylesheet`);
  }

  for (const file of filesIn(app)) {
    if (!file.endsWith('.vue')) continue;
    const source = fs.readFileSync(file, 'utf8');
    const template = source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '');
    let searchFormCount = 0;
    for (const [, attributes, fields] of template.matchAll(/<el-form(?=[\s>])([^>]*)>([\s\S]*?)<\/el-form>/g)) {
      const className = attributes.match(/(?:^|\s)class=(["'])(.*?)\1/)?.[2] ?? '';
      if (className.split(/\s+/).includes('search-form')) {
        searchFormCount += 1;
      } else if (fields.includes('common.search') && fields.includes('common.reset')) {
        failures.push(`${path.relative(root, file)} has query and reset controls outside .search-form`);
      }
    }
    if (searchFormCount === 0) continue;
    checkedForms += searchFormCount;

    for (const [, cssText] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
      postcss.parse(cssText, { from: file }).walkRules((rule) => {
        const targetsSearchControl = rule.selectors.some((selector) =>
          /\.(?:search-form|search-actions|merchant-search-actions)\b/.test(selector)
            && /\.el-(?:form-item__label|input|select|cascader|date-editor|button)\b/.test(selector),
        );
        if (!targetsSearchControl) return;
        rule.walkDecls(/^(?:min-|max-)?(?:width|height|inline-size|block-size)$|^(?:line-height|font-size|font-weight)$/u, (declaration) => {
          failures.push(`${path.relative(root, file)} overrides list search ${declaration.prop} in ${rule.selector}`);
        });
      });
    }
  }
}

if (checkedForms === 0) failures.push('No list search forms were found');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Shared list-search layout verified in ${checkedForms} Admin and Merchant forms`);
}
