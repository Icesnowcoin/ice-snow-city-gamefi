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
  return trpc.game.npc.getAll.useQuery();
}

export function useNPCDetails(npcId: number) {
  return trpc.game.npc.getDetails.useQuery({ npcId });
}

export function useNPCInteract() {
  return trpc.game.npc.interact.useMutation();
}

export function useUpdateNPCRelationship() {
  return trpc.game.npc.updateRelationship.useMutation();
}

// ─── Task Hooks ─────────────────────────────────────────────────────────────

export function useTaskList() {
  return trpc.game.task.getAll.useQuery();
}

export function usePlayerTasks() {
  return trpc.game.task.getPlayerTasks.useQuery();
}

export function useAcceptTask() {
  return trpc.game.task.acceptTask.useMutation();
}

export function useCompleteTask() {
  return trpc.game.task.completeTask.useMutation();
}

// ─── Shop Hooks ─────────────────────────────────────────────────────────────

export function useShopItems() {
  return trpc.game.shop.getItems.useQuery();
}

export function useSearchShopItems(query: string) {
  return trpc.game.shop.searchItems.useQuery({ query }, { enabled: query.length > 0 });
}

export function usePurchaseItem() {
  return trpc.game.shop.purchaseItem.useMutation();
}

// ─── Real Estate Hooks ──────────────────────────────────────────────────────

export function useProperties() {
  return trpc.game.realEstate.getProperties.useQuery();
}

export function usePlayerProperties() {
  return trpc.game.realEstate.getPlayerProperties.useQuery();
}

export function usePurchaseProperty() {
  return trpc.game.realEstate.purchaseProperty.useMutation();
}

export function useRentProperty() {
  return trpc.game.realEstate.rentProperty.useMutation();
}

// ─── Agriculture Hooks ──────────────────────────────────────────────────────

export function useFarms() {
  return trpc.game.agriculture.getFarms.useQuery();
}

export function usePlantCrop() {
  return trpc.game.agriculture.plantCrop.useMutation();
}

export function useHarvestCrop() {
  return trpc.game.agriculture.harvestCrop.useMutation();
}

export function useGetGrowthStatus(farmId: number) {
  return trpc.game.agriculture.getGrowthStatus.useQuery({ farmId });
}

// ─── Wallet Hooks ───────────────────────────────────────────────────────────

export function useWalletBalance() {
  return trpc.game.wallet.getBalance.useQuery();
}

export function useWalletTransactions() {
  return trpc.game.wallet.getTransactions.useQuery();
}

export function useDeposit() {
  return trpc.game.wallet.deposit.useMutation();
}

export function useWithdraw() {
  return trpc.game.wallet.withdraw.useMutation();
}

export function useTransfer() {
  return trpc.game.wallet.transfer.useMutation();
}

// ─── Banking Hooks ──────────────────────────────────────────────────────────

export function useBankingBalance() {
  return trpc.game.banking.getBalance.useQuery();
}

export function useBankDeposit() {
  return trpc.game.banking.deposit.useMutation();
}

export function useBankWithdraw() {
  return trpc.game.banking.withdraw.useMutation();
}

export function useClaimInterest() {
  return trpc.game.banking.claimInterest.useMutation();
}
