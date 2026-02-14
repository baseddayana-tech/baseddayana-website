// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SecureTimestampManager.sol";

/**
 * @title SecureGovernance
 * @dev Governance with lock period protection against flash loan attacks
 * @author BASED DAYANA Security Team
 */
contract SecureGovernance {
    // Import timestamp manager
    SecureTimestampManager public timestampManager;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event StakingLocked(address indexed user, uint256 amount, uint256 lockEndTime);
    event StakingUnlocked(address indexed user, uint256 amount);
    
    // Structs
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }
    
    struct StakingLock {
        uint256 amount;
        uint256 lockEndTime;
        bool isLocked;
    }
    
    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(address => StakingLock) public stakingLocks;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public votingPower;
    
    uint256 public proposalCount;
    uint256 public constant MIN_PROPOSAL_POWER = 1000 * 10**18; // 1000 DAYA minimum
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant LOCK_PERIOD = 7 days; // 7 days lock for proposals
    uint256 public constant MIN_LOCK_FOR_PROPOSAL = 30 days; // 30 days minimum lock to propose
    
    address public stakingContract;
    address public owner;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }
    
    modifier validProposal(uint256 _proposalId) {
        require(_proposalId < proposalCount, "Invalid proposal");
        require(!proposals[_proposalId].executed, "Proposal already executed");
        require(!proposals[_proposalId].canceled, "Proposal canceled");
        _;
    }
    
    constructor(address _stakingContract, address _timestampManager) {
        stakingContract = _stakingContract;
        timestampManager = SecureTimestampManager(_timestampManager);
        owner = msg.sender;
    }
    
    /**
     * @dev Create a new proposal with lock period validation
     * @param _description Description of the proposal
     * @return proposalId The ID of the created proposal
     */
    function createProposal(string memory _description) external returns (uint256) {
        // Check if user has sufficient locked staking power
        require(
            stakingLocks[msg.sender].amount >= MIN_PROPOSAL_POWER,
            "Insufficient locked staking power"
        );
        
        // Check if user's lock period is sufficient
        require(
            stakingLocks[msg.sender].lockEndTime >= block.timestamp + MIN_LOCK_FOR_PROPOSAL,
            "Lock period too short for proposal"
        );
        
        // Check if user's lock is still active
        require(
            stakingLocks[msg.sender].isLocked,
            "Staking not locked"
        );
        
        uint256 proposalId = proposalCount;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: _description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });
        
        proposalCount++;
        
        emit ProposalCreated(proposalId, msg.sender, _description, startTime, endTime);
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal with lock validation
     * @param _proposalId The ID of the proposal
     * @param _support True for support, false for against
     */
    function vote(uint256 _proposalId, bool _support) external validProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        // Check if voting period is active
        require(
            block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime,
            "Voting period not active"
        );
        
        // Check if user hasn't voted yet
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        
        // Get user's voting power (must be locked)
        uint256 userVotingPower = getVotingPower(msg.sender);
        require(userVotingPower > 0, "No voting power");
        
        // Record vote
        hasVoted[_proposalId][msg.sender] = true;
        
        if (_support) {
            proposal.forVotes += userVotingPower;
        } else {
            proposal.againstVotes += userVotingPower;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, userVotingPower);
    }
    
    /**
     * @dev Execute a proposal after voting period
     * @param _proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 _proposalId) external validProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        // Check if voting period has ended
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        // Check if proposal passed (simple majority)
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        
        // Mark as executed
        proposal.executed = true;
        
        emit ProposalExecuted(_proposalId);
        
        // Here you would implement the actual proposal execution logic
        // For now, we just mark it as executed
    }
    
    /**
     * @dev Lock staking for governance participation
     * @param _amount Amount to lock
     * @param _lockDuration Duration of lock in seconds
     */
    function lockStaking(uint256 _amount, uint256 _lockDuration) external {
        require(_amount > 0, "Amount must be positive");
        require(_lockDuration >= MIN_LOCK_FOR_PROPOSAL, "Lock duration too short");
        
        // Check if user has sufficient staking balance
        // This would typically call the staking contract
        // For now, we assume the amount is valid
        
        // Set lock
        stakingLocks[msg.sender] = StakingLock({
            amount: _amount,
            lockEndTime: block.timestamp + _lockDuration,
            isLocked: true
        });
        
        // Update voting power
        votingPower[msg.sender] = _amount;
        
        emit StakingLocked(msg.sender, _amount, block.timestamp + _lockDuration);
    }
    
    /**
     * @dev Unlock staking after lock period
     */
    function unlockStaking() external {
        StakingLock storage lock = stakingLocks[msg.sender];
        
        require(lock.isLocked, "No active lock");
        require(block.timestamp >= lock.lockEndTime, "Lock period not ended");
        
        uint256 amount = lock.amount;
        
        // Clear lock
        lock.amount = 0;
        lock.lockEndTime = 0;
        lock.isLocked = false;
        
        // Clear voting power
        votingPower[msg.sender] = 0;
        
        emit StakingUnlocked(msg.sender, amount);
    }
    
    /**
     * @dev Get user's voting power
     * @param _user User address
     * @return Voting power amount
     */
    function getVotingPower(address _user) public view returns (uint256) {
        StakingLock memory lock = stakingLocks[_user];
        
        if (!lock.isLocked || block.timestamp >= lock.lockEndTime) {
            return 0;
        }
        
        return lock.amount;
    }
    
    /**
     * @dev Get proposal details
     * @param _proposalId Proposal ID
     * @return Proposal details
     */
    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }
    
    /**
     * @dev Get user's lock status
     * @param _user User address
     * @return Lock details
     */
    function getUserLock(address _user) external view returns (StakingLock memory) {
        return stakingLocks[_user];
    }
    
    /**
     * @dev Check if user can create proposal
     * @param _user User address
     * @return True if user can propose
     */
    function canCreateProposal(address _user) external view returns (bool) {
        StakingLock memory lock = stakingLocks[_user];
        
        return lock.isLocked && 
               lock.amount >= MIN_PROPOSAL_POWER &&
               lock.lockEndTime >= block.timestamp + MIN_LOCK_FOR_PROPOSAL;
    }
    
    /**
     * @dev Set staking contract (only owner)
     * @param _stakingContract New staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }
    
    /**
     * @dev Emergency function to unlock all staking (only owner)
     * @param _user User to unlock
     */
    function emergencyUnlock(address _user) external onlyOwner {
        StakingLock storage lock = stakingLocks[_user];
        
        if (lock.isLocked) {
            lock.amount = 0;
            lock.lockEndTime = 0;
            lock.isLocked = false;
            votingPower[_user] = 0;
            
            emit StakingUnlocked(_user, lock.amount);
        }
    }
}
