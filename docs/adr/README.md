# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Blockchain Snapshots Service.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences. ADRs help future developers (including ourselves) understand why certain decisions were made.

## ADR Format

Each ADR follows this structure:
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: What is the issue we're trying to solve?
- **Decision**: What decision did we make?
- **Rationale**: Why did we make this decision?
- **Consequences**: What are the positive and negative outcomes?

## Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-authentication-nextauth-vs-clerk.md) | Authentication Provider - NextAuth vs Clerk | Accepted | 2025-01-26 |

## Creating a New ADR

1. Copy the template from an existing ADR
2. Name it with the next number: `XXX-brief-description.md`
3. Fill in all sections
4. Update this README with the new ADR

## References
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) by Michael Nygard
- [ADR Tools](https://github.com/npryce/adr-tools)