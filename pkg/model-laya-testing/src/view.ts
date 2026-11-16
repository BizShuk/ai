// Terminal panel redrawn in place: hp bar, per-skill cooldown bar, and last action for both sides.

import { MAX_HP } from "./character.ts";
import type { Fighter } from "./engine.ts";
import { SKILLS } from "./skill.ts";

const HP_BAR_WIDTH = 30;
/** Cells per cooldown turn, so every skill's bar shows its own full length. */
const COOLDOWN_CELL_WIDTH = 3;
const COOLDOWN_BAR_WIDTH = COOLDOWN_CELL_WIDTH * Math.max(...SKILLS.map((s) => s.cooldown));

/** Visible width of the "  last:    " prefix. */
const LAST_PREFIX_WIDTH = 11;

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const RED = `${ESC}31m`;
const CYAN = `${ESC}36m`;
const DIM = `${ESC}2m`;
const BOLD = `${ESC}1m`;
const CLEAR_LINE = `${ESC}2K`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;

function bar(filled: number, width: number, color: string): string {
  return `${color}${"█".repeat(filled)}${RESET}${DIM}${"░".repeat(width - filled)}${RESET}`;
}

function hpColor(hp: number): string {
  if (hp > MAX_HP * 0.5) return GREEN;
  if (hp > MAX_HP * 0.25) return YELLOW;
  return RED;
}

function fighterLines(f: Fighter): string[] {
  const { char } = f;
  const hpCells = Math.ceil((char.hp / MAX_HP) * HP_BAR_WIDTH);
  const lines = [
    `${BOLD}${char.name}${RESET}${char.defending ? `  ${CYAN}[guard]${RESET}` : ""}`,
    `  ${"HP".padEnd(8)} ${bar(hpCells, HP_BAR_WIDTH, hpColor(char.hp))} ${String(char.hp).padStart(3)}/${MAX_HP}`,
  ];
  for (const skill of SKILLS) {
    const left = char.cooldownLeft(skill.name);
    const status = left === 0 ? `${GREEN}ready${RESET}` : `${left} turn${left > 1 ? "s" : ""}`;
    const pad = " ".repeat(COOLDOWN_BAR_WIDTH - skill.cooldown * COOLDOWN_CELL_WIDTH);
    lines.push(
      `  ${skill.name.padEnd(8)} ${bar(left * COOLDOWN_CELL_WIDTH, skill.cooldown * COOLDOWN_CELL_WIDTH, YELLOW)}${pad} ${status}`,
    );
  }
  // A wrapped line would shift the frame, so the action text is cut to the terminal width.
  const room = (process.stdout.columns ?? 120) - LAST_PREFIX_WIDTH;
  lines.push(`  ${DIM}last:${RESET}    ${f.lastAction.slice(0, room)}`);
  return lines;
}

/** Draws the battle panel, overwriting the previous frame at the same screen position. */
export class View {
  private drawnLines = 0;

  constructor() {
    process.stdout.write(HIDE_CURSOR);
    process.on("exit", () => process.stdout.write(SHOW_CURSOR));
    process.on("SIGINT", () => process.exit(130));
  }

  render(round: number, maxRounds: number, a: Fighter, b: Fighter, footer = ""): void {
    const lines = [
      `${BOLD}Round ${String(round).padStart(String(maxRounds).length)}/${maxRounds}${RESET}`,
      "",
      ...fighterLines(a),
      "",
      ...fighterLines(b),
      "",
      footer,
    ];
    const moveUp = this.drawnLines > 0 ? `${ESC}${this.drawnLines}A` : "";
    process.stdout.write(moveUp + lines.map((line) => `${CLEAR_LINE}${line}\n`).join(""));
    this.drawnLines = lines.length;
  }
}
