# Security Reporting

Generated reports are CI artifacts, not source files. They may contain exploit details and internal URLs: restrict them to engineering and security roles.

| Report           | Produced by                | Artifact / location                 | Format               | Retention           |
| ---------------- | -------------------------- | ----------------------------------- | -------------------- | ------------------- |
| SAST findings    | CodeQL (`codeql.yml`)      | GitHub Security > Code scanning     | SARIF                | Per GitHub settings |
| Secret scan      | Gitleaks (`security.yml`)  | `gitleaks-report`                   | SARIF (redacted)     | 30 days             |
| Dependency audit | npm audit (`security.yml`) | `dependency-reports/npm-audit.json` | JSON                 | 90 days             |
| SBOM             | CycloneDX (`security.yml`) | `dependency-reports/sbom.cdx.json`  | CycloneDX JSON       | 90 days             |
| Threat model     | Threagile (`security.yml`) | `threagile-report`                  | PDF, XLSX, JSON, PNG | 90 days             |
| DAST baseline    | ZAP (`dast.yml`)           | `zap-baseline-report`               | HTML, JSON, Markdown | 90 days             |

## Required content

Each report records commit SHA, workflow run, scanner and version, scan time (UTC), scope and exclusions, and findings with severity, location, and remediation. A scan that did not run or could not reach its target is a coverage gap, not a clean result.

## Gates

- CI: format, lint, tests, build must pass.
- Security: no secrets; no high findings in production dependencies; no critical findings in any dependency; no unresolved critical or high Threagile risks.
- DAST: no High ZAP alerts; CSP, anti-clickjacking, and nosniff rules must not fail.
- CodeQL: make the check required in branch protection once the first run is reviewed.

## Triage

1. Review new findings on each pull request or scheduled run.
2. Confirm or mark false positive; record the reason.
3. Track confirmed findings as issues with owner and due date (critical: immediately; high: 7 days; medium: 30 days; low: backlog).
4. Exceptions need a named approver, justification, compensating control, and an expiry date.

## Accepted risks (current)

| Finding                                               | Scope                                       | Reason                                                                                                                     | Review by  |
| ----------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `braces` stack-exhaustion DoS (via Karma, `chokidar`) | Dev tooling only; not in the shipped bundle | No fixed upstream release                                                                                                  | 2027-01-06 |
| ZAP 10055 `style-src 'unsafe-inline'`                 | CSP                                         | Angular component styles are inlined; move to a nonce (`ngCspNonce`) when the production host can issue per-request nonces | 2027-01-06 |
| ZAP 10049, 10109 (cacheable content, modern web app)  | Dev server responses                        | Informational; caching is set by the production host                                                                       | 2027-01-06 |

## Release report

`release.yml` runs on a `v*` tag (or manually). It builds the bundle with a SHA-256 checksum and SBOM, then generates `release-report.md`: the latest result of each required check on the tagged commit, open CodeQL alerts by severity, evidence links, and coverage limits. The report fails if any required check is not `success` or any critical or high CodeQL alert is open. On a tag it publishes a GitHub release with the bundle, checksum, SBOM, and report.

- Tag a commit only after CI, Security, CodeQL, and DAST have finished for it; checks still running count as not passing.
- Review accepted-risk expiry dates above before tagging.
- Not yet covered: new and fixed findings since the previous release, and deployment (hosting is undecided).

## Branch protection

`.github/rulesets/main-protection.json` is a repository ruleset for `main`: no deletion or force push, pull request required, and the CI, Gitleaks, dependency, Threagile, and CodeQL checks must pass. DAST is excluded because it does not run on pull requests. Import it in GitHub: Settings > Rules > Rulesets > New ruleset > Import a ruleset. Required checks only appear for selection after each workflow has run once.
