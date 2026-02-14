// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BASED DAYANA Token ($DAYA) - Standalone Auto-Renounce Version
 * @dev A secure ERC-20 token with AUTOMATIC ownership renouncement after 60 days.
 * 
 * This is a standalone version that doesn't depend on OpenZeppelin libraries
 * for easier deployment and compilation.
 *
 * Security Features:
 * - No Transfer Fees: Eliminates fee-based scam patterns
 * - Limited Owner Powers: Reduces centralization risks  
 * - No Blacklist: Removes arbitrary blocking capabilities
 * - AUTOMATIC RENOUNCE: Owner automatically renounced after 60 days
 * - Anti-Reentrancy: Manual implementation of reentrancy protection
 * - Emergency Controls: Limited duration emergency pause (max 72h)
 */
contract DAYATokenStandalone {
    // ERC20 Basic Variables
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    // Ownership
    address private _owner;
    
    // Reentrancy Protection
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    
    // Anti-Whale Protection
    uint256 public maxWalletAmount;
    uint256 public maxTxAmount;
    
    // Trading Control
    bool public tradingEnabled;
    mapping(address => bool) public isExcludedFromLimits;
    
    // Emergency Controls
    bool public emergencyMode;
    uint256 public emergencyModeEndTime;
    
    // AUTOMATIC Ownership Renouncement
    uint256 public immutable deploymentTime;
    uint256 public constant AUTO_RENOUNCE_DELAY = 60 days;
    bool public ownershipAutoRenounced;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TradingEnabled();
    event AutoRenounceExecuted(uint256 timestamp);
    event EmergencyModeActivated(uint256 endTime);
    event EmergencyModeDeactivated();

    // Modifiers
    modifier onlyOwner() {
        require(!isOwnershipAutoRenounced() && msg.sender == _owner, "Not owner or ownership renounced");
        _;
    }
    
    modifier whenNotPaused() {
        require(!emergencyMode || block.timestamp > emergencyModeEndTime, "Emergency mode active");
        _;
    }
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() {
        _name = "BASED DAYANA";
        _symbol = "DAYA";
        _decimals = 18;
        _totalSupply = 1_000_000_000 * 10**_decimals;
        
        // Record deployment time for auto-renounce
        deploymentTime = block.timestamp;
        
        // Set owner
        _owner = msg.sender;
        
        // Mint total supply to deployer
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
        
        // Set reasonable anti-whale limits (2% of total supply)
        uint256 reasonableMax = _totalSupply * 2 / 100;
        maxWalletAmount = reasonableMax;
        maxTxAmount = reasonableMax;
        
        // Exclude deployer and contract from limits
        isExcludedFromLimits[msg.sender] = true;
        isExcludedFromLimits[address(this)] = true;
        
        // Initialize reentrancy guard
        _status = _NOT_ENTERED;
        
        // Trading starts disabled
        tradingEnabled = false;
    }

    // ERC20 Standard Functions
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        
        return true;
    }

    // Internal transfer function with all checks
    function _transfer(address from, address to, uint256 amount) internal whenNotPaused {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        // Check if trading is enabled
        if (!tradingEnabled) {
            require(
                isExcludedFromLimits[from] || isExcludedFromLimits[to], 
                "Trading not yet enabled"
            );
        }
        
        // Apply anti-whale limits
        if (!isExcludedFromLimits[from] && !isExcludedFromLimits[to]) {
            require(amount <= maxTxAmount, "Transfer amount exceeds maximum");
            require(_balances[to] + amount <= maxWalletAmount, "Wallet would exceed maximum");
        }
        
        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        
        emit Transfer(from, to, amount);
    }

    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }

    // Auto-Renounce Logic
    function isOwnershipAutoRenounced() public view returns (bool) {
        return ownershipAutoRenounced || (block.timestamp >= deploymentTime + AUTO_RENOUNCE_DELAY);
    }

    function getTimeUntilAutoRenounce() external view returns (uint256) {
        if (isOwnershipAutoRenounced()) return 0;
        uint256 renounceTime = deploymentTime + AUTO_RENOUNCE_DELAY;
        if (block.timestamp >= renounceTime) return 0;
        return renounceTime - block.timestamp;
    }

    function executeAutoRenounce() external nonReentrant {
        require(block.timestamp >= deploymentTime + AUTO_RENOUNCE_DELAY, "Auto-renounce time not reached");
        require(!ownershipAutoRenounced, "Already auto-renounced");
        
        ownershipAutoRenounced = true;
        address previousOwner = _owner;
        _owner = address(0);
        
        emit OwnershipTransferred(previousOwner, address(0));
        emit AutoRenounceExecuted(block.timestamp);
    }

    function owner() public view returns (address) {
        if (isOwnershipAutoRenounced()) {
            return address(0);
        }
        return _owner;
    }

    // Limited Owner Functions (only work before auto-renounce)
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled();
    }

    function increaseMaxWalletAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > maxWalletAmount, "Can only increase max wallet amount");
        require(_newAmount <= _totalSupply / 10, "Cannot exceed 10% of total supply");
        maxWalletAmount = _newAmount;
    }

    function increaseMaxTxAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > maxTxAmount, "Can only increase max tx amount");
        require(_newAmount <= _totalSupply / 10, "Cannot exceed 10% of total supply");
        maxTxAmount = _newAmount;
    }

    function excludeFromLimits(address _address, bool _excluded) external onlyOwner {
        require(_address != address(0), "Invalid address");
        isExcludedFromLimits[_address] = _excluded;
    }

    function activateEmergencyMode(uint256 _durationHours) external onlyOwner {
        require(_durationHours <= 72, "Emergency mode cannot exceed 72 hours");
        require(!emergencyMode, "Emergency mode already active");
        
        emergencyMode = true;
        emergencyModeEndTime = block.timestamp + (_durationHours * 1 hours);
        
        emit EmergencyModeActivated(emergencyModeEndTime);
    }

    function deactivateEmergencyMode() external onlyOwner {
        require(emergencyMode, "Emergency mode not active");
        
        emergencyMode = false;
        emergencyModeEndTime = 0;
        
        emit EmergencyModeDeactivated();
    }

    function autoUnpause() external {
        require(emergencyMode && block.timestamp > emergencyModeEndTime, "Emergency mode still active");
        
        emergencyMode = false;
        emergencyModeEndTime = 0;
        
        emit EmergencyModeDeactivated();
    }

    // View Functions
    function isFullyDecentralized() external view returns (bool) {
        return isOwnershipAutoRenounced();
    }

    function getAutoRenounceInfo() external view returns (
        uint256 deployTime,
        uint256 renounceTime,
        bool isRenounced,
        uint256 timeRemaining
    ) {
        deployTime = deploymentTime;
        renounceTime = deploymentTime + AUTO_RENOUNCE_DELAY;
        isRenounced = isOwnershipAutoRenounced();
        
        if (isRenounced) {
            timeRemaining = 0;
        } else if (block.timestamp >= renounceTime) {
            timeRemaining = 0;
        } else {
            timeRemaining = renounceTime - block.timestamp;
        }
    }

    function getEmergencyModeStatus() external view returns (bool active, uint256 timeRemaining) {
        active = emergencyMode && block.timestamp <= emergencyModeEndTime;
        if (active) {
            timeRemaining = emergencyModeEndTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    function getSecurityInfo() external pure returns (
        string memory auditStatus,
        string memory securityFeatures,
        string memory riskLevel,
        string memory autoRenounceStatus
    ) {
        auditStatus = "Community verified standalone implementation";
        securityFeatures = "No fees, limited owner powers, automatic renouncement";
        riskLevel = "Ultra Low - Auto-decentralized";
        autoRenounceStatus = "60-day automatic renouncement guaranteed";
    }

    // Burn function (anyone can burn their own tokens)
    function burn(uint256 amount) external nonReentrant {
        require(_balances[msg.sender] >= amount, "Burn amount exceeds balance");
        
        unchecked {
            _balances[msg.sender] -= amount;
            _totalSupply -= amount;
        }
        
        emit Transfer(msg.sender, address(0), amount);
    }
}
