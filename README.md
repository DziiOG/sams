# SAMS (Selective Autonomous Messaging System)

SAMS is a production-oriented monorepo for DDD-first autonomous messaging services built on NestJS and RabbitMQ.

## Workspace layout

- `packages/gateway-service` — WhatsApp webhook ingress, HMAC validation, inbound publishing
- `packages/orchestrator-service` — AI/policy orchestration and approval relay
- `packages/sender-service` — outbound WhatsApp dispatch and retry handling
- `packages/shared` — shared messaging abstractions, event contracts, and env validation
- `services/ai-service` — future AI service placeholder
- `services/memory-service` — future memory service placeholder
- `tests/integration` — Testcontainers-backed messaging and end-to-end tests

## Quick start

1. Create a dedicated env file for each NestJS service:

```bash
cp packages/gateway-service/.env.example packages/gateway-service/.env
cp packages/orchestrator-service/.env.example packages/orchestrator-service/.env
cp packages/sender-service/.env.example packages/sender-service/.env
```

2. Start the local dependencies:

```bash
docker compose up -d rabbitmq redis postgres
```

Or launch the full Phase 1 stack in Docker:

```bash
docker compose --profile app up --build
```

3. Install and verify the workspace:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## Phase 1 WhatsApp MVP flow

```text
POST /webhook/whatsapp
  -> HMAC validation
  -> owner allowlist check
  -> publish inbound.whatsapp to sams.inbound
  -> orchestrator consumes and builds reply suggestion
  -> simulated approval relay approves/rejects
  -> publish sender.dispatch to sams.sender
  -> sender dispatches via simulated sender or WhatsApp Cloud API
```

## Running the services locally

- `gateway-service` → `http://localhost:3000`
- `orchestrator-service` → `http://localhost:3001`
- `sender-service` → `http://localhost:3002`

```bash
pnpm start:gateway
pnpm start:orchestrator
pnpm start:sender
```

## Runtime modes

- `WHATSAPP_MODE=simulated` — local MVP mode with no Meta credentials required
- `WHATSAPP_MODE=cloud` — uses the real WhatsApp Cloud API once credentials are available
- `APPROVAL_MODE=simulated` — auto-approves via the local approval relay

Management UI: `http://localhost:15672` (`sams` / `sams`)
# sams
