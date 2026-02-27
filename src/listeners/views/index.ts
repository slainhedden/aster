import { App } from '@slack/bolt';
import { SkillService } from '../../services/skills';
import { registerViewHandlers } from './skill-modal';

export function registerViews(app: App, skillService: SkillService): void {
  registerViewHandlers(app, skillService);
}
