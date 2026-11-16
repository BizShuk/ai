// The battle loop: alternating turns until one side dies or the round limit hits.

import { Character } from "./character.ts";
import type { Strategy } from "./strategy.ts";

/** A character, the strategy driving it, and what it did on its latest turn. */
export class Fighter {
  char: Character;
  strategy: Strategy;
  lastAction = "-";

  constructor(name: string, strategy: Strategy) {
    this.char = new Character(`${name}[${strategy.name}]`);
    this.strategy = strategy;
  }
}

/**
 * Plays the battle, calling onRound after each round (both fighters acted, or one died).
 * Returns the winner, or null on a draw.
 */
export async function run(
  a: Fighter,
  b: Fighter,
  maxRounds: number,
  onRound: (round: number) => Promise<void> | void,
): Promise<Fighter | null> {
  for (let round = 1; round <= maxRounds; round++) {
    for (const [actor, target] of [[a, b], [b, a]]) {
      const { action, note } = await actor.strategy.pick(actor.char, target.char);
      const result = actor.char.act(action, target.char);
      actor.lastAction = note ? `${result}  <${note}>` : result;
      if (!target.char.alive) break;
    }
    await onRound(round);
    if (!a.char.alive) return b;
    if (!b.char.alive) return a;
  }
  if (a.char.hp === b.char.hp) return null;
  return a.char.hp > b.char.hp ? a : b;
}
