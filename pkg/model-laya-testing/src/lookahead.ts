// Lookahead: simulate each usable skill against every reply the enemy could make, weight the
// outcomes by how likely each reply is, and play the skill with the best expected result.
// The outcome is computed; where the reply probabilities come from is the ReplyModel's job.

import type { Character } from "./character.ts";
import type { Action, SkillName } from "./skill.ts";
import type { Pick, Strategy } from "./strategy.ts";

/** Estimates how likely the enemy is to answer with each of its usable skills (same order, sums to 1). */
export type ReplyModel = (enemy: Character, replies: SkillName[]) => Promise<number[]> | number[];

/** Every usable reply is equally likely. */
export const uniformReplies: ReplyModel = (_enemy, replies) => replies.map(() => 1 / replies.length);

/** Outcome of a simulated exchange: my hp lead over the enemy. */
function hpLead(self: Character, enemy: Character): number {
  return self.hp - enemy.hp;
}

export class Lookahead implements Strategy {
  readonly name: string;
  private replyModel: ReplyModel;

  constructor(name: string, replyModel: ReplyModel) {
    this.name = name;
    this.replyModel = replyModel;
  }

  async pick(self: Character, enemy: Character): Promise<Pick> {
    // "wait" is always a candidate and goes first, so a skill that gains nothing is saved, not burned.
    const candidates: Action[] = ["wait", ...self.readySkills()];

    // Skills on cooldown are excluded on both sides; with nothing usable the enemy can only wait.
    const ready = enemy.readySkills();
    const replies: Action[] = ready.length > 0 ? ready : ["wait"];
    const weights = ready.length > 0 ? await this.replyModel(enemy, ready) : [1];

    let best: Action = "wait";
    let bestScore = -Infinity;
    const scores: string[] = [];
    for (const action of candidates) {
      let score = 0;
      replies.forEach((reply, i) => {
        const me = self.clone();
        const foe = enemy.clone();
        me.act(action, foe);
        if (foe.alive) foe.act(reply, me);
        score += weights[i] * hpLead(me, foe);
      });
      scores.push(`${action} ${score.toFixed(1)}`);
      if (score > bestScore) {
        best = action;
        bestScore = score;
      }
    }
    const odds = replies.map((reply, i) => `${reply} ${Math.round(weights[i] * 100)}%`).join(" ");
    return { action: best, note: `${scores.join(", ")} | foe: ${odds}` };
  }
}
