const NexusWeb3Config = require('./NexusWeb3Config');
const ProfileManager = require('./ProfileManager');
const PaymentManager = require('./PaymentManager');
const ReputationManager = require('./ReputationManager');

/**
 * Main Nexus Platform SDK
 * Provides unified interface for all platform functionality
 */
class NexusSDK {
    constructor() {
        this.web3 = new NexusWeb3Config();
        this.profileManager = new ProfileManager(this.web3);
        this.paymentManager = new PaymentManager(this.web3);
        this.reputationManager = new ReputationManager(this.web3);
        this.isInitialized = false;
    }

    /**
     * Initialize the SDK
     * @param {Object} config - Configuration object
     * @param {string} config.ethereumRpcUrl - Ethereum RPC URL
     * @param {string} config.polkadotWsUrl - Polkadot WebSocket URL
     * @param {string} config.privateKey - Private key for signing
     * @param {Object} config.contractAddresses - Contract addresses
     */
    async init(config) {
        try {
            // Initialize Web3 configuration
            if (config.ethereumRpcUrl && config.privateKey) {
                await this.web3.initEthereum(config.ethereumRpcUrl, config.privateKey);
            }

            if (config.polkadotWsUrl) {
                await this.web3.initPolkadot(config.polkadotWsUrl);
            }

            // Load contracts
            if (config.contractAddresses) {
                await this.web3.loadContracts(config.contractAddresses);
            }

            // Initialize managers
            await this.profileManager.init();
            await this.paymentManager.init();
            await this.reputationManager.init();

            this.isInitialized = true;
            console.log('Nexus SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Nexus SDK:', error);
            throw error;
        }
    }

    /**
     * Get current user address
     * @returns {string} User address
     */
    getAddress() {
        return this.web3.getAddress();
    }

    /**
     * Get account balance
     * @returns {Promise<string>} Balance in ETH
     */
    async getBalance() {
        return await this.web3.getBalance();
    }

    /**
     * Check if user is verified
     * @param {string} address - User address (optional, defaults to current user)
     * @returns {Promise<boolean>} Verification status
     */
    async isVerified(address = null) {
        const userAddress = address || this.getAddress();
        return await this.profileManager.isVerified(userAddress);
    }

    /**
     * Create a complete user profile
     * @param {Object} profileData - Profile data
     * @param {string} profileData.name - User's display name
     * @param {string} profileData.email - User's email address
     * @param {string} profileData.documentHash - IPFS hash of verification document
     * @returns {Promise<Object>} Transaction result
     */
    async createProfile(profileData) {
        return await this.profileManager.createProfile(
            profileData.name,
            profileData.email,
            profileData.documentHash
        );
    }

    /**
     * Update user profile
     * @param {string} profileId - Profile ID
     * @param {Object} profileData - Updated profile data
     * @returns {Promise<Object>} Transaction result
     */
    async updateProfile(profileId, profileData) {
        return await this.profileManager.updateProfile(
            profileId,
            profileData.name,
            profileData.email
        );
    }

    /**
     * Upload verification document
     * @param {string} profileId - Profile ID
     * @param {string} documentType - Type of document
     * @param {string} documentHash - IPFS hash of document
     * @returns {Promise<Object>} Transaction result
     */
    async uploadDocument(profileId, documentType, documentHash) {
        return await this.profileManager.uploadDocument(profileId, documentType, documentHash);
    }

    /**
     * Get user profile
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} Profile data
     */
    async getProfile(address = null) {
        const userAddress = address || this.getAddress();
        return await this.profileManager.getProfileByAddress(userAddress);
    }

    /**
     * Create a utility bill
     * @param {Object} billData - Bill data
     * @param {string} billData.user - User address
     * @param {number} billData.billType - Type of utility bill (0-7)
     * @param {string} billData.provider - Service provider name
     * @param {string} billData.amount - Bill amount in wei
     * @param {number} billData.dueDate - Due date timestamp
     * @param {string} billData.metadata - Additional bill information
     * @returns {Promise<Object>} Transaction result
     */
    async createBill(billData) {
        return await this.paymentManager.createBill(
            billData.user,
            billData.billType,
            billData.provider,
            billData.amount,
            billData.dueDate,
            billData.metadata
        );
    }

    /**
     * Pay a utility bill
     * @param {string} billId - Bill ID to pay
     * @param {string} amount - Payment amount in wei
     * @returns {Promise<Object>} Transaction result
     */
    async payBill(billId, amount) {
        return await this.paymentManager.payBill(billId, amount);
    }

    /**
     * Calculate reward for a payment
     * @param {string} billId - Bill ID
     * @returns {Promise<string>} Reward amount in wei
     */
    async calculateReward(billId) {
        return await this.paymentManager.calculateReward(billId);
    }

    /**
     * Get payment history
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} Payment history
     */
    async getPaymentHistory(address = null) {
        const userAddress = address || this.getAddress();
        return await this.paymentManager.getPaymentHistory(userAddress);
    }

    /**
     * Get user bills
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} User bills
     */
    async getUserBills(address = null) {
        const userAddress = address || this.getAddress();
        return await this.paymentManager.getUserBills(userAddress);
    }

