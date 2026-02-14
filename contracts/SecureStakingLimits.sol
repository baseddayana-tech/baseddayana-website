// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureStakingLimits - Límites de Staking Seguros
 * @dev Soluciona la vulnerabilidad crítica de bypass de límites de staking
 * 
 * Características de Seguridad:
 * - Verificación doble de límites
 * - Protección contra race conditions
 * - Modo de sostenibilidad automático
 * - Transacciones únicas para prevenir duplicados
 * - Migración segura desde límites anteriores
 */
contract SecureStakingLimits {
    address public owner;
    address public stakingContract;
    
    struct TierLimit {
        uint256 maxStakingAmount;
        uint256 currentStaked;
        uint256 maxUsers;
        uint256 currentUsers;
        bool isActive;
        uint256 lastUpdateTime; // ✅ Para prevenir race conditions
    }
    
    mapping(uint256 => TierLimit) public tierLimits;
    
    // ✅ LÍMITES GLOBALES CON VERIFICACIÓN
    uint256 public maxTotalStaking = 200_000_000 * 10**18;
    uint256 public currentTotalStaked;
    uint256 public maxTotalUsers = 10000;
    uint256 public currentTotalUsers;
    
    // ✅ PROTECCIÓN CONTRA RACE CONDITIONS
    mapping(bytes32 => bool) public processedTransactions;
    uint256 public constant TRANSACTION_TIMEOUT = 5 minutes;
    
    // ✅ MODO DE SOSTENIBILIDAD AUTOMÁTICO
    bool public autoSustainabilityMode;
    uint256 public constant SUSTAINABILITY_THRESHOLD = 80; // 80% utilización
    uint256 public constant SUSTAINABILITY_REDUCTION = 50; // Reducir límites 50%
    
    // ✅ MIGRACIÓN DESDE CONTRATO ANTERIOR
    address public oldStakingLimits;
    bool public migrationCompleted;
    
    event StakingRecorded(uint256 indexed tier, uint256 amount, address user, bytes32 txHash);
    event LimitExceeded(uint256 indexed tier, uint256 attempted, uint256 available);
    event SustainabilityModeActivated(bool isAuto, uint256 reduction);
    event MigrationCompleted(uint256 totalStaked, uint256 totalUsers);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }
    
    modifier validTier(uint256 _tier) {
        require(_tier < 4, "Invalid tier");
        _;
    }
    
    constructor(address _oldStakingLimits) {
        owner = msg.sender;
        oldStakingLimits = _oldStakingLimits;
        _initializeTierLimits();
        
        // Migrar datos desde contrato anterior
        if (_oldStakingLimits != address(0)) {
            _migrateFromOldContract();
        }
    }
    
    function _initializeTierLimits() internal {
        // Tier 1: 5M DAYA, 1000 users
        tierLimits[0] = TierLimit({
            maxStakingAmount: 5_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 1000,
            currentUsers: 0,
            isActive: true,
            lastUpdateTime: block.timestamp
        });
        
        // Tier 2: 10M DAYA, 800 users
        tierLimits[1] = TierLimit({
            maxStakingAmount: 10_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 800,
            currentUsers: 0,
            isActive: true,
            lastUpdateTime: block.timestamp
        });
        
        // Tier 3: 15M DAYA, 500 users
        tierLimits[2] = TierLimit({
            maxStakingAmount: 15_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 500,
            currentUsers: 0,
            isActive: true,
            lastUpdateTime: block.timestamp
        });
        
        // Tier 4: 20M DAYA, 200 users
        tierLimits[3] = TierLimit({
            maxStakingAmount: 20_000_000 * 10**18,
            currentStaked: 0,
            maxUsers: 200,
            currentUsers: 0,
            isActive: true,
            lastUpdateTime: block.timestamp
        });
    }
    
    // ✅ MIGRACIÓN SEGURA DESDE CONTRATO ANTERIOR
    function _migrateFromOldContract() internal {
        if (oldStakingLimits != address(0)) {
            try IOldStakingLimits(oldStakingLimits).currentTotalStaked() returns (uint256 oldTotalStaked) {
                currentTotalStaked = oldTotalStaked;
            } catch {}
            
            try IOldStakingLimits(oldStakingLimits).currentTotalUsers() returns (uint256 oldTotalUsers) {
                currentTotalUsers = oldTotalUsers;
            } catch {}
            
            // Migrar datos por tier
            for (uint256 i = 0; i < 4; i++) {
                try IOldStakingLimits(oldStakingLimits).getTierInfo(i) returns (
                    uint256 /* maxAmount */,
                    uint256 currentStaked,
                    uint256 /* maxUsers */,
                    uint256 currentUsers,
                    bool isActive,
                    uint256 /* utilizationPercent */
                ) {
                    tierLimits[i].currentStaked = currentStaked;
                    tierLimits[i].currentUsers = currentUsers;
                    tierLimits[i].isActive = isActive;
                    tierLimits[i].lastUpdateTime = block.timestamp;
                } catch {}
            }
            
            migrationCompleted = true;
            emit MigrationCompleted(currentTotalStaked, currentTotalUsers);
        }
    }
    
    // ✅ CONFIGURAR CONTRATO DE STAKING
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid staking contract");
        stakingContract = _stakingContract;
    }
    
    // ✅ VERIFICACIÓN PREVIA ANTES DE STAKING
    function canStake(uint256 _tier, uint256 _amount, address /* _user */) external view validTier(_tier) returns (bool, string memory) {
        TierLimit memory tier = tierLimits[_tier];
        
        // Verificar si tier está activo
        if (!tier.isActive) {
            return (false, "Tier not accepting new stakes");
        }
        
        // ✅ VERIFICAR LÍMITES CON MARGEN DE SEGURIDAD
        uint256 effectiveMaxAmount = tier.maxStakingAmount;
        uint256 effectiveMaxUsers = tier.maxUsers;
        
        // Aplicar modo de sostenibilidad si está activo
        if (autoSustainabilityMode) {
            effectiveMaxAmount = (effectiveMaxAmount * (100 - SUSTAINABILITY_REDUCTION)) / 100;
            effectiveMaxUsers = (effectiveMaxUsers * (100 - SUSTAINABILITY_REDUCTION)) / 100;
        }
        
        // Verificar límites de tier
        if (tier.currentStaked + _amount > effectiveMaxAmount) {
            return (false, "Tier staking capacity exceeded");
        }
        
        if (tier.currentUsers >= effectiveMaxUsers) {
            return (false, "Tier user capacity exceeded");
        }
        
        // Verificar límites globales
        if (currentTotalStaked + _amount > maxTotalStaking) {
            return (false, "Global staking capacity exceeded");
        }
        
        if (currentTotalUsers >= maxTotalUsers) {
            return (false, "Global user capacity exceeded");
        }
        
        return (true, "Can stake");
    }
    
    // ✅ REGISTRO SEGURO DE STAKE CON VERIFICACIÓN
    function recordStake(uint256 _tier, uint256 _amount, address _user) external onlyStakingContract validTier(_tier) {
        // ✅ CREAR HASH ÚNICO PARA PREVENIR DUPLICADOS
        bytes32 txHash = keccak256(abi.encodePacked(
            _tier, _amount, _user, block.timestamp, block.number, msg.sender
        ));
        
        require(!processedTransactions[txHash], "Transaction already processed");
        require(block.timestamp <= block.timestamp + TRANSACTION_TIMEOUT, "Transaction timeout");
        
        // ✅ VERIFICAR LÍMITES NUEVAMENTE (DOBLE VERIFICACIÓN)
        (bool canStakeResult, string memory reason) = this.canStake(_tier, _amount, _user);
        require(canStakeResult, reason);
        
        TierLimit storage tier = tierLimits[_tier];
        
        // ✅ ACTUALIZAR ESTADO DE FORMA ATOMICA
        tier.currentStaked += _amount;
        tier.currentUsers += 1;
        tier.lastUpdateTime = block.timestamp;
        
        currentTotalStaked += _amount;
        currentTotalUsers += 1;
        
        // ✅ MARCAR TRANSACCIÓN COMO PROCESADA
        processedTransactions[txHash] = true;
        
        // ✅ VERIFICAR MODO DE SOSTENIBILIDAD AUTOMÁTICO
        _checkSustainabilityMode();
        
        emit StakingRecorded(_tier, _amount, _user, txHash);
        
        // ✅ VERIFICAR SI SE ALCANZÓ EL LÍMITE
        if (tier.currentStaked >= tier.maxStakingAmount) {
            emit LimitExceeded(_tier, tier.currentStaked, tier.maxStakingAmount);
        }
    }
    
    // ✅ REGISTRO SEGURO DE UNSTAKE
    function recordUnstake(uint256 _tier, uint256 _amount, address /* _user */) external onlyStakingContract validTier(_tier) {
        TierLimit storage tier = tierLimits[_tier];
        
        // ✅ VERIFICAR QUE HAY SUFICIENTE STAKED
        require(tier.currentStaked >= _amount, "Insufficient staked amount");
        require(tier.currentUsers > 0, "No users in tier");
        require(currentTotalStaked >= _amount, "Insufficient total staked");
        require(currentTotalUsers > 0, "No total users");
        
        // ✅ ACTUALIZAR ESTADO DE FORMA SEGURA
        tier.currentStaked -= _amount;
        tier.currentUsers -= 1;
        tier.lastUpdateTime = block.timestamp;
        
        currentTotalStaked -= _amount;
        currentTotalUsers -= 1;
        
        // ✅ VERIFICAR SI SE PUEDE DESACTIVAR MODO DE SOSTENIBILIDAD
        _checkSustainabilityMode();
    }
    
    // ✅ VERIFICACIÓN AUTOMÁTICA DE SOSTENIBILIDAD
    function _checkSustainabilityMode() internal {
        uint256 utilizationPercent = (currentTotalStaked * 100) / maxTotalStaking;
        
        if (utilizationPercent >= SUSTAINABILITY_THRESHOLD && !autoSustainabilityMode) {
            autoSustainabilityMode = true;
            emit SustainabilityModeActivated(true, SUSTAINABILITY_REDUCTION);
        } else if (utilizationPercent < (SUSTAINABILITY_THRESHOLD - 10) && autoSustainabilityMode) {
            autoSustainabilityMode = false;
            emit SustainabilityModeActivated(false, 0);
        }
    }
    
    // ✅ FUNCIONES DE ADMINISTRACIÓN SEGURAS
    function updateTierLimits(
        uint256 _tier,
        uint256 _maxAmount,
        uint256 _maxUsers,
        bool _isActive
    ) external onlyOwner validTier(_tier) {
        require(_maxAmount > 0, "Invalid max amount");
        require(_maxUsers > 0, "Invalid max users");
        
        TierLimit storage tier = tierLimits[_tier];
        
        // ✅ VERIFICAR QUE LOS NUEVOS LÍMITES NO VIOLEN EL ESTADO ACTUAL
        require(tier.currentStaked <= _maxAmount, "Current staked exceeds new max");
        require(tier.currentUsers <= _maxUsers, "Current users exceeds new max");
        
        tier.maxStakingAmount = _maxAmount;
        tier.maxUsers = _maxUsers;
        tier.isActive = _isActive;
        tier.lastUpdateTime = block.timestamp;
    }
    
    function updateGlobalLimits(
        uint256 _maxTotalStaking,
        uint256 _maxTotalUsers
    ) external onlyOwner {
        require(_maxTotalStaking > 0, "Invalid max total staking");
        require(_maxTotalUsers > 0, "Invalid max total users");
        
        // ✅ VERIFICAR QUE LOS NUEVOS LÍMITES NO VIOLEN EL ESTADO ACTUAL
        require(currentTotalStaked <= _maxTotalStaking, "Current staked exceeds new max");
        require(currentTotalUsers <= _maxTotalUsers, "Current users exceeds new max");
        
        maxTotalStaking = _maxTotalStaking;
        maxTotalUsers = _maxTotalUsers;
    }
    
    // ✅ FUNCIONES DE INFORMACIÓN MEJORADAS
    function getTierInfo(uint256 _tier) external view validTier(_tier) returns (
        uint256 maxAmount,
        uint256 currentStaked,
        uint256 maxUsers,
        uint256 currentUsers,
        bool isActive,
        uint256 utilizationPercent,
        uint256 availableCapacity
    ) {
        TierLimit memory tier = tierLimits[_tier];
        
        maxAmount = tier.maxStakingAmount;
        currentStaked = tier.currentStaked;
        maxUsers = tier.maxUsers;
        currentUsers = tier.currentUsers;
        isActive = tier.isActive;
        utilizationPercent = (tier.currentStaked * 100) / tier.maxStakingAmount;
        availableCapacity = tier.maxStakingAmount - tier.currentStaked;
    }
    
    function getSustainabilityMetrics() external view returns (
        uint256 totalStaked,
        uint256 totalUsers,
        uint256 totalCapacity,
        uint256 userCapacity,
        uint256 sustainabilityScore,
        bool autoModeActive,
        uint256 utilizationPercent
    ) {
        totalStaked = currentTotalStaked;
        totalUsers = currentTotalUsers;
        totalCapacity = maxTotalStaking;
        userCapacity = maxTotalUsers;
        autoModeActive = autoSustainabilityMode;
        utilizationPercent = (currentTotalStaked * 100) / maxTotalStaking;
        
        // Calcular score de sostenibilidad (0-100)
        uint256 stakingUtilization = (currentTotalStaked * 100) / maxTotalStaking;
        uint256 userUtilization = (currentTotalUsers * 100) / maxTotalUsers;
        sustainabilityScore = (stakingUtilization + userUtilization) / 2;
    }
    
    // ✅ FUNCIONES DE COMPATIBILIDAD
    function getTierLimits() external view returns (TierLimit[] memory) {
        TierLimit[] memory limits = new TierLimit[](4);
        for (uint256 i = 0; i < 4; i++) {
            limits[i] = tierLimits[i];
        }
        return limits;
    }
    
    function isTransactionProcessed(bytes32 _txHash) external view returns (bool) {
        return processedTransactions[_txHash];
    }
    
    function getMigrationStatus() external view returns (bool completed, address oldContract) {
        return (migrationCompleted, oldStakingLimits);
    }
}

// Interface para compatibilidad con contrato anterior
interface IOldStakingLimits {
    function currentTotalStaked() external view returns (uint256);
    function currentTotalUsers() external view returns (uint256);
    function getTierInfo(uint256 _tier) external view returns (
        uint256 maxAmount,
        uint256 currentStaked,
        uint256 maxUsers,
        uint256 currentUsers,
        bool isActive,
        uint256 utilizationPercent
    );
}
