// Command entry: choose a mode for each side, then run the duel with a live panel.

import { createInterface } from "node:readline";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";

import { Fighter, run } from "./engine.ts";
import { MODES, isMode, newStrategy, type Mode } from "./mode.ts";
import { DEFAULT_SEQUENCE } from "./strategy.ts";
import { View } from "./view.ts";

/** Wall-clock time each round stays on screen. */
const ROUND_MS = 300;

const { values } = parseArgs({
  options: {
    a: { type: "string", short: "a" },
    b: { type: "string", short: "b" },
    "laya-url": { type: "string", default: "http://localhost:8503" },
    sequence: { type: "string", default: DEFAULT_SEQUENCE },
    rounds: { type: "string", default: "1000" },
  },
});

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

/** Asks for each missing mode until the answer is a menu number or a mode name. */
async function chooseModes(preset: (string | undefined)[]): Promise<Mode[]> {
  const chosen: Mode[] = [];
  let lines: AsyncIterator<string> | undefined;
  let rl: ReturnType<typeof createInterface> | undefined;

  for (const [i, value] of preset.entries()) {
    if (value !== undefined) {
      if (!isMode(value)) fail(`unknown mode "${value}" (want one of ${MODES.join(", ")})`);
      chosen.push(value);
      continue;
    }
    rl ??= createInterface({ input: process.stdin });
    lines ??= rl[Symbol.asyncIterator]();
    for (;;) {
      console.log(`Choose mode for fighter ${"AB"[i]}:`);
      MODES.forEach((m, n) => console.log(`  ${n + 1}) ${m}`));
      process.stdout.write("> ");
      const { value: line, done } = await lines.next();
      if (done) fail("\nno mode chosen");
      const answer = line.trim();
      const mode = MODES[Number(answer) - 1] ?? (isMode(answer) ? answer : undefined);
      if (mode) {
        chosen.push(mode);
        break;
      }
      console.log("invalid choice");
    }
  }
  rl?.close();
  return chosen;
}

const maxRounds = Number(values.rounds);
if (!Number.isInteger(maxRounds) || maxRounds < 1) fail(`invalid --rounds "${values.rounds}"`);

const modes = await chooseModes([values.a, values.b]);
let fighters: Fighter[];
try {
  fighters = modes.map(
    (mode, i) => new Fighter("AB"[i], newStrategy(mode, { layaUrl: values["laya-url"], sequence: values.sequence })),
  );
} catch (err) {
  fail((err as Error).message);
}
const [a, b] = fighters;

console.log();
const view = new View();
view.render(0, maxRounds, a, b);

let lastRound = 0;
let roundStart = performance.now();
const winner = await run(a, b, maxRounds, async (round) => {
  lastRound = round;
  view.render(round, maxRounds, a, b);
  await sleep(Math.max(ROUND_MS - (performance.now() - roundStart), 0));
  roundStart = performance.now();
});

view.render(
  lastRound,
  maxRounds,
  a,
  b,
  winner ? `Result: ${winner.char.name} wins with ${winner.char.hp} hp` : "Result: draw",
);
