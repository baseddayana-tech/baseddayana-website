// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StakingLimits - Sustainable Staking Management
 * @dev Manages staking limits per tier to ensure economic sustainability
 * 
 * This contract implements:
 * - Maximum staking amounts per tier
 * - Total staking capacity limits
 * - Emergency pause for sustainability
 * - Real-time sustainability monitoring
 */
contract StakingLimits {
    address public owner;
    address public stakingContract;
    
    // Staking capacity limits per tier
    struct TierLimit {
        uint256 maxStakingAmount;    // Max DAYA that can be staked in this tier
        uint256 currentStaked;       // Current amount staked in this tier
        uint256 maxUsers;            // Maximum number of users per tier
        uint256 currentUsers;        // Current number of users in this tier
        bool isActive;               // Whether this tier accepts new stakes
    }
    
    // Tier limits (0=Tier1, 1=Tier2, 2=Tier3, 3=Tier4)
    mapping(uint256 => TierLimit) public tierLimits;
    
    // Global limits
    uint256 public maxTotalStaking = 200_000_000 * 10**18; // 20% of total supply
    uint256 public currentTotalStaked;
    uint256 public maxTotalUsers = 10000; // Maximum total stakers
    uint256 public currentTotalUsers;
    
    // Emergency controls
    bool public emergencyPause;
    bool public sustainabilityMode; // Reduces limits when activated
    
    // Events
    event TierLimitUpdated(uint256 indexed tier, uint256 maxAmount, uint256 maxUsers);
    event StakingLimitReached(uint256 indexed tier, uint256 current, uint256 max);
    event EmergencyPauseToggled(bool paused);
    event SustainabilityModeToggled(bool enabled);
    event StakingCapacityUpdated(uint256 totalStaked, uint256 totalUsers);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!emergencyPause, "Emergency pause active");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Initialize tier limits for sustainability
        // Tier 1 (30 days): 5M DAYA max, 1000 users max
        tierLimits[0] = TierLimit({
            maxStakingAmount: 5_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 1000,
            currentUsers: 0,
            isActive: true
        });
        
        // Tier 2 (90 days): 10M DAYA max, 800 users max
        tierLimits[1] = TierLimit({
            maxStakingAmount: 10_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 800,
            currentUsers: 0,
            isActive: true
        });
        
        // Tier 3 (180 days): 15M DAYA max, 500 users max
        tierLimits[2] = TierLimit({
            maxStakingAmount: 15_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 500,
            currentUsers: 0,
            isActive: true
        });
        
        // Tier 4 (365 days): 20M DAYA max, 200 users max
        tierLimits[3] = TierLimit({
            maxStakingAmount: 20_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 200,
            currentUsers: 0,
            isActive: true
        });
    }
    
    /**
     * @dev Set the staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }
    
    /**
     * @dev Check if a user can stake in a specific tier
     */
    function canStake(uint256 _tier, uint256 _amount, address /*_user*/) external view returns (bool, string memory) {
        require(_tier < 4, "Invalid tier");
        
        TierLimit memory tier = tierLimits[_tier];
        
        // Check if tier is active
        if (!tier.isActive) {
            return (false, "Tier not accepting new stakes");
        }
        
        // Check tier capacity
        if (tier.currentStaked + _amount > tier.maxStakingAmount) {
            return (false, "Tier staking capacity exceeded");
        }
        
        // Check user limit
        if (tier.currentUsers >= tier.maxUsers) {
            return (false, "Tier user capacity exceeded");
        }
        
        // Check global capacity
        if (currentTotalStaked + _amount > maxTotalStaking) {
            return (false, "Global staking capacity exceeded");
        }
        
        if (currentTotalUsers >= maxTotalUsers) {
            return (false, "Global user capacity exceeded");
        }
        
        return (true, "Can stake");
    }
    
    /**
     * @dev Record a new stake (called by staking contract)
     */
    function recordStake(uint256 _tier, uint256 _amount, address /*_user*/) external {
        require(msg.sender == stakingContract, "Only staking contract");
        require(_tier < 4, "Invalid tier");
        
        TierLimit storage tier = tierLimits[_tier];
        
        // Update tier stats
        tier.currentStaked += _amount;
        tier.currentUsers += 1;
        
        // Update global stats
        currentTotalStaked += _amount;
        currentTotalUsers += 1;
        
        emit StakingCapacityUpdated(currentTotalStaked, currentTotalUsers);
        
        // Check if tier is now full
        if (tier.currentStaked >= tier.maxStakingAmount) {
            emit StakingLimitReached(_tier, tier.currentStaked, tier.maxStakingAmount);
        }
    }
    
    /**
     * @dev Record an unstake (called by staking contract)
     */
    function recordUnstake(uint256 _tier, uint256 _amount, address /*_user*/) external {
        require(msg.sender == stakingContract, "Only staking contract");
        require(_tier < 4, "Invalid tier");
        
        TierLimit storage tier = tierLimits[_tier];
        
        // Update tier stats
        if (tier.currentStaked >= _amount) {
            tier.currentStaked -= _amount;
        }
        if (tier.currentUsers > 0) {
            tier.currentUsers -= 1;
        }
        
        // Update global stats
        if (currentTotalStaked >= _amount) {
            currentTotalStaked -= _amount;
        }
        if (currentTotalUsers > 0) {
            currentTotalUsers -= 1;
        }
        
        emit StakingCapacityUpdated(currentTotalStaked, currentTotalUsers);
    }
    
    /**
     * @dev Update tier limits (owner only)
     */
    function updateTierLimits(
        uint256 _tier,
        uint256 _maxAmount,
        uint256 _maxUsers,
        bool _isActive
    ) external onlyOwner {
        require(_tier < 4, "Invalid tier");
        
        tierLimits[_tier].maxStakingAmount = _maxAmount;
        tierLimits[_tier].maxUsers = _maxUsers;
        tierLimits[_tier].isActive = _isActive;
        
        emit TierLimitUpdated(_tier, _maxAmount, _maxUsers);
    }
    
    /**
     * @dev Update global limits
     */
    function updateGlobalLimits(
        uint256 _maxTotalStaking,
        uint256 _maxTotalUsers
    ) external onlyOwner {
        maxTotalStaking = _maxTotalStaking;
        maxTotalUsers = _maxTotalUsers;
    }
    
    /**
     * @dev Toggle emergency pause
     */
    function toggleEmergencyPause() external onlyOwner {
        emergencyPause = !emergencyPause;
        emit EmergencyPauseToggled(emergencyPause);
    }
    
    /**
     * @dev Toggle sustainability mode (reduces limits by 50%)
     */
    function toggleSustainabilityMode() external onlyOwner {
        sustainabilityMode = !sustainabilityMode;
        
        // Adjust limits based on mode
        for (uint256 i = 0; i < 4; i++) {
            if (sustainabilityMode) {
                tierLimits[i].maxStakingAmount = tierLimits[i].maxStakingAmount * 50 / 100;
                tierLimits[i].maxUsers = tierLimits[i].maxUsers * 50 / 100;
            } else {
                // Restore original limits (would need to store original values)
                // For now, just toggle the mode
            }
        }
        
        emit SustainabilityModeToggled(sustainabilityMode);
    }
    
    /**
     * @dev Get sustainability metrics
     */
    function getSustainabilityMetrics() external view returns (
        uint256 totalStaked,
        uint256 totalUsers,
        uint256 totalCapacity,
        uint256 userCapacity,
        uint256 sustainabilityScore
    ) {
        totalStaked = currentTotalStaked;
        totalUsers = currentTotalUsers;
        totalCapacity = maxTotalStaking;
        userCapacity = maxTotalUsers;
        
        // Calculate sustainability score (0-100)
        uint256 stakingUtilization = (currentTotalStaked * 100) / maxTotalStaking;
        uint256 userUtilization = (currentTotalUsers * 100) / maxTotalUsers;
        sustainabilityScore = (stakingUtilization + userUtilization) / 2;
    }
    
    /**
     * @dev Get tier information
     */
    function getTierInfo(uint256 _tier) external view returns (
        uint256 maxAmount,
        uint256 currentStaked,
        uint256 maxUsers,
        uint256 currentUsers,
        bool isActive,
        uint256 utilizationPercent
    ) {
        require(_tier < 4, "Invalid tier");
        
        TierLimit memory tier = tierLimits[_tier];
        maxAmount = tier.maxStakingAmount;
        currentStaked = tier.currentStaked;
        maxUsers = tier.maxUsers;
        currentUsers = tier.currentUsers;
        isActive = tier.isActive;
        utilizationPercent = (tier.currentStaked * 100) / tier.maxStakingAmount;
    }
}
