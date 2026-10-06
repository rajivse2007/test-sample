# Operations: Logging, Monitoring, and Incident Response

Status: logging code is implemented in the app; collector, alerting, and retention are not yet provisioned. Items marked TBD need an owner and a decision.

## Browser logging (implemented)

- `LoggerService` (`src/app/core/logging/`) emits structured entries: UTC timestamp, level, event name, per-page-load correlation ID, redacted context.
- `GlobalErrorHandler` routes all unhandled Angular errors through the logger.
- `redact()` removes values of sensitive keys (password, token, secret, authorization, cookie, session, api key, credential), bearer tokens and JWTs in strings, truncates long strings, and limits object depth.
- With no `TELEMETRY_ENDPOINT`, entries go to the browser console. To ship telemetry, provide `TELEMETRY_ENDPOINT` in `app.config.ts` with an HTTPS collector URL and add that origin to `connect-src` in the CSP.
- Payloads over 8 KB are sent with the context dropped.
- `console` is blocked by ESLint everywhere else; use `LoggerService`.

## Collector requirements (TBD)

Browser telemetry is untrusted input. The collector must:

- Accept only JSON, enforce a size limit and rate limit per client, and validate the schema.
- Never trust client-supplied severity or identity fields for security decisions.
- Strip or reject fields matching the redaction patterns again server-side.
- Restrict read access to engineering and security roles.
- Define retention and deletion (TBD by data obligations).

## Signals and alerts (TBD thresholds)

| Signal                  | Alert condition                                                 | Owner |
| ----------------------- | --------------------------------------------------------------- | ----- |
| Frontend error rate     | Sustained increase over baseline after a release                | TBD   |
| Telemetry volume        | Sudden spike (abuse or loop) or drop (collector or app failure) | TBD   |
| CSP violation reports   | Any new blocked source in production                            | TBD   |
| Authentication failures | Spike across accounts or from one source (when auth exists)     | TBD   |
| CI security gates       | Failed scheduled Security or DAST workflow                      | TBD   |

Set numeric SLOs before launch. Alert only on actionable conditions.

## Runbooks

### Suspected account compromise

1. Confirm using audit and authentication logs; preserve evidence.
2. Revoke the user's sessions and tokens at the identity provider.
3. Force credential reset; review recent privileged actions.
4. Record scope, root cause, and follow-up in the risk register.

### Secret exposed (repository, bundle, or logs)

1. Treat as compromised; revoke and rotate the secret first.
2. Remove it from the current tree; rewrite history only if required and agreed.
3. Check logs for use of the secret since exposure.
4. Add or tune a Gitleaks rule so it cannot recur.

### Vulnerable or malicious dependency

1. Identify affected versions from the SBOM (`sbom.cdx.json` artifact) and `npm audit` report.
2. Upgrade or override; if no fix exists, document the accepted risk with an expiry in the risk register.
3. Rebuild, run the full CI and Security workflows, and redeploy.

### Outage or bad release

1. Roll back to the previous known-good artifact.
2. Confirm health, then investigate with release ID and correlation IDs from logs.
3. Add a regression test and update this runbook.

## Exercise before launch

Trigger a synthetic error and a simulated security event and confirm each reaches the alert owner with no sensitive fields in the log.
