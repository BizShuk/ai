// Laya reply model: the laya classifier (POST /v1/systemone) estimates how likely the enemy is
// to use each of its usable skills. Lookahead turns those probabilities into a decision.
//
// Laya is a text classifier: it cannot compare numbers ("hp 28 of 100" reads the same as
// "hp 82 of 100") and its multi-option choice follows option order more than the state.
// One yes/no question per skill over a worded state is the form it answers consistently.

import type { Character } from "./character.ts";
import { MAX_HP } from "./character.ts";
import { uniformReplies, type ReplyModel } from "./lookahead.ts";
import type { SkillName } from "./skill.ts";

const LAYA_TIMEOUT_MS = 10_000;

/** One yes/no question per skill; laya's "yes" probability is that skill's raw likelihood. */
const REPLY_QUESTIONS: Record<SkillName, { instructions: string; criteria: { false: string; true: string } }> = {
  attack: {
    instructions: "Will the fighter attack?",
    criteria: { false: "the fighter is wounded and must recover", true: "the fighter is healthy and ready to strike" },
  },
  defense: {
    instructions: "Will the fighter raise its shield?",
    criteria: { false: "the fighter is healthy and unafraid", true: "the fighter is hurt and wants protection" },
  },
  heal: {
    instructions: "Will the fighter heal itself?",
    criteria: { false: "the fighter is healthy", true: "the fighter is wounded" },
  },
};

/** Turns hp into the wording laya reads; it does not understand the raw number. */
function describeHealth(hp: number): string {
  if (hp >= MAX_HP) return "The fighter is at full health and unhurt.";
  if (hp > MAX_HP * 0.5) return "The fighter is in good shape, only lightly scratched.";
  if (hp > MAX_HP * 0.25) return "The fighter is hurt and has lost more than half of its health.";
  return "The fighter is badly wounded and close to dying.";
}

/** Builds a ReplyModel backed by the laya server; falls back to equal odds when laya is unreachable. */
export function layaReplies(url: string): ReplyModel {
  return async (enemy, replies) => {
    const questions: Record<string, object> = {};
    for (const skill of replies) questions[skill] = { type: "noul", ...REPLY_QUESTIONS[skill] };

    let answers: Record<string, { noul: number } | undefined>;
    try {
      const resp = await fetch(`${url}/v1/systemone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(LAYA_TIMEOUT_MS),
        body: JSON.stringify({ state: { body: describeHealth(enemy.hp) }, questions }),
      });
      if (!resp.ok) throw new Error(`http ${resp.status}`);
      answers = ((await resp.json()) as { answers: typeof answers }).answers;
    } catch {
      return uniformReplies(enemy, replies);
    }

    const raw = replies.map((skill) => answers[skill]?.noul ?? 0);
    const total = raw.reduce((sum, p) => sum + p, 0);
    if (total === 0) return uniformReplies(enemy, replies);
    return raw.map((p) => p / total);
  };
}
