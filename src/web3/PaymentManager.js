const NexusWeb3Config = require('./NexusWeb3Config');

/**
 * Payment Manager for Nexus Platform
 * Handles utility bill payments and reward distribution
 */
class PaymentManager {
    constructor(web3Config) {
        this.web3 = web3Config;
        this.utilityPayment = null;
        this.nexusToken = null;
    }

    /**
     * Initialize payment manager
     */
    async init() {
        this.utilityPayment = this.web3.getContract('utilityPayment');
        this.nexusToken = this.web3.getContract('nexusToken');
    }

    /**
     * Create a new utility bill
     * @param {string} user - User address
     * @param {number} billType - Type of utility bill (0-7)
     * @param {string} provider - Service provider name
     * @param {string} amount - Bill amount in wei
     * @param {number} dueDate - Due date timestamp
     * @param {string} metadata - Additional bill information
     * @returns {Promise<Object>} Transaction result
     */
    async createBill(user, billType, provider, amount, dueDate, metadata) {
        try {
            const tx = await this.utilityPayment.createBill(
                user,
                billType,
                provider,
                amount,
                dueDate,
                metadata
            );
            const receipt = await tx.wait();
            
            // Extract bill ID from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.utilityPayment.interface.parseLog(log);
                    return parsed.name === 'BillCreated';
                } catch (e) {
                    return false;
                }
            });

            if (event) {
                const parsed = this.utilityPayment.interface.parseLog(event);
                return {
                    success: true,
                    billId: parsed.args.billId.toString(),
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
            console.error('Error creating bill:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pay a utility bill
     * @param {string} billId - Bill ID to pay
     * @param {string} amount - Payment amount in wei
     * @returns {Promise<Object>} Transaction result
     */
    async payBill(billId, amount) {
        try {
            const tx = await this.utilityPayment.payBill(billId, {
                value: amount
            });
            const receipt = await tx.wait();
            
            // Extract payment details from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.utilityPayment.interface.parseLog(log);
                    return parsed.name === 'PaymentMade';
                } catch (e) {
                    return false;
                }
            });

            let paymentDetails = {};
            if (event) {
                const parsed = this.utilityPayment.interface.parseLog(event);
                paymentDetails = {
                    paymentId: parsed.args.paymentId.toString(),
                    billId: parsed.args.billId.toString(),
                    user: parsed.args.user,
                    amount: parsed.args.amount.toString(),
                    rewardEarned: parsed.args.rewardEarned.toString()
                };
            }

            return {
                success: true,
                transactionHash: tx.hash,
                receipt,
                paymentDetails
            };
        } catch (error) {
            console.error('Error paying bill:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate reward for a payment
     * @param {string} billId - Bill ID
     * @returns {Promise<string>} Reward amount in wei
     */
    async calculateReward(billId) {
        try {
            const reward = await this.utilityPayment.calculateReward(billId);
            return reward.toString();
        } catch (error) {
            console.error('Error calculating reward:', error);
            return '0';
        }
    }

    /**
     * Get user's payment history
     * @param {string} user - User address
     * @returns {Promise<Object>} Payment history
     */
    async getPaymentHistory(user) {
        try {
            const history = await this.utilityPayment.getPaymentHistory(user);
            
            return {
                success: true,
                history: {
                    totalPayments: history.totalPayments.toString(),
                    onTimePayments: history.onTimePayments.toString(),
                    overduePayments: history.overduePayments.toString(),
                    totalRewardsEarned: history.totalRewardsEarned.toString(),
                    lastPaymentDate: history.lastPaymentDate.toString()
                }
            };
        } catch (error) {
            console.error('Error getting payment history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's bills
     * @param {string} user - User address
     * @returns {Promise<Object>} User bills
     */
    async getUserBills(user) {
        try {
            const billIds = await this.utilityPayment.getUserBills(user);
            
            return {
                success: true,
                billIds: billIds.map(id => id.toString())
            };
        } catch (error) {
            console.error('Error getting user bills:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's payments
     * @param {string} user - User address
     * @returns {Promise<Object>} User payments
     */
    async getUserPayments(user) {
        try {
            const paymentIds = await this.utilityPayment.getUserPayments(user);
            
            return {
                success: true,
                paymentIds: paymentIds.map(id => id.toString())
            };
        } catch (error) {
            console.error('Error getting user payments:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get bill details
     * @param {string} billId - Bill ID
     * @returns {Promise<Object>} Bill details
     */
    async getBill(billId) {
        try {
            const bill = await this.utilityPayment.getBill(billId);
            
            return {
                success: true,
                bill: {
                    billId: bill.billId.toString(),
                    user: bill.user,
                    billType: bill.billType,
                    provider: bill.provider,
                    amount: bill.amount.toString(),
                    dueDate: bill.dueDate.toString(),
                    createdAt: bill.createdAt.toString(),
                    isPaid: bill.isPaid,
                    isOverdue: bill.isOverdue,
                    metadata: bill.metadata
                }
            };
        } catch (error) {
            console.error('Error getting bill:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get payment details
     * @param {string} paymentId - Payment ID
     * @returns {Promise<Object>} Payment details
     */
    async getPayment(paymentId) {
        try {
            const payment = await this.utilityPayment.getPayment(paymentId);
            
            return {
                success: true,
                payment: {
                    paymentId: payment.paymentId.toString(),
                    billId: payment.billId.toString(),
                    user: payment.user,
                    amount: payment.amount.toString(),
                    paidAt: payment.paidAt.toString(),
                    status: payment.status,
                    transactionHash: payment.transactionHash,
                    rewardEarned: payment.rewardEarned.toString()
                }
            };
        } catch (error) {
            console.error('Error getting payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get NEX token balance
     * @param {string} address - User address
     * @returns {Promise<string>} Token balance
     */
    async getTokenBalance(address) {
        try {
            const balance = await this.nexusToken.balanceOf(address);
            return balance.toString();
        } catch (error) {
            console.error('Error getting token balance:', error);
            return '0';
        }
    }

    /**
     * Transfer NEX tokens
     * @param {string} to - Recipient address
     * @param {string} amount - Amount to transfer
     * @returns {Promise<Object>} Transaction result
     */
    async transferTokens(to, amount) {
        try {
            const tx = await this.nexusToken.transfer(to, amount);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error transferring tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark bill as overdue (provider only)
     * @param {string} billId - Bill ID
     * @returns {Promise<Object>} Transaction result
     */
    async markBillOverdue(billId) {
        try {
            const tx = await this.utilityPayment.markBillOverdue(billId);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error marking bill overdue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = PaymentManager;
