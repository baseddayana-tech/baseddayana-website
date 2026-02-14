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

contract RewardDistributionStandalone {
    IERC20 public immutable dayaToken;
    address public owner;
    
    struct Pool {
        uint256 totalRewards;
        uint256 rewardPerToken;
        uint256 lastUpdateTime;
        mapping(address => uint256) userRewards;
        mapping(address => uint256) userRewardPerTokenPaid;
    }
    
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    
    event RewardAdded(uint256 indexed poolId, uint256 reward);
    event RewardPaid(address indexed user, uint256 indexed poolId, uint256 reward);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _dayaTokenAddress) {
        dayaToken = IERC20(_dayaTokenAddress);
        owner = msg.sender;
    }
    
    function createPool(uint256 _totalRewards) external onlyOwner {
        Pool storage newPool = pools[poolCount];
        newPool.totalRewards = _totalRewards;
        newPool.lastUpdateTime = block.timestamp;
        
        poolCount++;
        
        dayaToken.transferFrom(msg.sender, address(this), _totalRewards);
        emit RewardAdded(poolCount - 1, _totalRewards);
    }
    
    function claimRewards(uint256 _poolId) external {
        require(_poolId < poolCount, "Invalid pool");
        
        Pool storage pool = pools[_poolId];
        uint256 reward = pool.userRewards[msg.sender];
        
        if (reward > 0) {
            pool.userRewards[msg.sender] = 0;
            dayaToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, _poolId, reward);
        }
    }
    
    function addUserToPool(uint256 _poolId, address _user, uint256 _rewardAmount) external onlyOwner {
        require(_poolId < poolCount, "Invalid pool");
        require(_user != address(0), "Invalid user address");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");
        
        unchecked {
            pools[_poolId].userRewards[_user] += _rewardAmount;
        }
    }
}