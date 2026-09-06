import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type NetworkMode = "testnet" | "mainnet";

const STORAGE_KEY = "isc-network-mode";

type NetworkModeContextValue = {
  mode: NetworkMode;
  isMainnetReadOnly: boolean;
  setMode: (mode: NetworkMode) => void;
};

const NetworkModeContext = createContext<NetworkModeContextValue | null>(null);

export function NetworkModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<NetworkMode>("testnet");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "mainnet") setModeState("mainnet");
    } catch {
      // Keep the safe testnet default when storage is unavailable.
    }
  }, []);

  const setMode = (nextMode: NetworkMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // Non-persistent mode remains safe and functional.
    }
  };

  const value = useMemo(() => ({ mode, isMainnetReadOnly: mode === "mainnet", setMode }), [mode]);
  return <NetworkModeContext.Provider value={value}>{children}</NetworkModeContext.Provider>;
}

const SAFE_FALLBACK: NetworkModeContextValue = { mode: "testnet", isMainnetReadOnly: false, setMode: () => {} };

export function useNetworkMode() {
  return useContext(NetworkModeContext) ?? SAFE_FALLBACK;
}

export const networkModeStorageKey = STORAGE_KEY;
