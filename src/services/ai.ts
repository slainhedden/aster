import OpenAI from 'openai';
import { Skill, ConversationMessage, AskResult } from '../types';

export class AIService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  buildSystemPrompt(skills: Skill[]): string {
    let prompt = `You are Aster, an AI assistant for teams on Slack. You are helpful, concise, and friendly.
You have access to the following skills that define your specialized knowledge and capabilities.
Use the relevant skills to provide the best possible answer.`;

    if (skills.length === 0) {
      prompt += `\n\nNo custom skills are configured yet. Answer questions using your general knowledge.
Suggest that the team add skills using "/aster skill add" to customize your capabilities.`;
    } else {
      prompt += `\n\n--- SKILLS ---\n`;
      for (const skill of skills) {
        prompt += `\n### ${skill.display_name} (${skill.name})\n`;
        prompt += `Description: ${skill.description}\n`;
        prompt += `Instructions: ${skill.instructions}\n`;
        if (skill.examples) {
          prompt += `Examples:\n${skill.examples}\n`;
        }
      }
      prompt += `\n--- END SKILLS ---`;
    }

    prompt += `\n\nGuidelines:
- Be concise but thorough in Slack messages.
- Use Slack formatting (bold, code blocks, lists) when helpful.
- If a question relates to a specific skill, follow that skill's instructions closely.
- If unsure, say so rather than guessing.
- When multiple skills are relevant, combine their knowledge.`;

    return prompt;
  }

  async ask(
    userMessage: string,
    skills: Skill[],
    conversationHistory: ConversationMessage[] = [],
  ): Promise<AskResult> {
    const systemPrompt = this.buildSystemPrompt(skills);

    const relevantSkills = skills.filter(
      (s) =>
        userMessage.toLowerCase().includes(s.name) ||
        userMessage.toLowerCase().includes(s.display_name.toLowerCase()) ||
        s.description.toLowerCase().split(' ').some((word) => userMessage.toLowerCase().includes(word)),
    );

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content || 'I was unable to generate a response.';

    return {
      answer,
      skillsUsed: relevantSkills.map((s) => s.display_name),
    };
  }
}
