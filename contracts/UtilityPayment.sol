// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ProfileRegistry.sol";

/**
 * @title UtilityPayment
 * @dev Handles utility bill payments and reward distribution for timely payments
 * @notice Users can pay utility bills and earn rewards for maintaining good payment history
 */
contract UtilityPayment is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _paymentIds;
    Counters.Counter private _billIds;
    
    ProfileRegistry public profileRegistry;
    IERC20 public nexusToken; // Reward token
    
    enum PaymentStatus {
        Pending,
        Completed,
        Failed,
        Refunded
    }
    
    enum BillType {
        Electricity,
        Water,
        Gas,
        Internet,
        Phone,
        Rent,
        Insurance,
        Other
    }
    
    struct UtilityBill {
        uint256 billId;
        address user;
        BillType billType;
        string provider;
        uint256 amount;
        uint256 dueDate;
        uint256 createdAt;
        bool isPaid;
        bool isOverdue;
        string metadata; // Additional bill information
    }
    
    struct Payment {
        uint256 paymentId;
        uint256 billId;
        address user;
        uint256 amount;
        uint256 paidAt;
        PaymentStatus status;
        string transactionHash;
        uint256 rewardEarned;
    }
    
    struct PaymentHistory {
        uint256 totalPayments;
        uint256 onTimePayments;
        uint256 overduePayments;
        uint256 totalRewardsEarned;
        uint256 lastPaymentDate;
    }
    
    mapping(uint256 => UtilityBill) public bills;
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userBills;
    mapping(address => uint256[]) public userPayments;
    mapping(address => PaymentHistory) public paymentHistories;
    mapping(address => bool) public authorizedProviders;
    
    // Reward configuration
    uint256 public onTimeRewardRate = 5; // 5% of bill amount
    uint256 public earlyPaymentBonus = 2; // Additional 2% for payments 7+ days early
    uint256 public constant EARLY_PAYMENT_THRESHOLD = 7 days;
    uint256 public constant OVERDUE_PENALTY_DAYS = 30 days;
    
    // Fee configuration
    uint256 public platformFeeRate = 1; // 1% platform fee
    address public feeRecipient;
    
    event BillCreated(uint256 indexed billId, address indexed user, BillType billType, uint256 amount, uint256 dueDate);
    event PaymentMade(uint256 indexed paymentId, uint256 indexed billId, address indexed user, uint256 amount, uint256 rewardEarned);
    event RewardDistributed(address indexed user, uint256 amount);
    event ProviderAuthorized(address indexed provider);
    event ProviderDeauthorized(address indexed provider);
    event RewardRateUpdated(uint256 newRate);
    event PlatformFeeUpdated(uint256 newFeeRate);
    
    modifier onlyAuthorizedProvider() {
        require(authorizedProviders[msg.sender] || msg.sender == owner(), "Not authorized provider");
        _;
    }
    
    modifier billExists(uint256 _billId) {
        require(_billId > 0 && _billId <= _billIds.current(), "Bill does not exist");
        _;
    }
    
    modifier paymentExists(uint256 _paymentId) {
        require(_paymentId > 0 && _paymentId <= _paymentIds.current(), "Payment does not exist");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(profileRegistry.isVerified(msg.sender), "User not verified");
        _;
    }
    
    constructor(
        address _profileRegistry,
        address _nexusToken,
        address _feeRecipient
    ) {
        profileRegistry = ProfileRegistry(_profileRegistry);
        nexusToken = IERC20(_nexusToken);
        feeRecipient = _feeRecipient;
        authorizedProviders[msg.sender] = true;
    }
    
    /**
     * @dev Create a new utility bill
     * @param _user User address
     * @param _billType Type of utility bill
     * @param _provider Service provider name
     * @param _amount Bill amount
     * @param _dueDate Due date timestamp
     * @param _metadata Additional bill information
     */
    function createBill(
        address _user,
        BillType _billType,
        string memory _provider,
        uint256 _amount,
        uint256 _dueDate,
        string memory _metadata
    ) external onlyAuthorizedProvider returns (uint256) {
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_dueDate > block.timestamp, "Due date must be in the future");
        require(bytes(_provider).length > 0, "Provider name cannot be empty");
        
        _billIds.increment();
        uint256 newBillId = _billIds.current();
        
        bills[newBillId] = UtilityBill({
            billId: newBillId,
            user: _user,
            billType: _billType,
            provider: _provider,
            amount: _amount,
            dueDate: _dueDate,
            createdAt: block.timestamp,
            isPaid: false,
            isOverdue: false,
            metadata: _metadata
        });
        
        userBills[_user].push(newBillId);
        
        emit BillCreated(newBillId, _user, _billType, _amount, _dueDate);
        return newBillId;
    }
    
    /**
     * @dev Pay a utility bill
     * @param _billId Bill ID to pay
     */
    function payBill(uint256 _billId) 
        external 
        payable 
        billExists(_billId) 
        onlyVerifiedUser 
        nonReentrant 
    {
        UtilityBill storage bill = bills[_billId];
        require(bill.user == msg.sender, "Not bill owner");
        require(!bill.isPaid, "Bill already paid");
        require(msg.value >= bill.amount, "Insufficient payment amount");
        
        // Calculate platform fee
        uint256 platformFee = (bill.amount * platformFeeRate) / 100;
        uint256 netAmount = bill.amount - platformFee;
        
        // Calculate reward
        uint256 rewardAmount = calculateReward(_billId);
        
        // Update bill status
        bill.isPaid = true;
        
        // Create payment record
        _paymentIds.increment();
        uint256 newPaymentId = _paymentIds.current();
        
        payments[newPaymentId] = Payment({
            paymentId: newPaymentId,
            billId: _billId,
            user: msg.sender,
            amount: bill.amount,
            paidAt: block.timestamp,
            status: PaymentStatus.Completed,
            transactionHash: "",
            rewardEarned: rewardAmount
        });
        
        userPayments[msg.sender].push(newPaymentId);
        
        // Update payment history
        PaymentHistory storage history = paymentHistories[msg.sender];
        history.totalPayments++;
        history.lastPaymentDate = block.timestamp;
        
        if (block.timestamp <= bill.dueDate) {
            history.onTimePayments++;
        } else {
            history.overduePayments++;
        }
        
        if (rewardAmount > 0) {
            history.totalRewardsEarned += rewardAmount;
            // Transfer reward tokens to user
            require(nexusToken.transfer(msg.sender, rewardAmount), "Reward transfer failed");
            emit RewardDistributed(msg.sender, rewardAmount);
        }
        
        // Transfer payment to provider (simplified - in real implementation, this would go to actual provider)
        payable(owner()).transfer(netAmount);
        
        // Transfer platform fee
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        
        // Refund excess payment
        if (msg.value > bill.amount) {
            payable(msg.sender).transfer(msg.value - bill.amount);
        }
        
        emit PaymentMade(newPaymentId, _billId, msg.sender, bill.amount, rewardAmount);
    }
    
    /**
     * @dev Calculate reward for a payment
     * @param _billId Bill ID
     * @return Reward amount
     */
    function calculateReward(uint256 _billId) public view billExists(_billId) returns (uint256) {
        UtilityBill memory bill = bills[_billId];
        
        if (block.timestamp > bill.dueDate + OVERDUE_PENALTY_DAYS) {
            return 0; // No reward for severely overdue payments
        }
        
        uint256 baseReward = (bill.amount * onTimeRewardRate) / 100;
        
        // Early payment bonus
        if (block.timestamp <= bill.dueDate - EARLY_PAYMENT_THRESHOLD) {
            uint256 earlyBonus = (bill.amount * earlyPaymentBonus) / 100;
            return baseReward + earlyBonus;
        }
        
        // On-time payment
        if (block.timestamp <= bill.dueDate) {
            return baseReward;
        }
        
        // Overdue payment (reduced reward)
        return baseReward / 2;
    }
    
    /**
     * @dev Mark bill as overdue
     * @param _billId Bill ID
     */
    function markBillOverdue(uint256 _billId) external onlyAuthorizedProvider billExists(_billId) {
        UtilityBill storage bill = bills[_billId];
        require(!bill.isPaid, "Bill already paid");
        require(block.timestamp > bill.dueDate, "Bill not yet overdue");
        
        bill.isOverdue = true;
    }
    
    /**
     * @dev Get user's payment history
     * @param _user User address
     * @return Payment history data
     */
    function getPaymentHistory(address _user) external view returns (PaymentHistory memory) {
        return paymentHistories[_user];
    }
    
    /**
     * @dev Get user's bills
     * @param _user User address
     * @return Array of bill IDs
     */
    function getUserBills(address _user) external view returns (uint256[] memory) {
        return userBills[_user];
    }
    
    /**
     * @dev Get user's payments
     * @param _user User address
     * @return Array of payment IDs
     */
    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }
    
    /**
     * @dev Get bill details
     * @param _billId Bill ID
     * @return Bill data
     */
    function getBill(uint256 _billId) external view billExists(_billId) returns (UtilityBill memory) {
        return bills[_billId];
    }
    
    /**
     * @dev Get payment details
     * @param _paymentId Payment ID
     * @return Payment data
     */
    function getPayment(uint256 _paymentId) external view paymentExists(_paymentId) returns (Payment memory) {
        return payments[_paymentId];
    }
    
    /**
     * @dev Authorize a provider
     * @param _provider Provider address
     */
    function authorizeProvider(address _provider) external onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        authorizedProviders[_provider] = true;
        emit ProviderAuthorized(_provider);
    }
    
    /**
     * @dev Deauthorize a provider
     * @param _provider Provider address
     */
    function deauthorizeProvider(address _provider) external onlyOwner {
        authorizedProviders[_provider] = false;
        emit ProviderDeauthorized(_provider);
    }
    
    /**
     * @dev Update reward rate
     * @param _newRate New reward rate (percentage)
     */
    function updateRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 20, "Reward rate too high"); // Max 20%
        onTimeRewardRate = _newRate;
        emit RewardRateUpdated(_newRate);
    }
    
    /**
     * @dev Update platform fee rate
     * @param _newFeeRate New fee rate (percentage)
     */
    function updatePlatformFeeRate(uint256 _newFeeRate) external onlyOwner {
        require(_newFeeRate <= 10, "Fee rate too high"); // Max 10%
        platformFeeRate = _newFeeRate;
        emit PlatformFeeUpdated(_newFeeRate);
    }
    
    /**
     * @dev Update fee recipient
     * @param _newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _newFeeRecipient;
    }
    
    /**
     * @dev Get total bills count
     * @return Total bill count
     */
    function getTotalBills() external view returns (uint256) {
        return _billIds.current();
    }
    
    /**
     * @dev Get total payments count
     * @return Total payment count
     */
    function getTotalPayments() external view returns (uint256) {
        return _paymentIds.current();
    }
    
    /**
     * @dev Emergency withdraw function for owner
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
