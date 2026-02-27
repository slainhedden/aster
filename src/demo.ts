import readline from 'readline';
import { SkillStore } from './services/store';
import { SkillService } from './services/skills';
import { AIService } from './services/ai';

const DEMO_TEAM_ID = 'T-DEMO-WORKSPACE';
const DEMO_USER_ID = 'U-DEMO-ADMIN';

class AsterDemo {
  private store: SkillStore;
  private skillService: SkillService;
  private aiService: AIService | null = null;
  private rl: readline.Interface;

  constructor() {
    this.store = new SkillStore('./data/demo.db');
    this.skillService = new SkillService(this.store);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.aiService = new AIService(apiKey, process.env.OPENAI_MODEL || 'gpt-4o');
      console.log('  AI Mode: Live (OpenAI connected)');
    } else {
      console.log('  AI Mode: Simulated (no OPENAI_API_KEY set)');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => resolve(answer.trim()));
    });
  }

  private simulateAIResponse(question: string, skills: { display_name: string; instructions: string }[]): string {
    if (skills.length === 0) {
      return `I'm Aster, your AI assistant! I don't have any custom skills configured yet. Try adding some with the "skill add" command to customize my knowledge for your team.`;
    }

    const relevantSkill = skills.find(
      (s) =>
        question.toLowerCase().includes(s.display_name.toLowerCase()) ||
        s.instructions.toLowerCase().split(' ').some((w) => w.length > 4 && question.toLowerCase().includes(w)),
    );

    if (relevantSkill) {
      return `[Using skill: ${relevantSkill.display_name}]\n\nBased on the "${relevantSkill.display_name}" skill, here's my response:\n\n${relevantSkill.instructions.split('\n').slice(0, 3).join('\n')}\n\n(This is a simulated response. With a real OpenAI key, I'd give a more natural answer using these instructions as context.)`;
    }

    const skillNames = skills.map((s) => s.display_name).join(', ');
    return `I have ${skills.length} skills available (${skillNames}). Based on your question, I'd provide a general answer. Try asking about a specific skill topic for a more targeted response!\n\n(Simulated response — connect OpenAI for real AI answers.)`;
  }

  async handleCommand(input: string): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();

    switch (cmd) {
      case 'ask': {
        const question = parts.slice(1).join(' ');
        if (!question) {
          console.log('\n  ⚠️  Usage: ask <your question>');
          return;
        }
        console.log('\n  ⏳ Thinking...');

        const skills = this.skillService.getAllSkillsForPrompt(DEMO_TEAM_ID);

        if (this.aiService) {
          try {
            const result = await this.aiService.ask(question, skills);
            console.log(`\n  🤖 Aster: ${result.answer}`);
            if (result.skillsUsed.length > 0) {
              console.log(`\n  📚 Skills used: ${result.skillsUsed.join(', ')}`);
            }
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`\n  ❌ AI Error: ${msg}`);
            console.log('  Falling back to simulated response...');
            const simulated = this.simulateAIResponse(question, skills);
            console.log(`\n  🤖 Aster: ${simulated}`);
          }
        } else {
          const simulated = this.simulateAIResponse(question, skills);
          console.log(`\n  🤖 Aster: ${simulated}`);
        }
        break;
      }

      case 'skill': {
        const action = parts[1]?.toLowerCase();

        switch (action) {
          case 'add': {
            console.log('\n  📝 Add a New Skill');
            console.log('  ─────────────────');

            const name = await this.prompt('  Skill ID (lowercase, hyphens ok): ');
            if (!name || !/^[a-z0-9_-]+$/.test(name)) {
              console.log('  ❌ Invalid name. Use lowercase alphanumeric with hyphens/underscores.');
              return;
            }

            const displayName = await this.prompt('  Display Name: ');
            if (!displayName) { console.log('  ❌ Display name required.'); return; }

            const description = await this.prompt('  Description: ');
            if (!description) { console.log('  ❌ Description required.'); return; }

            const instructions = await this.prompt('  Instructions (what should Aster know?): ');
            if (!instructions) { console.log('  ❌ Instructions required.'); return; }

            const examples = await this.prompt('  Examples (optional, press Enter to skip): ');

            try {
              const skill = this.skillService.addSkill({
                team_id: DEMO_TEAM_ID,
                name,
                display_name: displayName,
                description,
                instructions,
                examples: examples || '',
                created_by: DEMO_USER_ID,
              });
              console.log(`\n  ✅ Skill "${skill.display_name}" (${skill.name}) created successfully!`);
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Unknown error';
              console.log(`\n  ❌ ${msg}`);
            }
            break;
          }

          case 'list': {
            const skills = this.skillService.listSkills(DEMO_TEAM_ID);
            if (skills.length === 0) {
              console.log('\n  ℹ️  No skills configured yet. Use "skill add" to create one!');
              return;
            }
            console.log(`\n  🧠 Skills (${skills.length}):`);
            console.log('  ─────────────────');
            skills.forEach((s, i) => {
              console.log(`  ${i + 1}. ${s.display_name} (${s.name})`);
              console.log(`     ${s.description}`);
            });
            break;
          }

          case 'info': {
            const infoName = parts[2];
            if (!infoName) { console.log('\n  ⚠️  Usage: skill info <name>'); return; }
            const skill = this.skillService.getSkill(DEMO_TEAM_ID, infoName);
            if (!skill) { console.log(`\n  ❌ Skill "${infoName}" not found.`); return; }

            console.log(`\n  📋 ${skill.display_name} (${skill.name})`);
            console.log('  ─────────────────');
            console.log(`  Description: ${skill.description}`);
            console.log(`  Instructions: ${skill.instructions}`);
            if (skill.examples) console.log(`  Examples: ${skill.examples}`);
            console.log(`  Created: ${new Date(skill.created_at).toLocaleString()}`);
            break;
          }

          case 'remove': {
            const removeName = parts[2];
            if (!removeName) { console.log('\n  ⚠️  Usage: skill remove <name>'); return; }
            try {
              this.skillService.removeSkill(DEMO_TEAM_ID, removeName);
              console.log(`\n  ✅ Skill "${removeName}" removed.`);
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Unknown error';
              console.log(`\n  ❌ ${msg}`);
            }
            break;
          }

          case 'search': {
            const query = parts.slice(2).join(' ');
            if (!query) { console.log('\n  ⚠️  Usage: skill search <query>'); return; }
            const results = this.skillService.searchSkills(DEMO_TEAM_ID, query);
            if (results.length === 0) { console.log(`\n  ℹ️  No skills matching "${query}".`); return; }
            console.log(`\n  🔍 Search results for "${query}" (${results.length}):`);
            results.forEach((s, i) => {
              console.log(`  ${i + 1}. ${s.display_name} (${s.name}) — ${s.description}`);
            });
            break;
          }

          default:
            console.log('\n  ⚠️  Unknown skill action. Available: add, list, info, remove, search');
        }
        break;
      }

      case 'help':
      default: {
        const count = this.skillService.getSkillCount(DEMO_TEAM_ID);
        console.log(`
  ⭐ Aster — AI assistant with custom skills
  ──────────────────────────────────────────

  Commands:
    ask <question>          Ask Aster a question
    skill add               Add a new skill (interactive)
    skill list              List all skills
    skill info <name>       View skill details
    skill remove <name>     Remove a skill
    skill search <query>    Search skills
    help                    Show this help
    quit                    Exit demo

  ${count} skill${count !== 1 ? 's' : ''} configured
`);
        break;
      }
    }
  }

  async run(): Promise<void> {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║           ⭐ ASTER DEMO MODE ⭐          ║
  ║   AI Slack assistant with custom skills   ║
  ╚═══════════════════════════════════════════╝

  Workspace: DEMO-WORKSPACE
  Type "help" for commands, "quit" to exit.
`);

    while (true) {
      const input = await this.prompt('\n  aster> ');

      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log('\n  👋 Goodbye!\n');
        break;
      }

      if (!input) continue;

      await this.handleCommand(input);
    }

    this.store.close();
    this.rl.close();
  }
}

const demo = new AsterDemo();
demo.run().catch(console.error);
