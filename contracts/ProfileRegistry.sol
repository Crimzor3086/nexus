// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProfileRegistry
 * @dev Manages verified on-chain profiles for the Nexus platform
 * @notice Users can create profiles, submit verification documents, and get approved by admins/DAOs
 */
contract ProfileRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _profileIds;
    
    enum ProfileStatus {
        Pending,
        Approved,
        Rejected,
        Suspended
    }
    
    struct Profile {
        uint256 id;
        address owner;
        string name;
        string email;
        string documentHash; // IPFS hash of verification documents
        ProfileStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        address approvedBy; // Admin/DAO that approved the profile
        uint256 reputationScore;
        bool isActive;
    }
    
    struct VerificationDocument {
        string documentType; // "passport", "drivers_license", "utility_bill", etc.
        string documentHash;
        uint256 uploadedAt;
        bool isVerified;
    }
    
    mapping(uint256 => Profile) public profiles;
    mapping(address => uint256) public addressToProfileId;
    mapping(uint256 => VerificationDocument[]) public profileDocuments;
    mapping(address => bool) public admins;
    mapping(address => bool) public daos;
    
    uint256 public constant MIN_REPUTATION_SCORE = 100;
    uint256 public constant MAX_REPUTATION_SCORE = 1000;
    
    event ProfileCreated(uint256 indexed profileId, address indexed owner, string name);
    event ProfileUpdated(uint256 indexed profileId, address indexed owner);
    event ProfileApproved(uint256 indexed profileId, address indexed approver);
    event ProfileRejected(uint256 indexed profileId, address indexed rejector, string reason);
    event DocumentUploaded(uint256 indexed profileId, string documentType, string documentHash);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event DAOAdded(address indexed dao);
    event DAORemoved(address indexed dao);
    
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not an admin");
        _;
    }
    
    modifier onlyAdminOrDAO() {
        require(admins[msg.sender] || daos[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier profileExists(uint256 _profileId) {
        require(_profileId > 0 && _profileId <= _profileIds.current(), "Profile does not exist");
        _;
    }
    
    modifier onlyProfileOwner(uint256 _profileId) {
        require(profiles[_profileId].owner == msg.sender, "Not profile owner");
        _;
    }
    
    constructor() {
        admins[msg.sender] = true;
    }
    
    /**
     * @dev Create a new profile
     * @param _name User's display name
     * @param _email User's email address
     * @param _documentHash IPFS hash of initial verification document
     */
    function createProfile(
        string memory _name,
        string memory _email,
        string memory _documentHash
    ) external nonReentrant returns (uint256) {
        require(addressToProfileId[msg.sender] == 0, "Profile already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        _profileIds.increment();
        uint256 newProfileId = _profileIds.current();
        
        profiles[newProfileId] = Profile({
            id: newProfileId,
            owner: msg.sender,
            name: _name,
            email: _email,
            documentHash: _documentHash,
            status: ProfileStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            approvedBy: address(0),
            reputationScore: 0,
            isActive: true
        });
        
        addressToProfileId[msg.sender] = newProfileId;
        
        emit ProfileCreated(newProfileId, msg.sender, _name);
        return newProfileId;
    }
    
    /**
     * @dev Update profile information
     * @param _profileId Profile ID to update
     * @param _name New name
     * @param _email New email
     */
    function updateProfile(
        uint256 _profileId,
        string memory _name,
        string memory _email
    ) external profileExists(_profileId) onlyProfileOwner(_profileId) {
        require(profiles[_profileId].status != ProfileStatus.Suspended, "Profile is suspended");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        profiles[_profileId].name = _name;
        profiles[_profileId].email = _email;
        profiles[_profileId].updatedAt = block.timestamp;
        
        emit ProfileUpdated(_profileId, msg.sender);
    }
    
    /**
     * @dev Upload verification document
     * @param _profileId Profile ID
     * @param _documentType Type of document
     * @param _documentHash IPFS hash of document
     */
    function uploadDocument(
        uint256 _profileId,
        string memory _documentType,
        string memory _documentHash
    ) external profileExists(_profileId) onlyProfileOwner(_profileId) {
        require(profiles[_profileId].status != ProfileStatus.Suspended, "Profile is suspended");
        require(bytes(_documentType).length > 0, "Document type cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        
        profileDocuments[_profileId].push(VerificationDocument({
            documentType: _documentType,
            documentHash: _documentHash,
            uploadedAt: block.timestamp,
            isVerified: false
        }));
        
        emit DocumentUploaded(_profileId, _documentType, _documentHash);
    }
    
    /**
     * @dev Approve a profile (admin/DAO only)
     * @param _profileId Profile ID to approve
     */
    function approveProfile(uint256 _profileId) 
        external 
        profileExists(_profileId) 
        onlyAdminOrDAO 
    {
        require(profiles[_profileId].status == ProfileStatus.Pending, "Profile not pending");
        
        profiles[_profileId].status = ProfileStatus.Approved;
        profiles[_profileId].approvedBy = msg.sender;
        profiles[_profileId].updatedAt = block.timestamp;
        profiles[_profileId].reputationScore = MIN_REPUTATION_SCORE;
        
        emit ProfileApproved(_profileId, msg.sender);
    }
    
    /**
     * @dev Reject a profile (admin/DAO only)
     * @param _profileId Profile ID to reject
     * @param _reason Reason for rejection
     */
    function rejectProfile(uint256 _profileId, string memory _reason) 
        external 
        profileExists(_profileId) 
        onlyAdminOrDAO 
    {
        require(profiles[_profileId].status == ProfileStatus.Pending, "Profile not pending");
        
        profiles[_profileId].status = ProfileStatus.Rejected;
        profiles[_profileId].updatedAt = block.timestamp;
        
        emit ProfileRejected(_profileId, msg.sender, _reason);
    }
    
    /**
     * @dev Suspend a profile (admin only)
     * @param _profileId Profile ID to suspend
     */
    function suspendProfile(uint256 _profileId) 
        external 
        profileExists(_profileId) 
        onlyAdmin 
    {
        profiles[_profileId].status = ProfileStatus.Suspended;
        profiles[_profileId].updatedAt = block.timestamp;
        profiles[_profileId].isActive = false;
        
        emit ProfileRejected(_profileId, msg.sender, "Profile suspended");
    }
    
    /**
     * @dev Update reputation score
     * @param _profileId Profile ID
     * @param _newScore New reputation score
     */
    function updateReputationScore(uint256 _profileId, uint256 _newScore) 
        external 
        onlyAdminOrDAO 
        profileExists(_profileId) 
    {
        require(_newScore >= 0 && _newScore <= MAX_REPUTATION_SCORE, "Invalid reputation score");
        
        profiles[_profileId].reputationScore = _newScore;
        profiles[_profileId].updatedAt = block.timestamp;
        
        if (_newScore < MIN_REPUTATION_SCORE) {
            profiles[_profileId].isActive = false;
        } else {
            profiles[_profileId].isActive = true;
        }
    }
    
    /**
     * @dev Add admin
     * @param _admin Address to add as admin
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }
    
    /**
     * @dev Remove admin
     * @param _admin Address to remove as admin
     */
    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner(), "Cannot remove owner");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }
    
    /**
     * @dev Add DAO
     * @param _dao Address to add as DAO
     */
    function addDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "Invalid DAO address");
        daos[_dao] = true;
        emit DAOAdded(_dao);
    }
    
    /**
     * @dev Remove DAO
     * @param _dao Address to remove as DAO
     */
    function removeDAO(address _dao) external onlyOwner {
        daos[_dao] = false;
        emit DAORemoved(_dao);
    }
    
    /**
     * @dev Get profile by address
     * @param _address User address
     * @return Profile data
     */
    function getProfileByAddress(address _address) external view returns (Profile memory) {
        uint256 profileId = addressToProfileId[_address];
        require(profileId > 0, "Profile not found");
        return profiles[profileId];
    }
    
    /**
     * @dev Get profile documents
     * @param _profileId Profile ID
     * @return Array of verification documents
     */
    function getProfileDocuments(uint256 _profileId) 
        external 
        view 
        profileExists(_profileId) 
        returns (VerificationDocument[] memory) 
    {
        return profileDocuments[_profileId];
    }
    
    /**
     * @dev Check if address has verified profile
     * @param _address User address
     * @return True if verified
     */
    function isVerified(address _address) external view returns (bool) {
        uint256 profileId = addressToProfileId[_address];
        if (profileId == 0) return false;
        
        Profile memory profile = profiles[profileId];
        return profile.status == ProfileStatus.Approved && profile.isActive;
    }
    
    /**
     * @dev Get total number of profiles
     * @return Total profile count
     */
    function getTotalProfiles() external view returns (uint256) {
        return _profileIds.current();
    }
}
