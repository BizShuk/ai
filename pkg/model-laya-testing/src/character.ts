// One fighter: hp, guard state, and remaining cooldown per skill.

import { DEFENSE_BLOCK_PERCENT, SKILLS, type Action, type SkillName } from "./skill.ts";

export const MAX_HP = 100;

export class Character {
  name: string;
  hp = MAX_HP;
  defending = false;
  private cooldowns: Record<SkillName, number> = { attack: 0, defense: 0, heal: 0 };

  constructor(name: string) {
    this.name = name;
  }

  /** Independent copy, used to simulate a turn without touching the real fighter. */
  clone(): Character {
    const copy = new Character(this.name);
    copy.hp = this.hp;
    copy.defending = this.defending;
    copy.cooldowns = { ...this.cooldowns };
    return copy;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  /** Own turns left before the skill is usable again. */
  cooldownLeft(skill: SkillName): number {
    return this.cooldowns[skill];
  }

  ready(skill: SkillName): boolean {
    return this.cooldowns[skill] === 0;
  }

  /** Usable skills in declaration order. */
  readySkills(): SkillName[] {
    return SKILLS.map((s) => s.name).filter((name) => this.ready(name));
  }

  /** Applies the action against target, starts its cooldown, and returns a log line. */
  act(action: Action, target: Character): string {
    this.defending = false; // a guard only lasts until the owner's next turn
    for (const s of SKILLS) {
      this.cooldowns[s.name] = Math.max(this.cooldowns[s.name] - 1, 0);
    }
    if (action === "wait") return "waits";

    const skill = SKILLS.find((s) => s.name === action)!;
    this.cooldowns[action] = skill.cooldown;

    switch (action) {
      case "attack": {
        const blocked = target.defending;
        const dmg = blocked ? Math.floor((skill.power * (100 - DEFENSE_BLOCK_PERCENT)) / 100) : skill.power;
        target.defending = false;
        target.hp = Math.max(target.hp - dmg, 0);
        return `attacks for ${dmg}${blocked ? " (blocked)" : ""}`;
      }
      case "defense":
        this.defending = true;
        return `defends (next hit -${DEFENSE_BLOCK_PERCENT}%)`;
      case "heal": {
        const healed = Math.min(skill.power, MAX_HP - this.hp);
        this.hp += healed;
        return `heals ${healed}`;
      }
    }
  }
}
