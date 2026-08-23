# ShadowChat Core — Architecture

## Runtime boundary

ShadowChat Core is a large application repository spanning web UI, TypeScript services, SQL, and supporting components. The architecture should be treated as a set of explicit boundaries rather than one undifferentiated application.

```text
Browser / Mobile UI
        |
        v
   HTTP / tRPC
        |
        v
+--------------------+
| Auth / Session     |
+----------+---------+
           |
           v
+--------------------+
| Domain procedures  |
| messages / users   |
| ecosystem services |
+----------+---------+
           |
     +-----+------+
     |            |
     v            v
 Database      event/realtime
 / Drizzle      boundaries
     |            |
     +-----+------+
           |
           v
    observability
```

## Verified operational boundary

The repository exposes a health-check implementation that reports process uptime, memory usage, timestamp, and health status. This is a liveness signal, not proof that the database, OAuth provider, wallet integrations, AI providers, or production traffic path are healthy.

## Messaging boundary

Direct messaging uses typed application procedures and database-backed message records. The in-process subscriber path is intentionally documented as process-local; it should not be represented as a distributed WebSocket or multi-instance event bus without a durable/shared transport.

## Security boundary

OAuth configuration, JWT signing secrets, and database credentials belong on the server. Browser bundles must receive only explicitly public configuration. Deployment environments should add TLS, secret rotation, least-privilege database credentials, rate limiting, audit logging, and centralized telemetry.

## CI contract

GitHub Actions now performs locked dependency installation, TypeScript checking, the repository test suite, production build, and a high-severity dependency audit on main-branch changes and pull requests.

## Product/value surfaces

Potential institutional product surfaces include secure communication infrastructure, team collaboration, messaging APIs, enterprise integrations, AI-assisted communication tooling, audit/history services, identity integrations, analytics, managed hosting, premium support/SLA services, and implementation/migration work. These are potential business models, not claims of current revenue or adoption.

## Production gates

Production deployment still requires independently verified database provisioning/migrations, OAuth provider configuration, secrets management, TLS, monitoring/alerting, backups and restore testing, authenticated end-to-end tests, and a rollback procedure.
