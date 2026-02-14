// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importar los contratos seguros
import "./SecurePriceOracle.sol";
import "./SecureEmergencyControls.sol";
import "./SecureStakingLimits.sol";

/**
 * @title SimpleMigrationManager - Gestor de Migración Simplificado
 * @dev Versión simplificada para evitar límites de tamaño de contrato
 */
contract SimpleMigrationManager {
    address public owner;
    bool public migrationCompleted;
    
    // ✅ CONTRATOS ANTERIORES
    address public oldPriceOracle;
    address public oldTokenContract;
    address public oldStakingLimits;
    
    // ✅ NUEVOS CONTRATOS SEGUROS
    address public newPriceOracle;
    address public newEmergencyControls;
    address public newStakingLimits;
    
    // ✅ CONFIGURACIÓN DE MIGRACIÓN
    address[] public emergencySigners;
    uint256 public migrationTimestamp;
    
    event MigrationStarted(address indexed migrator);
    event MigrationStepCompleted(string step, address newContract);
    event MigrationCompleted(address indexed migrator, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier migrationNotCompleted() {
        require(!migrationCompleted, "Migration already completed");
        _;
    }
    
    constructor(
        address _oldPriceOracle,
        address _oldTokenContract,
        address _oldStakingLimits,
        address[] memory _emergencySigners
    ) {
        owner = msg.sender;
        oldPriceOracle = _oldPriceOracle;
        oldTokenContract = _oldTokenContract;
        oldStakingLimits = _oldStakingLimits;
        emergencySigners = _emergencySigners;
    }
    
    // ✅ INICIAR MIGRACIÓN COMPLETA
    function startMigration() external onlyOwner migrationNotCompleted {
        migrationTimestamp = block.timestamp;
        emit MigrationStarted(msg.sender);
        
        // Paso 1: Migrar Oracle de Precios
        _migratePriceOracle();
        
        // Paso 2: Migrar Controles de Emergencia
        _migrateEmergencyControls();
        
        // Paso 3: Migrar Límites de Staking
        _migrateStakingLimits();
        
        // Paso 4: Completar migración
        migrationCompleted = true;
        
        emit MigrationCompleted(msg.sender, block.timestamp);
    }
    
    // ✅ MIGRAR ORACLE DE PRECIOS
    function _migratePriceOracle() internal {
        require(oldPriceOracle != address(0), "Old oracle not set");
        
        // Desplegar nuevo oracle seguro
        newPriceOracle = address(new SecurePriceOracle(oldPriceOracle));
        
        // Verificar migración
        require(newPriceOracle != address(0), "Oracle migration failed");
        
        emit MigrationStepCompleted("priceOracle", newPriceOracle);
    }
    
    // ✅ MIGRAR CONTROLES DE EMERGENCIA
    function _migrateEmergencyControls() internal {
        require(oldTokenContract != address(0), "Old token contract not set");
        require(emergencySigners.length >= 2, "Insufficient emergency signers");
        
        // Desplegar nuevos controles de emergencia
        newEmergencyControls = address(new SecureEmergencyControls(emergencySigners, oldTokenContract));
        
        // Verificar migración
        require(newEmergencyControls != address(0), "Emergency controls migration failed");
        
        emit MigrationStepCompleted("emergencyControls", newEmergencyControls);
    }
    
    // ✅ MIGRAR LÍMITES DE STAKING
    function _migrateStakingLimits() internal {
        require(oldStakingLimits != address(0), "Old staking limits not set");
        
        // Desplegar nuevos límites de staking
        newStakingLimits = address(new SecureStakingLimits(oldStakingLimits));
        
        // Verificar migración
        require(newStakingLimits != address(0), "Staking limits migration failed");
        
        emit MigrationStepCompleted("stakingLimits", newStakingLimits);
    }
    
    // ✅ OBTENER INFORMACIÓN DE MIGRACIÓN
    function getMigrationStatus() external view returns (
        bool completed,
        uint256 timestamp,
        address priceOracle,
        address emergencyControls,
        address stakingLimits
    ) {
        return (
            migrationCompleted,
            migrationTimestamp,
            newPriceOracle,
            newEmergencyControls,
            newStakingLimits
        );
    }
    
    // ✅ OBTENER DIRECCIONES DE CONTRATOS MIGRADOS
    function getMigratedContracts() external view returns (
        address priceOracle,
        address emergencyControls,
        address stakingLimits
    ) {
        return (newPriceOracle, newEmergencyControls, newStakingLimits);
    }
    
    // ✅ FUNCIONES DE ADMINISTRACIÓN
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        require(_newOwner != owner, "Same owner");
        
        owner = _newOwner;
    }
    
    function renounceOwnership() external onlyOwner {
        require(migrationCompleted, "Cannot renounce before migration completion");
        owner = address(0);
    }
}
