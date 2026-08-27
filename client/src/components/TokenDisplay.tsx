/**
 * Token Display Component
 * Shows ISC token balance and related information
 */

import React from "react";
import { useISCToken } from "@/hooks/useISCToken";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ISCLogo } from "@/components/ISCLogo";

export interface TokenDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export function TokenDisplay({ className = "", showDetails = false }: TokenDisplayProps) {
  const { balance, tokenInfo, cooldown, contractAddress, isLoading, error } = useISCToken();

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load token information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Skeleton className="h-6 w-32" />
        {showDetails && <Skeleton className="h-4 w-48" />}
      </div>
    );
  }

  const balanceNum = parseFloat(balance);
  const formattedBalance = balanceNum.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <ISCLogo size="md" className="drop-shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
        <span className="text-lg font-semibold">
          {formattedBalance} {tokenInfo?.symbol || "ISC"}
        </span>
      </div>

      {showDetails && (
        <div className="text-sm text-gray-400 space-y-1">
          {tokenInfo && (
            <>
              <div>Token: {tokenInfo.name}</div>
              <div>Total Supply: {tokenInfo.totalSupply}</div>
            </>
          )}
          {cooldown > 0 && (
            <div className="text-yellow-500">
              Cooldown remaining: {Math.ceil(cooldown / 1000)}s
            </div>
          )}
          {contractAddress && (
            <div className="text-xs font-mono">
              Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TokenDisplay;
