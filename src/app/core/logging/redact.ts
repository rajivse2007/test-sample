export const REDACTED = '[REDACTED]';

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|session|api[-_]?key|credential/i;
const BEARER = /\bBearer\s+[\w\-.~+/]+=*/gi;
const JWT = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g;
const MAX_DEPTH = 5;
const MAX_STRING_LENGTH = 1000;

export function redactString(value: string): string {
  const cleaned = value.replace(BEARER, `Bearer ${REDACTED}`).replace(JWT, REDACTED);
  return cleaned.length > MAX_STRING_LENGTH ? `${cleaned.slice(0, MAX_STRING_LENGTH)}...` : cleaned;
}

export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? undefined : value;
  }
  if (depth >= MAX_DEPTH) {
    return '[TRUNCATED]';
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1);
  }
  return result;
}
