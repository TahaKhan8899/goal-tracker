import { z } from 'zod';

const envSchema = z.object({
  AIRTABLE_API_KEY: z.string().min(1),
  AIRTABLE_BASE_ID: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export function validateEnv() {
  try {
    return envSchema.parse({
      AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

export const env = validateEnv(); 