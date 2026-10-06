# Security Requirements and Traceability

| ID    | Requirement                                                 | Threat / risk                     | Control                                                    | Verification                                     |
| ----- | ----------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| SR-01 | All authorization decisions are enforced server-side        | Broken object-level authorization | Backend checks per request; route guards are UX only       | API authorization tests; DAST authenticated scan |
| SR-02 | No secrets in the Angular bundle                            | Secret exposure                   | Secrets stay server-side; secret scanning in CI            | Gitleaks scan; bundle review                     |
| SR-03 | No raw HTML sinks or sanitizer bypass                       | Cross-site scripting              | `no-restricted-syntax`, `no-eval` and related ESLint rules | `npm run lint`; Semgrep rules                    |
| SR-04 | Strict Content Security Policy                              | Cross-site scripting              | CSP at host, report-only first                             | Header checks in DAST                            |
| SR-05 | CSRF protection for cookie-authenticated writes             | Cross-site request forgery        | SameSite plus anti-CSRF token                              | Integration test; ZAP                            |
| SR-06 | Telemetry excludes tokens and personal data                 | Sensitive data in logs            | Redaction before send; collector validation and limits     | Log review test                                  |
| SR-07 | Dependencies and builds are reproducible and scanned        | Supply-chain compromise           | Lockfile, `npm ci`, dependency scan, SBOM                  | CI results; SBOM artifact                        |
| SR-08 | Security tooling reports are retained and access-controlled | Undetected regressions            | SARIF and ZAP reports as restricted CI artifacts           | Release report review                            |

Status: requirements are defined; only SR-03 is currently enforced (ESLint). The rest are pending the implementation phases.
