import { App } from '@slack/bolt';
import { SkillService } from '../../services/skills';
import { AIService } from '../../services/ai';
import { buildSkillAddModal } from '../views/skill-modal';

export function registerAsterCommand(
  app: App,
  skillService: SkillService,
  aiService: AIService,
): void {
  app.command('/aster', async ({ command, ack, respond, client }) => {
    await ack();

    const args = command.text.trim().split(/\s+/);
    const subcommand = args[0]?.toLowerCase() || 'help';
    const teamId = command.team_id;

    switch (subcommand) {
      case 'ask': {
        const question = args.slice(1).join(' ');
        if (!question) {
          await respond({
            response_type: 'ephemeral',
            text: ':warning: Please provide a question. Usage: `/aster ask <your question>`',
          });
          return;
        }

        await respond({
          response_type: 'ephemeral',
          text: ':hourglass_flowing_sand: Thinking...',
        });

        try {
          const skills = skillService.getAllSkillsForPrompt(teamId);
          const result = await aiService.ask(question, skills);

          let responseText = result.answer;
          if (result.skillsUsed.length > 0) {
            responseText += `\n\n_Skills used: ${result.skillsUsed.join(', ')}_`;
          }

          await respond({
            response_type: 'in_channel',
            text: responseText,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          await respond({
            response_type: 'ephemeral',
            text: `:x: Error: ${message}`,
          });
        }
        break;
      }

      case 'skill': {
        const skillAction = args[1]?.toLowerCase();

        switch (skillAction) {
          case 'add': {
            try {
              await client.views.open({
                trigger_id: command.trigger_id,
                view: buildSkillAddModal(),
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              await respond({
                response_type: 'ephemeral',
                text: `:x: Failed to open skill form: ${message}`,
              });
            }
            break;
          }

          case 'list': {
            const skills = skillService.listSkills(teamId);
            if (skills.length === 0) {
              await respond({
                response_type: 'ephemeral',
                text: ':information_source: No skills configured yet. Use `/aster skill add` to create one!',
              });
              return;
            }

            const skillList = skills
              .map(
                (s, i) =>
                  `*${i + 1}. ${s.display_name}* (\`${s.name}\`)\n> ${s.description}`,
              )
              .join('\n\n');

            await respond({
              response_type: 'ephemeral',
              text: `:brain: *Skills for this workspace* (${skills.length}):\n\n${skillList}`,
            });
            break;
          }

          case 'remove': {
            const skillName = args[2];
            if (!skillName) {
              await respond({
                response_type: 'ephemeral',
                text: ':warning: Please specify a skill name. Usage: `/aster skill remove <name>`',
              });
              return;
            }

            try {
              skillService.removeSkill(teamId, skillName);
              await respond({
                response_type: 'ephemeral',
                text: `:white_check_mark: Skill \`${skillName}\` removed successfully.`,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown error';
              await respond({
                response_type: 'ephemeral',
                text: `:x: ${message}`,
              });
            }
            break;
          }

          case 'info': {
            const infoName = args[2];
            if (!infoName) {
              await respond({
                response_type: 'ephemeral',
                text: ':warning: Please specify a skill name. Usage: `/aster skill info <name>`',
              });
              return;
            }

            const skill = skillService.getSkill(teamId, infoName);
            if (!skill) {
              await respond({
                response_type: 'ephemeral',
                text: `:x: Skill \`${infoName}\` not found.`,
              });
              return;
            }

            let info = `*${skill.display_name}* (\`${skill.name}\`)\n`;
            info += `> ${skill.description}\n\n`;
            info += `*Instructions:*\n${skill.instructions}\n`;
            if (skill.examples) {
              info += `\n*Examples:*\n${skill.examples}\n`;
            }
            info += `\n_Created by <@${skill.created_by}> on ${new Date(skill.created_at).toLocaleDateString()}_`;

            await respond({
              response_type: 'ephemeral',
              text: info,
            });
            break;
          }

          default:
            await respond({
              response_type: 'ephemeral',
              text: ':warning: Unknown skill action. Available: `add`, `list`, `remove`, `info`',
            });
        }
        break;
      }

      case 'help':
      default: {
        const count = skillService.getSkillCount(teamId);
        await respond({
          response_type: 'ephemeral',
          text: `:star2: *Aster* - AI assistant with custom skills\n\n`
            + `*Commands:*\n`
            + `• \`/aster ask <question>\` - Ask Aster a question\n`
            + `• \`/aster skill add\` - Add a new skill (opens form)\n`
            + `• \`/aster skill list\` - List all skills\n`
            + `• \`/aster skill info <name>\` - View skill details\n`
            + `• \`/aster skill remove <name>\` - Remove a skill\n`
            + `• \`/aster help\` - Show this help\n\n`
            + `_${count} skill${count !== 1 ? 's' : ''} configured for this workspace_`,
        });
        break;
      }
    }
  });
}
