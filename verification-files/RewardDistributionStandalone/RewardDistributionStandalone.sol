// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RewardDistributionStandalone is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    struct Distribution {
        address recipient;
        uint256 amount;
        uint256 vestingPeriod;
        uint256 startTime;
        bool claimed;
    }
    
    mapping(bytes32 => Distribution) public distributions;
    mapping(address => uint256) public totalClaimed;
    
    event DistributionCreated(bytes32 indexed distributionId, address recipient, uint256 amount);
    event RewardsClaimed(bytes32 indexed distributionId, address recipient, uint256 amount);
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function createDistribution(
        address _recipient,
        uint256 _amount,
        uint256 _vestingPeriod
    ) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be positive");
        
        bytes32 distributionId = keccak256(abi.encodePacked(
            _recipient,
            _amount,
            _vestingPeriod,
            block.timestamp
        ));
        
        distributions[distributionId] = Distribution({
            recipient: _recipient,
            amount: _amount,
            vestingPeriod: _vestingPeriod,
            startTime: block.timestamp,
            claimed: false
        });
        
        emit DistributionCreated(distributionId, _recipient, _amount);
    }
    
    function claimRewards(bytes32 _distributionId) external nonReentrant {
        Distribution storage distribution = distributions[_distributionId];
        require(distribution.recipient == msg.sender, "Not authorized");
        require(!distribution.claimed, "Already claimed");
        require(block.timestamp >= distribution.startTime + distribution.vestingPeriod, "Still vesting");
        
        distribution.claimed = true;
        totalClaimed[msg.sender] += distribution.amount;
        
        token.transfer(msg.sender, distribution.amount);
        
        emit RewardsClaimed(_distributionId, msg.sender, distribution.amount);
    }
    
    function getClaimableAmount(bytes32 _distributionId) external view returns (uint256) {
        Distribution memory distribution = distributions[_distributionId];
        if (distribution.claimed || block.timestamp < distribution.startTime + distribution.vestingPeriod) {
            return 0;
        }
        return distribution.amount;
    }
}