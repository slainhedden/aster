import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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

const TEST_DB_PATH = path.join(__dirname, '..', '.test-data', 'e2e-demo.db');

describe('End-to-End Demo: Full Aster Workflow', () => {
  let store: SkillStore;
  let skillService: SkillService;
  let aiService: AIService;

  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    store = new SkillStore(TEST_DB_PATH);
    skillService = new SkillService(store);
    aiService = new AIService('test-key', 'gpt-4o');
  });

  afterAll(() => {
    store.close();
    [TEST_DB_PATH, TEST_DB_PATH + '-wal', TEST_DB_PATH + '-shm'].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('Step 1: Fresh workspace has no skills', () => {
    const skills = skillService.listSkills('T-DEMO');
    expect(skills).toHaveLength(0);
    expect(skillService.getSkillCount('T-DEMO')).toBe(0);
    console.log('  [PASS] New workspace starts with 0 skills');
  });

  it('Step 2: AI responds with general knowledge when no skills exist', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello! I\'m Aster, your AI assistant. I don\'t have any custom skills yet, but I can answer general questions. Try adding skills with /aster skill add!' } }],
    });

    const skills = skillService.getAllSkillsForPrompt('T-DEMO');
    const prompt = aiService.buildSystemPrompt(skills);
    expect(prompt).toContain('No custom skills');

    const result = await aiService.ask('Hello, what can you do?', skills);
    expect(result.answer).toContain('Aster');
    expect(result.skillsUsed).toHaveLength(0);
    console.log('  [PASS] AI responds with no-skills fallback message');
  });

  it('Step 3: Admin adds a "code-review" skill', () => {
    const skill = skillService.addSkill({
      team_id: 'T-DEMO',
      name: 'code-review',
      display_name: 'Code Review Expert',
      description: 'Reviews code for bugs, security issues, and best practices',
      instructions: `When reviewing code:
1. Check for security vulnerabilities (SQL injection, XSS, etc.)
2. Look for performance issues (N+1 queries, memory leaks)
3. Verify error handling is comprehensive
4. Check for code style consistency
5. Suggest improvements with explanations`,
      examples: `Q: Review this function: function add(a, b) { return a + b; }
A: The function looks clean but could benefit from TypeScript types for better safety.`,
      created_by: 'U-ADMIN',
    });

    expect(skill.name).toBe('code-review');
    expect(skill.id).toBeDefined();
    console.log(`  [PASS] Skill "code-review" created with id ${skill.id}`);
  });

  it('Step 4: Admin adds a "standup" skill', () => {
    const skill = skillService.addSkill({
      team_id: 'T-DEMO',
      name: 'standup',
      display_name: 'Standup Facilitator',
      description: 'Helps run daily standup meetings efficiently',
      instructions: `Guide standup meetings:
- Ask: What did you do yesterday?
- Ask: What will you do today?
- Ask: Any blockers?
Keep responses concise and action-oriented.`,
      created_by: 'U-ADMIN',
    });

    expect(skill.name).toBe('standup');
    console.log(`  [PASS] Skill "standup" created with id ${skill.id}`);
  });

  it('Step 5: Admin adds a "deploy" skill', () => {
    const skill = skillService.addSkill({
      team_id: 'T-DEMO',
      name: 'deploy-guide',
      display_name: 'Deployment Guide',
      description: 'Guides through the deployment process to production',
      instructions: `Deployment checklist:
1. Run all tests (npm test)
2. Create PR with description
3. Get 2 code review approvals
4. Merge to main branch
5. Monitor CI/CD pipeline
6. Verify in staging
7. Promote to production
8. Monitor error rates for 30 minutes`,
      created_by: 'U-ADMIN',
    });

    expect(skill.name).toBe('deploy-guide');
    console.log(`  [PASS] Skill "deploy-guide" created with id ${skill.id}`);
  });

  it('Step 6: Workspace now has 3 skills', () => {
    const skills = skillService.listSkills('T-DEMO');
    expect(skills).toHaveLength(3);
    expect(skillService.getSkillCount('T-DEMO')).toBe(3);

    const names = skills.map((s) => s.name);
    expect(names).toContain('code-review');
    expect(names).toContain('standup');
    expect(names).toContain('deploy-guide');
    console.log(`  [PASS] Workspace has 3 skills: ${names.join(', ')}`);
  });

  it('Step 7: AI includes all skills in system prompt', () => {
    const skills = skillService.getAllSkillsForPrompt('T-DEMO');
    const prompt = aiService.buildSystemPrompt(skills);

    expect(prompt).toContain('Code Review Expert');
    expect(prompt).toContain('Standup Facilitator');
    expect(prompt).toContain('Deployment Guide');
    expect(prompt).not.toContain('No custom skills');
    console.log('  [PASS] All 3 skills injected into AI system prompt');
  });

  it('Step 8: User asks a code review question - AI uses code-review skill', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: 'I found a potential SQL injection vulnerability in line 15. Use parameterized queries instead of string concatenation.',
        },
      }],
    });

    const skills = skillService.getAllSkillsForPrompt('T-DEMO');
    const result = await aiService.ask('Please do a code-review of my latest PR', skills);

    expect(result.answer).toContain('SQL injection');
    expect(result.skillsUsed).toContain('Code Review Expert');
    console.log('  [PASS] AI correctly identified and used "Code Review Expert" skill');
  });

  it('Step 9: User asks about deploying - AI uses deploy skill', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: 'To deploy to production: 1) Run tests 2) Create PR 3) Get approvals 4) Merge to main 5) Monitor CI/CD.',
        },
      }],
    });

    const skills = skillService.getAllSkillsForPrompt('T-DEMO');
    const result = await aiService.ask('How do I use the deploy-guide?', skills);

    expect(result.answer).toContain('deploy');
    expect(result.skillsUsed).toContain('Deployment Guide');
    console.log('  [PASS] AI correctly identified and used "Deployment Guide" skill');
  });

  it('Step 10: View detailed skill info', () => {
    const skill = skillService.getSkill('T-DEMO', 'code-review');
    expect(skill).toBeDefined();
    expect(skill!.display_name).toBe('Code Review Expert');
    expect(skill!.instructions).toContain('security vulnerabilities');
    expect(skill!.examples).toContain('TypeScript types');
    console.log('  [PASS] Skill detail retrieval works correctly');
  });

  it('Step 11: Update a skill', () => {
    const updated = skillService.updateSkill('T-DEMO', 'standup', {
      instructions: 'Updated: Keep standups to 15 minutes max. Focus on blockers.',
    });

    expect(updated.instructions).toContain('15 minutes');
    const fresh = skillService.getSkill('T-DEMO', 'standup');
    expect(fresh!.instructions).toContain('15 minutes');
    console.log('  [PASS] Skill update persisted correctly');
  });

  it('Step 12: Search for skills', () => {
    const codeSkills = skillService.searchSkills('T-DEMO', 'code');
    expect(codeSkills).toHaveLength(1);
    expect(codeSkills[0].name).toBe('code-review');

    const allDeploySkills = skillService.searchSkills('T-DEMO', 'deploy');
    expect(allDeploySkills).toHaveLength(1);
    console.log('  [PASS] Skill search returns correct results');
  });

  it('Step 13: Remove a skill', () => {
    skillService.removeSkill('T-DEMO', 'standup');
    expect(skillService.getSkill('T-DEMO', 'standup')).toBeUndefined();
    expect(skillService.getSkillCount('T-DEMO')).toBe(2);
    console.log('  [PASS] Skill removed, count updated to 2');
  });

  it('Step 14: AI prompt reflects removal', () => {
    const skills = skillService.getAllSkillsForPrompt('T-DEMO');
    const prompt = aiService.buildSystemPrompt(skills);

    expect(prompt).toContain('Code Review Expert');
    expect(prompt).toContain('Deployment Guide');
    expect(prompt).not.toContain('Standup Facilitator');
    console.log('  [PASS] Removed skill no longer appears in AI prompt');
  });

  it('Step 15: Error handling - duplicate skill', () => {
    expect(() =>
      skillService.addSkill({
        team_id: 'T-DEMO',
        name: 'code-review',
        display_name: 'Duplicate',
        description: 'Should fail',
        instructions: 'Should fail',
        created_by: 'U-ADMIN',
      }),
    ).toThrow('already exists');
    console.log('  [PASS] Duplicate skill properly rejected');
  });

  it('Step 16: Error handling - remove non-existent skill', () => {
    expect(() => skillService.removeSkill('T-DEMO', 'does-not-exist')).toThrow('not found');
    console.log('  [PASS] Non-existent skill removal properly rejected');
  });

  it('Step 17: Multi-tenant isolation verified', () => {
    const demoSkills = skillService.listSkills('T-DEMO');
    const otherSkills = skillService.listSkills('T-OTHER');

    expect(demoSkills).toHaveLength(2);
    expect(otherSkills).toHaveLength(0);
    console.log('  [PASS] Skills properly isolated between teams');
  });
});
