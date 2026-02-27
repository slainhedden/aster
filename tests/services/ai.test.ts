import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../src/services/ai';
import { Skill } from '../../src/types';

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

const makeSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'skill-1',
  team_id: 'T123',
  name: 'code-review',
  display_name: 'Code Review',
  description: 'Reviews code for bugs and style',
  instructions: 'Check code for common issues',
  examples: 'Q: Review this\nA: Looks good',
  created_by: 'U456',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('AIService', () => {
  let service: AIService;
  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIService('test-key', 'gpt-4o');
  });

  describe('buildSystemPrompt', () => {
    it('should build a prompt with no skills', () => {
      const prompt = service.buildSystemPrompt([]);
      expect(prompt).toContain('Aster');
      expect(prompt).toContain('No custom skills');
      expect(prompt).toContain('/aster skill add');
    });

    it('should build a prompt with skills included', () => {
      const skills = [makeSkill(), makeSkill({ name: 'deploy', display_name: 'Deploy Helper', description: 'Helps deploy' })];
      const prompt = service.buildSystemPrompt(skills);
      expect(prompt).toContain('Code Review');
      expect(prompt).toContain('Deploy Helper');
      expect(prompt).toContain('Reviews code for bugs and style');
      expect(prompt).toContain('SKILLS');
    });

    it('should include skill examples when provided', () => {
      const skill = makeSkill({ examples: 'Q: Test\nA: Answer' });
      const prompt = service.buildSystemPrompt([skill]);
      expect(prompt).toContain('Q: Test');
      expect(prompt).toContain('A: Answer');
    });
  });

  describe('ask', () => {
    it('should call OpenAI and return the response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Here is my review of the code.' } }],
      });

      const result = await service.ask('Review this code please', [makeSkill()]);

      expect(result.answer).toBe('Here is my review of the code.');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should identify relevant skills based on user message', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Done.' } }],
      });

      const skills = [
        makeSkill(),
        makeSkill({ name: 'deploy', display_name: 'Deploy Helper', description: 'Helps deploy applications' }),
      ];

      const result = await service.ask('Can you review my code?', skills);
      expect(result.skillsUsed).toContain('Code Review');
    });

    it('should handle empty response from OpenAI', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await service.ask('Hello', []);
      expect(result.answer).toBe('I was unable to generate a response.');
    });

    it('should pass conversation history to OpenAI', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Follow-up response' } }],
      });

      const history = [
        { role: 'user' as const, content: 'Previous question' },
        { role: 'assistant' as const, content: 'Previous answer' },
      ];

      await service.ask('Follow-up question', [], history);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(4); // system + 2 history + user
      expect(callArgs.messages[1].content).toBe('Previous question');
      expect(callArgs.messages[2].content).toBe('Previous answer');
    });

    it('should propagate OpenAI errors', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit'));

      await expect(service.ask('test', [])).rejects.toThrow('API rate limit');
    });
  });
});
