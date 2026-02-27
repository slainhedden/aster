import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Skill, CreateSkillInput, CreateSkillInputSchema } from '../types';

export class SkillStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT NOT NULL,
        examples TEXT DEFAULT '',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(team_id, name)
      );

      CREATE INDEX IF NOT EXISTS idx_skills_team_id ON skills(team_id);
      CREATE INDEX IF NOT EXISTS idx_skills_team_name ON skills(team_id, name);
    `);
  }

  addSkill(input: CreateSkillInput): Skill {
    const validated = CreateSkillInputSchema.parse(input);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const skill: Skill = {
      id,
      team_id: validated.team_id,
      name: validated.name,
      display_name: validated.display_name,
      description: validated.description,
      instructions: validated.instructions,
      examples: validated.examples ?? '',
      created_by: validated.created_by,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO skills (id, team_id, name, display_name, description, instructions, examples, created_by, created_at, updated_at)
      VALUES (@id, @team_id, @name, @display_name, @description, @instructions, @examples, @created_by, @created_at, @updated_at)
    `);
    stmt.run(skill);

    return skill;
  }

  getSkill(teamId: string, name: string): Skill | undefined {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE team_id = ? AND name = ?');
    return stmt.get(teamId, name) as Skill | undefined;
  }

  getSkillById(id: string): Skill | undefined {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE id = ?');
    return stmt.get(id) as Skill | undefined;
  }

  listSkills(teamId: string): Skill[] {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE team_id = ? ORDER BY name ASC');
    return stmt.all(teamId) as Skill[];
  }

  removeSkill(teamId: string, name: string): boolean {
    const stmt = this.db.prepare('DELETE FROM skills WHERE team_id = ? AND name = ?');
    const result = stmt.run(teamId, name);
    return result.changes > 0;
  }

  updateSkill(
    teamId: string,
    name: string,
    updates: Partial<Pick<Skill, 'display_name' | 'description' | 'instructions' | 'examples'>>,
  ): Skill | undefined {
    const existing = this.getSkill(teamId, name);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE skills
      SET display_name = @display_name,
          description = @description,
          instructions = @instructions,
          examples = @examples,
          updated_at = @updated_at
      WHERE team_id = @team_id AND name = @name
    `);

    stmt.run({
      team_id: teamId,
      name,
      display_name: updates.display_name ?? existing.display_name,
      description: updates.description ?? existing.description,
      instructions: updates.instructions ?? existing.instructions,
      examples: updates.examples ?? existing.examples,
      updated_at: now,
    });

    return this.getSkill(teamId, name);
  }

  searchSkills(teamId: string, query: string): Skill[] {
    const stmt = this.db.prepare(`
      SELECT * FROM skills
      WHERE team_id = ? AND (name LIKE ? OR display_name LIKE ? OR description LIKE ?)
      ORDER BY name ASC
    `);
    const pattern = `%${query}%`;
    return stmt.all(teamId, pattern, pattern, pattern) as Skill[];
  }

  countSkills(teamId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM skills WHERE team_id = ?');
    const result = stmt.get(teamId) as { count: number };
    return result.count;
  }

  close(): void {
    this.db.close();
  }
}
