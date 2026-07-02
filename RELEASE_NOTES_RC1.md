# VaanForge v1.0.0-rc1 Release Notes

Company: KRAVIA PRIVATE LIMITED  
Product: VaanForge  
Release: v1.0.0-rc1  
Status: Release Candidate for closed beta

## Summary

VaanForge v1.0.0-rc1 is the first production-quality release candidate for KRAVIA's enterprise AI software factory. It freezes the implemented platform and validates the current system for closed-beta approval.

## Release Scope

Included:

- Customer Builder Portal
- Autonomous Software Factory
- VaanForge AI agent planning and execution workflows
- Multi-agent team system
- Live agent workspace
- Deployment agent
- Memory and knowledge base
- Template and app marketplace
- Developer platform
- Billing, subscriptions, credits, invoices, and usage limits
- Operations command center
- KRAVIA Cloud Platform foundations
- Enterprise security, audit, and compliance readiness surfaces

## Quality Gates

The RC1 validation suite includes:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## Release Decision

RC1 is recommended as **Ready for Closed Beta** after production environment configuration is completed.

It is not recommended for broad public production launch until load testing, production provider configuration, queue/DLQ setup, and production readiness checks are complete.
