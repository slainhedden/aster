import { App, LogLevel } from '@slack/bolt';
import { loadConfig } from './config';
import { SkillStore } from './services/store';
import { SkillService } from './services/skills';
import { AIService } from './services/ai';
import { registerListeners } from './listeners';

async function main(): Promise<void> {
  const config = loadConfig();

  const logLevelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  };

  const app = new App({
    token: config.slack.botToken,
    appToken: config.slack.appToken,
    signingSecret: config.slack.signingSecret,
    socketMode: true,
    logLevel: logLevelMap[config.logLevel] || LogLevel.INFO,
  });

  const store = new SkillStore(config.database.path);
  const skillService = new SkillService(store);
  const aiService = new AIService(config.openai.apiKey, config.openai.model);

  registerListeners(app, skillService, aiService);

  const port = Number(process.env.PORT) || 3000;
  await app.start(port);

  console.log(`⚡ Aster is running on port ${port}`);
  console.log(`📦 Database: ${config.database.path}`);
  console.log(`🤖 AI Model: ${config.openai.model}`);
  console.log(`🔌 Socket Mode: enabled`);

  const gracefulShutdown = () => {
    console.log('\nShutting down...');
    store.close();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

main().catch((error) => {
  console.error('Failed to start Aster:', error);
  process.exit(1);
});
