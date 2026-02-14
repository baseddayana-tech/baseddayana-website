// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VestingStandalone is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliff;
        uint256 duration;
        uint256 released;
        bool revocable;
        bool revoked;
    }
    
    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => uint256) public totalVested;
    
    event VestingScheduleCreated(bytes32 indexed scheduleId, address beneficiary, uint256 amount);
    event TokensReleased(bytes32 indexed scheduleId, uint256 amount);
    event VestingRevoked(bytes32 indexed scheduleId);
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _cliff,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_amount > 0, "Amount must be positive");
        require(_duration > 0, "Duration must be positive");
        
        bytes32 scheduleId = keccak256(abi.encodePacked(
            _beneficiary,
            _amount,
            _cliff,
            _duration,
            block.timestamp
        ));
        
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _amount,
            startTime: block.timestamp,
            cliff: _cliff,
            duration: _duration,
            released: 0,
            revocable: _revocable,
            revoked: false
        });
        
        totalVested[_beneficiary] += _amount;
        
        emit VestingScheduleCreated(scheduleId, _beneficiary, _amount);
    }
    
    function release(bytes32 _scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        require(schedule.beneficiary == msg.sender, "Not authorized");
        require(!schedule.revoked, "Schedule revoked");
        
        uint256 releasableAmount = getReleasableAmount(_scheduleId);
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.released += releasableAmount;
        token.transfer(msg.sender, releasableAmount);
        
        emit TokensReleased(_scheduleId, releasableAmount);
    }
    
    function getReleasableAmount(bytes32 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_scheduleId];
        if (schedule.revoked) return 0;
        
        uint256 vestedAmount = getVestedAmount(_scheduleId);
        return vestedAmount - schedule.released;
    }
    
    function getVestedAmount(bytes32 _scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_scheduleId];
        
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        
        return (schedule.totalAmount * (block.timestamp - schedule.startTime)) / schedule.duration;
    }
    
    function revokeVesting(bytes32 _scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        require(schedule.revocable, "Not revocable");
        require(!schedule.revoked, "Already revoked");
        
        schedule.revoked = true;
        emit VestingRevoked(_scheduleId);
    }
}