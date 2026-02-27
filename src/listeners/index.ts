import { App } from '@slack/bolt';
import { SkillService } from '../services/skills';
import { AIService } from '../services/ai';
import { registerCommands } from './commands';
import { registerViews } from './views';
import { registerMessageHandlers } from './messages';

export function registerListeners(
  app: App,
  skillService: SkillService,
  aiService: AIService,
): void {
  registerCommands(app, skillService, aiService);
  registerViews(app, skillService);
  registerMessageHandlers(app, skillService, aiService);
}
