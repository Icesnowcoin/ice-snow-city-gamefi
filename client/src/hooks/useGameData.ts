/**
 * Game Data Hooks
 * Custom hooks for accessing game data via tRPC
 */

import { trpc } from "@/lib/trpc";

// ─── Player Hooks ───────────────────────────────────────────────────────────

export function usePlayerProfile() {
  return trpc.game.player.getProfile.useQuery();
}

export function usePlayerAssets() {
  return trpc.game.player.getAssets.useQuery();
}

export function useUpdateProfile() {
  return trpc.game.player.updateProfile.useMutation();
}

export function useAddExperience() {
  return trpc.game.player.addExperience.useMutation();
}

// ─── NPC Hooks ──────────────────────────────────────────────────────────────

export function useNPCList() {
  return trpc.game.core.getState.useQuery();
}

export function useNPCDetails(npcId: number) {
  return trpc.game.core.getState.useQuery();
}

export function useNPCInteract() {
  return trpc.game.core.interactWithNPC.useMutation();
}

export function useUpdateNPCRelationship() {
  return trpc.game.core.interactWithNPC.useMutation();
}

// ─── Task Hooks ─────────────────────────────────────────────────────────────

export function useTaskList() {
  return trpc.game.core.getState.useQuery();
}

export function usePlayerTasks() {
  return trpc.game.core.getState.useQuery();
}

export function useAcceptTask() {
  return trpc.game.core.acceptTask.useMutation();
}

export function useCompleteTask() {
  return trpc.game.core.completeTask.useMutation();
}

// ─── Shop Hooks ─────────────────────────────────────────────────────────────

export function useShopItems() {
  return trpc.game.core.getState.useQuery();
}

export function useSearchShopItems(query: string) {
  return trpc.game.core.getState.useQuery();
}

export function usePurchaseItem() {
  return trpc.game.core.getState.useQuery();
}

// ─── Real Estate Hooks ──────────────────────────────────────────────────────

export function useProperties() {
  return trpc.game.core.getState.useQuery();
}

export function usePlayerProperties() {
  return trpc.game.core.getState.useQuery();
}

export function usePurchaseProperty() {
  return trpc.game.core.getState.useQuery();
}

export function useRentProperty() {
  return trpc.game.core.getState.useQuery();
}

// ─── Agriculture Hooks ──────────────────────────────────────────────────────

export function useFarms() {
  return trpc.game.core.getState.useQuery();
}

export function usePlantCrop() {
  return trpc.game.core.getState.useQuery();
}

export function useHarvestCrop() {
  return trpc.game.core.getState.useQuery();
}

export function useGetGrowthStatus(farmId: number) {
  return trpc.game.core.getState.useQuery();
}

// ─── Wallet Hooks ───────────────────────────────────────────────────────────

export function useWalletBalance() {
  return trpc.game.core.getWalletBalance.useQuery();
}

export function useWalletTransactions() {
  return trpc.game.core.getState.useQuery();
}

export function useDeposit() {
  return trpc.game.core.bankDeposit.useMutation();
}

export function useWithdraw() {
  return trpc.game.core.bankWithdraw.useMutation();
}

export function useTransfer() {
  return trpc.game.core.bankDeposit.useMutation();
}

// ─── Banking Hooks ──────────────────────────────────────────────────────────

export function useBankingBalance() {
  return trpc.game.core.getWalletBalance.useQuery();
}

export function useBankDeposit() {
  return trpc.game.core.bankDeposit.useMutation();
}

export function useBankWithdraw() {
  return trpc.game.core.bankWithdraw.useMutation();
}

export function useClaimInterest() {
  return trpc.game.core.claimInterest.useMutation();
}
