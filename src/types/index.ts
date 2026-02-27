import { z } from 'zod';

export const SkillSchema = z.object({
  id: z.string(),
  team_id: z.string(),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/, 'Skill name must be lowercase alphanumeric with hyphens/underscores'),
  display_name: z.string().min(1).max(128),
  description: z.string().min(1).max(512),
  instructions: z.string().min(1).max(4096),
  examples: z.string().max(4096).optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Skill = z.infer<typeof SkillSchema>;

export const CreateSkillInputSchema = z.object({
  team_id: z.string().min(1),
  name: SkillSchema.shape.name,
  display_name: SkillSchema.shape.display_name,
  description: SkillSchema.shape.description,
  instructions: SkillSchema.shape.instructions,
  examples: z.string().max(4096).optional().default(''),
  created_by: z.string().min(1),
});

export type CreateSkillInput = z.infer<typeof CreateSkillInputSchema>;

export interface AsterConfig {
  slack: {
    botToken: string;
    appToken: string;
    signingSecret: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  database: {
    path: string;
  };
  logLevel: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AskResult {
  answer: string;
  skillsUsed: string[];
}
