import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  UseGuards,
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
import { WhatsAppHmacGuard } from '../guards/whatsapp-hmac.guard';

@Controller('webhook')
export class WebhookController {
  public constructor(
    @Inject(ProcessInboundMessageUseCase)
    private readonly processInboundMessageUseCase: ProcessInboundMessageUseCase,
    @Inject(WhatsAppWebhookAdapter)
    private readonly whatsAppWebhookAdapter: WhatsAppWebhookAdapter,
    @Inject(GATEWAY_RUNTIME_CONFIG)
    private readonly runtimeConfig: GatewayRuntimeConfig,
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
  @UseGuards(WhatsAppHmacGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  public async handleWhatsAppWebhook(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponseEnvelope<ProcessInboundMessageResult>> {
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
