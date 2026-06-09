import type { TargetKey } from "../intent";
import type { AgentSkill } from "./types";
import { x402Skill } from "./x402";
import { uniswapV3Skill } from "./uniswapV3";

// Registry of implemented agent skills — same rails, one file each.
const REGISTRY: Partial<Record<TargetKey, AgentSkill>> = {
  "x402": x402Skill,
  "uniswap-v3": uniswapV3Skill
};

export function getSkill(key: TargetKey): AgentSkill {
  const skill = REGISTRY[key];
  if (!skill) throw new Error(`No agent skill implemented for "${key}" yet.`);
  return skill;
}

export type { AgentSkill, SkillCall, SkillInput } from "./types";
