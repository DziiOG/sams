# SAMS Architecture Overview

## Principles

- Domain-Driven Design boundaries are enforced through lint rules.
- Messaging flows through RabbitMQ only.
- Controllers delegate to use-cases and avoid business logic.
- Shared infrastructure is exposed through `@sams/shared` abstractions.

## Initial flow

`HTTP POST /webhooks/messages` -> `ProcessInboundMessageUseCase` -> `RabbitMqInboundMessagePublisher` -> `sams.inbound`
