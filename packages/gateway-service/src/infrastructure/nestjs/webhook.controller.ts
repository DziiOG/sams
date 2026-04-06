import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';

import type { ProcessInboundMessageResult } from '../../application/use-cases/process-inbound-message.use-case';
import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';

class InboundMessageDto {
  @IsString()
  @IsIn(['sms', 'whatsapp', 'email', 'webchat'])
  public channel!: string;

  @IsString()
  public senderId!: string;

  @IsString()
  public content!: string;

  @IsOptional()
  @IsString()
  public correlationId?: string;
}

@Controller('webhooks')
export class WebhookController {
  public constructor(
    @Inject(ProcessInboundMessageUseCase)
    private readonly processInboundMessageUseCase: ProcessInboundMessageUseCase,
  ) {}

  @Post('messages')
  @HttpCode(HttpStatus.ACCEPTED)
  public async handleInbound(
    @Body() body: InboundMessageDto,
  ): Promise<ProcessInboundMessageResult> {
    return this.processInboundMessageUseCase.execute(body);
  }
}
