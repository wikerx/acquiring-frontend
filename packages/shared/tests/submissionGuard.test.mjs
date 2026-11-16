import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const sourceFile = path.resolve(import.meta.dirname, '../src/submissionGuard.ts');
const transpiled = ts.transpileModule(fs.readFileSync(sourceFile, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
  fileName: sourceFile,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
// The URL is generated only from the checked-in submissionGuard.ts source above.
// eslint-disable-next-line no-unsanitized/method
const { createDuplicateSubmissionGuard, DuplicateSubmissionError } = await import(moduleUrl);

test('rejects the same mutating request while the first request is in flight', () => {
  const guard = createDuplicateSubmissionGuard(() => 'zh-CN');
  const first = request({ accountId: 7, roleIds: [2, 3] });
  const duplicate = request({ roleIds: [2, 3], accountId: 7 });

  guard.acquire(first);

  assert.equal(guard.size(), 1);
  assert.throws(
    () => guard.acquire(duplicate),
    (error) =>
      error instanceof DuplicateSubmissionError &&
      error.code === 'ERR_DUPLICATE_SUBMISSION' &&
      error.message === '操作正在处理中，请勿重复提交。',
  );
  assert.equal(guard.size(), 1);
});

test('allows a legitimate follow-up after the original request is released', () => {
  const guard = createDuplicateSubmissionGuard(() => 'en-US');
  const first = request({ status: 1 });
  const followUp = request({ status: 1 });

  guard.acquire(first);
  guard.release(first);
  guard.acquire(followUp);

  assert.equal(guard.size(), 1);
  guard.release(followUp);
  assert.equal(guard.size(), 0);
});

test('allows different payloads and does not guard read requests', () => {
  const guard = createDuplicateSubmissionGuard();
  const enabled = request({ status: 1 });
  const disabled = request({ status: 0 });
  const read = { method: 'get', url: '/admin/system/users', params: { pageNo: 1 } };

  guard.acquire(enabled);
  guard.acquire(disabled);
  guard.acquire(read);

  assert.equal(guard.size(), 2);
});

test('only bypasses protection when the caller explicitly opts out', () => {
  const guard = createDuplicateSubmissionGuard();
  const first = request({ task: 'heartbeat' }, true);
  const second = request({ task: 'heartbeat' }, true);

  guard.acquire(first);
  guard.acquire(second);

  assert.equal(guard.size(), 0);
});

test('releases the in-flight key after failure or cancellation handling', () => {
  const guard = createDuplicateSubmissionGuard();
  const failed = request({ action: 'approve', version: 3 });
  const retry = request({ action: 'approve', version: 3 });

  guard.acquire(failed);
  guard.release(failed);
  guard.acquire(retry);

  assert.equal(guard.size(), 1);
  guard.release(retry);
  assert.equal(guard.size(), 0);
});

test('keeps different resource targets and query scopes independent', () => {
  const guard = createDuplicateSubmissionGuard();
  const first = request({ status: 1 });
  const differentResource = { ...request({ status: 1 }), url: '/admin/system/roles' };
  const differentScope = {
    ...request({ status: 1 }),
    params: { locale: 'zh-CN', merchantId: 'M000002' },
  };

  guard.acquire(first);
  guard.acquire(differentResource);
  guard.acquire(differentScope);

  assert.equal(guard.size(), 3);
});

test('recognizes equivalent form submissions including file metadata', () => {
  const guard = createDuplicateSubmissionGuard();
  const firstForm = new FormData();
  firstForm.append('locale', 'zh-CN');
  firstForm.append('file', new Blob(['first'], { type: 'text/plain' }), 'template.txt');
  const duplicateForm = new FormData();
  duplicateForm.append('file', new Blob(['first'], { type: 'text/plain' }), 'template.txt');
  duplicateForm.append('locale', 'zh-CN');

  const first = request(firstForm);
  const duplicate = request(duplicateForm);
  guard.acquire(first);

  assert.throws(() => guard.acquire(duplicate), DuplicateSubmissionError);
});

function request(data, allowDuplicateSubmission = false) {
  return {
    method: 'post',
    baseURL: '/api',
    url: '/admin/system/users',
    params: { locale: 'zh-CN' },
    data,
    allowDuplicateSubmission,
    headers: {},
  };
}
