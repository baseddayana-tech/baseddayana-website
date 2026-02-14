// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStaking {
    function votingPower(address user) external view returns (uint256);
    function stakes(address user) external view returns (uint256, uint256, uint256, uint256, bool, uint256, uint256);
}

contract GovernanceStandalone {
    IStaking public stakingContract;
    address public owner;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        mapping(uint256 => uint256) optionVotes; // optionIndex => votes
        mapping(address => bool) hasVoted;
        mapping(address => uint256) userVote;
        ProposalStatus status;
        uint256 minVotingPower;
        bool executed;
    }
    
    enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public minProposalPower = 10000 * 10**18; // 10,000 DAYA voting power to create proposal
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    
    // Community rewards for active participation
    mapping(address => uint256) public governanceRewards;
    mapping(address => uint256) public proposalsCreated;
    mapping(address => uint256) public votesCount;
    uint256 public totalGovernanceRewards;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 optionIndex,
        uint256 votingPower,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId, uint256 winningOption);
    event GovernanceRewardDistributed(address indexed user, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyStaker() {
        require(stakingContract.votingPower(msg.sender) > 0, "Must be staking to participate");
        _;
    }
    
    constructor(address _stakingContract) {
        stakingContract = IStaking(_stakingContract);
        owner = msg.sender;
    }
    
    // ✅ CREATE COMMUNITY PROPOSAL
    function createProposal(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _minVotingPower
    ) external onlyStaker {
        require(_options.length >= 2 && _options.length <= 10, "Invalid options count");
        require(stakingContract.votingPower(msg.sender) >= minProposalPower, "Insufficient voting power");
        require(bytes(_title).length > 0 && bytes(_description).length > 0, "Empty title or description");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.options = _options;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        newProposal.status = ProposalStatus.Active;
        newProposal.minVotingPower = _minVotingPower;
        
        // Reward proposal creation
        proposalsCreated[msg.sender]++;
        _distributeGovernanceReward(msg.sender, 100 * 10**18); // 100 DAYA reward for creating proposal
        
        emit ProposalCreated(proposalId, msg.sender, _title, newProposal.endTime);
    }
    
    // ✅ VOTE ON PROPOSALS
    function vote(
        uint256 _proposalId,
        uint256 _optionIndex,
        string memory _reason
    ) external onlyStaker {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(_optionIndex < proposal.options.length, "Invalid option");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 userVotingPower = stakingContract.votingPower(msg.sender);
        require(userVotingPower >= proposal.minVotingPower, "Insufficient voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.userVote[msg.sender] = _optionIndex;
        proposal.optionVotes[_optionIndex] += userVotingPower;
        proposal.totalVotes += userVotingPower;
        
        // Reward voting participation
        votesCount[msg.sender]++;
        _distributeGovernanceReward(msg.sender, 10 * 10**18); // 10 DAYA reward for voting
        
        emit VoteCast(_proposalId, msg.sender, _optionIndex, userVotingPower, _reason);
    }
    
    // ✅ FINALIZE PROPOSAL
    function finalizeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        // Find winning option
        uint256 winningOption = 0;
        uint256 maxVotes = proposal.optionVotes[0];
        
        for (uint256 i = 1; i < proposal.options.length; i++) {
            if (proposal.optionVotes[i] > maxVotes) {
                maxVotes = proposal.optionVotes[i];
                winningOption = i;
            }
        }
        
        // Check if proposal passed (needs >50% of total votes)
        if (maxVotes > proposal.totalVotes / 2) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
        
        emit ProposalExecuted(_proposalId, winningOption);
    }
    
    // ✅ EARLY ADOPTER GOVERNANCE FEATURES
    function createEarlyAdopterProposal(
        string memory _title,
        string memory _description,
        string[] memory _options
    ) external onlyStaker {
        // Early adopters can create proposals with lower requirements
        require(stakingContract.votingPower(msg.sender) >= minProposalPower / 2, "Insufficient voting power");
        require(_isEarlyAdopter(msg.sender), "Not an early adopter");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = string(abi.encodePacked("🌟 Early Adopter: ", _title));
        newProposal.description = _description;
        newProposal.options = _options;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + (votingPeriod * 2); // Longer voting period
        newProposal.status = ProposalStatus.Active;
        newProposal.minVotingPower = 1000 * 10**18; // Lower requirement for early adopters
        
        // Extra reward for early adopter proposals
        proposalsCreated[msg.sender]++;
        _distributeGovernanceReward(msg.sender, 200 * 10**18); // 200 DAYA bonus
        
        emit ProposalCreated(proposalId, msg.sender, newProposal.title, newProposal.endTime);
    }
    
    // ✅ COMMUNITY REWARDS DISTRIBUTION
    function _distributeGovernanceReward(address _user, uint256 _amount) internal {
        governanceRewards[_user] += _amount;
        totalGovernanceRewards += _amount;
        
        emit GovernanceRewardDistributed(_user, _amount);
    }
    
    function claimGovernanceRewards() external {
        uint256 rewards = governanceRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        governanceRewards[msg.sender] = 0;
        // In production, this would transfer actual DAYA tokens
        // dayaToken.transfer(msg.sender, rewards);
        
        emit GovernanceRewardDistributed(msg.sender, rewards);
    }
    
    // ✅ VIEW FUNCTIONS
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        uint256 totalVotes,
        ProposalStatus status,
        uint256 minVotingPower,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.options,
            proposal.startTime,
            proposal.endTime,
            proposal.totalVotes,
            proposal.status,
            proposal.minVotingPower,
            proposal.executed
        );
    }
    
    function getProposalVotes(uint256 _proposalId) external view returns (uint256[] memory) {
        Proposal storage proposal = proposals[_proposalId];
        uint256[] memory votes = new uint256[](proposal.options.length);
        
        for (uint256 i = 0; i < proposal.options.length; i++) {
            votes[i] = proposal.optionVotes[i];
        }
        
        return votes;
    }
    
    function getUserVote(uint256 _proposalId, address _user) external view returns (uint256, bool) {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.userVote[_user], proposal.hasVoted[_user]);
    }
    
    function getUserGovernanceStats(address _user) external view returns (
        uint256 votingPower,
        uint256 proposalsCreated_,
        uint256 votesCount_,
        uint256 governanceRewards_,
        bool isEarlyAdopter
    ) {
        return (
            stakingContract.votingPower(_user),
            proposalsCreated[_user],
            votesCount[_user],
            governanceRewards[_user],
            _isEarlyAdopter(_user)
        );
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256[] memory activeProposals = new uint256[](proposalCount);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Active && block.timestamp <= proposals[i].endTime) {
                activeProposals[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeProposals[i];
        }
        
        return result;
    }
    
    function _isEarlyAdopter(address _user) internal view returns (bool) {
        // In production, this would check with the staking contract
        // For now, we'll check if they have been staking for less than 30 days
        (, uint256 since, , , , , ) = stakingContract.stakes(_user);
        return since > 0 && (block.timestamp - since) <= 30 days;
    }
    
    // ✅ ADMIN FUNCTIONS
    function updateMinProposalPower(uint256 _newMinPower) external onlyOwner {
        minProposalPower = _newMinPower;
    }
    
    function updateVotingPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod >= 1 days && _newPeriod <= 30 days, "Invalid period");
        votingPeriod = _newPeriod;
    }
    
    // ✅ EMERGENCY FUNCTIONS
    function emergencyCancelProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        
        proposal.status = ProposalStatus.Rejected;
    }
}
