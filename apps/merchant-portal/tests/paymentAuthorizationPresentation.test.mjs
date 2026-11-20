import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = fs.readFileSync(
  new URL('../src/utils/paymentAuthorizationPresentation.ts', import.meta.url),
  'utf8',
);
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
// The module URL is constructed only from the checked-in pure presentation source above.
// eslint-disable-next-line no-unsanitized/method
const state = await import(moduleUrl);
const { paymentCapabilityMetrics } = state;
test('legacy observations and unavailable assessments never become new authorization counts', () => {
  for (const assessmentStatus of [undefined, 'HISTORY_PENDING', 'UNAVAILABLE'])
    assert.deepEqual(
      paymentCapabilityMetrics({
        assessmentStatus,
        activeBindingCount: 9,
        capabilities: [{ paymentType: 'BANK_CARD', paymentMethod: 'ALL' }],
        authorizedCount: 8,
      }),
      [],
    );
});
test('evaluated counts preserve separate formal and historical scopes and an actual zero', () => {
  const metrics = paymentCapabilityMetrics({
    assessmentStatus: 'EVALUATED',
    authorizedCount: 0,
    legacyCoverageCount: 8,
    configurationReadyCount: 3,
    executionReadyCount: null,
  });
  assert.equal(metrics.find((item) => item.key === 'authorizedCount').value, 0);
  assert.equal(metrics.find((item) => item.key === 'legacyCoverageCount').value, 8);
  assert.equal(metrics.find((item) => item.key === 'configurationReadyCount').value, 3);
  assert.equal(metrics.find((item) => item.key === 'executionReadyCount').value, null);
});
test('missing or invalid counters remain unknown instead of being filled from configuration', () => {
  const metrics = paymentCapabilityMetrics({
    assessmentStatus: 'EVALUATED',
    activeBindingCount: 99,
    authorizedCount: -1,
    legacyCoverageCount: Infinity,
    pendingConfigurationCount: '0',
  });
  assert.equal(
    metrics.every((item) => item.value === null),
    true,
  );
});
