# ShadowChat Core product status

Status: **engineering beta / major-application core**.

This branch verifies and hardens one concrete messaging boundary while retaining the existing full-stack application. The repository already has React/Vite, Express/tRPC, database integration surfaces, tests, and production build scripts, but those ingredients alone do not prove a deployed production chat service.

## Verified by the branch CI gate

- locked dependency install;
- strict TypeScript check;
- Vitest suite, including messaging-contract regression tests;
- production frontend/server build;
- high-severity dependency audit.

## Messaging contract guarantees

- message content is trimmed, non-empty, and bounded to 2,000 characters;
- sender/recipient identifiers must be positive integers and self-messaging is rejected;
- direct record construction re-validates the input instead of assuming callers pre-validated it;
- message IDs are bounded to a conservative machine-safe character set;
- invalid timestamps are rejected and stored dates are defensive copies;
- reads are limited by the contract helper to valid sender/recipient IDs.

## Not established by this branch

No claim is made that database migrations, OAuth, WebSockets, external AI/Web3/payment providers, object storage, domains/TLS, staging deployment, backups, monitoring, incident response, or production operations are verified. Those remain separate runtime/security/staging gates.
