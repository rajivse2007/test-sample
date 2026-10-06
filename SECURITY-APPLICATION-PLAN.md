# Security-First Application Plan

Status: Foundation implemented (ESLint/Prettier, Threagile model, CodeQL, CI, secret and dependency scanning, SBOM, ZAP baseline DAST, security headers, browser logging, reporting and runbooks, release workflow with consolidated security report, branch protection ruleset). Backend, authentication, the telemetry collector, authenticated DAST, deployment, and production hosting are pending the discovery decisions in section 2.

## 1. Goal and Scope

Design and implement an Angular application with security built into its architecture, development workflow, release process, and production operations.

The plan covers:

- Threat modeling and security requirements.
- Threagile as a version-controlled threat model and risk-analysis tool.
- ESLint, Angular template linting, and formatting rules.
- Static application security testing (SAST).
- Dynamic application security testing (DAST).
- Dependency, secret, and deployment configuration checks.
- Monitoring, logging, alerting, and incident response.

This is a secure application lifecycle plan, not a proposal to build a security dashboard. A dashboard can be scoped separately if it is the intended product.

## 2. Current Baseline and Decisions

The repository currently uses Angular 20.2, TypeScript 5.9, SCSS, and Jasmine/Karma. It provides build and test scripts but has no ESLint or security-scanning scripts in its package manifest.

Planning assumptions:

- The Angular application is an untrusted browser client.
- Any API, identity provider, database, or telemetry collector is a separate trust boundary.
- Server-side authorization is mandatory if protected data or operations are introduced.
- CI provider, hosting platform, backend technology, and monitoring vendor remain undecided.
- Use OWASP ASVS Level 2 as an initial verification target, tailored to the actual application and its data sensitivity.

Before implementation, confirm:

1. Product purpose, user journeys, roles, and privileged actions.
2. Data classification, privacy obligations, retention, and residency requirements.
3. Whether a backend is needed, and who owns it.
4. Authentication approach, session management, and identity provider.
5. Deployment environments, CI provider, security owners, and operational budget.

Deliverable: a short architecture decision record with these decisions and named owners.

## 3. Architecture and Security Requirements

Proposed logical boundaries, subject to the decisions above:

```text
Browser / Angular SPA
    -> HTTPS hosting / reverse proxy
    -> API or backend-for-frontend, if required
        -> Identity provider
        -> Database and external services
        -> Central logging and telemetry

Source repository -> CI checks -> Artifact -> Staging -> Release approval -> Production
```

Required controls:

- Never embed secrets in Angular source or build-time environment configuration; browser bundles are public.
- Prefer a same-origin backend-for-frontend with Secure, HttpOnly, appropriately scoped SameSite session cookies where suitable. Define CSRF defenses for cookie-authenticated state changes.
- If direct SPA authentication is necessary, use a maintained OIDC client and authorization code flow with PKCE. Decide token storage and renewal risks explicitly; avoid persistent browser storage of bearer tokens.
- Validate input and enforce authentication, authorization, and object-level access checks on the server. Angular route guards are UX controls, not security boundaries.
- Use Angular's default escaping and sanitization. Review every use of raw HTML, dynamic resource URLs, and sanitizer bypass APIs.
- Define an Angular-compatible Content Security Policy; begin in report-only mode and verify production behavior before enforcement. Evaluate Trusted Types where supported.
- Configure TLS, HSTS, anti-framing policy, MIME sniffing protection, referrer policy, and narrowly scoped CORS at the hosting/API layer.
- Apply least privilege, request limits, safe error responses, and rate limits to exposed APIs.
- Keep development diagnostics, source maps containing sensitive details, and test endpoints out of public production deployments.

Deliverables: architecture diagram, security requirements, and a control-to-test mapping.

## 4. Threat Modeling and Threagile

### Modeling process

1. Identify assets, actors, entry points, data flows, third parties, and trust boundaries.
2. Classify data and document confidentiality, integrity, and availability needs.
3. Analyze STRIDE threats and realistic abuse cases, including XSS, account takeover, broken object authorization, CSRF, supply-chain compromise, and sensitive logging.
4. Score risks using agreed likelihood and impact criteria; assign an owner and treatment to each material risk.
5. Link mitigations to implementation tasks and security verification cases.
6. Revisit the model when authentication, data flows, dependencies, privileges, or deployment boundaries change.

### Threagile integration

