const NexusWeb3Config = require('./NexusWeb3Config');

/**
 * Profile Manager for Nexus Platform
 * Handles profile creation, verification, and management
 */
class ProfileManager {
    constructor(web3Config) {
        this.web3 = web3Config;
        this.profileRegistry = null;
    }

    /**
     * Initialize profile manager
     */
    async init() {
        this.profileRegistry = this.web3.getContract('profileRegistry');
    }

    /**
     * Create a new profile
     * @param {string} name - User's display name
     * @param {string} email - User's email address
     * @param {string} documentHash - IPFS hash of verification document
     * @returns {Promise<Object>} Transaction result
     */
    async createProfile(name, email, documentHash) {
        try {
            const tx = await this.profileRegistry.createProfile(name, email, documentHash);
            const receipt = await tx.wait();
            
            // Extract profile ID from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.profileRegistry.interface.parseLog(log);
                    return parsed.name === 'ProfileCreated';
                } catch (e) {
                    return false;
                }
            });

            if (event) {
                const parsed = this.profileRegistry.interface.parseLog(event);
                return {
                    success: true,
                    profileId: parsed.args.profileId.toString(),
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
            console.error('Error creating profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update profile information
     * @param {string} profileId - Profile ID
     * @param {string} name - New name
     * @param {string} email - New email
     * @returns {Promise<Object>} Transaction result
     */
    async updateProfile(profileId, name, email) {
        try {
            const tx = await this.profileRegistry.updateProfile(profileId, name, email);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload verification document
     * @param {string} profileId - Profile ID
     * @param {string} documentType - Type of document
     * @param {string} documentHash - IPFS hash of document
     * @returns {Promise<Object>} Transaction result
     */
    async uploadDocument(profileId, documentType, documentHash) {
        try {
            const tx = await this.profileRegistry.uploadDocument(profileId, documentType, documentHash);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error uploading document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get profile by address
     * @param {string} address - User address
     * @returns {Promise<Object>} Profile data
     */
    async getProfileByAddress(address) {
        try {
            const profile = await this.profileRegistry.getProfileByAddress(address);
            
            return {
                success: true,
                profile: {
                    id: profile.id.toString(),
                    owner: profile.owner,
                    name: profile.name,
                    email: profile.email,
                    documentHash: profile.documentHash,
                    status: profile.status,
                    createdAt: profile.createdAt.toString(),
                    updatedAt: profile.updatedAt.toString(),
                    approvedBy: profile.approvedBy,
                    reputationScore: profile.reputationScore.toString(),
                    isActive: profile.isActive
                }
            };
        } catch (error) {
            console.error('Error getting profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get profile documents
     * @param {string} profileId - Profile ID
     * @returns {Promise<Object>} Profile documents
     */
    async getProfileDocuments(profileId) {
        try {
            const documents = await this.profileRegistry.getProfileDocuments(profileId);
            
            const formattedDocuments = documents.map(doc => ({
                documentType: doc.documentType,
                documentHash: doc.documentHash,
                uploadedAt: doc.uploadedAt.toString(),
                isVerified: doc.isVerified
            }));

            return {
                success: true,
                documents: formattedDocuments
            };
        } catch (error) {
            console.error('Error getting profile documents:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if address has verified profile
     * @param {string} address - User address
     * @returns {Promise<boolean>} Verification status
     */
    async isVerified(address) {
        try {
            const verified = await this.profileRegistry.isVerified(address);
            return verified;
        } catch (error) {
            console.error('Error checking verification status:', error);
            return false;
        }
    }

    /**
     * Approve profile (admin/DAO only)
     * @param {string} profileId - Profile ID to approve
     * @returns {Promise<Object>} Transaction result
     */
    async approveProfile(profileId) {
        try {
            const tx = await this.profileRegistry.approveProfile(profileId);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error approving profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reject profile (admin/DAO only)
     * @param {string} profileId - Profile ID to reject
     * @param {string} reason - Reason for rejection
     * @returns {Promise<Object>} Transaction result
     */
    async rejectProfile(profileId, reason) {
        try {
            const tx = await this.profileRegistry.rejectProfile(profileId, reason);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error rejecting profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ProfileManager;
