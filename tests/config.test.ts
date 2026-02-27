import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setRequiredEnv = () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_APP_TOKEN = 'xapp-test';
    process.env.SLACK_SIGNING_SECRET = 'test-secret';
    process.env.OPENAI_API_KEY = 'sk-test';
  };

  it('should load config with all required env vars', async () => {
    setRequiredEnv();
    const { loadConfig } = await import('../src/config');
    const config = loadConfig();

    expect(config.slack.botToken).toBe('xoxb-test');
    expect(config.slack.appToken).toBe('xapp-test');
    expect(config.slack.signingSecret).toBe('test-secret');
    expect(config.openai.apiKey).toBe('sk-test');
  });

  it('should use defaults for optional values', async () => {
    setRequiredEnv();
    const { loadConfig } = await import('../src/config');
    const config = loadConfig();

    expect(config.openai.model).toBe('gpt-4o');
    expect(config.database.path).toBe('./data/aster.db');
    expect(config.logLevel).toBe('info');
  });

  it('should throw when SLACK_BOT_TOKEN is missing', async () => {
    process.env.SLACK_APP_TOKEN = 'xapp-test';
    process.env.SLACK_SIGNING_SECRET = 'test-secret';
    process.env.OPENAI_API_KEY = 'sk-test';

    const { loadConfig } = await import('../src/config');
    expect(() => loadConfig()).toThrow('SLACK_BOT_TOKEN');
  });

  it('should throw when OPENAI_API_KEY is missing', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_APP_TOKEN = 'xapp-test';
    process.env.SLACK_SIGNING_SECRET = 'test-secret';

    const { loadConfig } = await import('../src/config');
    expect(() => loadConfig()).toThrow('OPENAI_API_KEY');
  });

  it('should allow overriding optional values', async () => {
    setRequiredEnv();
    process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
    process.env.DATABASE_PATH = '/custom/path.db';
    process.env.LOG_LEVEL = 'debug';

    const { loadConfig } = await import('../src/config');
    const config = loadConfig();

    expect(config.openai.model).toBe('gpt-3.5-turbo');
    expect(config.database.path).toBe('/custom/path.db');
    expect(config.logLevel).toBe('debug');
  });
});
