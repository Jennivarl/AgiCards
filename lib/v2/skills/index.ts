import type { TargetKey } from "../intent";
import type { AgentSkill } from "./types";
import { x402Skill } from "./x402";

// Registry of implemented agent skills. The swap skill (uniswap-v3) slots in
// here next — same rails, one new file.
const REGISTRY: Partial<Record<TargetKey, AgentSkill>> = {
  "x402": x402Skill
};

export function getSkill(key: TargetKey): AgentSkill {
  const skill = REGISTRY[key];
  if (!skill) throw new Error(`No agent skill implemented for "${key}" yet.`);
  return skill;
}

export type { AgentSkill, SkillCall, SkillInput } from "./types";
