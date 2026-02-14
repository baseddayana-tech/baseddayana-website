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

contract VestingStandalone {
    IERC20 public immutable dayaToken;
    address public owner;
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 released;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 start, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _dayaTokenAddress) {
        dayaToken = IERC20(_dayaTokenAddress);
        owner = msg.sender;
    }
    
    function createVestingSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _cliff,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_totalAmount > 0, "Amount must be greater than 0");
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule already exists");
        
        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _totalAmount,
            start: block.timestamp,
            cliff: _cliff,
            duration: _duration,
            released: 0,
            revocable: _revocable,
            revoked: false
        });
        
        dayaToken.transferFrom(msg.sender, address(this), _totalAmount);
        
        emit VestingScheduleCreated(_beneficiary, _totalAmount, block.timestamp, _duration);
    }
    
    function release() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Vesting revoked");
        
        uint256 releasableAmount = getReleasableAmount(msg.sender);
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.released += releasableAmount;
        dayaToken.transfer(msg.sender, releasableAmount);
        
        emit TokensReleased(msg.sender, releasableAmount);
    }
    
    function getReleasableAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        if (schedule.revoked || block.timestamp < schedule.start + schedule.cliff) {
            return 0;
        }
        
        uint256 elapsedTime = block.timestamp - schedule.start;
        uint256 vestedAmount;
        
        if (elapsedTime >= schedule.duration) {
            vestedAmount = schedule.totalAmount;
        } else {
            unchecked {
                vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.duration;
            }
        }
        
        if (vestedAmount <= schedule.released) {
            return 0;
        }
        
        unchecked {
            return vestedAmount - schedule.released;
        }
    }
    
    function revokeVesting(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.revocable, "Not revocable");
        require(!schedule.revoked, "Already revoked");
        
        uint256 releasableAmount = getReleasableAmount(_beneficiary);
        if (releasableAmount > 0) {
            unchecked {
                schedule.released += releasableAmount;
            }
            dayaToken.transfer(_beneficiary, releasableAmount);
        }
        
        schedule.revoked = true;
        uint256 remainingAmount;
        unchecked {
            remainingAmount = schedule.totalAmount - schedule.released;
        }
        if (remainingAmount > 0) {
            dayaToken.transfer(owner, remainingAmount);
        }
        
        emit VestingRevoked(_beneficiary);
    }
}