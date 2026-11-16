// Skill definitions shared by every character.

export type SkillName = "attack" | "defense" | "heal";

/** An action taken on a turn: a skill, or "wait" to skip the turn (nothing ready, or saving a skill). */
export type Action = SkillName | "wait";

export interface Skill {
  name: SkillName;
  /** Damage for attack, hp restored for heal, unused for defense. */
  power: number;
  /** Own turns the skill stays unusable after being used. */
  cooldown: number;
}

/** How much of the next incoming hit a defending character absorbs. */
export const DEFENSE_BLOCK_PERCENT = 70;

/** The fixed skill set, in round-robin order. */
export const SKILLS: readonly Skill[] = [
  { name: "attack", power: 18, cooldown: 1 },
  { name: "defense", power: 0, cooldown: 3 },
  { name: "heal", power: 35, cooldown: 5 },
];
