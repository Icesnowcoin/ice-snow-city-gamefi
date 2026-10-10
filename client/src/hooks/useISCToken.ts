/**
 * Hook for ISC Token integration
 * Provides access to token balance, info, and cooldown status
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface TokenBalance {
  balance: string;
  address: string;
}

export interface CooldownInfo {
  remaining: number;
  address: string;
}

export function useISCTokenBalance(address?: string) {
  const query = trpc.game.token.getBalance.useQuery(
    { address },
    {
      enabled: true,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // Refetch every 60 seconds
    }
  );

  return {
    balance: query.data?.balance || "0",
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useISCTokenInfo() {
  const query = trpc.game.token.getTokenInfo.useQuery(undefined, {
    staleTime: 300000, // 5 minutes
  });

  return {
    tokenInfo: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useISCTokenCooldown(address?: string) {
  const query = trpc.game.token.getCooldownRemaining.useQuery(
    { address },
    {
      enabled: true,
      staleTime: 10000, // 10 seconds
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  return {
    remaining: query.data?.remaining || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useISCTokenContractAddress() {
  const query = trpc.game.token.getContractAddress.useQuery(undefined, {
    staleTime: Infinity, // Never stale
  });

  return {
    contractAddress: query.data?.contractAddress || "",
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useISCToken() {
  const [isReady, setIsReady] = useState(false);

  const balance = useISCTokenBalance();
  const tokenInfo = useISCTokenInfo();
  const cooldown = useISCTokenCooldown();
  const contractAddress = useISCTokenContractAddress();

  useEffect(() => {
    if (
      !balance.isLoading &&
      !tokenInfo.isLoading &&
      !cooldown.isLoading &&
      !contractAddress.isLoading
    ) {
      setIsReady(true);
    }
  }, [
    balance.isLoading,
    tokenInfo.isLoading,
    cooldown.isLoading,
    contractAddress.isLoading,
  ]);

  return {
    balance: balance.balance,
    tokenInfo: tokenInfo.tokenInfo,
    cooldown: cooldown.remaining,
    contractAddress: contractAddress.contractAddress,
    isReady,
    isLoading:
      balance.isLoading ||
      tokenInfo.isLoading ||
      cooldown.isLoading ||
      contractAddress.isLoading,
    error: balance.error || tokenInfo.error || cooldown.error || contractAddress.error,
    refetch: {
      balance: balance.refetch,
      cooldown: cooldown.refetch,
    },
  };
}
