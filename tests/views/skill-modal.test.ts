import { describe, it, expect } from 'vitest';
import { buildSkillAddModal } from '../../src/listeners/views/skill-modal';

describe('Skill Add Modal', () => {
  it('should build a valid modal structure', () => {
    const modal = buildSkillAddModal();

    expect(modal.type).toBe('modal');
    expect(modal.callback_id).toBe('skill_add_modal');
    expect(modal.title.text).toBe('Add a Skill');
    expect(modal.submit!.text).toBe('Add Skill');
    expect(modal.close!.text).toBe('Cancel');
  });

  it('should have all required input blocks', () => {
    const modal = buildSkillAddModal();
    const blockIds = modal.blocks.map((b) => (b as { block_id: string }).block_id);

    expect(blockIds).toContain('skill_name_block');
    expect(blockIds).toContain('skill_display_name_block');
    expect(blockIds).toContain('skill_description_block');
    expect(blockIds).toContain('skill_instructions_block');
    expect(blockIds).toContain('skill_examples_block');
  });

  it('should mark examples block as optional', () => {
    const modal = buildSkillAddModal();
    const examplesBlock = modal.blocks.find(
      (b) => (b as { block_id: string }).block_id === 'skill_examples_block',
    );
    expect((examplesBlock as { optional?: boolean }).optional).toBe(true);
  });

  it('should have multiline inputs for instructions and examples', () => {
    const modal = buildSkillAddModal();

    const instructionsBlock = modal.blocks.find(
      (b) => (b as { block_id: string }).block_id === 'skill_instructions_block',
    ) as { element: { multiline?: boolean } };
    expect(instructionsBlock.element.multiline).toBe(true);

    const examplesBlock = modal.blocks.find(
      (b) => (b as { block_id: string }).block_id === 'skill_examples_block',
    ) as { element: { multiline?: boolean } };
    expect(examplesBlock.element.multiline).toBe(true);
  });

  it('should have max length constraints on inputs', () => {
    const modal = buildSkillAddModal();

    const nameBlock = modal.blocks.find(
      (b) => (b as { block_id: string }).block_id === 'skill_name_block',
    ) as { element: { max_length?: number } };
    expect(nameBlock.element.max_length).toBe(64);

    const instructionsBlock = modal.blocks.find(
      (b) => (b as { block_id: string }).block_id === 'skill_instructions_block',
    ) as { element: { max_length?: number } };
    expect(instructionsBlock.element.max_length).toBe(4096);
  });
});
