import dotenv from 'dotenv';
import { AsterConfig } from './types';

dotenv.config();

export function loadConfig(): AsterConfig {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const appToken = process.env.SLACK_APP_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!botToken) throw new Error('SLACK_BOT_TOKEN is required');
  if (!appToken) throw new Error('SLACK_APP_TOKEN is required');
  if (!signingSecret) throw new Error('SLACK_SIGNING_SECRET is required');
  if (!openaiKey) throw new Error('OPENAI_API_KEY is required');

  return {
    slack: {
      botToken,
      appToken,
      signingSecret,
    },
    openai: {
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    },
    database: {
      path: process.env.DATABASE_PATH || './data/aster.db',
    },
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
