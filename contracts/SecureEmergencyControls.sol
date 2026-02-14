// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureEmergencyControls - Controles de Emergencia Seguros
 * @dev Soluciona la vulnerabilidad crítica de abuso del modo de emergencia
 * 
 * Características de Seguridad:
 * - Multisig requerido (mínimo 2 firmas)
 * - Cooldown de 7 días entre activaciones
 * - Duración máxima reducida (24h)
 * - Auto-desactivación al expirar
 * - Migración segura desde controles anteriores
 */
contract SecureEmergencyControls {
    bool public emergencyMode;
    uint256 public emergencyModeEndTime;
    address public owner;
    
    // ✅ PROTECCIONES CONTRA ABUSO
    uint256 public lastEmergencyActivation;
    uint256 public constant EMERGENCY_COOLDOWN = 7 days;
    uint256 public constant MAX_EMERGENCY_DURATION = 24 hours; // Reducido de 72h
    uint256 public constant MIN_EMERGENCY_DURATION = 1 hours;
    
    // ✅ MULTISIG PARA EMERGENCIAS
    address[] public emergencySigners;
    mapping(address => bool) public isEmergencySigner;
    uint256 public constant REQUIRED_SIGNATURES = 2; // Mínimo 2 firmas
    
    struct EmergencyRequest {
        uint256 duration;
        uint256 requestTime;
        mapping(address => bool) signatures;
        uint256 signatureCount;
        bool executed;
    }
    
    mapping(uint256 => EmergencyRequest) public emergencyRequests;
    uint256 public requestCounter;
    
    // ✅ MIGRACIÓN DESDE CONTRATOS ANTERIORES
    address public oldTokenContract;
    bool public migrationCompleted;
    
    event EmergencyRequested(uint256 indexed requestId, uint256 duration, address requester);
    event EmergencySigned(uint256 indexed requestId, address signer);
    event EmergencyActivated(uint256 indexed requestId, uint256 endTime);
    event EmergencyDeactivated();
    event MigrationCompleted(bool emergencyMode, uint256 endTime);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyEmergencySigner() {
        require(isEmergencySigner[msg.sender], "Not emergency signer");
        _;
    }
    
    constructor(address[] memory _emergencySigners, address _oldTokenContract) {
        owner = msg.sender;
        oldTokenContract = _oldTokenContract;
        
        require(_emergencySigners.length >= REQUIRED_SIGNATURES, "Insufficient signers");
        
        for (uint256 i = 0; i < _emergencySigners.length; i++) {
            require(_emergencySigners[i] != address(0), "Invalid signer");
            emergencySigners.push(_emergencySigners[i]);
            isEmergencySigner[_emergencySigners[i]] = true;
        }
        
        // Migrar estado de emergencia si existe
        if (_oldTokenContract != address(0)) {
            _migrateEmergencyState();
        }
    }
    
    // ✅ MIGRACIÓN SEGURA DESDE CONTRATO ANTERIOR
    function _migrateEmergencyState() internal {
        if (oldTokenContract != address(0)) {
            try IOldTokenContract(oldTokenContract).emergencyMode() returns (bool oldEmergencyMode) {
                if (oldEmergencyMode) {
                    try IOldTokenContract(oldTokenContract).emergencyModeEndTime() returns (uint256 oldEndTime) {
                        if (oldEndTime > block.timestamp) {
                            emergencyMode = true;
                            emergencyModeEndTime = oldEndTime;
                            lastEmergencyActivation = block.timestamp - (oldEndTime - block.timestamp);
                        }
                    } catch {}
                }
            } catch {}
            
            migrationCompleted = true;
            emit MigrationCompleted(emergencyMode, emergencyModeEndTime);
        }
    }
    
    // ✅ SOLICITUD DE EMERGENCIA (REQUIERE MULTISIG)
    function requestEmergencyMode(uint256 _durationHours) external onlyEmergencySigner {
        require(_durationHours >= MIN_EMERGENCY_DURATION && _durationHours <= MAX_EMERGENCY_DURATION, "Invalid duration");
        require(block.timestamp >= lastEmergencyActivation + EMERGENCY_COOLDOWN, "Emergency cooldown active");
        require(!emergencyMode, "Emergency mode already active");
        
        uint256 requestId = requestCounter++;
        EmergencyRequest storage request = emergencyRequests[requestId];
        
        request.duration = _durationHours;
        request.requestTime = block.timestamp;
        request.signatures[msg.sender] = true;
        request.signatureCount = 1;
        
        emit EmergencyRequested(requestId, _durationHours, msg.sender);
    }
    
    // ✅ FIRMAR SOLICITUD DE EMERGENCIA
    function signEmergencyRequest(uint256 _requestId) external onlyEmergencySigner {
        EmergencyRequest storage request = emergencyRequests[_requestId];
        require(request.requestTime > 0, "Request not found");
        require(!request.executed, "Request already executed");
        require(!request.signatures[msg.sender], "Already signed");
        require(block.timestamp <= request.requestTime + 1 hours, "Request expired");
        
        request.signatures[msg.sender] = true;
        request.signatureCount++;
        
        emit EmergencySigned(_requestId, msg.sender);
        
        // ✅ EJECUTAR SI SE TIENEN SUFICIENTES FIRMAS
        if (request.signatureCount >= REQUIRED_SIGNATURES) {
            _executeEmergencyMode(_requestId);
        }
    }
    
    // ✅ EJECUTAR MODO DE EMERGENCIA
    function _executeEmergencyMode(uint256 _requestId) internal {
        EmergencyRequest storage request = emergencyRequests[_requestId];
        
        emergencyMode = true;
        emergencyModeEndTime = block.timestamp + (request.duration * 1 hours);
        lastEmergencyActivation = block.timestamp;
        request.executed = true;
        
        emit EmergencyActivated(_requestId, emergencyModeEndTime);
    }
    
    // ✅ DESACTIVAR EMERGENCIA (AUTOMÁTICO O MANUAL)
    function deactivateEmergencyMode() external {
        require(emergencyMode, "Emergency mode not active");
        require(
            msg.sender == owner || 
            block.timestamp > emergencyModeEndTime ||
            isEmergencySigner[msg.sender],
            "Not authorized"
        );
        
        emergencyMode = false;
        emergencyModeEndTime = 0;
        
        emit EmergencyDeactivated();
    }
    
    // ✅ AUTO-DESACTIVACIÓN CUANDO EXPIRA
    function autoDeactivateEmergency() external {
        require(emergencyMode && block.timestamp > emergencyModeEndTime, "Emergency not expired");
        
        emergencyMode = false;
        emergencyModeEndTime = 0;
        
        emit EmergencyDeactivated();
    }
    
    // ✅ FUNCIONES DE ADMINISTRACIÓN
    function addEmergencySigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer");
        require(!isEmergencySigner[_signer], "Already signer");
        
        emergencySigners.push(_signer);
        isEmergencySigner[_signer] = true;
    }
    
    function removeEmergencySigner(address _signer) external onlyOwner {
        require(isEmergencySigner[_signer], "Not signer");
        require(emergencySigners.length > REQUIRED_SIGNATURES, "Cannot remove below minimum");
        
        isEmergencySigner[_signer] = false;
        
        // Remover de array
        for (uint256 i = 0; i < emergencySigners.length; i++) {
            if (emergencySigners[i] == _signer) {
                emergencySigners[i] = emergencySigners[emergencySigners.length - 1];
                emergencySigners.pop();
                break;
            }
        }
    }
    
    // ✅ FUNCIONES DE INFORMACIÓN
    function getEmergencyStatus() external view returns (
        bool active,
        uint256 endTime,
        uint256 timeRemaining,
        uint256 cooldownRemaining
    ) {
        active = emergencyMode && block.timestamp <= emergencyModeEndTime;
        endTime = emergencyModeEndTime;
        
        if (active) {
            timeRemaining = emergencyModeEndTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
        
        if (block.timestamp < lastEmergencyActivation + EMERGENCY_COOLDOWN) {
            cooldownRemaining = (lastEmergencyActivation + EMERGENCY_COOLDOWN) - block.timestamp;
        } else {
            cooldownRemaining = 0;
        }
    }
    
    function getEmergencySigners() external view returns (address[] memory) {
        return emergencySigners;
    }
    
    function getPendingRequests() external view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](requestCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < requestCounter; i++) {
            EmergencyRequest storage request = emergencyRequests[i];
            if (request.requestTime > 0 && !request.executed && block.timestamp <= request.requestTime + 1 hours) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
    
    function getRequestInfo(uint256 _requestId) external view returns (
        uint256 duration,
        uint256 requestTime,
        uint256 signatureCount,
        bool executed,
        bool expired
    ) {
        EmergencyRequest storage request = emergencyRequests[_requestId];
        duration = request.duration;
        requestTime = request.requestTime;
        signatureCount = request.signatureCount;
        executed = request.executed;
        expired = block.timestamp > request.requestTime + 1 hours;
    }
    
    // ✅ FUNCIONES DE COMPATIBILIDAD
    function whenNotPaused() external view returns (bool) {
        return !emergencyMode || block.timestamp > emergencyModeEndTime;
    }
    
    function isEmergencyActive() external view returns (bool) {
        return emergencyMode && block.timestamp <= emergencyModeEndTime;
    }
}

// Interface para compatibilidad con contrato anterior
interface IOldTokenContract {
    function emergencyMode() external view returns (bool);
    function emergencyModeEndTime() external view returns (uint256);
}
