import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillStore } from '../../src/services/store';
import { SkillService } from '../../src/services/skills';
import fs from 'fs';
import path from 'path';

const TEST_DB_DIR = path.join(__dirname, '..', '.test-data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'skills-test.db');

describe('SkillService', () => {
  let store: SkillStore;
  let service: SkillService;

  const validInput = {
    team_id: 'T123',
    name: 'test-skill',
    display_name: 'Test Skill',
    description: 'A test skill',
    instructions: 'Test instructions for this skill.',
    examples: '',
    created_by: 'U456',
  };

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

  describe('addSkill', () => {
    it('should add a new skill successfully', () => {
      const skill = service.addSkill(validInput);
      expect(skill.name).toBe('test-skill');
      expect(skill.display_name).toBe('Test Skill');
    });

    it('should throw when adding a duplicate skill', () => {
      service.addSkill(validInput);
      expect(() => service.addSkill(validInput)).toThrow('already exists');
    });
  });

  describe('removeSkill', () => {
    it('should remove an existing skill', () => {
      service.addSkill(validInput);
      expect(service.removeSkill('T123', 'test-skill')).toBe(true);
      expect(service.getSkill('T123', 'test-skill')).toBeUndefined();
    });

    it('should throw when removing non-existent skill', () => {
      expect(() => service.removeSkill('T123', 'nope')).toThrow('not found');
    });
  });

  describe('updateSkill', () => {
    it('should update a skill', () => {
      service.addSkill(validInput);
      const updated = service.updateSkill('T123', 'test-skill', {
        description: 'Updated description',
      });
      expect(updated.description).toBe('Updated description');
    });

    it('should throw when updating non-existent skill', () => {
      expect(() =>
        service.updateSkill('T123', 'nope', { description: 'x' }),
      ).toThrow('not found');
    });
  });

  describe('listSkills', () => {
    it('should list all skills for a team', () => {
      service.addSkill(validInput);
      service.addSkill({ ...validInput, name: 'another-skill', display_name: 'Another' });
      const skills = service.listSkills('T123');
      expect(skills).toHaveLength(2);
    });
  });

  describe('getSkillCount', () => {
    it('should return correct count', () => {
      expect(service.getSkillCount('T123')).toBe(0);
      service.addSkill(validInput);
      expect(service.getSkillCount('T123')).toBe(1);
    });
  });

  describe('searchSkills', () => {
    it('should find skills matching query', () => {
      service.addSkill(validInput);
      service.addSkill({
        ...validInput,
        name: 'deploy',
        display_name: 'Deploy',
        description: 'Deploy things',
      });
      const results = service.searchSkills('T123', 'test');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test-skill');
    });
  });

  describe('getAllSkillsForPrompt', () => {
    it('should return all skills for prompt building', () => {
      service.addSkill(validInput);
      service.addSkill({
        ...validInput,
        name: 'second',
        display_name: 'Second',
        description: 'Second skill',
      });
      const skills = service.getAllSkillsForPrompt('T123');
      expect(skills).toHaveLength(2);
    });
  });
});
