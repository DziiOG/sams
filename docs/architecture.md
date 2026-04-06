# SAMS Architecture Overview

## Principles

- Domain-Driven Design boundaries are enforced through lint rules.
- Messaging flows through RabbitMQ only.
- Controllers delegate to use-cases and avoid business logic.
- Shared infrastructure is exposed through `@sams/shared` abstractions.
- Runtime config is validated with Zod and fails fast at startup.

## Phase 1 WhatsApp MVP pipeline

```text
Meta / local simulator webhook
  -> gateway-service
     -> HMAC guard validates X-Hub-Signature-256
     -> WhatsAppWebhookAdapter normalizes payload
     -> ProcessInboundMessageUseCase checks OWNER_PHONE allowlist
     -> publish inbound.whatsapp on sams.inbound (topic)

sams.inbound / inbound.whatsapp
  -> orchestrator-service
     -> RabbitMqInboundMessageConsumer
     -> OrchestratePipelineUseCase
     -> MockAIProvider generates a reply suggestion
     -> PolicyEngine marks the response as review-required
     -> SimulatedApprovalRelay approves/rejects the suggestion
     -> publish sender.dispatch on sams.sender (direct)

sams.sender / sender.dispatch
  -> sender-service
     -> RabbitMqDispatchConsumer
     -> DispatchOutboundMessageUseCase
     -> SimulatedWhatsAppSendAdapter or WhatsAppSendAdapter
     -> dead-letter routing on repeated failures
```

## Exchanges and routing keys

- `sams.inbound` (`topic`)
  - `inbound.whatsapp`
- `sams.sender` (`direct`)
  - `sender.dispatch`
- `sams.dead-letter` (`direct`)
  - `sender.dispatch.failed`

## Environment modes

- **Simulated mode** is the default and requires no Meta credentials beyond local placeholders.
- **Cloud mode** activates the real WhatsApp Cloud API adapter once the user provides:
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_APP_SECRET`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN`
  - `OWNER_PHONE`