    /**
     * Get token balance
     * @param {string} address - User address (optional)
     * @returns {Promise<string>} Token balance
     */
    async getTokenBalance(address = null) {
        const userAddress = address || this.getAddress();
        return await this.paymentManager.getTokenBalance(userAddress);
    }

    /**
     * Transfer tokens
     * @param {string} to - Recipient address
     * @param {string} amount - Amount to transfer
     * @returns {Promise<Object>} Transaction result
     */
    async transferTokens(to, amount) {
        return await this.paymentManager.transferTokens(to, amount);
    }

    /**
     * Create a governance proposal
     * @param {Object} proposalData - Proposal data
     * @param {number} proposalData.proposalType - Type of proposal (0-6)
     * @param {string} proposalData.targetAddress - Address being voted on
     * @param {string} proposalData.description - Proposal description
     * @param {string} proposalData.metadata - Additional proposal data
     * @returns {Promise<Object>} Transaction result
     */
    async createProposal(proposalData) {
        return await this.reputationManager.createProposal(
            proposalData.proposalType,
            proposalData.targetAddress,
            proposalData.description,
            proposalData.metadata
        );
    }

    /**
     * Vote on a proposal
     * @param {string} proposalId - Proposal ID
     * @param {boolean} support - True for yes, false for no
     * @returns {Promise<Object>} Transaction result
     */
    async vote(proposalId, support) {
        return await this.reputationManager.vote(proposalId, support);
    }

    /**
     * Execute a proposal
     * @param {string} proposalId - Proposal ID
     * @returns {Promise<Object>} Transaction result
     */
    async executeProposal(proposalId) {
        return await this.reputationManager.executeProposal(proposalId);
    }

    /**
     * Update reputation metrics
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} Transaction result
     */
    async updateReputationMetrics(address = null) {
        const userAddress = address || this.getAddress();
        return await this.reputationManager.updateReputationMetrics(userAddress);
    }

    /**
     * Get reputation metrics
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} Reputation metrics
     */
    async getReputationMetrics(address = null) {
        const userAddress = address || this.getAddress();
        return await this.reputationManager.getReputationMetrics(userAddress);
    }

    /**
     * Get voting power
     * @param {string} address - User address (optional)
     * @returns {Promise<string>} Voting power
     */
    async getVotingPower(address = null) {
        const userAddress = address || this.getAddress();
        return await this.reputationManager.calculateVotingPower(userAddress);
    }

    /**
     * Stake as DAO
     * @param {string} amount - Amount to stake in wei
     * @returns {Promise<Object>} Transaction result
     */
    async stakeAsDAO(amount) {
        return await this.reputationManager.stakeAsDAO(amount);
    }

    /**
     * Unstake as DAO
     * @param {string} amount - Amount to unstake in wei
     * @returns {Promise<Object>} Transaction result
     */
    async unstakeAsDAO(amount) {
        return await this.reputationManager.unstakeAsDAO(amount);
    }

    /**
     * Get proposal details
     * @param {string} proposalId - Proposal ID
     * @returns {Promise<Object>} Proposal details
     */
    async getProposal(proposalId) {
        return await this.reputationManager.getProposal(proposalId);
    }

    /**
     * Check if user can create proposal
     * @param {string} address - User address (optional)
     * @returns {Promise<boolean>} Can create proposal
     */
    async canCreateProposal(address = null) {
        const userAddress = address || this.getAddress();
        return await this.reputationManager.canCreateProposal(userAddress);
    }

    /**
     * Get comprehensive user dashboard data
     * @param {string} address - User address (optional)
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboard(address = null) {
        const userAddress = address || this.getAddress();
        
        try {
            const [
                profile,
                paymentHistory,
                reputationMetrics,
                tokenBalance,
                userBills,
                userPayments,
                votingPower,
                isVerified
            ] = await Promise.all([
                this.getProfile(userAddress),
                this.getPaymentHistory(userAddress),
                this.getReputationMetrics(userAddress),
                this.getTokenBalance(userAddress),
                this.getUserBills(userAddress),
                this.paymentManager.getUserPayments(userAddress),
                this.getVotingPower(userAddress),
                this.isVerified(userAddress)
            ]);

            return {
                success: true,
                dashboard: {
                    address: userAddress,
                    profile,
                    paymentHistory,
                    reputationMetrics,
                    tokenBalance,
                    userBills,
                    userPayments,
                    votingPower,
                    isVerified,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            console.error('Error getting dashboard:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Disconnect from networks
     */
    async disconnect() {
        await this.web3.disconnect();
        this.isInitialized = false;
    }

    /**
     * Utility function to format wei to ether
     * @param {string} wei - Amount in wei
     * @returns {string} Amount in ether
     */
    formatEther(wei) {
        const { ethers } = require('ethers');
        return ethers.formatEther(wei);
    }

    /**
     * Utility function to format ether to wei
     * @param {string} ether - Amount in ether
     * @returns {string} Amount in wei
     */
    parseEther(ether) {
        const { ethers } = require('ethers');
        return ethers.parseEther(ether);
    }
}

module.exports = NexusSDK;
