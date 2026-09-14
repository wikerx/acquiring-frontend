import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const formatterSourceUrl = new URL('../src/components/MonitorChart/monitorFormatters.ts', import.meta.url);
const formatterSource = await readFile(formatterSourceUrl, 'utf8');
const formatterModuleSource = ts.transpileModule(formatterSource, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
    },
    fileName: formatterSourceUrl.pathname,
}).outputText;
const formatterModuleUrl = `data:text/javascript;base64,${Buffer.from(formatterModuleSource).toString('base64')}`;
const {
    formatMonitorTimeLabel,
    formatMonitorTooltipTime,
    parseMonitorDateTime,
} = await import(formatterModuleUrl);

const mysqlMicrosecondTime = '2026-09-14 01:16:48.418166';
const parsed = parseMonitorDateTime(mysqlMicrosecondTime);

assert.ok(parsed, 'MySQL local datetime with microseconds must be parsed');
assert.equal(parsed.toISOString(), '2026-09-13T17:16:48.418Z');
assert.equal(
    formatMonitorTimeLabel(mysqlMicrosecondTime, { preset: '1h', timezone: 'Asia/Shanghai' }, 'zh-CN'),
    '01:16',
);
assert.match(
    formatMonitorTooltipTime(mysqlMicrosecondTime, { preset: '1h', timezone: 'Asia/Shanghai' }, 'zh-CN'),
    /2026.*09.*14.*01.*16.*48/,
);
assert.equal(parseMonitorDateTime('not-a-date'), null);

console.log('Monitor formatters: MySQL microsecond timestamps and Asia/Shanghai wall-clock semantics verified.');
