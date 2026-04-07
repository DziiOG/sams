import { createHmac, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { Result } from '@sams/shared';

import { GATEWAY_RUNTIME_CONFIG, type GatewayRuntimeConfig } from '../config/gateway.tokens';

export interface RequestWithRawBody {
  rawBody?: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class WhatsAppHmacGuard {
  public constructor(
    @Inject(GATEWAY_RUNTIME_CONFIG)
    private readonly runtimeConfig: GatewayRuntimeConfig,
  ) {}

  public validateRequest(request: RequestWithRawBody): Result<void> {
    const signatureHeader = request.headers['x-hub-signature-256'];

    if (typeof signatureHeader !== 'string') {
      return Result.unauthorized('Missing X-Hub-Signature-256 header');
    }

    if (!request.rawBody) {
      return Result.unauthorized('Raw request body is required for WhatsApp signature validation');
    }

    const expectedSignature = this.computeSignature(request.rawBody);
    const providedSignature = Buffer.from(signatureHeader);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      providedSignature.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(providedSignature, expectedSignatureBuffer)
    ) {
      return Result.unauthorized('Invalid WhatsApp webhook signature');
    }

    return Result.success(undefined);
  }

  private computeSignature(rawBody: Buffer): string {
    return `sha256=${createHmac('sha256', this.runtimeConfig.whatsappAppSecret)
      .update(rawBody)
      .digest('hex')}`;
  }
}
