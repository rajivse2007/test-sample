# Risk Register

Source: `security/threagile.yaml` (Threagile `latest` image as pulled 2026-10-06; pin a specific version in CI).
Status: initial triage. All risks are `unchecked` in Threagile; none are accepted yet.
Reports are generated into `security/output/` (git-ignored, restricted artifact).

Many findings result from assumed components (backend, identity provider, telemetry). Re-run after discovery decisions.

Summary: 12 elevated, 16 medium, 8 low (36 total, no critical/high).

## Elevated

| Risk category                       | Count | Affected              | Proposed treatment                                                                                     | Owner | Status |
| ----------------------------------- | ----- | --------------------- | ------------------------------------------------------------------------------------------------------ | ----- | ------ |
| cross-site-scripting                | 2     | SPA host, backend API | Angular default escaping; no sanitizer bypass (lint-enforced); strict CSP; server-side output encoding | TBD   | Open   |
| missing-authentication              | 1     | Telemetry collector   | Rate limits, schema validation, size limits, or a signed ingest token; document accepted residual risk | TBD   | Open   |
| unguarded-access-from-internet      | 3     | Hosts, API, collector | Reverse proxy/WAF, TLS, request limits, least-privilege exposure                                       | TBD   | Open   |
| server-side-request-forgery         | 1     | Backend API           | Allow-list outbound targets; block internal address ranges                                             | TBD   | Open   |
| missing-hardening                   | 3     | Hosts and services    | Baseline hardening and configuration scanning                                                          | TBD   | Open   |
| missing-cloud-hardening             | 1     | Hosting environment   | Apply provider benchmark (CIS or equivalent)                                                           | TBD   | Open   |
| missing-identity-provider-isolation | 1     | Identity provider     | Network isolation if self-hosted; managed provider otherwise                                           | TBD   | Open   |

## Medium

| Risk category                        | Count | Proposed treatment                                                                     | Status |
| ------------------------------------ | ----- | -------------------------------------------------------------------------------------- | ------ |
| cross-site-request-forgery           | 3     | SameSite cookies plus anti-CSRF token, or bearer-token API with no ambient credentials | Open   |
| missing-waf                          | 3     | Decide on WAF at the edge                                                              | Open   |
| unencrypted-asset                    | 3     | Confirm storage encryption once data stores exist                                      | Open   |
| container-baseimage-backdooring      | 3     | Pin and scan base images, minimal images                                               | Open   |
| missing-authentication-second-factor | 2     | MFA at the identity provider for privileged roles                                      | Open   |
| missing-vault                        | 1     | Secret manager for server-side secrets                                                 | Open   |
| missing-build-infrastructure         | 1     | Model CI/CD and artifact registry as assets                                            | Open   |
| missing-identity-store               | 1     | Model the user directory once the identity provider is chosen                          | Open   |

## Low

dos-risky-access-across-trust-boundary, unnecessary-communication-link, wrong-communication-link-content (3), missing-network-segmentation, unnecessary-technical-asset. Review during the next model iteration.

## Process

- Each risk needs an owner, status, justification, and review date; record decisions in `risk_tracking` in the Threagile model.
- Release gate: no unresolved critical/high risks; elevated risks need a treatment or an expiring accepted-risk entry.
- Not modeled yet: CI/CD pipeline, dependency supply chain, and the Threagile abuse cases beyond the listed ones. Add them with the CI work.
