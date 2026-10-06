# Security Requirements and Traceability

| ID    | Requirement                                                 | Threat / risk                     | Control                                                                                   | Verification                                     |
| ----- | ----------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SR-01 | All authorization decisions are enforced server-side        | Broken object-level authorization | Backend checks per request; route guards are UX only                                      | API authorization tests; DAST authenticated scan |
| SR-02 | No secrets in the Angular bundle                            | Secret exposure                   | Secrets stay server-side; secret scanning in CI                                           | Gitleaks scan; bundle review                     |
| SR-03 | No raw HTML sinks or sanitizer bypass                       | Cross-site scripting              | `no-restricted-syntax`, `no-eval` and related ESLint rules                                | `npm run lint`; CodeQL                           |
| SR-04 | Strict Content Security Policy                              | Cross-site scripting              | CSP and security headers (`angular.json` serve headers; replicate at the production host) | ZAP baseline rules (`.zap/rules.tsv`)            |
| SR-05 | CSRF protection for cookie-authenticated writes             | Cross-site request forgery        | SameSite plus anti-CSRF token                                                             | Integration test; ZAP                            |
| SR-06 | Telemetry excludes tokens and personal data                 | Sensitive data in logs            | `redact()` before send; collector validation and limits                                   | `redact.spec.ts`, `logger.service.spec.ts`       |
| SR-07 | Dependencies and builds are reproducible and scanned        | Supply-chain compromise           | Lockfile, `npm ci`, dependency scan, SBOM                                                 | CI results; SBOM artifact                        |
| SR-08 | Security tooling reports are retained and access-controlled | Undetected regressions            | SARIF and ZAP reports as restricted CI artifacts                                          | Release report review                            |

Status:

- Enforced: SR-02 (Gitleaks), SR-03 (ESLint, CodeQL), SR-04 (headers and ZAP rules on the local production build), SR-06 (client-side redaction), SR-07 (lockfile, `npm ci`, audit, SBOM), SR-08 (artifacts in CI).
- Pending: SR-01 and SR-05 need a backend. The production host must replicate the SR-04 headers, and the telemetry collector (SR-06) is not yet provisioned.
