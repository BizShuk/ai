// Mode names and the factory that turns one into a Strategy.

import { layaReplies } from "./laya.ts";
import { Lookahead, uniformReplies } from "./lookahead.ts";
import { RoundRobin, Sequence, type Strategy } from "./strategy.ts";

/** Selectable modes in menu order. */
export const MODES = ["laya", "sequence", "roundrobin", "lookahead"] as const;
export type Mode = (typeof MODES)[number];

export function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

export function newStrategy(mode: Mode, opts: { layaUrl: string; sequence: string }): Strategy {
  switch (mode) {
    case "laya":
      return new Lookahead("laya", layaReplies(opts.layaUrl));
    case "sequence":
      return new Sequence(opts.sequence);
    case "roundrobin":
      return new RoundRobin();
    case "lookahead":
      return new Lookahead("lookahead", uniformReplies);
  }
}
