import { Injectable, InjectionToken, inject } from '@angular/core';
import { redact } from './redact';

// HTTPS collector URL that receives browser telemetry; null keeps logs local.
export const TELEMETRY_ENDPOINT = new InjectionToken<string | null>('TELEMETRY_ENDPOINT', {
  providedIn: 'root',
  factory: () => null,
});

export type LogLevel = 'error' | 'warn' | 'info';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  correlationId: string;
  context?: unknown;
}

const MAX_PAYLOAD_BYTES = 8 * 1024;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly endpoint = inject(TELEMETRY_ENDPOINT);
  private readonly correlationId = globalThis.crypto?.randomUUID?.() ?? 'unavailable';

  error(event: string, context?: unknown): void {
    this.log('error', event, context);
  }

  warn(event: string, context?: unknown): void {
    this.log('warn', event, context);
  }

  info(event: string, context?: unknown): void {
    this.log('info', event, context);
  }

  private log(level: LogLevel, event: string, context?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      correlationId: this.correlationId,
      context: redact(context),
    };

    if (this.endpoint) {
      this.send(entry);
    } else {
      // Local sink when no collector is configured.
      // eslint-disable-next-line no-console
      console[level](JSON.stringify(entry));
    }
  }

  private send(entry: LogEntry): void {
    let body = JSON.stringify(entry);
    if (body.length > MAX_PAYLOAD_BYTES) {
      body = JSON.stringify({ ...entry, context: '[TRUNCATED]' });
    }
    // Best effort; telemetry failures must never affect the user.
    navigator.sendBeacon?.(this.endpoint!, new Blob([body], { type: 'application/json' }));
  }
}
