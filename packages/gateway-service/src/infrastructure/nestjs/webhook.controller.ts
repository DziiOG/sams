import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  ApiResponseFactory,
  Result,
  type ApiResponseEnvelope,
} from '@sams/shared';

import type {
  ProcessInboundMessageCommand,
  ProcessInboundMessageResult,
} from '../../application/use-cases/process-inbound-message.use-case';
import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';
import { WhatsAppWebhookAdapter } from '../adapters/whatsapp-webhook.adapter';
import { GATEWAY_RUNTIME_CONFIG, type GatewayRuntimeConfig } from '../config/gateway.tokens';
import {
  type RequestWithRawBody,
  WhatsAppHmacGuard,
} from '../guards/whatsapp-hmac.guard';

@Controller('webhook')
export class WebhookController {
  public constructor(
    @Inject(ProcessInboundMessageUseCase)
    private readonly processInboundMessageUseCase: ProcessInboundMessageUseCase,
    @Inject(WhatsAppWebhookAdapter)
    private readonly whatsAppWebhookAdapter: WhatsAppWebhookAdapter,
    @Inject(GATEWAY_RUNTIME_CONFIG)
    private readonly runtimeConfig: GatewayRuntimeConfig,
    @Inject(WhatsAppHmacGuard)
    private readonly whatsAppHmacGuard: WhatsAppHmacGuard,
  ) {}

  @Get('whatsapp')
  public verifyWebhook(
    @Query() query: Record<string, string | undefined>,
    @Res() response: Response,
  ): void {
    const mode = query['hub.mode'];
    const verifyToken = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (
      mode === 'subscribe' &&
      verifyToken === this.runtimeConfig.whatsappVerifyToken &&
      challenge
    ) {
      response.status(HttpStatus.OK).send(challenge);
      return;
    }

    response.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Post('whatsapp')
  @HttpCode(HttpStatus.ACCEPTED)
  public async handleWhatsAppWebhook(
    @Body() body: unknown,
    @Req() request: RequestWithRawBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponseEnvelope<ProcessInboundMessageResult>> {
    const signatureResult = this.whatsAppHmacGuard.validateRequest(request);

    if (signatureResult.isFailure) {
      return ApiResponseFactory.create(
        Result.failure<ProcessInboundMessageResult>(
          signatureResult.error ?? 'Unauthorized',
          signatureResult.status,
          signatureResult.errors,
        ),
        response,
      );
    }

    const commandResult = this.whatsAppWebhookAdapter.parse(body);

    if (commandResult.isFailure) {
      return ApiResponseFactory.create(
        Result.failure<ProcessInboundMessageResult>(
          commandResult.error ?? 'Invalid WhatsApp webhook payload',
          commandResult.status,
          commandResult.errors,
        ),
        response,
      );
    }

    const result = await this.processInboundMessageUseCase.execute(
      commandResult.value as ProcessInboundMessageCommand,
    );

    return ApiResponseFactory.create(result, response);
  }
}
