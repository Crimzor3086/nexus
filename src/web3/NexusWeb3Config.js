const { ethers } = require('ethers');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

/**
 * Web3 Configuration for Nexus Platform
 * Supports both Ethereum-compatible networks and Polkadot/Substrate
 */
class NexusWeb3Config {
    constructor() {
        this.ethereumProvider = null;
        this.polkadotApi = null;
        this.keyring = null;
        this.contracts = {};
        this.isConnected = false;
    }

    /**
     * Initialize Ethereum provider
     * @param {string} rpcUrl - RPC URL for Ethereum network
     * @param {string} privateKey - Private key for signing transactions
     */
    async initEthereum(rpcUrl, privateKey) {
        try {
            this.ethereumProvider = new ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers.Wallet(privateKey, this.ethereumProvider);
            this.isConnected = true;
            console.log('Ethereum provider initialized');
        } catch (error) {
            console.error('Failed to initialize Ethereum provider:', error);
            throw error;
        }
    }

    /**
     * Initialize Polkadot API
     * @param {string} wsUrl - WebSocket URL for Polkadot network
     */
    async initPolkadot(wsUrl) {
        try {
            const provider = new WsProvider(wsUrl);
            this.polkadotApi = await ApiPromise.create({ provider });
            this.keyring = new Keyring({ type: 'sr25519' });
            console.log('Polkadot API initialized');
        } catch (error) {
            console.error('Failed to initialize Polkadot API:', error);
            throw error;
        }
    }

    /**
     * Load contract instances
     * @param {Object} contractAddresses - Contract addresses
     */
    async loadContracts(contractAddresses) {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum provider not initialized');
        }

        try {
            // Load ProfileRegistry contract
            if (contractAddresses.profileRegistry) {
                const profileRegistryABI = require('../artifacts/contracts/ProfileRegistry.sol/ProfileRegistry.json');
                this.contracts.profileRegistry = new ethers.Contract(
                    contractAddresses.profileRegistry,
                    profileRegistryABI.abi,
                    this.wallet
                );
            }

            // Load UtilityPayment contract
            if (contractAddresses.utilityPayment) {
                const utilityPaymentABI = require('../artifacts/contracts/UtilityPayment.sol/UtilityPayment.json');
                this.contracts.utilityPayment = new ethers.Contract(
                    contractAddresses.utilityPayment,
                    utilityPaymentABI.abi,
                    this.wallet
                );
            }

            // Load ReputationSystem contract
            if (contractAddresses.reputationSystem) {
                const reputationSystemABI = require('../artifacts/contracts/ReputationSystem.sol/ReputationSystem.json');
                this.contracts.reputationSystem = new ethers.Contract(
                    contractAddresses.reputationSystem,
                    reputationSystemABI.abi,
                    this.wallet
                );
            }

            // Load NexusToken contract
            if (contractAddresses.nexusToken) {
                const nexusTokenABI = require('../artifacts/contracts/NexusToken.sol/NexusToken.json');
                this.contracts.nexusToken = new ethers.Contract(
                    contractAddresses.nexusToken,
                    nexusTokenABI.abi,
                    this.wallet
                );
            }

            console.log('Contracts loaded successfully');
        } catch (error) {
            console.error('Failed to load contracts:', error);
            throw error;
        }
    }

    /**
     * Get contract instance
     * @param {string} contractName - Name of the contract
     * @returns {ethers.Contract} Contract instance
     */
    getContract(contractName) {
        if (!this.contracts[contractName]) {
            throw new Error(`Contract ${contractName} not loaded`);
        }
        return this.contracts[contractName];
    }

    /**
     * Get current account address
     * @returns {string} Account address
     */
    getAddress() {
        if (!this.wallet) {
            throw new Error('Wallet not initialized');
        }
        return this.wallet.address;
    }

    /**
     * Get account balance
     * @returns {Promise<string>} Account balance in ETH
     */
    async getBalance() {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum provider not initialized');
        }
        const balance = await this.ethereumProvider.getBalance(this.getAddress());
        return ethers.formatEther(balance);
    }

    /**
     * Wait for transaction confirmation
     * @param {string} txHash - Transaction hash
     * @param {number} confirmations - Number of confirmations to wait for
     * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
     */
    async waitForTransaction(txHash, confirmations = 1) {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum provider not initialized');
        }
        return await this.ethereumProvider.waitForTransaction(txHash, confirmations);
    }

    /**
     * Estimate gas for a transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<bigint>} Estimated gas
     */
    async estimateGas(transaction) {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum provider not initialized');
        }
        return await this.ethereumProvider.estimateGas(transaction);
    }

    /**
     * Get current gas price
     * @returns {Promise<bigint>} Gas price
     */
    async getGasPrice() {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum provider not initialized');
        }
        return await this.ethereumProvider.getGasPrice();
    }

    /**
     * Disconnect from networks
     */
    async disconnect() {
        if (this.polkadotApi) {
            await this.polkadotApi.disconnect();
            this.polkadotApi = null;
        }
        this.ethereumProvider = null;
        this.wallet = null;
        this.contracts = {};
        this.isConnected = false;
        console.log('Disconnected from networks');
    }
}

module.exports = NexusWeb3Config;
