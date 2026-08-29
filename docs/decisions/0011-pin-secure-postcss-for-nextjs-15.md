# ADR-0011: Pin Secure PostCSS for Next.js 15

- Status: Accepted
- Date: 2026-08-29

## Context

The project runs Next.js 15.5.24. Its dependency tree pins PostCSS 8.4.31,
while current security advisories affect PostCSS versions through 8.5.22.
The standard audit repair path proposes a Next.js 16 upgrade, which requires a
dedicated compatibility review and migration task.

## Decision

Use the npm `overrides` field to resolve PostCSS 8.5.26 across the project
while the application remains on Next.js 15. Keep the Next.js security patch at
15.5.24 and verify the resulting dependency tree with tests, a production
build, type checks, and `npm audit`.

## Why This Option

- PostCSS 8.5.26 is outside the affected advisory ranges.
- The override removes the known vulnerability while retaining the verified
  Next.js 15 application surface.
- The lockfile records the exact dependency resolution for local development
  and CI.

## Alternatives Considered

### Upgrade to Next.js 16

Next.js 16 is the standard audit repair path. It remains a future dedicated
migration because a major framework upgrade deserves explicit compatibility
testing and a focused review.

### Accept the Advisory Until a Framework Migration

Leaving a known high-risk build dependency in the project conflicts with the
security standard for a portfolio product.

## Consequences

- Every future Next.js update requires an audit and production-build check.
- The PostCSS override remains visible in `package.json` for maintainers and
  interview discussion.
- A later Next.js 16 migration can remove this override after its own audit and
  verification pass.

## Revisit When

Revisit this decision when a compatible Next.js 15 release resolves the
dependency, when the project schedules a Next.js 16 migration, or when future
security advisories affect the override path.
