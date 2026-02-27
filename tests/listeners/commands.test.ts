import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillStore } from '../../src/services/store';
import { SkillService } from '../../src/services/skills';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(__dirname, '..', '.test-data', 'cmd-test.db');

describe('Aster Command Logic', () => {
  let store: SkillStore;
  let service: SkillService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    store = new SkillStore(TEST_DB_PATH);
    service = new SkillService(store);
  });

  afterEach(() => {
    store.close();
    [TEST_DB_PATH, TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  describe('skill add flow', () => {
    it('should add a skill with valid input', () => {
      const skill = service.addSkill({
        team_id: 'T123',
        name: 'onboarding',
        display_name: 'Onboarding Guide',
        description: 'Guides new team members through onboarding',
        instructions: 'Walk through the company wiki, tools, and processes.',
        examples: '',
        created_by: 'U789',
      });

      expect(skill.name).toBe('onboarding');
      expect(skill.display_name).toBe('Onboarding Guide');
    });

    it('should prevent adding duplicate skills', () => {
      service.addSkill({
        team_id: 'T123',
        name: 'onboarding',
        display_name: 'Onboarding',
        description: 'Test',
        instructions: 'Test',
        created_by: 'U789',
      });

      expect(() =>
        service.addSkill({
          team_id: 'T123',
          name: 'onboarding',
          display_name: 'Onboarding v2',
          description: 'Test 2',
          instructions: 'Test 2',
          created_by: 'U789',
        }),
      ).toThrow('already exists');
    });
  });

  describe('skill list flow', () => {
    it('should return formatted skill list', () => {
      service.addSkill({
        team_id: 'T123',
        name: 'skill-a',
        display_name: 'Skill A',
        description: 'First skill',
        instructions: 'Instructions A',
        created_by: 'U1',
      });
      service.addSkill({
        team_id: 'T123',
        name: 'skill-b',
        display_name: 'Skill B',
        description: 'Second skill',
        instructions: 'Instructions B',
        created_by: 'U1',
      });

      const skills = service.listSkills('T123');
      expect(skills).toHaveLength(2);

      const formatted = skills
        .map((s, i) => `*${i + 1}. ${s.display_name}* (\`${s.name}\`)\n> ${s.description}`)
        .join('\n\n');

      expect(formatted).toContain('Skill A');
      expect(formatted).toContain('Skill B');
      expect(formatted).toContain('skill-a');
    });

    it('should return empty for team with no skills', () => {
      const skills = service.listSkills('TEMPTY');
      expect(skills).toHaveLength(0);
    });
  });

  describe('skill remove flow', () => {
    it('should remove an existing skill', () => {
      service.addSkill({
        team_id: 'T123',
        name: 'temp-skill',
        display_name: 'Temporary',
        description: 'Will be removed',
        instructions: 'N/A',
        created_by: 'U1',
      });

      const result = service.removeSkill('T123', 'temp-skill');
      expect(result).toBe(true);
      expect(service.listSkills('T123')).toHaveLength(0);
    });

    it('should error on removing non-existent skill', () => {
      expect(() => service.removeSkill('T123', 'ghost')).toThrow('not found');
    });
  });

  describe('skill info flow', () => {
    it('should return detailed skill information', () => {
      service.addSkill({
        team_id: 'T123',
        name: 'detailed-skill',
        display_name: 'Detailed Skill',
        description: 'Has all the details',
        instructions: 'Step 1: Do this\nStep 2: Do that',
        examples: 'Q: Example\nA: Response',
        created_by: 'U1',
      });

      const skill = service.getSkill('T123', 'detailed-skill');
      expect(skill).toBeDefined();
      expect(skill!.instructions).toContain('Step 1');
      expect(skill!.examples).toContain('Q: Example');
    });
  });

  describe('help flow', () => {
    it('should report the correct skill count', () => {
      expect(service.getSkillCount('T123')).toBe(0);

      service.addSkill({
        team_id: 'T123',
        name: 'help-test',
        display_name: 'Help Test',
        description: 'Testing help',
        instructions: 'Test',
        created_by: 'U1',
      });

      expect(service.getSkillCount('T123')).toBe(1);
    });
  });
});
