import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const attemptedDotEnvLoads = new Set<string>();

export type RuntimeMode = 'simulated' | 'cloud';
export type ApprovalMode = 'simulated' | 'whatsapp';

export interface SamsRuntimeConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  rabbitMqUrl: string;
  redisUrl: string;
  databaseUrl: string;
  whatsappToken?: string;
  whatsappAppSecret: string;
  whatsappPhoneNumberId?: string;
  whatsappVerifyToken: string;
  ownerPhone: string;
  llmProvider: string;
  encryptionKey: string;
  whatsappMode: RuntimeMode;
  approvalMode: ApprovalMode;
  simulatedApprovalDecision: 'Y' | 'N' | 'E';
  whatsappApiBaseUrl: string;
}

const samsEnvSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    WHATSAPP_TOKEN: z.string().optional(),
    WHATSAPP_APP_SECRET: z.string().min(1, 'WHATSAPP_APP_SECRET is required'),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().min(1, 'WHATSAPP_VERIFY_TOKEN is required'),
    OWNER_PHONE: z
      .string()
      .regex(E164_PHONE_PATTERN, 'OWNER_PHONE must be in E.164 format'),
    LLM_PROVIDER: z.string().min(1, 'LLM_PROVIDER is required').default('ollama'),
    ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY must be at least 16 characters'),
    WHATSAPP_MODE: z.enum(['simulated', 'cloud']).default('simulated'),
    APPROVAL_MODE: z.enum(['simulated', 'whatsapp']).default('simulated'),
    SIMULATED_APPROVAL_DECISION: z.enum(['Y', 'N', 'E']).default('Y'),
    WHATSAPP_API_BASE_URL: z.string().url().default('https://graph.facebook.com/v18.0'),
  })
  .superRefine((env, ctx) => {
    if (env.WHATSAPP_MODE === 'cloud') {
      if (!env.WHATSAPP_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WHATSAPP_TOKEN is required when WHATSAPP_MODE=cloud',
          path: ['WHATSAPP_TOKEN'],
        });
      }

      if (!env.WHATSAPP_PHONE_NUMBER_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WHATSAPP_PHONE_NUMBER_ID is required when WHATSAPP_MODE=cloud',
          path: ['WHATSAPP_PHONE_NUMBER_ID'],
        });
      }
    }

    if (env.APPROVAL_MODE === 'whatsapp' && !env.OWNER_PHONE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'OWNER_PHONE is required when APPROVAL_MODE=whatsapp',
        path: ['OWNER_PHONE'],
      });
    }
  });

function resolveEnvCandidate(candidate: string): string {
  return isAbsolute(candidate) ? candidate : resolve(process.cwd(), candidate);
}

function ensureDotEnvLoaded(): void {
  const explicitFile = process.env.SAMS_ENV_FILE;
  const candidates = explicitFile
    ? [resolveEnvCandidate(explicitFile)]
    : [resolve(process.cwd(), '.env.local'), resolve(process.cwd(), '.env')];
  const loadKey = candidates.join('|');
  if (attemptedDotEnvLoads.has(loadKey)) {
    return;
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      loadDotEnv({ path: candidate, override: false });
      attemptedDotEnvLoads.add(loadKey);
      return;
    }
  }

  attemptedDotEnvLoads.add(loadKey);
}

export function loadSamsRuntimeConfig(overrides: Partial<NodeJS.ProcessEnv> = {}): SamsRuntimeConfig {
  ensureDotEnvLoaded();

  const parsed = samsEnvSchema.parse({
    ...process.env,
    ...overrides,
  });

  return {
    port: parsed.PORT,
    nodeEnv: parsed.NODE_ENV,
    rabbitMqUrl: parsed.RABBITMQ_URL,
    redisUrl: parsed.REDIS_URL,
    databaseUrl: parsed.DATABASE_URL,
    whatsappToken: parsed.WHATSAPP_TOKEN,
    whatsappAppSecret: parsed.WHATSAPP_APP_SECRET,
    whatsappPhoneNumberId: parsed.WHATSAPP_PHONE_NUMBER_ID,
    whatsappVerifyToken: parsed.WHATSAPP_VERIFY_TOKEN,
    ownerPhone: parsed.OWNER_PHONE,
    llmProvider: parsed.LLM_PROVIDER,
    encryptionKey: parsed.ENCRYPTION_KEY,
    whatsappMode: parsed.WHATSAPP_MODE,
    approvalMode: parsed.APPROVAL_MODE,
    simulatedApprovalDecision: parsed.SIMULATED_APPROVAL_DECISION,
    whatsappApiBaseUrl: parsed.WHATSAPP_API_BASE_URL,
  };
}
