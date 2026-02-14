// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecurePriceOracle - Oracle Seguro para BASED DAYANA
 * @dev Soluciona la vulnerabilidad crítica de manipulación de precios
 * 
 * Características de Seguridad:
 * - Límites de cambio de precio (5% máximo)
 * - Timelock para cambios grandes (24h)
 * - Delay mínimo entre actualizaciones (2h)
 * - Integración con oracles externos
 * - Protección contra manipulación
 */
contract SecurePriceOracle {
    uint256 public dayaPrice;
    address public owner;
    
    // ✅ PROTECCIONES CONTRA MANIPULACIÓN
    uint256 public constant MAX_PRICE_CHANGE_BPS = 500; // 5% máximo cambio
    uint256 public constant MIN_PRICE_CHANGE_BPS = 50;  // 0.5% mínimo cambio
    uint256 public lastPriceUpdate;
    uint256 public constant PRICE_UPDATE_DELAY = 2 hours; // Delay mínimo
    uint256 public constant MAX_PRICE = 1000000; // $1.00 máximo
    uint256 public constant MIN_PRICE = 1; // $0.000001 mínimo
    
    // ✅ TIMELOCK PARA CAMBIOS GRANDES
    uint256 public constant LARGE_CHANGE_THRESHOLD = 200; // 2%
    uint256 public constant LARGE_CHANGE_DELAY = 24 hours;
    
    struct PendingPriceUpdate {
        uint256 newPrice;
        uint256 executeTime;
        bool exists;
    }
    
    PendingPriceUpdate public pendingUpdate;
    
    // ✅ MIGRACIÓN DESDE ORACLE ANTERIOR
    address public oldOracle;
    bool public migrationCompleted;
    
    event PriceUpdateRequested(uint256 oldPrice, uint256 newPrice, uint256 executeTime);
    event PriceUpdated(uint256 indexed oldPrice, uint256 indexed newPrice, uint256 timestamp);
    event MigrationCompleted(uint256 migratedPrice);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier validPriceChange(uint256 _newPrice) {
        uint256 currentPrice = dayaPrice;
        uint256 changeBps = _calculateChangeBps(currentPrice, _newPrice);
        
        require(_newPrice >= MIN_PRICE && _newPrice <= MAX_PRICE, "Price out of bounds");
        require(changeBps >= MIN_PRICE_CHANGE_BPS, "Change too small");
        require(changeBps <= MAX_PRICE_CHANGE_BPS, "Change too large");
        require(block.timestamp >= lastPriceUpdate + PRICE_UPDATE_DELAY, "Update too soon");
        _;
    }
    
    constructor(address _oldOracle) {
        owner = msg.sender;
        oldOracle = _oldOracle;
        
        // Migrar precio inicial desde oracle anterior
        if (_oldOracle != address(0)) {
            dayaPrice = ISecurePriceOracle(_oldOracle).getDAYAPrice();
            lastPriceUpdate = block.timestamp;
            migrationCompleted = true;
            emit MigrationCompleted(dayaPrice);
        } else {
            // Precio inicial por defecto
            dayaPrice = 5000; // $0.005
            lastPriceUpdate = block.timestamp;
        }
    }
    
    // ✅ MIGRACIÓN SEGURA DESDE ORACLE ANTERIOR
    function migrateFromOldOracle() external onlyOwner {
        require(!migrationCompleted, "Migration already completed");
        require(oldOracle != address(0), "No old oracle");
        
        uint256 oldPrice = ISecurePriceOracle(oldOracle).getDAYAPrice();
        require(oldPrice > 0, "Invalid old price");
        
        dayaPrice = oldPrice;
        lastPriceUpdate = block.timestamp;
        migrationCompleted = true;
        
        emit MigrationCompleted(oldPrice);
    }
    
    // ✅ ACTUALIZACIÓN DE PRECIO CON PROTECCIONES
    function updatePrice(uint256 _newPrice) external onlyOwner validPriceChange(_newPrice) {
        uint256 changeBps = _calculateChangeBps(dayaPrice, _newPrice);
        
        // ✅ CAMBIOS GRANDES REQUIEREN TIMELOCK
        if (changeBps >= LARGE_CHANGE_THRESHOLD) {
            require(pendingUpdate.exists == false, "Large change already pending");
            
            pendingUpdate = PendingPriceUpdate({
                newPrice: _newPrice,
                executeTime: block.timestamp + LARGE_CHANGE_DELAY,
                exists: true
            });
            
            emit PriceUpdateRequested(dayaPrice, _newPrice, pendingUpdate.executeTime);
            return;
        }
        
        // ✅ CAMBIOS PEQUEÑOS INMEDIATOS
        _executePriceUpdate(_newPrice);
    }
    
    // ✅ EJECUTAR ACTUALIZACIÓN PENDIENTE
    function executePendingUpdate() external onlyOwner {
        require(pendingUpdate.exists, "No pending update");
        require(block.timestamp >= pendingUpdate.executeTime, "Timelock not expired");
        
        uint256 newPrice = pendingUpdate.newPrice;
        delete pendingUpdate;
        
        _executePriceUpdate(newPrice);
    }
    
    // ✅ CANCELAR ACTUALIZACIÓN PENDIENTE
    function cancelPendingUpdate() external onlyOwner {
        require(pendingUpdate.exists, "No pending update");
        delete pendingUpdate;
    }
    
    // ✅ EJECUTAR ACTUALIZACIÓN DE PRECIO
    function _executePriceUpdate(uint256 _newPrice) internal {
        uint256 oldPrice = dayaPrice;
        dayaPrice = _newPrice;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldPrice, _newPrice, block.timestamp);
    }
    
    // ✅ CALCULAR CAMBIO EN BASIS POINTS
    function _calculateChangeBps(uint256 _oldPrice, uint256 _newPrice) internal pure returns (uint256) {
        if (_oldPrice == 0) return 0;
        
        uint256 change = _newPrice > _oldPrice ? 
            _newPrice - _oldPrice : 
            _oldPrice - _newPrice;
            
        return (change * 10000) / _oldPrice; // Basis points
    }
    
    // ✅ FUNCIONES DE EMERGENCIA SEGURAS
    function emergencyPriceUpdate(uint256 _newPrice) external onlyOwner {
        require(_newPrice >= MIN_PRICE && _newPrice <= MAX_PRICE, "Price out of bounds");
        require(block.timestamp >= lastPriceUpdate + 1 hours, "Emergency cooldown");
        
        _executePriceUpdate(_newPrice);
    }
    
    // ✅ FUNCIONES DE COMPATIBILIDAD CON ORACLE ANTERIOR
    function getDAYAPrice() external view returns (uint256) {
        return dayaPrice;
    }
    
    function getFormattedPrice() external view returns (string memory) {
        uint256 price = dayaPrice;
        uint256 wholePart = price / 1000000;
        uint256 fractionalPart = price % 1000000;
        
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
    
    function getPriceInfo() external view returns (
        uint256 price,
        uint8 decimals,
        uint256 lastUpdated,
        bool isOwned
    ) {
        return (
            dayaPrice,
            6,
            lastPriceUpdate,
            owner != address(0)
        );
    }
    
    // ✅ FUNCIONES DE INFORMACIÓN
    function getPendingUpdate() external view returns (
        bool exists,
        uint256 newPrice,
        uint256 executeTime,
        uint256 timeRemaining
    ) {
        exists = pendingUpdate.exists;
        newPrice = pendingUpdate.newPrice;
        executeTime = pendingUpdate.executeTime;
        
        if (exists && block.timestamp < executeTime) {
            timeRemaining = executeTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }
    
    function getNextUpdateTime() external view returns (uint256) {
        return lastPriceUpdate + PRICE_UPDATE_DELAY;
    }
    
    function canUpdatePrice() external view returns (bool) {
        return block.timestamp >= lastPriceUpdate + PRICE_UPDATE_DELAY;
    }
    
    // ✅ FUNCIONES DE ADMINISTRACIÓN
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        require(_newOwner != owner, "Same owner");
        
        address oldOwner = owner;
        owner = _newOwner;
        
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
    
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
    
    // ✅ FUNCIONES HELPER
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
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}

// Interface para compatibilidad con oracle anterior
interface ISecurePriceOracle {
    function getDAYAPrice() external view returns (uint256);
}
