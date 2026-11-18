import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// 执行双端真实工具源码；金额依赖不参与本组时间转换测试。
function loadFormat(app) {
    const source = readFileSync(new URL(`../../../apps/${app}/src/utils/format.ts`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    runInNewContext(compiled, { exports, require: () => ({}), Date, Intl, Set });
    return exports;
}

for (const app of ['admin-system', 'merchant-portal']) {
    const format = loadFormat(app);
    test(`${app}: IANA source preserves milliseconds without advancing displayed seconds`, () => {
        const instant = format.toSourceTimeZoneInstant('2026-11-18T12:11:51.750', 'Asia/Shanghai');
        assert.equal(instant.toISOString(), '2026-11-18T04:11:51.750Z');
        assert.equal(format.formatDateTimeFromSourceTimeZone('2026-11-18T12:11:51.750', 'Asia/Shanghai', 'Asia/Shanghai'), '2026-11-18 12:11:51');
        assert.equal(format.formatDateTimeFromSourceTimeZone('2026-11-18T12:11:51.750', 'Asia/Shanghai', 'UTC'), '2026-11-18 04:11:51');
    });
    test(`${app}: fixed offsets preserve the same fractional instant`, () => {
        assert.equal(format.toSourceTimeZoneInstant('2026-11-18 12:11:51.750', 'UTC+08:00').toISOString(), '2026-11-18T04:11:51.750Z');
    });
    test(`${app}: named source zones respect winter and summer offsets`, () => {
        assert.equal(format.toSourceTimeZoneInstant('2026-01-18T12:00:00.999', 'America/New_York').toISOString(), '2026-01-18T17:00:00.999Z');
        assert.equal(format.toSourceTimeZoneInstant('2026-07-18T12:00:00.999', 'America/New_York').toISOString(), '2026-07-18T16:00:00.999Z');
    });
    test(`${app}: second precision and explicit instants retain existing behavior`, () => {
        assert.equal(format.toSourceTimeZoneInstant('2026-11-18T12:11:51', 'Asia/Shanghai').toISOString(), '2026-11-18T04:11:51.000Z');
        assert.equal(format.toSourceTimeZoneInstant('2026-11-18T04:11:51.750Z', 'Asia/Shanghai'), '2026-11-18T04:11:51.750Z');
    });
}
