import { Inject, Injectable } from '@nestjs/common';

import type { ApprovalRelay, ApprovalRequest, ApprovalResult } from '../../application/ports/approval-relay';
import {
  ORCHESTRATOR_RUNTIME_CONFIG,
  type OrchestratorRuntimeConfig,
} from '../config/orchestrator.tokens';

@Injectable()
export class SimulatedApprovalRelay implements ApprovalRelay {
  public constructor(
    @Inject(ORCHESTRATOR_RUNTIME_CONFIG)
    private readonly runtimeConfig: OrchestratorRuntimeConfig,
  ) {}

  public async requestApproval(request: ApprovalRequest): Promise<ApprovalResult> {
    console.warn(
      `[approval:${request.correlationId}] Review request for ${request.recipientPhone}: ${request.suggestion}`,
    );

    if (this.runtimeConfig.simulatedApprovalDecision === 'N') {
      return {
        status: 'rejected',
        approvedBy: this.runtimeConfig.ownerPhone,
      };
    }

    if (this.runtimeConfig.simulatedApprovalDecision === 'E') {
      return {
        status: 'approved',
        approvedBy: this.runtimeConfig.ownerPhone,
        editedReply: `${request.suggestion} (edited by owner simulator)`,
      };
    }

    return {
      status: 'approved',
      approvedBy: this.runtimeConfig.ownerPhone,
    };
  }
}
