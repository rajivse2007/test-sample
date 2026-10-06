import { REDACTED, redact, redactString } from './redact';

describe('redact', () => {
  it('redacts values of sensitive keys at any depth', () => {
    const result = redact({
      user: 'a',
      password: 'p',
      nested: { accessToken: 't', Authorization: 'Bearer x', ok: 1 },
    }) as Record<string, unknown>;

    expect(result['user']).toBe('a');
    expect(result['password']).toBe(REDACTED);
    expect(result['nested']).toEqual({ accessToken: REDACTED, Authorization: REDACTED, ok: 1 });
  });

  it('redacts bearer tokens and JWTs inside strings', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln';
    const text = redactString(`failed with Bearer abc.def and ${jwt}`);

    expect(text).not.toContain('abc.def');
    expect(text).not.toContain(jwt);
  });

  it('serialises errors without losing the message', () => {
    const result = redact(new Error('boom')) as { name: string; message: string };

    expect(result.name).toBe('Error');
    expect(result.message).toBe('boom');
  });

  it('truncates long strings and deep structures', () => {
    expect(redactString('a'.repeat(5000)).length).toBeLessThan(1100);

    const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    expect(JSON.stringify(redact(deep))).toContain('[TRUNCATED]');
  });
});
