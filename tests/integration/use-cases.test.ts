import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillStore } from '../../src/services/store';
import { SkillService } from '../../src/services/skills';
import { AIService } from '../../src/services/ai';
import fs from 'fs';
import path from 'path';

const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

const TEST_DB_PATH = path.join(__dirname, '..', '.test-data', 'integration-test.db');

describe('Use Case Integration Tests', () => {
  let store: SkillStore;
  let skillService: SkillService;
  let aiService: AIService;
  beforeEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    store = new SkillStore(TEST_DB_PATH);
    skillService = new SkillService(store);
    aiService = new AIService('test-key', 'gpt-4o');
  });

  afterEach(() => {
    store.close();
    [TEST_DB_PATH, TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  describe('Use Case 1: Company onboarding a new team member', () => {
    it('should create an onboarding skill and answer onboarding questions', async () => {
      const skill = skillService.addSkill({
        team_id: 'T-ACME',
        name: 'onboarding',
        display_name: 'Onboarding Guide',
        description: 'Guides new employees through the onboarding process',
        instructions: `When helping with onboarding, provide the following information:
1. First day: Set up laptop, get badge, meet your buddy
2. First week: Complete compliance training, set up dev environment
3. First month: Shadow team members, complete first PR
Always be encouraging and welcoming.`,
        examples: `Q: What do I do on my first day?
A: Welcome aboard! On your first day, you'll need to:
1. Set up your laptop with IT
2. Get your office badge from reception
3. Meet your onboarding buddy who will show you around`,
        created_by: 'U-HR',
      });

      expect(skill.name).toBe('onboarding');

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Welcome to the team! On your first day, you should set up your laptop, get your badge, and meet your buddy.',
          },
        }],
      });

      const result = await aiService.ask(
        'I need help with onboarding, what should I do on my first day?',
        skillService.getAllSkillsForPrompt('T-ACME'),
      );

      expect(result.answer).toContain('Welcome');
      expect(result.skillsUsed).toContain('Onboarding Guide');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('onboarding');
      expect(callArgs.messages[0].content).toContain('First day');
    });
  });

  describe('Use Case 2: Engineering team code standards', () => {
    it('should add multiple related skills and use them together', async () => {
      skillService.addSkill({
        team_id: 'T-ENG',
        name: 'code-style',
        display_name: 'Code Style Guide',
        description: 'Company code style and conventions',
        instructions: 'We use TypeScript with strict mode. Prefer functional patterns. Use camelCase for variables, PascalCase for types.',
        created_by: 'U-LEAD',
      });

      skillService.addSkill({
        team_id: 'T-ENG',
        name: 'pr-review',
        display_name: 'PR Review Checklist',
        description: 'Standards for reviewing pull requests',
        instructions: 'Check for: 1) Test coverage 2) No console.logs 3) Proper error handling 4) Documentation updates',
        created_by: 'U-LEAD',
      });

      skillService.addSkill({
        team_id: 'T-ENG',
        name: 'deploy-process',
        display_name: 'Deployment Process',
        description: 'How to deploy to production',
        instructions: 'Run tests, create PR, get 2 approvals, merge to main, CI/CD handles the rest.',
        created_by: 'U-LEAD',
      });

      const skills = skillService.listSkills('T-ENG');
      expect(skills).toHaveLength(3);

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'For your PR review, check test coverage, remove console.logs, ensure proper error handling, and update docs.',
          },
        }],
      });

      const result = await aiService.ask(
        'What should I check when doing a pr-review?',
        skillService.getAllSkillsForPrompt('T-ENG'),
      );

      expect(result.answer).toContain('PR review');
      expect(result.skillsUsed).toContain('PR Review Checklist');

      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Code Style Guide');
      expect(systemPrompt).toContain('PR Review Checklist');
      expect(systemPrompt).toContain('Deployment Process');
    });
  });

  describe('Use Case 3: Managing skills lifecycle', () => {
    it('should handle full CRUD lifecycle for skills', () => {
      const created = skillService.addSkill({
        team_id: 'T-OPS',
        name: 'incident-response',
        display_name: 'Incident Response',
        description: 'How to handle production incidents',
        instructions: 'Step 1: Assess severity. Step 2: Notify stakeholders.',
        created_by: 'U-OPS',
      });
      expect(created.name).toBe('incident-response');

      const read = skillService.getSkill('T-OPS', 'incident-response');
      expect(read).toBeDefined();
      expect(read!.instructions).toContain('Assess severity');

      const updated = skillService.updateSkill('T-OPS', 'incident-response', {
        instructions: 'Step 1: Assess severity. Step 2: Notify stakeholders. Step 3: Create incident channel.',
      });
      expect(updated.instructions).toContain('Step 3');

      skillService.removeSkill('T-OPS', 'incident-response');
      expect(skillService.getSkill('T-OPS', 'incident-response')).toBeUndefined();
      expect(skillService.getSkillCount('T-OPS')).toBe(0);
    });
  });

  describe('Use Case 4: Multi-tenant isolation', () => {
    it('should keep skills isolated between teams', async () => {
      skillService.addSkill({
        team_id: 'T-TEAM-A',
        name: 'secret-sauce',
        display_name: 'Secret Sauce',
        description: 'Team A proprietary process',
        instructions: 'Our secret process is XYZ.',
        created_by: 'U-A',
      });

      skillService.addSkill({
        team_id: 'T-TEAM-B',
        name: 'their-process',
        display_name: 'Their Process',
        description: 'Team B process',
        instructions: 'Our process is ABC.',
        created_by: 'U-B',
      });

      const teamASkills = skillService.getAllSkillsForPrompt('T-TEAM-A');
      const teamBSkills = skillService.getAllSkillsForPrompt('T-TEAM-B');

      expect(teamASkills).toHaveLength(1);
      expect(teamASkills[0].name).toBe('secret-sauce');
      expect(teamBSkills).toHaveLength(1);
      expect(teamBSkills[0].name).toBe('their-process');

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Using the process.' } }],
      });

      const promptA = aiService.buildSystemPrompt(teamASkills);
      expect(promptA).toContain('Secret Sauce');
      expect(promptA).not.toContain('Their Process');

      const promptB = aiService.buildSystemPrompt(teamBSkills);
      expect(promptB).toContain('Their Process');
      expect(promptB).not.toContain('Secret Sauce');
    });
  });

  describe('Use Case 5: Zero-skill fallback', () => {
    it('should work gracefully with no skills configured', async () => {
      const skills = skillService.getAllSkillsForPrompt('T-EMPTY');
      expect(skills).toHaveLength(0);

      const prompt = aiService.buildSystemPrompt(skills);
      expect(prompt).toContain('No custom skills');
      expect(prompt).toContain('/aster skill add');

      mockCreate.mockResolvedValue({
        choices: [{
          message: { content: 'I can help! Try adding skills with /aster skill add.' },
        }],
      });

      const result = await aiService.ask('Hello, what can you do?', skills);
      expect(result.answer).toBeDefined();
      expect(result.skillsUsed).toHaveLength(0);
    });
  });

  describe('Use Case 6: Skill search', () => {
    it('should find relevant skills by search query', () => {
      skillService.addSkill({
        team_id: 'T-SEARCH',
        name: 'javascript-style',
        display_name: 'JavaScript Style Guide',
        description: 'Coding standards for JavaScript projects',
        instructions: 'Use ESLint, Prettier, etc.',
        created_by: 'U1',
      });
      skillService.addSkill({
        team_id: 'T-SEARCH',
        name: 'python-style',
        display_name: 'Python Style Guide',
        description: 'Coding standards for Python projects',
        instructions: 'Use Black, flake8, etc.',
        created_by: 'U1',
      });
      skillService.addSkill({
        team_id: 'T-SEARCH',
        name: 'meeting-notes',
        display_name: 'Meeting Notes Template',
        description: 'How to write meeting notes',
        instructions: 'Include attendees, agenda, action items.',
        created_by: 'U1',
      });

      const codeSkills = skillService.searchSkills('T-SEARCH', 'style');
      expect(codeSkills).toHaveLength(2);

      const jsSkills = skillService.searchSkills('T-SEARCH', 'javascript');
      expect(jsSkills).toHaveLength(1);
      expect(jsSkills[0].name).toBe('javascript-style');

      const meetingSkills = skillService.searchSkills('T-SEARCH', 'meeting');
      expect(meetingSkills).toHaveLength(1);
      expect(meetingSkills[0].name).toBe('meeting-notes');
    });
  });
});
