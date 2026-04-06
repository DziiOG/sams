import { createHmac, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { GATEWAY_RUNTIME_CONFIG, type GatewayRuntimeConfig } from '../config/gateway.tokens';

interface RequestWithRawBody {
  rawBody?: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class WhatsAppHmacGuard implements CanActivate {
  public constructor(
    @Inject(GATEWAY_RUNTIME_CONFIG)
    private readonly runtimeConfig: GatewayRuntimeConfig,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithRawBody>();
    const signatureHeader = request.headers['x-hub-signature-256'];

    if (typeof signatureHeader !== 'string') {
      throw new UnauthorizedException('Missing X-Hub-Signature-256 header');
    }

    if (!request.rawBody) {
      throw new UnauthorizedException('Raw request body is required for WhatsApp signature validation');
    }

    const expectedSignature = this.computeSignature(request.rawBody);
    const providedSignature = Buffer.from(signatureHeader);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      providedSignature.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(providedSignature, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('Invalid WhatsApp webhook signature');
    }

    return true;
  }

  private computeSignature(rawBody: Buffer): string {
    return `sha256=${createHmac('sha256', this.runtimeConfig.whatsappAppSecret)
      .update(rawBody)
      .digest('hex')}`;
  }
}
