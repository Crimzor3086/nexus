// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ProfileRegistry.sol";
import "./UtilityPayment.sol";

/**
 * @title ReputationSystem
 * @dev Manages reputation scores and DAO/admin approval system for the Nexus platform
 * @notice Builds a transparent reputation network through community governance
 */
contract ReputationSystem is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _proposalIds;
    
    ProfileRegistry public profileRegistry;
    UtilityPayment public utilityPayment;
    
    enum ProposalType {
        ProfileApproval,
        ProfileSuspension,
        AdminAddition,
        AdminRemoval,
        DAOAddition,
        DAORemoval,
        ParameterUpdate
    }
    
    enum ProposalStatus {
        Active,
        Executed,
        Rejected,
        Expired
    }
    
    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address proposer;
        address targetAddress; // Address being voted on (for admin/DAO proposals)
        string description;
        string metadata; // Additional proposal data
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votingPower;
    }
    
    struct ReputationMetrics {
        uint256 profileScore;
        uint256 paymentScore;
        uint256 communityScore;
        uint256 totalScore;
        uint256 lastUpdated;
        uint256 level; // Reputation level (1-10)
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => ReputationMetrics) public reputationMetrics;
    mapping(address => bool) public daos;
    mapping(address => bool) public admins;
    mapping(address => uint256) public daoStakes; // DAO voting power based on stake
    
    // Voting parameters
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000; // Minimum reputation to create proposal
    uint256 public constant QUORUM_THRESHOLD = 30; // 30% of total stake required
    uint256 public constant APPROVAL_THRESHOLD = 60; // 60% approval required
    
    // Reputation scoring weights
    uint256 public profileWeight = 30;
    uint256 public paymentWeight = 40;
    uint256 public communityWeight = 30;
    
    // Reputation levels
    uint256[] public reputationLevels = [100, 200, 350, 500, 700, 900, 1200, 1500, 2000, 2500];
    
    event ProposalCreated(uint256 indexed proposalId, ProposalType proposalType, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId, ProposalType proposalType);
    event ReputationUpdated(address indexed user, uint256 newScore, uint256 newLevel);
    event DAOStaked(address indexed dao, uint256 amount);
    event DAOUnstaked(address indexed dao, uint256 amount);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event DAOAdded(address indexed dao);
    event DAORemoved(address indexed dao);
    
    modifier onlyDAO() {
        require(daos[msg.sender], "Not a DAO");
        _;
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }
    
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= _proposalIds.current(), "Proposal does not exist");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(profileRegistry.isVerified(msg.sender), "User not verified");
        _;
    }
    
    constructor(address _profileRegistry, address _utilityPayment) {
        profileRegistry = ProfileRegistry(_profileRegistry);
        utilityPayment = UtilityPayment(_utilityPayment);
        admins[msg.sender] = true;
    }
    
    /**
     * @dev Create a new proposal
     * @param _proposalType Type of proposal
     * @param _targetAddress Address being voted on (if applicable)
     * @param _description Proposal description
     * @param _metadata Additional proposal data
     */
    function createProposal(
        ProposalType _proposalType,
        address _targetAddress,
        string memory _description,
        string memory _metadata
    ) external onlyVerifiedUser nonReentrant returns (uint256) {
        ReputationMetrics memory metrics = reputationMetrics[msg.sender];
        require(metrics.totalScore >= MIN_PROPOSAL_THRESHOLD, "Insufficient reputation to create proposal");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();
        
        Proposal storage proposal = proposals[newProposalId];
        proposal.id = newProposalId;
        proposal.proposalType = _proposalType;
        proposal.proposer = msg.sender;
        proposal.targetAddress = _targetAddress;
        proposal.description = _description;
        proposal.metadata = _metadata;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_DURATION;
        proposal.status = ProposalStatus.Active;
        proposal.executed = false;
        
        emit ProposalCreated(newProposalId, _proposalType, msg.sender, _description);
        return newProposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param _proposalId Proposal ID
     * @param _support True for yes, false for no
     */
    function vote(uint256 _proposalId, bool _support) 
        external 
        proposalExists(_proposalId) 
        onlyVerifiedUser 
        nonReentrant 
    {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 votingPower = calculateVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votingPower[msg.sender] = votingPower;
        
        if (_support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, votingPower);
    }
    
    /**
     * @dev Execute a proposal
     * @param _proposalId Proposal ID
     */
    function executeProposal(uint256 _proposalId) 
        external 
        proposalExists(_proposalId) 
        nonReentrant 
    {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalStake = getTotalStake();
        
        // Check quorum
        require(totalVotes >= (totalStake * QUORUM_THRESHOLD) / 100, "Quorum not met");
        
        // Check approval threshold
        bool approved = proposal.votesFor > (totalVotes * APPROVAL_THRESHOLD) / 100;
        
        if (approved) {
            proposal.status = ProposalStatus.Executed;
            proposal.executed = true;
            
            // Execute the proposal based on type
            _executeProposal(proposal);
            
            emit ProposalExecuted(_proposalId, proposal.proposalType);
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
    }
    
    /**
     * @dev Execute proposal actions
     * @param _proposal Proposal to execute
     */
    function _executeProposal(Proposal storage _proposal) internal {
        if (_proposal.proposalType == ProposalType.ProfileApproval) {
            profileRegistry.approveProfile(profileRegistry.addressToProfileId(_proposal.targetAddress));
        } else if (_proposal.proposalType == ProposalType.ProfileSuspension) {
            profileRegistry.suspendProfile(profileRegistry.addressToProfileId(_proposal.targetAddress));
        } else if (_proposal.proposalType == ProposalType.AdminAddition) {
            profileRegistry.addAdmin(_proposal.targetAddress);
            admins[_proposal.targetAddress] = true;
            emit AdminAdded(_proposal.targetAddress);
        } else if (_proposal.proposalType == ProposalType.AdminRemoval) {
            profileRegistry.removeAdmin(_proposal.targetAddress);
            admins[_proposal.targetAddress] = false;
            emit AdminRemoved(_proposal.targetAddress);
        } else if (_proposal.proposalType == ProposalType.DAOAddition) {
            profileRegistry.addDAO(_proposal.targetAddress);
            daos[_proposal.targetAddress] = true;
            emit DAOAdded(_proposal.targetAddress);
        } else if (_proposal.proposalType == ProposalType.DAORemoval) {
            profileRegistry.removeDAO(_proposal.targetAddress);
            daos[_proposal.targetAddress] = false;
            emit DAORemoved(_proposal.targetAddress);
        }
    }
    
    /**
     * @dev Calculate voting power for a user
     * @param _user User address
     * @return Voting power
     */
    function calculateVotingPower(address _user) public view returns (uint256) {
        ReputationMetrics memory metrics = reputationMetrics[_user];
        
        // Base voting power from reputation
        uint256 basePower = metrics.totalScore;
        
        // DAO staking bonus
        if (daos[_user]) {
            basePower += daoStakes[_user];
        }
        
        return basePower;
    }
    
    /**
     * @dev Update user reputation metrics
     * @param _user User address
     */
    function updateReputationMetrics(address _user) external {
        require(profileRegistry.isVerified(_user), "User not verified");
        
        ReputationMetrics storage metrics = reputationMetrics[_user];
        
        // Get profile data
        ProfileRegistry.Profile memory profile = profileRegistry.getProfileByAddress(_user);
        metrics.profileScore = profile.reputationScore;
        
        // Get payment history
        UtilityPayment.PaymentHistory memory paymentHistory = utilityPayment.getPaymentHistory(_user);
        metrics.paymentScore = _calculatePaymentScore(paymentHistory);
        
        // Community score (simplified - in real implementation, this would include more factors)
        metrics.communityScore = _calculateCommunityScore(_user);
        
        // Calculate total score
        metrics.totalScore = (metrics.profileScore * profileWeight) / 100 +
                            (metrics.paymentScore * paymentWeight) / 100 +
                            (metrics.communityScore * communityWeight) / 100;
        
        // Update reputation level
        metrics.level = _calculateReputationLevel(metrics.totalScore);
        metrics.lastUpdated = block.timestamp;
        
        emit ReputationUpdated(_user, metrics.totalScore, metrics.level);
    }
    
    /**
     * @dev Calculate payment score based on payment history
     * @param _paymentHistory Payment history data
     * @return Payment score
     */
    function _calculatePaymentScore(UtilityPayment.PaymentHistory memory _paymentHistory) 
        internal 
        pure 
        returns (uint256) 
    {
        if (_paymentHistory.totalPayments == 0) return 0;
        
        uint256 onTimeRate = (_paymentHistory.onTimePayments * 100) / _paymentHistory.totalPayments;
        uint256 baseScore = _paymentHistory.totalPayments * 10; // Base score per payment
        
        // Bonus for on-time payments
        if (onTimeRate >= 90) {
            return baseScore * 2; // 200% bonus
        } else if (onTimeRate >= 80) {
            return (baseScore * 150) / 100; // 150% bonus
        } else if (onTimeRate >= 70) {
            return (baseScore * 120) / 100; // 120% bonus
        }
        
        return baseScore;
    }
    
    /**
     * @dev Calculate community score
     * @param _user User address
     * @return Community score
     */
    function _calculateCommunityScore(address _user) internal view returns (uint256) {
        // Simplified community score calculation
        // In a real implementation, this would include:
        // - Number of proposals created
        // - Number of votes cast
        // - Community contributions
        // - Social interactions
        
        uint256 score = 0;
        
        // Check if user has created proposals
        for (uint256 i = 1; i <= _proposalIds.current(); i++) {
            if (proposals[i].proposer == _user) {
                score += 50;
            }
        }
        
        // Check if user has voted on proposals
        for (uint256 i = 1; i <= _proposalIds.current(); i++) {
            if (proposals[i].hasVoted[_user]) {
                score += 10;
            }
        }
        
        return score;
    }
    
    /**
     * @dev Calculate reputation level based on total score
     * @param _totalScore Total reputation score
     * @return Reputation level (1-10)
     */
    function _calculateReputationLevel(uint256 _totalScore) internal view returns (uint256) {
        for (uint256 i = 0; i < reputationLevels.length; i++) {
            if (_totalScore < reputationLevels[i]) {
                return i + 1;
            }
        }
        return 10; // Maximum level
    }
    
    /**
     * @dev Stake tokens as DAO for increased voting power
     * @param _amount Amount to stake
     */
    function stakeAsDAO(uint256 _amount) external payable onlyDAO {
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value >= _amount, "Insufficient payment");
        
        daoStakes[msg.sender] += _amount;
        emit DAOStaked(msg.sender, _amount);
    }
    
    /**
     * @dev Unstake tokens as DAO
     * @param _amount Amount to unstake
     */
    function unstakeAsDAO(uint256 _amount) external onlyDAO {
        require(_amount > 0, "Amount must be greater than 0");
        require(daoStakes[msg.sender] >= _amount, "Insufficient stake");
        
        daoStakes[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit DAOUnstaked(msg.sender, _amount);
    }
    
    /**
     * @dev Get total stake in the system
     * @return Total stake amount
     */
    function getTotalStake() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= _proposalIds.current(); i++) {
            // This is simplified - in real implementation, you'd track total stake differently
            total += 1000; // Placeholder
        }
        return total;
    }
    
    /**
     * @dev Get user's reputation metrics
     * @param _user User address
     * @return Reputation metrics
     */
    function getReputationMetrics(address _user) external view returns (ReputationMetrics memory) {
        return reputationMetrics[_user];
    }
    
    /**
     * @dev Get proposal details
     * @param _proposalId Proposal ID
     * @return Proposal data
     */
    function getProposal(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId) 
        returns (
            uint256 id,
            ProposalType proposalType,
            address proposer,
            address targetAddress,
            string memory description,
            string memory metadata,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 startTime,
            uint256 endTime,
            ProposalStatus status,
            bool executed
        ) 
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposalType,
            proposal.proposer,
            proposal.targetAddress,
            proposal.description,
            proposal.metadata,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.status,
            proposal.executed
        );
    }
    
    /**
     * @dev Update reputation scoring weights
     * @param _profileWeight Profile weight percentage
     * @param _paymentWeight Payment weight percentage
     * @param _communityWeight Community weight percentage
     */
    function updateScoringWeights(
        uint256 _profileWeight,
        uint256 _paymentWeight,
        uint256 _communityWeight
    ) external onlyOwner {
        require(_profileWeight + _paymentWeight + _communityWeight == 100, "Weights must sum to 100");
        
        profileWeight = _profileWeight;
        paymentWeight = _paymentWeight;
        communityWeight = _communityWeight;
    }
    
    /**
     * @dev Get total proposals count
     * @return Total proposal count
     */
    function getTotalProposals() external view returns (uint256) {
        return _proposalIds.current();
    }
}
