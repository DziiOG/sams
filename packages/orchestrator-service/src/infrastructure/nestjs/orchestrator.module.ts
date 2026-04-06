import { Module } from '@nestjs/common';

import {
  loadSamsRuntimeConfig,
  RabbitMqConnectionManager,
  RabbitMqConsumer,
  RabbitMqProducer,
} from '@sams/shared';

import type { AIProvider } from '../../application/ports/ai-provider';
import type { ApprovalRelay } from '../../application/ports/approval-relay';
import type { DispatchPublisher } from '../../application/ports/dispatch-publisher';
import { GetServiceStatusUseCase } from '../../application/use-cases/get-service-status.use-case';
import { OrchestratePipelineUseCase } from '../../application/use-cases/orchestrate-pipeline.use-case';
import { MockAIProvider } from '../adapters/mock-ai.provider';
import { SimulatedApprovalRelay } from '../adapters/simulated-approval.relay';
import { ORCHESTRATOR_RUNTIME_CONFIG, type OrchestratorRuntimeConfig } from '../config/orchestrator.tokens';
import { RabbitMqDispatchPublisher } from '../messaging/rabbitmq-dispatch.publisher';
import { RabbitMqInboundMessageConsumer } from '../messaging/rabbitmq-inbound-message.consumer';
import { HealthController } from './health.controller';

const AI_PROVIDER = Symbol('AI_PROVIDER');
const APPROVAL_RELAY = Symbol('APPROVAL_RELAY');
const DISPATCH_PUBLISHER = Symbol('DISPATCH_PUBLISHER');

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: ORCHESTRATOR_RUNTIME_CONFIG,
      useFactory: (): OrchestratorRuntimeConfig => loadSamsRuntimeConfig(),
    },
    {
      provide: RabbitMqConnectionManager,
      useFactory: (runtimeConfig: OrchestratorRuntimeConfig): RabbitMqConnectionManager =>
        new RabbitMqConnectionManager(runtimeConfig.rabbitMqUrl),
      inject: [ORCHESTRATOR_RUNTIME_CONFIG],
    },
    {
      provide: RabbitMqConsumer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqConsumer =>
        new RabbitMqConsumer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    {
      provide: RabbitMqProducer,
      useFactory: (connectionManager: RabbitMqConnectionManager): RabbitMqProducer =>
        new RabbitMqProducer(connectionManager),
      inject: [RabbitMqConnectionManager],
    },
    MockAIProvider,
    SimulatedApprovalRelay,
    RabbitMqDispatchPublisher,
    {
      provide: AI_PROVIDER,
      useExisting: MockAIProvider,
    },
    {
      provide: APPROVAL_RELAY,
      useExisting: SimulatedApprovalRelay,
    },
    {
      provide: DISPATCH_PUBLISHER,
      useExisting: RabbitMqDispatchPublisher,
    },
    {
      provide: OrchestratePipelineUseCase,
      useFactory: (
        aiProvider: AIProvider,
        approvalRelay: ApprovalRelay,
        dispatchPublisher: DispatchPublisher,
      ): OrchestratePipelineUseCase =>
        new OrchestratePipelineUseCase(aiProvider, approvalRelay, dispatchPublisher),
      inject: [AI_PROVIDER, APPROVAL_RELAY, DISPATCH_PUBLISHER],
    },
    RabbitMqInboundMessageConsumer,
    GetServiceStatusUseCase,
  ],
})
export class OrchestratorModule {}
