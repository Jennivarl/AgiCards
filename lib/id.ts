import { keccak256, stringToHex } from "viem";

export function makeId(prefix: string, input: string) {
  return `${prefix}_${keccak256(stringToHex(`${prefix}:${input}:${Date.now()}`)).slice(2, 10)}`;
}

export function makeRoot(input: unknown) {
  return keccak256(stringToHex(JSON.stringify(input)));
}

export function shortHash(value: string) {
  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