- Introduce `security/threagile.yaml` using the example/schema supported by a pinned Threagile version; do not invent a custom model schema.
- Model technical assets, communication links, trust boundaries, data assets, and shared runtime relationships as applicable.
- Validate the model and generate available risk reports and diagrams locally and in CI using the pinned release's documented commands.
- Keep explicit human-reviewed risks alongside automated findings; Threagile is not a replacement for an architecture review or penetration test.
- Restrict access to reports and diagrams because they can disclose sensitive architecture details.
- Track risk dispositions using supported Threagile mechanisms plus a register for owner, rationale, evidence, expiry, and review date.
- Block release on new unresolved critical/high risks unless a named approver grants a time-limited exception.

Deliverables: validated model, reviewed diagrams/reports, risk register, and mitigation backlog.

## 5. ESLint and Linting Rules

### Tooling

- Install an Angular-20-compatible `angular-eslint` setup with ESLint flat configuration and compatible TypeScript ESLint packages.
- Lint TypeScript and Angular HTML templates; preserve the project's existing Prettier settings for formatting.
- Add `lint`, `lint:fix`, and `format:check` scripts after confirming the actual CLI configuration.
- Enable type-aware rules using the correct TypeScript project configuration where needed.

### Proposed rule policy

| Area           | Initial policy                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript     | Reject unused variables, unsafe assignments/calls, floating promises, and misused promises; control explicit `any` with reviewed exceptions. |
| Angular        | Apply recommended component, directive, lifecycle, and template rules; use applicable accessibility checks.                                  |
| Dangerous APIs | Restrict `eval`, `Function`, direct document writes, and sanitizer bypass calls through suitable rules or targeted security checks.          |
| Logging        | Prevent ad hoc production console output; use the agreed logging abstraction.                                                                |
| Suppressions   | Require a reason for disables and reject unused disable directives.                                                                          |
| Formatting     | Run Prettier separately so formatting does not obscure semantic lint findings.                                                               |

Start with supported recommended rules and add focused restrictions. Confirm each custom rule against representative Angular code to avoid false positives. Linting improves consistency but does not prove security.

Acceptance: lint and formatting checks pass locally and in CI, and a deliberate rule violation causes the CI check to fail.

## 6. SAST and Supply-Chain Checks

- SAST choice: CodeQL (`security-extended` suite) through GitHub Actions, configured in `.github/workflows/codeql.yml` and `.github/codeql/codeql-config.yml`; it runs on pull requests, pushes to `main`, and weekly, and uploads SARIF to GitHub code scanning. Private repositories need GitHub Code Security enabled. Add Semgrep later only if custom Angular-specific rules are needed.
- Cover application and backend code when a backend exists; test Angular-specific sinks rather than assuming generic rules cover templates.
- Run a secret scanner such as Gitleaks with redacted output. Review repository history once, then scan subsequent changes continuously.
- Generate and commit the dependency lockfile, use deterministic CI installs, and scan dependencies using npm audit or the chosen dependency service.
- Classify findings by severity, exploitability, affected runtime, and reachability when available; dependency scanning is separate from SAST.
- Enable dependency update automation and generate a CycloneDX SBOM for release artifacts.
- Scan infrastructure/container configuration only if those artifacts are introduced.
- Emit machine-readable results (SARIF where supported) plus a human-readable summary for each scanner; see Section 8.
- Suppressions need an owner, justification, expiry, and review.

Acceptance: a harmless known-bad fixture demonstrates scanner detection and blocking without introducing exploitable code into production sources.

## 7. DAST and Security Behavior Tests

- Use OWASP ZAP against an explicitly authorized, production-like staging deployment with synthetic data.
- Run a passive/baseline scan for a quick initial assessment; it is not equivalent to active security testing.
- Run authenticated active scans on a schedule and before significant releases, isolated from production and external third-party targets.
- Configure scope, exclusions, rate limits, test accounts, seeded data, and cleanup before active scanning.
- For APIs, provide the supported API definition and role-specific authentication; verify server-side authorization with targeted tests in addition to ZAP.
- Add browser integration tests for session expiry, safe rendering, access-denied UX, and security header behavior where appropriate.
- Test object-level authorization, role escalation, CSRF protection, and rate limiting at the API boundary when those features exist.
- Produce HTML for reviewers and JSON (or SARIF where supported) for tracking from each ZAP run; see Section 8.
- Triage results manually and map confirmed findings back to modeled threats.

