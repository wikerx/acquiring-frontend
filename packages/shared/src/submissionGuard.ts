import type { InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * 仅用于明确允许并发提交的非业务写请求；普通表单和业务命令不得绕过。
     */
    allowDuplicateSubmission?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    allowDuplicateSubmission?: boolean;
    submissionGuardKey?: string;
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** 同一变更请求仍在处理中时抛出的受控错误。 */
export class DuplicateSubmissionError extends Error {
  public readonly code = 'ERR_DUPLICATE_SUBMISSION';
  public readonly friendlyMessage: string;

  public constructor(locale: string) {
    const chinese = !locale.toLowerCase().startsWith('en');
    const message = chinese
      ? '操作正在处理中，请勿重复提交。'
      : 'The operation is already in progress. Do not submit it again.';
    super(message);
    this.name = 'DuplicateSubmissionError';
    this.friendlyMessage = message;
  }
}

export interface DuplicateSubmissionGuard {
  acquire(config: InternalAxiosRequestConfig): void;
  release(config?: InternalAxiosRequestConfig): void;
  size(): number;
}

/**
 * 创建 HTTP 变更请求在途去重器。
 *
 * <p>该保护只阻止同一浏览器会话中的并发重复写请求，不能替代服务端 requestId、
 * 唯一约束或状态机。请求完成后立即释放，避免妨碍用户发起下一次合法操作。</p>
 */
export function createDuplicateSubmissionGuard(
  readLocale: () => string = () => 'zh-CN',
): DuplicateSubmissionGuard {
  const inFlight = new Set<string>();

  return {
    acquire(config) {
      if (!shouldGuard(config) || config.submissionGuardKey) {
        return;
      }
      const key = requestFingerprint(config);
      if (inFlight.has(key)) {
        throw new DuplicateSubmissionError(readLocale());
      }
      inFlight.add(key);
      config.submissionGuardKey = key;
    },
    release(config) {
      const key = config?.submissionGuardKey;
      if (!key) {
        return;
      }
      inFlight.delete(key);
      delete config.submissionGuardKey;
    },
    size() {
      return inFlight.size;
    },
  };
}

function shouldGuard(config: InternalAxiosRequestConfig): boolean {
  if (config.allowDuplicateSubmission) {
    return false;
  }
  return MUTATING_METHODS.has(String(config.method || 'GET').toUpperCase());
}

function requestFingerprint(config: InternalAxiosRequestConfig): string {
  const method = String(config.method || 'GET').toUpperCase();
  const target = `${config.baseURL || ''}${config.url || ''}`;
  return `${method}|${target}|${hashValue(config.params)}|${hashValue(config.data)}`;
}

function hashValue(value: unknown): string {
  const serialized = stableSerialize(value, new WeakSet<object>());
  let first = 0x811c9dc5;
  let second = 5381;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second = Math.imul(second, 33) ^ code;
  }
  return `${serialized.length}:${(first >>> 0).toString(36)}:${(second >>> 0).toString(36)}`;
}

function stableSerialize(value: unknown, visited: WeakSet<object>): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `string:${value}`;
  if (typeof value === 'number') return `number:${Number.isNaN(value) ? 'NaN' : value}`;
  if (typeof value === 'boolean') return `boolean:${value}`;
  if (typeof value === 'bigint') return `bigint:${value.toString()}`;
  if (typeof value === 'symbol') return `symbol:${String(value.description || '')}`;
  if (typeof value === 'function') return `function:${value.name || 'anonymous'}`;

  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return `search:${Array.from(value.entries())
      .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
        `${leftKey}\u0000${leftValue}`.localeCompare(`${rightKey}\u0000${rightValue}`),
      )
      .map(([key, item]) => `${key}=${item}`)
      .join('&')}`;
  }
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const entries = Array.from(value.entries())
      .map(([key, item]) => `${key}=${formDataValue(item)}`)
      .sort();
    return `form:${entries.join('&')}`;
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return blobValue(value);
  }
  if (value instanceof ArrayBuffer) {
    return `array-buffer:${value.byteLength}`;
  }
  if (ArrayBuffer.isView(value)) {
    return `typed-array:${value.constructor.name}:${value.byteLength}`;
  }

  const objectValue = value as object;
  if (visited.has(objectValue)) {
    return '[Circular]';
  }
  visited.add(objectValue);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableSerialize(item, visited)).join(',')}]`;
    }
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${key}:${stableSerialize(item, visited)}`)
      .join(',')}}`;
  } finally {
    visited.delete(objectValue);
  }
}

function formDataValue(value: FormDataEntryValue): string {
  if (typeof value === 'string') {
    return `string:${value}`;
  }
  return blobValue(value);
}

function blobValue(value: Blob): string {
  if (typeof File !== 'undefined' && value instanceof File) {
    return `file:${value.name}:${value.size}:${value.type}:${value.lastModified}`;
  }
  return `blob:${value.size}:${value.type}`;
}
