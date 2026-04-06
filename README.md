# SAMS (Selective Autonomous Messaging System)

SAMS is a production-oriented monorepo scaffold for DDD-first autonomous messaging services built on NestJS and RabbitMQ.

## Workspace layout

- `packages/gateway-service` — inbound HTTP entrypoint and RabbitMQ publisher
- `packages/orchestrator-service` — orchestration service shell
- `packages/sender-service` — outbound sender service shell
- `packages/shared` — shared messaging abstractions and contracts
- `services/ai-service` — AI service placeholder
- `services/memory-service` — memory service placeholder
- `tests/integration` — Testcontainers-backed messaging tests

## Quick start

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## Local RabbitMQ

```bash
docker compose up -d rabbitmq
```

Management UI: `http://localhost:15672` (`sams` / `sams`)
# sams
