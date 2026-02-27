import { App } from '@slack/bolt';
import { SkillService } from '../../services/skills';
import { AIService } from '../../services/ai';
import { registerAsterCommand } from './aster';

export function registerCommands(app: App, skillService: SkillService, aiService: AIService): void {
  registerAsterCommand(app, skillService, aiService);
}