Acceptance: staging scans complete with authenticated coverage evidence and no unresolved confirmed critical/high findings unless formally excepted.

## 8. SAST and DAST Reporting

### Report types

| Report                         | Source                                   | Formats                           | Audience                      | Cadence                                  |
| ------------------------------ | ---------------------------------------- | --------------------------------- | ----------------------------- | ---------------------------------------- |
| SAST findings                  | Semgrep or CodeQL                        | SARIF, plus HTML/Markdown summary | Developers, reviewers         | Every pull request and main-branch build |
| Dependency and secret findings | Dependency scanner, secret scanner       | JSON/SARIF, redacted summary      | Developers, security          | Every pull request and nightly           |
| DAST baseline                  | ZAP passive scan                         | HTML, JSON                        | Developers, QA                | Every staging deployment                 |
| DAST authenticated/active      | ZAP active scan                          | HTML, JSON (SARIF if supported)   | Security, release owner       | Scheduled and release candidates         |
| Consolidated security report   | All of the above, SBOM, Threagile output | Markdown/PDF/HTML                 | Management, release approvers | Every release                            |

Confirm the formats supported by the pinned scanner versions before relying on them.

### Report content

Every report records:

- Commit SHA, build or release ID, environment, scanner name and version, ruleset version, and scan timestamp (UTC).
- Scope: paths or URLs scanned, exclusions, authentication roles used, and coverage limits.
- Findings by severity and confidence, with rule ID, location (file/line or URL/parameter), evidence, CWE/OWASP mapping, and remediation guidance.
- Finding status: new, existing, fixed, suppressed, false positive, or accepted risk.
- Links to the related Threagile risk, security requirement, tracking issue, and exception record.

The consolidated release report adds:

- Executive summary and gate result (pass, fail, or pass with exceptions).
- Trend versus the previous release: new, fixed, and aged findings, and mean time to remediate.
- Open exceptions with owner and expiry.
- Scan coverage gaps, for example unauthenticated-only DAST or unscanned routes.
- SBOM reference and dependency vulnerability summary.

### Handling and publishing

- Upload SARIF to the code-scanning view of the repository host if available; show findings in pull requests.
- Publish HTML/JSON as CI artifacts and generate a short pull-request summary comment listing new findings only.
- Reports can contain exploit details, internal URLs, and tokens: redact secrets and session values, restrict access to security and engineering roles, and avoid public artifacts.
- Retain reports and release evidence for a period set by compliance needs; store release-level reports in a controlled location.
- Deduplicate and triage findings in one tracker, with severity-based SLAs, rather than treating raw scanner output as the record.
- Require review of suppressions and false positives; report them, do not drop them silently.
- Archive failed-scan logs, since a scan that did not run or lacked authentication is a coverage gap, not a clean result.
- Do not use pass/fail alone as evidence; the report must show scope and coverage.

Acceptance: for a test release, SAST and DAST reports are generated, redacted, access-controlled, linked from the consolidated release report, and a seeded finding is traceable from report to tracker item to fix.

## 9. Monitoring, Logging, and Incident Response

### Telemetry design

- Use structured server-side logs with UTC timestamp, severity, service, environment, event name, correlation ID, and outcome.
- Treat browser telemetry as untrusted input. Send it through a controlled endpoint with validation, size limits, rate limits, and abuse protection.
- Capture frontend exceptions and failed requests with release identifiers and source-map access restricted to the monitoring service.
- Use OpenTelemetry for backend traces/metrics where applicable; choose a frontend error collector and telemetry backend after hosting and privacy decisions.
- Never log passwords, session cookies, authorization headers, access tokens, or raw sensitive payloads. Redact and minimize personal data at collection.
- Maintain separate security audit events for privileged actions, permission changes, and important authentication outcomes.
- Protect log access, transport, retention, and integrity. Define retention durations and deletion rules from the confirmed data obligations.

### Operational readiness

- Define service indicators for availability, latency, error rate, and authentication failure patterns, with numerical SLOs agreed before launch.
- Alert on actionable security events and sustained service failures, with owners and escalation routes.
- Establish response runbooks for account compromise, secret exposure, dependency incidents, and outages.
- Include rollback, session revocation, evidence preservation, and recovery steps in the relevant runbooks.
- Exercise one synthetic error and one simulated security event from collection through alert delivery.

Acceptance: dashboards show the test events, alerts reach the assigned owner, sensitive fields are absent, and access/retention settings are verified.

