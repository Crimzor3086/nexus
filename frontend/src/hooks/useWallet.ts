import { useState, useEffect } from "react";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      selectedAddress?: string;
    };
  }
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum?.isMetaMask;
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setWalletState((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Please install MetaMask to continue.",
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = (await window.ethereum?.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        setWalletState({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      }
    } catch (error) {
      setWalletState({
        address: null,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = (await window.ethereum?.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          setWalletState({
            address: accounts[0],
            isConnected: true,
            isConnecting: false,
            error: null,
          });
        }
      } catch (error) {
        // Silently fail on initial check
        console.error("Error checking wallet connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet();
      } else {
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }));
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return {
    ...walletState,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    formatAddress,
  };
};

