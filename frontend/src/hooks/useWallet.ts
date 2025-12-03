import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: string | null;
  networkName: string | null;
  balance: string | null;
}

interface MetaMaskProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  networkVersion?: string;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

// Common chain IDs
const CHAIN_NAMES: Record<string, string> = {
  "0x1": "Ethereum Mainnet",
  "0x5": "Goerli",
  "0x89": "Polygon",
  "0x13881": "Mumbai",
  "0xa": "Optimism",
  "0xa4b1": "Arbitrum One",
  "0x2105": "Base",
  "0x38": "BSC",
  "0x61": "BSC Testnet",
};

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
    networkName: null,
    balance: null,
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== "undefined" && window.ethereum?.isMetaMask;
  }, []);

  // Get network name from chain ID
  const getNetworkName = useCallback((chainId: string | null): string | null => {
    if (!chainId) return null;
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
  }, []);

  // Get current chain ID
  const getChainId = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) return null;
    try {
      const chainId = (await window.ethereum?.request({
        method: "eth_chainId",
      })) as string;
      return chainId || null;
    } catch (error) {
      console.error("Error getting chain ID:", error);
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Format address for display
  const formatAddress = useCallback((address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Update chain info
  const updateChainInfo = useCallback(async () => {
    const chainId = await getChainId();
    const networkName = getNetworkName(chainId);
    setWalletState((prev) => ({
      ...prev,
      chainId,
      networkName,
    }));
  }, [getChainId, getNetworkName]);

  // Get balance for an address
  const updateBalance = useCallback(
    async (address: string | null) => {
      if (!isMetaMaskInstalled() || !address) {
        setWalletState((prev) => ({
          ...prev,
          balance: null,
        }));
        return;
      }

      try {
        const balanceHex = (await window.ethereum?.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        })) as string;

        if (!balanceHex) {
          setWalletState((prev) => ({
            ...prev,
            balance: null,
          }));
          return;
        }

        // Convert hex string balance (wei) to ETH string with 4 decimals
        const wei = BigInt(balanceHex);
        const eth = Number(wei) / 1e18;

        setWalletState((prev) => ({
          ...prev,
          balance: eth.toFixed(4),
        }));
      } catch (error) {
        console.error("Error getting balance:", error);
        setWalletState((prev) => ({
          ...prev,
          balance: null,
        }));
      }
    },
    [isMetaMaskInstalled],
  );

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      const errorMsg = "MetaMask is not installed. Please install MetaMask to continue.";
      setWalletState((prev) => ({
        ...prev,
        error: errorMsg,
      }));
      toast.error("MetaMask Not Found", {
        description: "Please install MetaMask extension to connect your wallet.",
        action: {
          label: "Install MetaMask",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = (await window.ethereum?.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const chainId = await getChainId();
        const networkName = getNetworkName(chainId);

        setWalletState({
          address,
          isConnected: true,
          isConnecting: false,
          error: null,
          chainId,
          networkName,
          balance: null,
        });

        // Fetch balance separately so UI updates when it arrives
        updateBalance(address);

        toast.success("Wallet Connected", {
          description: `Connected to ${formatAddress(address)}`,
        });
      } else {
        throw new Error("No accounts found");
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to connect wallet";
      
      if (error && typeof error === "object" && "code" in error) {
        const code = error.code;
        if (code === 4001) {
          errorMessage = "Connection rejected. Please approve the connection request.";
          toast.error("Connection Rejected", {
            description: "You rejected the connection request.",
          });
        } else if (code === -32002) {
          errorMessage = "Connection request already pending. Please check MetaMask.";
          toast.warning("Request Pending", {
            description: "A connection request is already pending. Please check MetaMask.",
          });
        } else {
          errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
          toast.error("Connection Failed", {
            description: errorMessage,
          });
        }
      } else {
        toast.error("Connection Failed", {
          description: errorMessage,
        });
      }

      setWalletState({
        address: null,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
        chainId: null,
        networkName: null,
        balance: null,
      });
    }
  }, [isMetaMaskInstalled, getChainId, getNetworkName, formatAddress, updateBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    const address = walletState.address;
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
      networkName: null,
      balance: null,
    });
    
    if (address) {
      toast.info("Wallet Disconnected", {
        description: `Disconnected from ${formatAddress(address)}`,
      });
    }
  }, [walletState.address, formatAddress]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = (await window.ethereum?.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          const chainId = await getChainId();
          const networkName = getNetworkName(chainId);
          
          setWalletState({
            address: accounts[0],
            isConnected: true,
            isConnecting: false,
            error: null,
            chainId,
            networkName,
            balance: null,
          });

          updateBalance(accounts[0]);
        }
      } catch (error) {
        // Silently fail on initial check
        console.error("Error checking wallet connection:", error);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled, getChainId, getNetworkName]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet();
        toast.info("Account Disconnected", {
          description: "Your account has been disconnected.",
        });
      } else {
        const chainId = await getChainId();
        const networkName = getNetworkName(chainId);
        
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          chainId,
          networkName,
        }));

        toast.info("Account Changed", {
          description: `Switched to ${formatAddress(accounts[0])}`,
        });

        updateBalance(accounts[0]);
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [isMetaMaskInstalled, getChainId, getNetworkName, formatAddress, disconnectWallet]);

  // Listen for chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleChainChanged = async (chainId: string) => {
      const networkName = getNetworkName(chainId);
      
      setWalletState((prev) => ({
        ...prev,
        chainId,
        networkName,
      }));

       // Refresh balance on network change if we have an address
      if (walletState.address) {
        updateBalance(walletState.address);
      }

      toast.info("Network Changed", {
        description: `Switched to ${networkName || `Chain ${chainId}`}`,
      });
    };

    window.ethereum?.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, getNetworkName]);

  // Update chain info when connected
  useEffect(() => {
    if (walletState.isConnected) {
      updateChainInfo();
      updateBalance(walletState.address);
    }
  }, [walletState.isConnected, walletState.address, updateChainInfo, updateBalance]);

  return {
    ...walletState,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    formatAddress,
    updateChainInfo,
    updateBalance,
  };
};

