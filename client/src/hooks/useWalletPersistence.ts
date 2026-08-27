import { useEffect, useCallback } from 'react';

export interface WalletConnectionState {
  address: string;
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'ledger' | 'trezor';
  chainId: number;
  connectedAt: string;
}

const WALLET_STORAGE_KEY = 'ice_snow_city_wallet_connection';
const WALLET_EXPIRY_KEY = 'ice_snow_city_wallet_expiry';
const WALLET_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hook for managing wallet connection persistence
 * Automatically saves and retrieves wallet connection state from localStorage
 */
export const useWalletPersistence = () => {
  /**
   * Save wallet connection state to localStorage
   */
  const saveWalletConnection = useCallback(
    (state: WalletConnectionState) => {
      try {
        const expiryTime = new Date().getTime() + WALLET_EXPIRY_TIME;
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(WALLET_EXPIRY_KEY, expiryTime.toString());
        console.log('[WalletPersistence] Wallet connection saved:', state.address);
      } catch (error) {
        console.error('[WalletPersistence] Failed to save wallet connection:', error);
      }
    },
    []
  );

  /**
   * Retrieve wallet connection state from localStorage
   */
  const getWalletConnection = useCallback((): WalletConnectionState | null => {
    try {
      const storedState = localStorage.getItem(WALLET_STORAGE_KEY);
      const expiryTime = localStorage.getItem(WALLET_EXPIRY_KEY);

      if (!storedState || !expiryTime) {
        return null;
      }

      // Check if connection has expired
      if (new Date().getTime() > parseInt(expiryTime)) {
        clearWalletConnection();
        console.log('[WalletPersistence] Wallet connection expired');
        return null;
      }

      const state = JSON.parse(storedState) as WalletConnectionState;
      console.log('[WalletPersistence] Wallet connection retrieved:', state.address);
      return state;
    } catch (error) {
      console.error('[WalletPersistence] Failed to retrieve wallet connection:', error);
      return null;
    }
  }, []);

  /**
   * Clear wallet connection state from localStorage
   */
  const clearWalletConnection = useCallback(() => {
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      localStorage.removeItem(WALLET_EXPIRY_KEY);
      console.log('[WalletPersistence] Wallet connection cleared');
    } catch (error) {
      console.error('[WalletPersistence] Failed to clear wallet connection:', error);
    }
  }, []);

  /**
   * Update wallet connection expiry time (extends the session)
   */
  const extendWalletConnection = useCallback(() => {
    try {
      const storedState = localStorage.getItem(WALLET_STORAGE_KEY);
      if (storedState) {
        const expiryTime = new Date().getTime() + WALLET_EXPIRY_TIME;
        localStorage.setItem(WALLET_EXPIRY_KEY, expiryTime.toString());
        console.log('[WalletPersistence] Wallet connection extended');
      }
    } catch (error) {
      console.error('[WalletPersistence] Failed to extend wallet connection:', error);
    }
  }, []);

  /**
   * Check if wallet connection is still valid
   */
  const isWalletConnectionValid = useCallback((): boolean => {
    try {
      const expiryTime = localStorage.getItem(WALLET_EXPIRY_KEY);
      if (!expiryTime) {
        return false;
      }
      return new Date().getTime() <= parseInt(expiryTime);
    } catch (error) {
      console.error('[WalletPersistence] Failed to check wallet connection validity:', error);
      return false;
    }
  }, []);

  /**
   * Get remaining time for wallet connection (in milliseconds)
   */
  const getWalletConnectionRemainingTime = useCallback((): number => {
    try {
      const expiryTime = localStorage.getItem(WALLET_EXPIRY_KEY);
      if (!expiryTime) {
        return 0;
      }
      const remaining = parseInt(expiryTime) - new Date().getTime();
      return Math.max(0, remaining);
    } catch (error) {
      console.error('[WalletPersistence] Failed to get remaining time:', error);
      return 0;
    }
  }, []);

  return {
    saveWalletConnection,
    getWalletConnection,
    clearWalletConnection,
    extendWalletConnection,
    isWalletConnectionValid,
    getWalletConnectionRemainingTime,
  };
};

export default useWalletPersistence;
