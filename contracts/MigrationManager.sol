// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importar los contratos seguros
import "./SecurePriceOracle.sol";
import "./SecureEmergencyControls.sol";
import "./SecureStakingLimits.sol";

/**
 * @title MigrationManager - Gestor de Migración Segura
 * @dev Coordina la migración segura de las 3 vulnerabilidades críticas
 * 
 * Funcionalidades:
 * - Migración atómica de todos los contratos
 * - Verificación de integridad post-migración
 * - Rollback en caso de problemas
 * - Actualización de referencias
 */
contract MigrationManager {
    address public owner;
    bool public migrationCompleted;
    bool public rollbackEnabled;
    
    // ✅ CONTRATOS ANTERIORES
    address public oldPriceOracle;
    address public oldTokenContract;
    address public oldStakingLimits;
    
    // ✅ NUEVOS CONTRATOS SEGUROS
    address public newPriceOracle;
    address public newEmergencyControls;
    address public newStakingLimits;
    
    // ✅ ESTADO DE MIGRACIÓN
    mapping(string => bool) public migrationSteps;
    mapping(string => address) public migratedContracts;
    
    // ✅ CONFIGURACIÓN DE MIGRACIÓN
    address[] public emergencySigners;
    uint256 public migrationTimestamp;
    
    event MigrationStarted(address indexed migrator);
    event MigrationStepCompleted(string step, address newContract);
    event MigrationCompleted(address indexed migrator, uint256 timestamp);
    event RollbackExecuted(address indexed migrator, string reason);
    
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
        rollbackEnabled = true;
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
        
        // Paso 4: Verificar integridad
        _verifyMigrationIntegrity();
        
        // Paso 5: Completar migración
        migrationCompleted = true;
        rollbackEnabled = false; // Deshabilitar rollback después de completar
        
        emit MigrationCompleted(msg.sender, block.timestamp);
    }
    
    // ✅ MIGRAR ORACLE DE PRECIOS
    function _migratePriceOracle() internal {
        require(oldPriceOracle != address(0), "Old oracle not set");
        
        // Desplegar nuevo oracle seguro
        // Nota: En producción, esto se haría con CREATE2 para dirección predecible
        newPriceOracle = address(new SecurePriceOracle(oldPriceOracle));
        
        // Verificar migración
        require(newPriceOracle != address(0), "Oracle migration failed");
        
        migrationSteps["priceOracle"] = true;
        migratedContracts["priceOracle"] = newPriceOracle;
        
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
        
        migrationSteps["emergencyControls"] = true;
        migratedContracts["emergencyControls"] = newEmergencyControls;
        
        emit MigrationStepCompleted("emergencyControls", newEmergencyControls);
    }
    
    // ✅ MIGRAR LÍMITES DE STAKING
    function _migrateStakingLimits() internal {
        require(oldStakingLimits != address(0), "Old staking limits not set");
        
        // Desplegar nuevos límites de staking
        newStakingLimits = address(new SecureStakingLimits(oldStakingLimits));
        
        // Verificar migración
        require(newStakingLimits != address(0), "Staking limits migration failed");
        
        migrationSteps["stakingLimits"] = true;
        migratedContracts["stakingLimits"] = newStakingLimits;
        
        emit MigrationStepCompleted("stakingLimits", newStakingLimits);
    }
    
    // ✅ VERIFICAR INTEGRIDAD DE MIGRACIÓN
    function _verifyMigrationIntegrity() internal view {
        require(newPriceOracle != address(0), "Price oracle not migrated");
        require(newEmergencyControls != address(0), "Emergency controls not migrated");
        require(newStakingLimits != address(0), "Staking limits not migrated");
        
        // Verificar que los contratos nuevos funcionan
        try ISecurePriceOracle(newPriceOracle).getDAYAPrice() returns (uint256 price) {
            require(price > 0, "Invalid oracle price");
        } catch {
            revert("Oracle verification failed");
        }
        
        try ISecureEmergencyControls(newEmergencyControls).getEmergencySigners() returns (address[] memory signers) {
            require(signers.length >= 2, "Insufficient emergency signers");
        } catch {
            revert("Emergency controls verification failed");
        }
        
        try ISecureStakingLimits(newStakingLimits).getSustainabilityMetrics() returns (
            uint256 /* totalStaked */,
            uint256 /* totalUsers */,
            uint256 /* totalCapacity */,
            uint256 /* userCapacity */,
            uint256 /* sustainabilityScore */,
            bool /* autoModeActive */,
            uint256 /* utilizationPercent */
        ) {
            require(true, "Staking limits verified");
        } catch {
            revert("Staking limits verification failed");
        }
    }
    
    // ✅ OBTENER INFORMACIÓN DE MIGRACIÓN
    function getMigrationStatus() external view returns (
        bool completed,
        uint256 timestamp,
        address priceOracle,
        address emergencyControls,
        address stakingLimits,
        bool rollbackAvailable
    ) {
        return (
            migrationCompleted,
            migrationTimestamp,
            newPriceOracle,
            newEmergencyControls,
            newStakingLimits,
            rollbackEnabled
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
    
    // ✅ VERIFICAR ESTADO DE MIGRACIÓN
    function verifyMigrationHealth() external view returns (
        bool oracleHealthy,
        bool emergencyHealthy,
        bool stakingHealthy,
        string memory status
    ) {
        oracleHealthy = false;
        emergencyHealthy = false;
        stakingHealthy = false;
        
        // Verificar Oracle
        try ISecurePriceOracle(newPriceOracle).getDAYAPrice() returns (uint256) {
            oracleHealthy = true;
        } catch {}
        
        // Verificar Emergency Controls
        try ISecureEmergencyControls(newEmergencyControls).getEmergencySigners() returns (address[] memory) {
            emergencyHealthy = true;
        } catch {}
        
        // Verificar Staking Limits
        try ISecureStakingLimits(newStakingLimits).getSustainabilityMetrics() returns (
            uint256, uint256, uint256, uint256, uint256, bool, uint256
        ) {
            stakingHealthy = true;
        } catch {}
        
        if (oracleHealthy && emergencyHealthy && stakingHealthy) {
            status = "All systems healthy";
        } else if (oracleHealthy && emergencyHealthy) {
            status = "Oracle and Emergency healthy, Staking issues";
        } else if (oracleHealthy && stakingHealthy) {
            status = "Oracle and Staking healthy, Emergency issues";
        } else if (emergencyHealthy && stakingHealthy) {
            status = "Emergency and Staking healthy, Oracle issues";
        } else {
            status = "Multiple systems unhealthy";
        }
    }
    
    // ✅ ROLLBACK DE EMERGENCIA (solo si está habilitado)
    function emergencyRollback(string memory _reason) external onlyOwner {
        require(rollbackEnabled, "Rollback not available");
        require(!migrationCompleted, "Cannot rollback completed migration");
        
        // Resetear estado de migración
        migrationSteps["priceOracle"] = false;
        migrationSteps["emergencyControls"] = false;
        migrationSteps["stakingLimits"] = false;
        
        newPriceOracle = address(0);
        newEmergencyControls = address(0);
        newStakingLimits = address(0);
        
        emit RollbackExecuted(msg.sender, _reason);
    }
    
    // ✅ ACTUALIZAR CONFIGURACIÓN DE MIGRACIÓN
    function updateMigrationConfig(
        address[] memory _newEmergencySigners
    ) external onlyOwner migrationNotCompleted {
        require(_newEmergencySigners.length >= 2, "Insufficient signers");
        emergencySigners = _newEmergencySigners;
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

// Interfaces para verificación
interface ISecureEmergencyControls {
    function getEmergencySigners() external view returns (address[] memory);
}

interface ISecureStakingLimits {
    function getSustainabilityMetrics() external view returns (
        uint256 totalStaked,
        uint256 totalUsers,
        uint256 totalCapacity,
        uint256 userCapacity,
        uint256 sustainabilityScore,
        bool autoModeActive,
        uint256 utilizationPercent
    );
}
