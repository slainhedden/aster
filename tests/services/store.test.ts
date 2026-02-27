import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillStore } from '../../src/services/store';
import fs from 'fs';
import path from 'path';

const TEST_DB_DIR = path.join(__dirname, '..', '.test-data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test.db');

describe('SkillStore', () => {
  let store: SkillStore;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    store = new SkillStore(TEST_DB_PATH);
  });

  afterEach(() => {
    store.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    const walPath = TEST_DB_PATH + '-wal';
    const shmPath = TEST_DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  const validInput = {
    team_id: 'T123',
    name: 'code-review',
    display_name: 'Code Review Expert',
    description: 'Reviews code for best practices',
    instructions: 'When reviewing code, check for bugs and style issues.',
    examples: 'Q: Review this code\nA: I found these issues...',
    created_by: 'U456',
  };

  describe('addSkill', () => {
    it('should add a skill and return it with generated fields', () => {
      const skill = store.addSkill(validInput);

      expect(skill.id).toBeDefined();
      expect(skill.team_id).toBe('T123');
      expect(skill.name).toBe('code-review');
      expect(skill.display_name).toBe('Code Review Expert');
      expect(skill.description).toBe('Reviews code for best practices');
      expect(skill.instructions).toBe('When reviewing code, check for bugs and style issues.');
      expect(skill.examples).toBe('Q: Review this code\nA: I found these issues...');
      expect(skill.created_by).toBe('U456');
      expect(skill.created_at).toBeDefined();
      expect(skill.updated_at).toBeDefined();
    });

    it('should reject duplicate team_id + name combinations', () => {
      store.addSkill(validInput);
      expect(() => store.addSkill(validInput)).toThrow();
    });

    it('should allow same name in different teams', () => {
      store.addSkill(validInput);
      const skill2 = store.addSkill({ ...validInput, team_id: 'T789' });
      expect(skill2.team_id).toBe('T789');
    });

    it('should reject invalid skill names', () => {
      expect(() =>
        store.addSkill({ ...validInput, name: 'Has Spaces' }),
      ).toThrow();
      expect(() =>
        store.addSkill({ ...validInput, name: 'UPPERCASE' }),
      ).toThrow();
      expect(() =>
        store.addSkill({ ...validInput, name: '' }),
      ).toThrow();
    });

    it('should allow hyphens and underscores in names', () => {
      const s1 = store.addSkill({ ...validInput, name: 'code-review' });
      const s2 = store.addSkill({ ...validInput, name: 'code_review_v2' });
      expect(s1.name).toBe('code-review');
      expect(s2.name).toBe('code_review_v2');
    });
  });

  describe('getSkill', () => {
    it('should retrieve a skill by team and name', () => {
      store.addSkill(validInput);
      const skill = store.getSkill('T123', 'code-review');
      expect(skill).toBeDefined();
      expect(skill!.name).toBe('code-review');
    });

    it('should return undefined for non-existent skill', () => {
      const skill = store.getSkill('T123', 'nonexistent');
      expect(skill).toBeUndefined();
    });
  });

  describe('listSkills', () => {
    it('should list all skills for a team sorted by name', () => {
      store.addSkill({ ...validInput, name: 'zebra' });
      store.addSkill({ ...validInput, name: 'alpha' });
      store.addSkill({ ...validInput, name: 'middle' });

      const skills = store.listSkills('T123');
      expect(skills).toHaveLength(3);
      expect(skills[0].name).toBe('alpha');
      expect(skills[1].name).toBe('middle');
      expect(skills[2].name).toBe('zebra');
    });

    it('should not return skills from other teams', () => {
      store.addSkill(validInput);
      store.addSkill({ ...validInput, team_id: 'T789', name: 'other' });

      const skills = store.listSkills('T123');
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('code-review');
    });

    it('should return empty array when no skills exist', () => {
      const skills = store.listSkills('T123');
      expect(skills).toEqual([]);
    });
  });

  describe('removeSkill', () => {
    it('should remove an existing skill', () => {
      store.addSkill(validInput);
      const result = store.removeSkill('T123', 'code-review');
      expect(result).toBe(true);
      expect(store.getSkill('T123', 'code-review')).toBeUndefined();
    });

    it('should return false for non-existent skill', () => {
      const result = store.removeSkill('T123', 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('updateSkill', () => {
    it('should update specific fields of a skill', () => {
      store.addSkill(validInput);
      const updated = store.updateSkill('T123', 'code-review', {
        description: 'Updated description',
        instructions: 'Updated instructions',
      });

      expect(updated).toBeDefined();
      expect(updated!.description).toBe('Updated description');
      expect(updated!.instructions).toBe('Updated instructions');
      expect(updated!.display_name).toBe('Code Review Expert');
    });

    it('should return undefined for non-existent skill', () => {
      const result = store.updateSkill('T123', 'nonexistent', {
        description: 'test',
      });
      expect(result).toBeUndefined();
    });

    it('should update the updated_at timestamp', async () => {
      const skill = store.addSkill(validInput);
      const originalUpdatedAt = skill.updated_at;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = store.updateSkill('T123', 'code-review', {
        description: 'New description',
      });
      expect(updated!.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  describe('searchSkills', () => {
    it('should search by name', () => {
      store.addSkill(validInput);
      store.addSkill({ ...validInput, name: 'deploy-helper', display_name: 'Deploy Helper', description: 'Helps with deployments' });

      const results = store.searchSkills('T123', 'code');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('code-review');
    });

    it('should search by display name', () => {
      store.addSkill(validInput);
      const results = store.searchSkills('T123', 'Expert');
      expect(results).toHaveLength(1);
    });

    it('should search by description', () => {
      store.addSkill(validInput);
      const results = store.searchSkills('T123', 'best practices');
      expect(results).toHaveLength(1);
    });

    it('should return empty for no matches', () => {
      store.addSkill(validInput);
      const results = store.searchSkills('T123', 'zzzzz');
      expect(results).toEqual([]);
    });
  });

  describe('countSkills', () => {
    it('should return the count of skills for a team', () => {
      expect(store.countSkills('T123')).toBe(0);
      store.addSkill(validInput);
      expect(store.countSkills('T123')).toBe(1);
      store.addSkill({ ...validInput, name: 'another' });
      expect(store.countSkills('T123')).toBe(2);
    });
  });
});
