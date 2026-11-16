// The Strategy contract plus the two fixed-order modes.

import type { Character } from "./character.ts";
import { SKILLS, type Action, type SkillName } from "./skill.ts";

export interface Pick {
  action: Action;
  /** Optional remark shown next to the action. */
  note?: string;
}

/** Decides which skill a character uses on its turn. */
export interface Strategy {
  readonly name: string;
  pick(self: Character, enemy: Character): Promise<Pick> | Pick;
}

/** Never stalls with the default cooldowns. */
export const DEFAULT_SEQUENCE = "attack,defense,attack,heal";

/** Plays a fixed, looping list in strict order; waits when the next skill is on cooldown. */
export class Sequence implements Strategy {
  readonly name = "sequence";
  private steps: SkillName[];
  private pos = 0;

  constructor(csv: string) {
    this.steps = csv.split(",").map((raw) => {
      const step = raw.trim();
      if (!SKILLS.some((s) => s.name === step)) throw new Error(`sequence: unknown skill "${step}"`);
      return step as SkillName;
    });
  }

  pick(self: Character): Pick {
    const next = this.steps[this.pos % this.steps.length];
    if (!self.ready(next)) return { action: "wait", note: `holding for ${next}` };
    this.pos++;
    return { action: next };
  }
}

/** Cycles through the skills, skipping any on cooldown. */
export class RoundRobin implements Strategy {
  readonly name = "roundrobin";
  private pos = 0;

  pick(self: Character): Pick {
    for (let i = 0; i < SKILLS.length; i++) {
      const skill = SKILLS[(this.pos + i) % SKILLS.length].name;
      if (self.ready(skill)) {
        this.pos = (this.pos + i + 1) % SKILLS.length;
        return { action: skill };
      }
    }
    return { action: "wait" };
  }
}
