const NexusWeb3Config = require('./NexusWeb3Config');

/**
 * Reputation Manager for Nexus Platform
 * Handles reputation scoring and DAO governance
 */
class ReputationManager {
    constructor(web3Config) {
        this.web3 = web3Config;
        this.reputationSystem = null;
    }

    /**
     * Initialize reputation manager
     */
    async init() {
        this.reputationSystem = this.web3.getContract('reputationSystem');
    }

    /**
     * Create a new proposal
     * @param {number} proposalType - Type of proposal (0-6)
     * @param {string} targetAddress - Address being voted on (if applicable)
     * @param {string} description - Proposal description
     * @param {string} metadata - Additional proposal data
     * @returns {Promise<Object>} Transaction result
     */
    async createProposal(proposalType, targetAddress, description, metadata) {
        try {
            const tx = await this.reputationSystem.createProposal(
                proposalType,
                targetAddress,
                description,
                metadata
            );
            const receipt = await tx.wait();
            
            // Extract proposal ID from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.reputationSystem.interface.parseLog(log);
                    return parsed.name === 'ProposalCreated';
                } catch (e) {
                    return false;
                }
            });

            if (event) {
                const parsed = this.reputationSystem.interface.parseLog(event);
                return {
                    success: true,
                    proposalId: parsed.args.proposalId.toString(),
                    transactionHash: tx.hash,
                    receipt
                };
            }

            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error creating proposal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Vote on a proposal
     * @param {string} proposalId - Proposal ID
     * @param {boolean} support - True for yes, false for no
     * @returns {Promise<Object>} Transaction result
     */
    async vote(proposalId, support) {
        try {
            const tx = await this.reputationSystem.vote(proposalId, support);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error voting on proposal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute a proposal
     * @param {string} proposalId - Proposal ID
     * @returns {Promise<Object>} Transaction result
     */
    async executeProposal(proposalId) {
        try {
            const tx = await this.reputationSystem.executeProposal(proposalId);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error executing proposal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update user reputation metrics
     * @param {string} user - User address
     * @returns {Promise<Object>} Transaction result
     */
    async updateReputationMetrics(user) {
        try {
            const tx = await this.reputationSystem.updateReputationMetrics(user);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error updating reputation metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate voting power for a user
     * @param {string} user - User address
     * @returns {Promise<string>} Voting power
     */
    async calculateVotingPower(user) {
        try {
            const power = await this.reputationSystem.calculateVotingPower(user);
            return power.toString();
        } catch (error) {
            console.error('Error calculating voting power:', error);
            return '0';
        }
    }

    /**
     * Get user's reputation metrics
     * @param {string} user - User address
     * @returns {Promise<Object>} Reputation metrics
     */
    async getReputationMetrics(user) {
        try {
            const metrics = await this.reputationSystem.getReputationMetrics(user);
            
            return {
                success: true,
                metrics: {
                    profileScore: metrics.profileScore.toString(),
                    paymentScore: metrics.paymentScore.toString(),
                    communityScore: metrics.communityScore.toString(),
                    totalScore: metrics.totalScore.toString(),
                    lastUpdated: metrics.lastUpdated.toString(),
                    level: metrics.level.toString()
                }
            };
        } catch (error) {
            console.error('Error getting reputation metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get proposal details
     * @param {string} proposalId - Proposal ID
     * @returns {Promise<Object>} Proposal details
     */
    async getProposal(proposalId) {
        try {
            const proposal = await this.reputationSystem.getProposal(proposalId);
            
            return {
                success: true,
                proposal: {
                    id: proposal.id.toString(),
                    proposalType: proposal.proposalType,
                    proposer: proposal.proposer,
                    targetAddress: proposal.targetAddress,
                    description: proposal.description,
                    metadata: proposal.metadata,
                    votesFor: proposal.votesFor.toString(),
                    votesAgainst: proposal.votesAgainst.toString(),
                    startTime: proposal.startTime.toString(),
                    endTime: proposal.endTime.toString(),
                    status: proposal.status,
                    executed: proposal.executed
                }
            };
        } catch (error) {
            console.error('Error getting proposal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stake tokens as DAO for increased voting power
     * @param {string} amount - Amount to stake in wei
     * @returns {Promise<Object>} Transaction result
     */
    async stakeAsDAO(amount) {
        try {
            const tx = await this.reputationSystem.stakeAsDAO(amount, {
                value: amount
            });
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error staking as DAO:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Unstake tokens as DAO
     * @param {string} amount - Amount to unstake in wei
     * @returns {Promise<Object>} Transaction result
     */
    async unstakeAsDAO(amount) {
        try {
            const tx = await this.reputationSystem.unstakeAsDAO(amount);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error unstaking as DAO:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get total stake in the system
     * @returns {Promise<string>} Total stake amount
     */
    async getTotalStake() {
        try {
            const totalStake = await this.reputationSystem.getTotalStake();
            return totalStake.toString();
        } catch (error) {
            console.error('Error getting total stake:', error);
            return '0';
        }
    }

    /**
     * Get total proposals count
     * @returns {Promise<string>} Total proposal count
     */
    async getTotalProposals() {
        try {
            const totalProposals = await this.reputationSystem.getTotalProposals();
            return totalProposals.toString();
        } catch (error) {
            console.error('Error getting total proposals:', error);
            return '0';
        }
    }

    /**
     * Check if user can create proposal
     * @param {string} user - User address
     * @returns {Promise<boolean>} Can create proposal
     */
    async canCreateProposal(user) {
        try {
            const metrics = await this.getReputationMetrics(user);
            if (!metrics.success) return false;
            
            const minThreshold = await this.reputationSystem.MIN_PROPOSAL_THRESHOLD();
            return parseInt(metrics.metrics.totalScore) >= parseInt(minThreshold.toString());
        } catch (error) {
            console.error('Error checking proposal creation eligibility:', error);
            return false;
        }
    }

    /**
     * Get proposal status text
     * @param {number} status - Proposal status enum
     * @returns {string} Status text
     */
    getProposalStatusText(status) {
        const statusMap = {
            0: 'Active',
            1: 'Executed',
            2: 'Rejected',
            3: 'Expired'
        };
        return statusMap[status] || 'Unknown';
    }

    /**
     * Get proposal type text
     * @param {number} type - Proposal type enum
     * @returns {string} Type text
     */
    getProposalTypeText(type) {
        const typeMap = {
            0: 'Profile Approval',
            1: 'Profile Suspension',
            2: 'Admin Addition',
            3: 'Admin Removal',
            4: 'DAO Addition',
            5: 'DAO Removal',
            6: 'Parameter Update'
        };
        return typeMap[type] || 'Unknown';
    }
}

module.exports = ReputationManager;
