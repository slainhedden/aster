import { SkillStore } from './store';
import { Skill, CreateSkillInput } from '../types';

export class SkillService {
  private store: SkillStore;

  constructor(store: SkillStore) {
    this.store = store;
  }

  addSkill(input: CreateSkillInput): Skill {
    const existing = this.store.getSkill(input.team_id, input.name);
    if (existing) {
      throw new Error(`Skill "${input.name}" already exists. Use a different name or remove the existing skill first.`);
    }
    return this.store.addSkill(input);
  }

  getSkill(teamId: string, name: string): Skill | undefined {
    return this.store.getSkill(teamId, name);
  }

  listSkills(teamId: string): Skill[] {
    return this.store.listSkills(teamId);
  }

  removeSkill(teamId: string, name: string): boolean {
    const existing = this.store.getSkill(teamId, name);
    if (!existing) {
      throw new Error(`Skill "${name}" not found.`);
    }
    return this.store.removeSkill(teamId, name);
  }

  updateSkill(
    teamId: string,
    name: string,
    updates: Partial<Pick<Skill, 'display_name' | 'description' | 'instructions' | 'examples'>>,
  ): Skill {
    const result = this.store.updateSkill(teamId, name, updates);
    if (!result) {
      throw new Error(`Skill "${name}" not found.`);
    }
    return result;
  }

  searchSkills(teamId: string, query: string): Skill[] {
    return this.store.searchSkills(teamId, query);
  }

  getSkillCount(teamId: string): number {
    return this.store.countSkills(teamId);
  }

  getAllSkillsForPrompt(teamId: string): Skill[] {
    return this.store.listSkills(teamId);
  }
}
