# Changelog

## 0.2.0 - 2026-04-06

- added Phase 1 WhatsApp MVP pipeline with fail-fast Zod environment validation
- implemented a WhatsApp webhook ingress with HMAC verification and owner allowlist enforcement
- implemented orchestrator consumption, mock AI reply generation, and simulated approval relay
- implemented sender dispatch with simulated and real WhatsApp Cloud API adapter modes
- expanded integration coverage for webhook publish, orchestrator consume, sender dispatch, and end-to-end pipeline verification

## 0.1.0 - 2026-04-06

- bootstrapped the SAMS monorepo structure
- added NestJS service scaffolds for gateway, orchestrator, and sender
- added a shared RabbitMQ messaging wrapper with retry-aware consumer support
- added Jest unit and Testcontainers integration test setup
- added CI and repository governance rules
