import { TestBed } from '@angular/core/testing';
import { LoggerService, TELEMETRY_ENDPOINT } from './logger.service';

describe('LoggerService', () => {
  it('writes a redacted structured entry locally when no endpoint is set', () => {
    const spy = spyOn(console, 'error');
    const logger = TestBed.inject(LoggerService);

    logger.error('test_event', { token: 'secret-value', detail: 'ok' });

    const entry = JSON.parse(spy.calls.mostRecent().args[0] as string) as Record<string, unknown>;
    expect(entry['event']).toBe('test_event');
    expect(entry['level']).toBe('error');
    expect(JSON.stringify(entry)).not.toContain('secret-value');
  });

  it('sends telemetry to the configured endpoint', () => {
    const beacon = spyOn(navigator, 'sendBeacon').and.returnValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: TELEMETRY_ENDPOINT, useValue: 'https://collector.example/ingest' }],
    });

    TestBed.inject(LoggerService).warn('sent_event');

    expect(beacon).toHaveBeenCalledWith('https://collector.example/ingest', jasmine.any(Blob));
  });
});
