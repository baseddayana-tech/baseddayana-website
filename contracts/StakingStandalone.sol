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

contract StakingStandalone {
    IERC20 public immutable dayaToken;
    address public owner;
    
    struct Stake {
        uint256 amount;
        uint256 since;
        uint256 stakingPeriod;
        uint256 rewards;
        bool compounded;
    }
    
    mapping(address => Stake) public stakes;
    
    struct StakingTier {
        uint256 period; // in days
        uint256 apyBps; // Annual Percentage Yield in basis points
    }
    
    StakingTier[] public stakingTiers;
    
    uint256 public earlyUnstakePenaltyBps = 2500; // 25% penalty
    address public penaltyWallet;
    
    event Staked(address indexed user, uint256 amount, uint256 period);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsCompounded(address indexed user, uint256 newAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _dayaTokenAddress) {
        dayaToken = IERC20(_dayaTokenAddress);
        owner = msg.sender;
        penaltyWallet = owner;
        
        // Initialize staking tiers
        stakingTiers.push(StakingTier(30, 1000)); // 10% APY
        stakingTiers.push(StakingTier(90, 1500)); // 15% APY
        stakingTiers.push(StakingTier(180, 2000)); // 20% APY
        stakingTiers.push(StakingTier(365, 3000)); // 30% APY
    }
    
    function stake(uint256 _amount, uint256 _tierIndex) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(_tierIndex < stakingTiers.length, "Invalid tier");
        require(stakes[msg.sender].amount == 0, "Already staking");
        
        dayaToken.transferFrom(msg.sender, address(this), _amount);
        
        stakes[msg.sender] = Stake({
            amount: _amount,
            since: block.timestamp,
            stakingPeriod: stakingTiers[_tierIndex].period,
            rewards: 0,
            compounded: false
        });
        
        emit Staked(msg.sender, _amount, stakingTiers[_tierIndex].period);
    }
    
    function unstake() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        
        uint256 stakingDuration = block.timestamp - userStake.since;
        uint256 rewards = calculateRewards(msg.sender);
        
        uint256 totalAmount;
        unchecked {
            totalAmount = userStake.amount + rewards;
        }
        
        // Apply penalty if unstaking early
        if (stakingDuration < userStake.stakingPeriod * 1 days) {
            uint256 penalty = (totalAmount * earlyUnstakePenaltyBps) / 10000;
            unchecked {
                totalAmount -= penalty;
            }
            dayaToken.transfer(penaltyWallet, penalty);
        }
        
        delete stakes[msg.sender];
        dayaToken.transfer(msg.sender, totalAmount);
        
        emit Unstaked(msg.sender, userStake.amount, rewards);
    }
    
    function calculateRewards(address _staker) public view returns (uint256) {
        Stake memory userStake = stakes[_staker];
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.since;
        uint256 annualReward;
        uint256 rewards;
        
        unchecked {
            annualReward = (userStake.amount * getAPYForPeriod(userStake.stakingPeriod)) / 10000;
            rewards = (annualReward * stakingDuration) / (365 days);
        }
        
        return rewards;
    }
    
    function getAPYForPeriod(uint256 _period) internal view returns (uint256) {
        for (uint256 i = 0; i < stakingTiers.length; i++) {
            if (stakingTiers[i].period == _period) {
                return stakingTiers[i].apyBps;
            }
        }
        return 1000; // Default 10% APY
    }
    
    function getStakingTiers() external view returns (StakingTier[] memory) {
        return stakingTiers;
    }
    
    function getStakeInfo(address _user) external view returns (Stake memory) {
        return stakes[_user];
    }
}