export type HoldingMutation =
  | { kind: "upsert"; amount: string }
  | { kind: "delete"; amount: "0" };

export function resolveHoldingMutation(currentAmount: string | null | undefined, deltaAmount: string): HoldingMutation {
  const current = BigInt(currentAmount ?? "0");
  const delta = BigInt(deltaAmount);
  const next = current + delta;
  if (next < BigInt(0)) throw new Error("持仓增量会导致负数余额，拒绝写入");
  if (next === BigInt(0)) return { kind: "delete", amount: "0" };
  return { kind: "upsert", amount: next.toString() };
}
