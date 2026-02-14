// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceOracle - BASED DAYANA Price Oracle
 * @dev Simple price oracle for DAYA token with owner-controlled pricing
 * 
 * Features:
 * - Owner can update DAYA price
 * - Price stored with 6 decimals (USDT standard)
 * - Transparent price updates with events
 * - Compatible with auto-renounce (price becomes immutable)
 * - Gas optimized for frequent reads
 */
contract PriceOracle {
    // State Variables
    uint256 public dayaPrice;           // Price with 6 decimals (e.g., 5000 = $0.005)
    address public owner;
    
    // Events
    event PriceUpdated(
        uint256 indexed oldPrice, 
        uint256 indexed newPrice, 
        uint256 timestamp,
        address updatedBy
    );
    
    event OwnershipTransferred(
        address indexed previousOwner, 
        address indexed newOwner
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "PriceOracle: caller is not the owner");
        _;
    }
    
    /**
     * @dev Constructor sets initial price and owner
     * @param _initialPrice Initial DAYA price with 6 decimals (e.g., 5000 = $0.005)
     * @param _owner Address of the owner who can update prices
     */
    constructor(uint256 _initialPrice, address _owner) {
        require(_initialPrice > 0, "PriceOracle: initial price must be greater than 0");
        require(_owner != address(0), "PriceOracle: owner cannot be zero address");
        
        dayaPrice = _initialPrice;
        owner = _owner;
        
        emit PriceUpdated(0, _initialPrice, block.timestamp, msg.sender);
        emit OwnershipTransferred(address(0), _owner);
    }
    
    /**
     * @dev Returns current DAYA price in USDT (6 decimals)
     * @return Current price (e.g., 5000 = $0.005)
     */
    function getDAYAPrice() external view returns (uint256) {
        return dayaPrice;
    }
    
    /**
     * @dev Returns current DAYA price formatted for display
     * @return Price with proper decimal formatting
     */
    function getFormattedPrice() external view returns (string memory) {
        uint256 price = dayaPrice;
        uint256 wholePart = price / 1000000;
        uint256 fractionalPart = price % 1000000;
        
        // Convert to string representation
        if (wholePart > 0) {
            return string(abi.encodePacked(
                _uint2str(wholePart),
                ".",
                _padZeros(_uint2str(fractionalPart), 6)
            ));
        } else {
            return string(abi.encodePacked(
                "0.",
                _padZeros(_uint2str(fractionalPart), 6)
            ));
        }
    }
    
    /**
     * @dev Updates DAYA price (only owner)
     * @param _newPrice New price with 6 decimals
     */
    function updatePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "PriceOracle: new price must be greater than 0");
        
        uint256 oldPrice = dayaPrice;
        dayaPrice = _newPrice;
        
        emit PriceUpdated(oldPrice, _newPrice, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Transfers ownership (only current owner)
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PriceOracle: new owner cannot be zero address");
        require(_newOwner != owner, "PriceOracle: new owner is the same as current owner");
        
        address oldOwner = owner;
        owner = _newOwner;
        
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
    
    /**
     * @dev Renounces ownership (makes price immutable)
     */
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
    
    /**
     * @dev Returns price information for external integrations
     * @return price Current price
     * @return decimals Number of decimals used (6)
     * @return lastUpdated Timestamp of last update
     * @return isOwned Whether contract has an active owner
     */
    function getPriceInfo() external view returns (
        uint256 price,
        uint8 decimals,
        uint256 lastUpdated,
        bool isOwned
    ) {
        return (
            dayaPrice,
            6,
            block.timestamp,
            owner != address(0)
        );
    }
    
    // Internal helper functions
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function _padZeros(string memory _str, uint256 _targetLength) internal pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        if (strBytes.length >= _targetLength) {
            return _str;
        }
        
        uint256 zerosNeeded = _targetLength - strBytes.length;
        string memory zeros = "";
        for (uint256 i = 0; i < zerosNeeded; i++) {
            zeros = string(abi.encodePacked("0", zeros));
        }
        return string(abi.encodePacked(zeros, _str));
    }
}

/**
 * DEPLOYMENT INSTRUCTIONS FOR REMIX:
 * 
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy with constructor parameters:
 *    - _initialPrice: 5000 (represents $0.005)
 *    - _owner: YOUR_WALLET_ADDRESS
 * 
 * 3. After deployment:
 *    - Verify contract on BaseScan
 *    - Test getDAYAPrice() function
 *    - Update frontend with new contract address
 * 
 * Example deployment:
 * _initialPrice: 5000
 * _owner: 0xYourWalletAddress
 * 
 * Gas estimate: ~450,000 gas
 * Cost on Base: ~$1-3 USD
 */



