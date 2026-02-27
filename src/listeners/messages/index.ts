import { App } from '@slack/bolt';
import { SkillService } from '../../services/skills';
import { AIService } from '../../services/ai';

export function registerMessageHandlers(
  app: App,
  skillService: SkillService,
  aiService: AIService,
): void {
  app.event('app_mention', async ({ event, say }) => {
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    if (!text) {
      await say({
        text: ':wave: Hi! Ask me anything or use `/aster help` to see available commands.',
        thread_ts: event.ts,
      });
      return;
    }

    const teamId = event.team ?? '';

    try {
      const skills = skillService.getAllSkillsForPrompt(teamId);
      const result = await aiService.ask(text, skills);

      let responseText = result.answer;
      if (result.skillsUsed.length > 0) {
        responseText += `\n\n_Skills used: ${result.skillsUsed.join(', ')}_`;
      }

      await say({
        text: responseText,
        thread_ts: event.ts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await say({
        text: `:x: Sorry, I encountered an error: ${message}`,
        thread_ts: event.ts,
      });
    }
  });

  app.message(async ({ message, say }) => {
    if (message.subtype) return;
    if (!('channel_type' in message)) return;
    if ((message as { channel_type?: string }).channel_type !== 'im') return;
    if (!('text' in message) || !message.text) return;

    const text = message.text.trim();
    const teamId = (message as { team?: string }).team ?? '';

    try {
      const skills = skillService.getAllSkillsForPrompt(teamId);
      const result = await aiService.ask(text, skills);

      let responseText = result.answer;
      if (result.skillsUsed.length > 0) {
        responseText += `\n\n_Skills used: ${result.skillsUsed.join(', ')}_`;
      }

      await say(responseText);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      await say(`:x: Sorry, I encountered an error: ${errMessage}`);
    }
  });
}
