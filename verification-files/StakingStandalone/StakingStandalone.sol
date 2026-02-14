// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingStandalone is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    struct StakingTier {
        uint256 minAmount;
        uint256 apy; // APY in basis points (100 = 1%)
        uint256 lockPeriod; // in seconds
    }
    
    struct Stake {
        uint256 amount;
        uint256 tier;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    StakingTier[] public stakingTiers;
    mapping(address => Stake) public stakes;
    
    event Staked(address indexed user, uint256 amount, uint256 tier);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event TierAdded(uint256 minAmount, uint256 apy, uint256 lockPeriod);
    
    constructor(address _token) {
        token = IERC20(_token);
        
        // Add default tiers
        stakingTiers.push(StakingTier(1000 * 10**18, 500, 30 days)); // 5% APY, 30 days
        stakingTiers.push(StakingTier(5000 * 10**18, 1000, 90 days)); // 10% APY, 90 days
        stakingTiers.push(StakingTier(10000 * 10**18, 1500, 180 days)); // 15% APY, 180 days
    }
    
    function getStakingTiers() external view returns (StakingTier[] memory) {
        return stakingTiers;
    }
    
    function getStakeInfo(address _user) external view returns (Stake memory) {
        return stakes[_user];
    }
    
    function addTier(uint256 _minAmount, uint256 _apy, uint256 _lockPeriod) external onlyOwner {
        stakingTiers.push(StakingTier(_minAmount, _apy, _lockPeriod));
        emit TierAdded(_minAmount, _apy, _lockPeriod);
    }
    
    function stake(uint256 _amount, uint256 _tier) external nonReentrant {
        require(_tier < stakingTiers.length, "Invalid tier");
        require(_amount >= stakingTiers[_tier].minAmount, "Amount below minimum");
        require(stakes[msg.sender].active == false, "Already staked");
        
        token.transferFrom(msg.sender, address(this), _amount);
        
        stakes[msg.sender] = Stake({
            amount: _amount,
            tier: _tier,
            startTime: block.timestamp,
            endTime: block.timestamp + stakingTiers[_tier].lockPeriod,
            active: true
        });
        
        emit Staked(msg.sender, _amount, _tier);
    }
    
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        require(block.timestamp >= userStake.endTime, "Stake still locked");
        
        uint256 rewards = calculateRewards(msg.sender);
        uint256 totalAmount = userStake.amount + rewards;
        
        userStake.active = false;
        
        token.transfer(msg.sender, totalAmount);
        
        emit Unstaked(msg.sender, userStake.amount, rewards);
    }
    
    function calculateRewards(address _user) public view returns (uint256) {
        Stake memory userStake = stakes[_user];
        if (!userStake.active) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.startTime;
        uint256 apy = stakingTiers[userStake.tier].apy;
        
        return (userStake.amount * apy * stakingDuration) / (365 days * 10000);
    }
}