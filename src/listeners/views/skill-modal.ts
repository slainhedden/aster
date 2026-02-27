import { App, ViewSubmitAction } from '@slack/bolt';
import { SkillService } from '../../services/skills';

export function buildSkillAddModal() {
  return {
    type: 'modal' as const,
    callback_id: 'skill_add_modal',
    title: {
      type: 'plain_text' as const,
      text: 'Add a Skill',
    },
    submit: {
      type: 'plain_text' as const,
      text: 'Add Skill',
    },
    close: {
      type: 'plain_text' as const,
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'input' as const,
        block_id: 'skill_name_block',
        label: { type: 'plain_text' as const, text: 'Skill Name (ID)' },
        hint: {
          type: 'plain_text' as const,
          text: 'Lowercase, alphanumeric, hyphens and underscores only. e.g. "code-review"',
        },
        element: {
          type: 'plain_text_input' as const,
          action_id: 'skill_name',
          placeholder: { type: 'plain_text' as const, text: 'e.g. code-review' },
          max_length: 64,
        },
      },
      {
        type: 'input' as const,
        block_id: 'skill_display_name_block',
        label: { type: 'plain_text' as const, text: 'Display Name' },
        element: {
          type: 'plain_text_input' as const,
          action_id: 'skill_display_name',
          placeholder: { type: 'plain_text' as const, text: 'e.g. Code Review Expert' },
          max_length: 128,
        },
      },
      {
        type: 'input' as const,
        block_id: 'skill_description_block',
        label: { type: 'plain_text' as const, text: 'Description' },
        hint: { type: 'plain_text' as const, text: 'Brief description of what this skill does.' },
        element: {
          type: 'plain_text_input' as const,
          action_id: 'skill_description',
          placeholder: {
            type: 'plain_text' as const,
            text: 'e.g. Reviews code for best practices, bugs, and style',
          },
          max_length: 512,
        },
      },
      {
        type: 'input' as const,
        block_id: 'skill_instructions_block',
        label: { type: 'plain_text' as const, text: 'Instructions' },
        hint: {
          type: 'plain_text' as const,
          text: 'Detailed instructions for Aster when using this skill. Be specific!',
        },
        element: {
          type: 'plain_text_input' as const,
          action_id: 'skill_instructions',
          multiline: true,
          placeholder: {
            type: 'plain_text' as const,
            text: 'e.g. When reviewing code, check for:\n- Security vulnerabilities\n- Performance issues\n- Code style consistency',
          },
          max_length: 4096,
        },
      },
      {
        type: 'input' as const,
        block_id: 'skill_examples_block',
        optional: true,
        label: { type: 'plain_text' as const, text: 'Examples (Optional)' },
        hint: {
          type: 'plain_text' as const,
          text: 'Example interactions to guide Aster. Format: Q: ... A: ...',
        },
        element: {
          type: 'plain_text_input' as const,
          action_id: 'skill_examples',
          multiline: true,
          placeholder: {
            type: 'plain_text' as const,
            text: 'Q: Review this function...\nA: I found the following issues...',
          },
          max_length: 4096,
        },
      },
    ],
  };
}

export function registerViewHandlers(app: App, skillService: SkillService): void {
  app.view('skill_add_modal', async ({ ack, body, view }) => {
    const values = view.state.values;
    const teamId = (body as ViewSubmitAction).user.team_id ?? '';
    const userId = (body as ViewSubmitAction).user.id;

    const name = values.skill_name_block.skill_name.value ?? '';
    const displayName = values.skill_display_name_block.skill_display_name.value ?? '';
    const description = values.skill_description_block.skill_description.value ?? '';
    const instructions = values.skill_instructions_block.skill_instructions.value ?? '';
    const examples = values.skill_examples_block.skill_examples?.value ?? '';

    const nameRegex = /^[a-z0-9_-]+$/;
    if (!nameRegex.test(name)) {
      await ack({
        response_action: 'errors',
        errors: {
          skill_name_block:
            'Skill name must be lowercase alphanumeric with hyphens/underscores only.',
        },
      });
      return;
    }

    try {
      skillService.addSkill({
        team_id: teamId,
        name,
        display_name: displayName,
        description,
        instructions,
        examples,
        created_by: userId,
      });

      await ack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('already exists')) {
        await ack({
          response_action: 'errors',
          errors: {
            skill_name_block: message,
          },
        });
      } else {
        await ack({
          response_action: 'errors',
          errors: {
            skill_name_block: `Failed to add skill: ${message}`,
          },
        });
      }
    }
  });
}
