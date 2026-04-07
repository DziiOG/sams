# AGENT_RULES.md

This file is the authoritative governance guide for changes made inside the SAMS monorepo.

## Core Rules

1. **Definition of done is strict**
   - A task is not complete until `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm test:integration` all pass.
   - If any required check fails, the work remains incomplete.

2. **DDD boundaries are mandatory**
   - `domain` must remain pure and must not import from `application` or `infrastructure`.
   - `application` may depend on `domain`, but must not import from `infrastructure`.
   - `infrastructure` may depend on `application` and `domain`.
   - Boundary violations must fail lint.

3. **Messaging architecture is RabbitMQ-only**
   - Cross-service asynchronous communication must go through RabbitMQ.
   - Durable exchanges and persistent messages are required.
   - Every published message must carry `correlationId` and `timestamp` metadata.
   - Raw `amqplib` usage must stay inside `packages/shared` only.

4. **Result-based application flow is mandatory**
   - Expected outcomes must not use exceptions in `application` or controller layers.
   - Public use-case/service entry methods must return `Promise<Result<T>>` and use `try/catch`.
   - Controllers must convert `Result<T>` values through the centralized `ApiResponseFactory`.
   - The global exception path is a fallback for unexpected/system failures only.

## Code Rules

1. **Use-case-first application design**
   - Controllers, handlers, and consumers must delegate to explicit use-case classes.
   - Business rules belong in `domain` and `application`, not in controllers.

2. **Infrastructure isolation**
   - Domain entities and value objects must not reference NestJS, HTTP, RabbitMQ, persistence clients, or framework-specific decorators.
   - Adapters must translate external inputs into application commands.

3. **Scalability over shortcuts**
   - Favor explicit modules, interfaces, and contracts.
   - Do not bypass the shared messaging wrapper.
   - Avoid hidden coupling between services.

## Testing Rules

1. **Unit tests are required for all logic**
   - Domain validation and application use-cases must have focused unit tests.

2. **Integration tests are required for messaging flows**
   - RabbitMQ publish/consume paths must be verified with Testcontainers or equivalent real infrastructure tests.

3. **Coverage target**
   - Domain and application layers should maintain **>= 90%** coverage.

4. **Testing style**
   - Prefer real behavior assertions over mock-only assertions.
   - Mock only the lowest seam required for unit isolation.

## Workflow Rules

1. **Update documentation**
   - Update `CHANGELOG.md` for user-visible or architecture-affecting changes.
   - Update the relevant docs when behavior, contracts, or workflows change.

2. **Use conventional commits**
   - Commit messages should follow conventional commit formatting such as `feat:`, `fix:`, `refactor:`, `test:`, or `docs:`.

3. **Preserve verification discipline**
   - Never claim completion without fresh command evidence.
   - Prefer small, reviewable changes with explicit verification steps.

## Failure Handling

1. **If tests fail, the task is incomplete**
   - Stop marking progress as done and fix the failure or report the blocker.

2. **If uncertain, stop and explain**
   - Do not guess across architecture or contract boundaries.
   - Surface the uncertainty, explain the risk, and request clarification if needed.