## 10. Delivery Phases

| Phase                    | Work                                                                                                         | Exit criteria                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1. Discovery             | Confirm product, data, roles, backend, hosting, and owners.                                                  | Approved architecture and explicit assumptions.                                       |
| 2. Threat model          | Create the Threagile model, abuse cases, and risk register.                                                  | Valid model and assigned mitigation tasks.                                            |
| 3. Developer baseline    | Add ESLint, formatting, focused tests, lockfile, and documented commands.                                    | Local checks pass and deliberate violations fail.                                     |
| 4. Secure vertical slice | Implement one real user journey and its applicable security controls.                                        | Functional and negative security tests pass.                                          |
| 5. CI security           | Integrate SAST, secret/dependency scanning, model validation, and SAST report generation (SARIF, summaries). | Blocking checks verified with safe fixtures; reports published and access-controlled. |
| 6. Staging validation    | Deploy staging, add authenticated DAST, authorization checks, and DAST reports.                              | Coverage documented, reports triaged, and material findings resolved.                 |
| 7. Operations            | Integrate sanitized telemetry, alerts, retention, and response runbooks.                                     | End-to-end alert and recovery exercise passes.                                        |
| 8. Release               | Produce the consolidated security report; review risk treatment, evidence, and rollback readiness.           | Named release/security owners approve.                                                |

Implement incrementally; do not postpone threat modeling until the application is complete.

## 11. CI and Release Gates

Proposed pipeline order:

1. Deterministic dependency installation from the lockfile.
2. Formatting, TypeScript/template linting, unit tests, and production build.
3. SAST, secret scanning, dependency checks, and Threagile model validation/risk review; publish SARIF and summaries.
4. Build the immutable release artifact and generate its SBOM.
5. Deploy that artifact to staging and run smoke/security behavior tests.
6. Run the appropriate DAST profile, publish HTML/JSON reports, and review confirmed findings.
7. Generate the consolidated security report, approve, and promote the same artifact to production, then verify health.

Run inexpensive checks on pull requests. Run heavier authenticated DAST on schedules and release candidates. Pin CI actions/scanner versions, minimize CI permissions, and keep credentials in the CI secret store.

Initial gate policy:

- Fail on lint, formatting, tests, build, or invalid model errors.
- Block verified secrets; revoke exposed credentials rather than merely deleting the finding.
- Block new confirmed critical/high security findings and unresolved release-critical risks.
- Assign medium findings a remediation deadline; track low findings in the backlog.
- Existing findings require explicit triage; baselines must not silently hide vulnerabilities.
- All exceptions require a named risk owner, justification, compensating controls, expiry, and approver.
- Define exact severity mappings and remediation deadlines before enabling gates.

## 12. Planned Repository Artifacts

Create these only during the relevant implementation phases:

- `eslint.config.js` and scoped lint scripts.
- `security/threagile.yaml` and `security/risk-register.md`.
- `security/security-requirements.md` with threat-to-control-to-test traceability.
- `security/scanning/` for scoped scanner configuration and reviewed exceptions.
- `security/reporting.md` for report templates, redaction rules, retention, and access roles; generated reports belong in CI artifacts, not in version control.
- CI workflow configuration appropriate to the selected CI provider.
- `docs/operations.md` for telemetry, alerts, retention, and response runbooks.

Extend existing test files where practical. Add backend, deployment, and integration-test artifacts only when the agreed architecture needs them.

## 13. Definition of Done

- Product scope and trust boundaries are approved.
- Threat model and risk register reflect the implemented architecture.
- Security requirements have owners and verification evidence.
- ESLint and formatting are reproducible and enforced in CI.
- SAST, dependency, and secret checks run with reviewed results.
- Authorized DAST covers staging, including authenticated paths where relevant.
- SAST and DAST reports are generated per run, redacted, access-controlled, retained, and rolled into a consolidated release report with coverage stated.
- Monitoring and audit logging are tested, sanitized, and access-controlled.
- Material risks are resolved or explicitly accepted with expiring exceptions.
- Release, rollback, and incident response responsibilities are documented.

## 14. First Implementation Milestone

After the scope decisions are confirmed, implement the developer baseline and the initial threat model first: compatible ESLint configuration, formatting checks, focused validation, a schema-valid Threagile model, and a reviewed risk register. Add CI security checks next, then secure the first agreed user journey.
