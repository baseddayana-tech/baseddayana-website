// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract StakingStandaloneEnhanced {
    IERC20 public immutable dayaToken;
    address public owner;
    
    struct Stake {
        uint256 amount;
        uint256 since;
        uint256 stakingPeriod;
        uint256 lastCompoundTime;
        bool autoCompound;
        uint256 compoundCount;
        uint256 totalRewardsEarned;
    }
    
    mapping(address => Stake) public stakes;
    
    struct StakingTier {
        uint256 period; // in days
        uint256 apyBps; // Annual Percentage Yield in basis points
        uint256 minAmount; // Minimum amount to access this tier
        string tierName;
        uint256 earlyAdopterBonus; // Extra APY for early adopters
    }
    
    StakingTier[] public stakingTiers;
    
    // Enhanced features
    uint256 public earlyUnstakePenaltyBps = 2500; // 25% penalty
    uint256 public autoCompoundReward = 50; // 0.5% bonus for auto-compound
    uint256 public earlyAdopterEndTime; // Timestamp when early adopter bonuses end
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    address public penaltyWallet;
    mapping(address => bool) public isEarlyAdopter;
    mapping(address => uint256) public userJoinTime;
    
    // Governance tracking
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    event Staked(address indexed user, uint256 amount, uint256 period, bool autoCompound);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsCompounded(address indexed user, uint256 rewardsAmount, uint256 newTotalStaked);
    event AutoCompoundToggled(address indexed user, bool enabled);
    event EarlyAdopterBonusApplied(address indexed user, uint256 bonusAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _dayaTokenAddress) {
        dayaToken = IERC20(_dayaTokenAddress);
        owner = msg.sender;
        penaltyWallet = owner;
        
        // Set early adopter period (30 days from deployment)
        earlyAdopterEndTime = block.timestamp + 30 days;
        
        // Initialize enhanced staking tiers with early adopter bonuses
        stakingTiers.push(StakingTier({
            period: 30,
            apyBps: 1000, // 10% APY
            minAmount: 1000 * 10**18, // 1000 DAYA minimum
            tierName: "Bronze Tier",
            earlyAdopterBonus: 200 // +2% for early adopters
        }));
        
        stakingTiers.push(StakingTier({
            period: 90,
            apyBps: 1500, // 15% APY
            minAmount: 5000 * 10**18, // 5000 DAYA minimum
            tierName: "Silver Tier",
            earlyAdopterBonus: 300 // +3% for early adopters
        }));
        
        stakingTiers.push(StakingTier({
            period: 180,
            apyBps: 2000, // 20% APY
            minAmount: 10000 * 10**18, // 10000 DAYA minimum
            tierName: "Gold Tier",
            earlyAdopterBonus: 400 // +4% for early adopters
        }));
        
        stakingTiers.push(StakingTier({
            period: 365,
            apyBps: 3000, // 30% APY
            minAmount: 25000 * 10**18, // 25000 DAYA minimum
            tierName: "Diamond Tier - MAX PROFIT",
            earlyAdopterBonus: 500 // +5% for early adopters (35% APY total!)
        }));
    }
    
    // ✅ ENHANCED STAKING WITH AUTO-COMPOUND
    function stake(uint256 _amount, uint256 _tierIndex, bool _autoCompound) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(_tierIndex < stakingTiers.length, "Invalid tier");
        require(stakes[msg.sender].amount == 0, "Already staking - use compoundRewards() instead");
        
        StakingTier memory tier = stakingTiers[_tierIndex];
        require(_amount >= tier.minAmount, "Amount below minimum for this tier");
        
        dayaToken.transferFrom(msg.sender, address(this), _amount);
        
        // Mark as early adopter if within bonus period
        bool isEarly = block.timestamp <= earlyAdopterEndTime;
        if (isEarly && !isEarlyAdopter[msg.sender]) {
            isEarlyAdopter[msg.sender] = true;
            userJoinTime[msg.sender] = block.timestamp;
        }
        
        stakes[msg.sender] = Stake({
            amount: _amount,
            since: block.timestamp,
            stakingPeriod: tier.period,
            lastCompoundTime: block.timestamp,
            autoCompound: _autoCompound,
            compoundCount: 0,
            totalRewardsEarned: 0
        });
        
        // Update governance voting power (1 DAYA = 1 vote, bonus for longer periods)
        uint256 votingMultiplier = 1 + (tier.period / 30); // 30 days = 2x, 365 days = 13x
        votingPower[msg.sender] = _amount * votingMultiplier;
        totalVotingPower += votingPower[msg.sender];
        
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount, tier.period, _autoCompound);
        
        if (isEarly) {
            emit EarlyAdopterBonusApplied(msg.sender, tier.earlyAdopterBonus);
        }
    }
    
    // ✅ AUTOMATIC COMPOUND REWARDS FUNCTION
    function compoundRewards() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(userStake.autoCompound, "Auto-compound not enabled");
        
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to compound");
        
        // Add compound bonus (0.5% extra)
        uint256 compoundBonus = (rewards * autoCompoundReward) / 10000;
        uint256 totalToCompound = rewards + compoundBonus;
        
        // Update stake
        userStake.amount += totalToCompound;
        userStake.lastCompoundTime = block.timestamp;
        userStake.compoundCount++;
        userStake.totalRewardsEarned += rewards;
        
        // Update voting power
        uint256 tierIndex = getTierIndex(userStake.stakingPeriod);
        uint256 votingMultiplier = 1 + (stakingTiers[tierIndex].period / 30);
        totalVotingPower = totalVotingPower - votingPower[msg.sender] + (userStake.amount * votingMultiplier);
        votingPower[msg.sender] = userStake.amount * votingMultiplier;
        
        totalStaked += totalToCompound;
        totalRewardsDistributed += rewards;
        
        emit RewardsCompounded(msg.sender, rewards, userStake.amount);
    }
    
    // ✅ TOGGLE AUTO-COMPOUND FEATURE
    function toggleAutoCompound() external {
        require(stakes[msg.sender].amount > 0, "No stake found");
        
        stakes[msg.sender].autoCompound = !stakes[msg.sender].autoCompound;
        
        emit AutoCompoundToggled(msg.sender, stakes[msg.sender].autoCompound);
    }
    
    // ✅ BATCH COMPOUND FOR GAS OPTIMIZATION
    function batchCompoundRewards(address[] calldata _users) external {
        for (uint256 i = 0; i < _users.length; i++) {
            if (stakes[_users[i]].autoCompound && calculateRewards(_users[i]) > 0) {
                _compoundForUser(_users[i]);
            }
        }
    }
    
    function _compoundForUser(address _user) internal {
        Stake storage userStake = stakes[_user];
        uint256 rewards = calculateRewards(_user);
        
        uint256 compoundBonus = (rewards * autoCompoundReward) / 10000;
        uint256 totalToCompound = rewards + compoundBonus;
        
        userStake.amount += totalToCompound;
        userStake.lastCompoundTime = block.timestamp;
        userStake.compoundCount++;
        userStake.totalRewardsEarned += rewards;
        
        totalStaked += totalToCompound;
        totalRewardsDistributed += rewards;
        
        emit RewardsCompounded(_user, rewards, userStake.amount);
    }
    
    function unstake() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        
        uint256 stakingDuration = block.timestamp - userStake.since;
        uint256 rewards = calculateRewards(msg.sender);
        
        uint256 totalAmount = userStake.amount + rewards;
        
        // Apply penalty if unstaking early
        if (stakingDuration < userStake.stakingPeriod * 1 days) {
            uint256 penalty = (totalAmount * earlyUnstakePenaltyBps) / 10000;
            totalAmount -= penalty;
            dayaToken.transfer(penaltyWallet, penalty);
        }
        
        // Update governance voting power
        totalVotingPower -= votingPower[msg.sender];
        votingPower[msg.sender] = 0;
        
        totalStaked -= userStake.amount;
        totalRewardsDistributed += rewards;
        
        delete stakes[msg.sender];
        dayaToken.transfer(msg.sender, totalAmount);
        
        emit Unstaked(msg.sender, userStake.amount, rewards);
    }
    
    // ✅ ENHANCED REWARD CALCULATION WITH BONUSES
    function calculateRewards(address _staker) public view returns (uint256) {
        Stake memory userStake = stakes[_staker];
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.lastCompoundTime;
        uint256 baseAPY = getAPYForPeriod(userStake.stakingPeriod);
        
        // Add early adopter bonus
        if (isEarlyAdopter[_staker]) {
            uint256 tierIndex = getTierIndex(userStake.stakingPeriod);
            baseAPY += stakingTiers[tierIndex].earlyAdopterBonus;
        }
        
        uint256 annualReward = (userStake.amount * baseAPY) / 10000;
        uint256 rewards = (annualReward * stakingDuration) / (365 days);
        
        return rewards;
    }
    
    function getTierIndex(uint256 _period) internal view returns (uint256) {
        for (uint256 i = 0; i < stakingTiers.length; i++) {
            if (stakingTiers[i].period == _period) {
                return i;
            }
        }
        return 0;
    }
    
    function getAPYForPeriod(uint256 _period) internal view returns (uint256) {
        for (uint256 i = 0; i < stakingTiers.length; i++) {
            if (stakingTiers[i].period == _period) {
                return stakingTiers[i].apyBps;
            }
        }
        return 1000; // Default 10% APY
    }
    
    // ✅ VIEW FUNCTIONS FOR UI
    function getUserStakeInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 stakingPeriod,
        uint256 currentRewards,
        bool autoCompound,
        uint256 compoundCount,
        uint256 totalEarned,
        string memory tierName,
        uint256 currentAPY,
        uint256 votingPower_,
        bool isEarlyAdopter_
    ) {
        Stake memory userStake = stakes[_user];
        if (userStake.amount == 0) {
            return (0, 0, 0, false, 0, 0, "", 0, 0, false);
        }
        
        uint256 tierIndex = getTierIndex(userStake.stakingPeriod);
        uint256 apy = getAPYForPeriod(userStake.stakingPeriod);
        
        if (isEarlyAdopter[_user]) {
            apy += stakingTiers[tierIndex].earlyAdopterBonus;
        }
        
        return (
            userStake.amount,
            userStake.stakingPeriod,
            calculateRewards(_user),
            userStake.autoCompound,
            userStake.compoundCount,
            userStake.totalRewardsEarned,
            stakingTiers[tierIndex].tierName,
            apy,
            votingPower[_user],
            isEarlyAdopter[_user]
        );
    }
    
    function getStakingTiers() external view returns (StakingTier[] memory) {
        return stakingTiers;
    }
    
    function getProtocolStats() external view returns (
        uint256 totalStaked_,
        uint256 totalRewardsDistributed_,
        uint256 totalVotingPower_,
        uint256 earlyAdopterEndTime_,
        uint256 activeStakers
    ) {
        // Note: activeStakers would need a separate counter in production
        return (
            totalStaked,
            totalRewardsDistributed,
            totalVotingPower,
            earlyAdopterEndTime,
            0 // placeholder
        );
    }
}
