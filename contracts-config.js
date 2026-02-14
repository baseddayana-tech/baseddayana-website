// BASED DAYANA ($DAYA) - Configuración de Contratos
// Configuración centralizada para todos los contratos desplegados

// ABI del contrato DAYATokenStandalone
const DAYA_TOKEN_ABI = [
    // ERC20 Standard Functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    
    // DAYA Token Specific Functions
    "function maxWalletAmount() view returns (uint256)",
    "function maxTxAmount() view returns (uint256)",
    "function tradingEnabled() view returns (bool)",
    "function isExcludedFromLimits(address) view returns (bool)",
    "function emergencyMode() view returns (bool)",
    "function emergencyModeEndTime() view returns (uint256)",
    "function deploymentTime() view returns (uint256)",
    "function ownershipAutoRenounced() view returns (bool)",
    "function isOwnershipAutoRenounced() view returns (bool)",
    "function getTimeUntilAutoRenounce() view returns (uint256)",
    "function getAutoRenounceInfo() view returns (tuple(uint256 deployTime, uint256 renounceTime, bool isRenounced, uint256 timeRemaining))",
    "function getEmergencyModeStatus() view returns (tuple(bool active, uint256 timeRemaining))",
    "function getSecurityInfo() view returns (tuple(string auditStatus, string securityFeatures, string riskLevel, string autoRenounceStatus))",
    "function burn(uint256 amount)",
    
    // Owner Functions (only work before auto-renounce)
    "function enableTrading()",
    "function increaseMaxWalletAmount(uint256 _newAmount)",
    "function increaseMaxTxAmount(uint256 _newAmount)",
    "function excludeFromLimits(address _address, bool _excluded)",
    "function activateEmergencyMode(uint256 _durationHours)",
    "function deactivateEmergencyMode()",
    "function autoUnpause()",
    "function executeAutoRenounce()",
    
    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event TradingEnabled()",
    "event AutoRenounceExecuted(uint256 timestamp)",
    "event EmergencyModeActivated(uint256 endTime)",
    "event EmergencyModeDeactivated()"
];

// ABI del contrato AirdropStandalone
const AIRDROP_ABI = [
    "function dayaToken() view returns (address)",
    "function owner() view returns (address)",
    "function merkleRoot() view returns (bytes32)",
    "function claimDeadline() view returns (uint256)",
    "function hasClaimed(address) view returns (bool)",
    "function startAirdrop(bytes32 _merkleRoot, uint256 _claimDeadline)",
    "function claim(uint256 _amount, bytes32[] calldata _merkleProof)",
    "function recoverTokens()",
    "event AirdropStarted(bytes32 indexed merkleRoot, uint256 claimDeadline)",
    "event TokensClaimed(address indexed claimant, uint256 amount)",
    "event TokensRecovered(uint256 amount)"
];

// ABI del contrato RewardDistributionStandalone
const REWARD_DISTRIBUTION_ABI = [
    "function dayaToken() view returns (address)",
    "function owner() view returns (address)",
    "function poolCount() view returns (uint256)",
    "function createPool(uint256 _totalRewards)",
    "function claimRewards(uint256 _poolId)",
    "function addUserToPool(uint256 _poolId, address _user, uint256 _rewardAmount)",
    "event RewardAdded(uint256 indexed poolId, uint256 reward)",
    "event RewardPaid(address indexed user, uint256 indexed poolId, uint256 reward)"
];

// ABI del contrato StakingStandalone
const STAKING_ABI = [
    "function dayaToken() view returns (address)",
    "function owner() view returns (address)",
    "function stakes(address) view returns (tuple(uint256 amount, uint256 since, uint256 stakingPeriod, uint256 rewards, bool compounded))",
    "function stakingTiers(uint256) view returns (tuple(uint256 period, uint256 apyBps))",
    "function earlyUnstakePenaltyBps() view returns (uint256)",
    "function penaltyWallet() view returns (address)",
    "function stake(uint256 _amount, uint256 _tierIndex)",
    "function unstake()",
    "function calculateRewards(address _staker) view returns (uint256)",
    "function getStakingTiers() view returns (tuple(uint256 period, uint256 apyBps)[])",
    "function getStakeInfo(address _user) view returns (tuple(uint256 amount, uint256 since, uint256 stakingPeriod, uint256 rewards, bool compounded))",
    "event Staked(address indexed user, uint256 amount, uint256 period)",
    "event Unstaked(address indexed user, uint256 amount, uint256 rewards)",
    "event RewardsCompounded(address indexed user, uint256 newAmount)"
];

// ABI del contrato VestingStandalone
const VESTING_ABI = [
    "function dayaToken() view returns (address)",
    "function owner() view returns (address)",
    "function vestingSchedules(address) view returns (tuple(uint256 totalAmount, uint256 start, uint256 cliff, uint256 duration, uint256 released, bool revocable, bool revoked))",
    "function createVestingSchedule(address _beneficiary, uint256 _totalAmount, uint256 _cliff, uint256 _duration, bool _revocable)",
    "function release()",
    "function getReleasableAmount(address _beneficiary) view returns (uint256)",
    "function revokeVesting(address _beneficiary)",
    "event VestingScheduleCreated(address indexed beneficiary, uint256 totalAmount, uint256 start, uint256 duration)",
    "event TokensReleased(address indexed beneficiary, uint256 amount)",
    "event VestingRevoked(address indexed beneficiary)"
];

// ABI del contrato SecurePriceOracle (MIGRADO)
const PRICE_ORACLE_ABI = [
    "function dayaPrice() view returns (uint256)",
    "function owner() view returns (address)",
    "function getDAYAPrice() view returns (uint256)",
    "function getFormattedPrice() view returns (string)",
    "function getPriceInfo() view returns (tuple(uint256 price, uint8 decimals, uint256 lastUpdated, bool isOwned))",
    "function updatePrice(uint256 _newPrice)",
    "function executePendingUpdate()",
    "function cancelPendingUpdate()",
    "function emergencyPriceUpdate(uint256 _newPrice)",
    "function updateFromExternalOracle(uint256 _newPrice)",
    "function getPendingUpdate() view returns (tuple(uint256 newPrice, uint256 executeTime, bool exists))",
    "function getPriceChangeLimits() view returns (uint256 maxChangeBps, uint256 minChangeBps, uint256 largeChangeThreshold, uint256 largeChangeDelay)",
    "function transferOwnership(address _newOwner)",
    "function renounceOwnership()",
    "event PriceUpdated(uint256 indexed oldPrice, uint256 indexed newPrice, uint256 timestamp, address updatedBy)",
    "event PriceUpdateRequested(uint256 indexed oldPrice, uint256 indexed newPrice, uint256 executeTime)",
    "event PendingUpdateExecuted(uint256 indexed newPrice, uint256 timestamp)",
    "event PendingUpdateCancelled(uint256 indexed cancelledPrice, uint256 timestamp)",
    "event EmergencyPriceUpdate(uint256 indexed newPrice, uint256 timestamp, string reason)",
    "event ExternalOracleUpdate(uint256 indexed newPrice, uint256 timestamp, string source)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

// ABI del contrato SecureTimestampManager
const TIMESTAMP_MANAGER_ABI = [
    "function getSafeTimestamp() view returns (uint256)",
    "function isTimestampSafe(uint256 _timestamp) view returns (bool)",
    "function getTimestampWithTolerance(uint256 _maxDeviation) view returns (uint256)",
    "function getTimeRemaining(uint256 _endTime) view returns (uint256)",
    "function isDeadlinePassed(uint256 _deadline) view returns (bool)",
    "function getTimestampHistory(uint256 _fromBlock, uint256 _toBlock) view returns (uint256[])",
    "event TimestampValidationFailed(uint256 blockTimestamp, uint256 expectedRange, string reason)",
    "event TimestampManipulationDetected(uint256 blockTimestamp, uint256 previousTimestamp, uint256 deviation)"
];

// ABI del contrato SecureGovernance
const GOVERNANCE_ABI = [
    "function createProposal(string memory _description) returns (uint256)",
    "function vote(uint256 _proposalId, bool _support)",
    "function executeProposal(uint256 _proposalId)",
    "function lockStaking(uint256 _amount, uint256 _lockDuration)",
    "function unlockStaking()",
    "function getVotingPower(address _user) view returns (uint256)",
    "function getProposal(uint256 _proposalId) view returns (tuple(uint256 id, address proposer, string description, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled))",
    "function getUserLock(address _user) view returns (tuple(uint256 amount, uint256 lockEndTime, bool isLocked))",
    "function canCreateProposal(address _user) view returns (bool)",
    "function setStakingContract(address _stakingContract)",
    "function emergencyUnlock(address _user)",
    "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime)",
    "event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
    "event ProposalExecuted(uint256 indexed proposalId)",
    "event StakingLocked(address indexed user, uint256 amount, uint256 lockEndTime)",
    "event StakingUnlocked(address indexed user, uint256 amount)"
];

// ABI del contrato SecureStakingLimits (MIGRADO)
const STAKING_LIMITS_ABI = [
    // Funciones básicas
    "function owner() view returns (address)",
    "function maxTotalStaking() view returns (uint256)",
    "function currentTotalStaked() view returns (uint256)",
    "function maxTotalUsers() view returns (uint256)",
    "function currentTotalUsers() view returns (uint256)",
    "function stakingContract() view returns (address)",
    "function autoSustainabilityMode() view returns (bool)",
    "function sustainabilityThreshold() view returns (uint256)",
    
    // Funciones de configuración
    "function setStakingContract(address _stakingContract)",
    "function updateTierLimits(uint256 _tier, uint256 _maxAmount, uint256 _maxUsers)",
    "function updateGlobalLimits(uint256 _maxTotalStaking, uint256 _maxTotalUsers)",
    
    // Funciones de verificación mejoradas
    "function canStake(uint256 _tier, uint256 _amount, address _user) view returns (bool, string memory)",
    "function getTierInfo(uint256 _tier) view returns (tuple(uint256 maxAmount, uint256 maxUsers, uint256 currentStaked, uint256 currentUsers))",
    "function getSustainabilityMetrics() view returns (tuple(uint256 totalStaked, uint256 totalUsers, uint256 totalCapacity, uint256 userCapacity, uint256 sustainabilityScore, bool autoModeActive, uint256 utilizationPercent))",
    
    // Funciones de registro con verificación doble
    "function recordStake(uint256 _tier, uint256 _amount, address _user)",
    "function recordUnstake(uint256 _tier, uint256 _amount, address _user)",
    
    // Eventos
    "event StakingCapacityUpdated(uint256 totalStaked, uint256 totalUsers)",
    "event TierLimitsUpdated(uint256 indexed tier, uint256 maxAmount, uint256 maxUsers)",
    "event GlobalLimitsUpdated(uint256 maxTotalStaking, uint256 maxTotalUsers)",
    "event SustainabilityModeActivated(bool isAuto, uint256 reduction)",
    "event StakingRecorded(uint256 indexed tier, uint256 amount, address indexed user, bool isStake)",
    "event TransactionProcessed(bytes32 indexed txHash, bool success)"
];

// Configuración de contratos
const CONTRACTS_CONFIG = {
    // Direcciones de contratos verificados en Base Mainnet
    ADDRESSES: {
        DAYA_TOKEN: "0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A",
        AIRDROP: "0xE406833d7f473B43FB2729C8d8D8D8FA3861Efc42b",
        REWARD_DISTRIBUTION: "0x0f42246448497Ee6206465Cd59a3EdEdF61FF513",
        STAKING: "0x9EDb752c8Afae710c637Fe08ca0f822AEaEcbE8D",
        VESTING: "0x9cd187f6bCf624c230d21de05Df7d23343Dea16A",
        PRICE_ORACLE: "0x54dcd3d9fc04f94451b386bf656d4c7804be98d4",
        STAKING_LIMITS: "0x8c6ef5cec6cf374f037be1cf22bb576e25a7a2ed",
        EMERGENCY_CONTROLS: "0x4411fcd7f1c73223335de741b707a6a8824567a5",
        TIMESTAMP_MANAGER: "0xd9225b00810b70955576306a18B6c1A578809256",
        GOVERNANCE: "0x137A928c7bec8A8E0eb19e3324b46e1298583B5E",
        MIGRATION_MANAGER: "0x0683985b13A5D7dE0493cAF225C5983cb3EE1292"
    },
    
    // Configuración de red
    NETWORK: {
        name: "Base Mainnet",
        chainId: 8453,
        rpcUrl: "https://mainnet.base.org",
        blockExplorer: "https://basescan.org"
    },
    
    // Configuración de tokens
    TOKEN: {
        name: "BASED DAYANA",
        symbol: "DAYA",
        decimals: 18,
        totalSupply: "1000000000000000000000000000", // 1 billion tokens
        maxWalletAmount: "20000000000000000000000000", // 2% of total supply
        maxTxAmount: "20000000000000000000000000" // 2% of total supply
    },
    
    // Configuración de staking - SOSTENIBLE
    STAKING: {
        tiers: [
            { period: 30, apy: 8 }, // 30 days, 8% APY (sostenible)
            { period: 90, apy: 12 }, // 90 days, 12% APY (sostenible)
            { period: 180, apy: 15 }, // 180 days, 15% APY (sostenible)
            { period: 365, apy: 20 } // 365 days, 20% APY (sostenible)
        ],
        earlyUnstakePenalty: 25, // 25% penalty
        // Límites de sostenibilidad
        limits: {
            maxTotalStaking: "200000000000000000000000000", // 20% del supply total
            maxUsersPerTier: [1000, 800, 500, 200], // Max usuarios por tier
            maxAmountPerTier: [
                "5000000000000000000000000",   // Tier 1: 5M DAYA
                "10000000000000000000000000",  // Tier 2: 10M DAYA
                "15000000000000000000000000",  // Tier 3: 15M DAYA
                "20000000000000000000000000"   // Tier 4: 20M DAYA
            ]
        }
    },
    
    // Configuración de auto-renounce
    AUTO_RENOUNCE: {
        delay: 60 * 24 * 60 * 60, // 60 days in seconds
        enabled: true
    }
};

// Función para obtener contrato
function getContract(contractName, signer) {
    const { ethers } = window;
    
    if (!ethers) {
        throw new Error('Ethers.js no está cargado');
    }
    
    const address = CONTRACTS_CONFIG.ADDRESSES[contractName];
    if (!address) {
        throw new Error(`Dirección no encontrada para ${contractName}`);
    }
    
    let abi;
    switch (contractName) {
        case 'DAYA_TOKEN':
            abi = DAYA_TOKEN_ABI;
            break;
        case 'AIRDROP':
            abi = AIRDROP_ABI;
            break;
        case 'REWARD_DISTRIBUTION':
            abi = REWARD_DISTRIBUTION_ABI;
            break;
        case 'STAKING':
            abi = STAKING_ABI;
            break;
        case 'VESTING':
            abi = VESTING_ABI;
            break;
        case 'PRICE_ORACLE':
            abi = PRICE_ORACLE_ABI;
            break;
        case 'STAKING_LIMITS':
            abi = STAKING_LIMITS_ABI;
            break;
        case 'TIMESTAMP_MANAGER':
            abi = TIMESTAMP_MANAGER_ABI;
            break;
        case 'GOVERNANCE':
            abi = GOVERNANCE_ABI;
            break;
        default:
            throw new Error(`ABI no encontrada para ${contractName}`);
    }
    
    // Compatible con ethers v6
    return new ethers.Contract(address, abi, signer);
}

// Función para formatear cantidad de tokens
function formatTokenAmount(amount, decimals = 18) {
    if (!amount || amount === '0' || amount === 0) return '0';
    
    // Convertir a BigInt si es necesario
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : BigInt(amount.toString());
    const divisor = BigInt(10 ** decimals);
    
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;
    
    if (fractionalPart === 0n) {
        return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
        return wholePart.toString();
    }
    
    return `${wholePart}.${trimmedFractional}`;
}

// Función para parsear cantidad de tokens
function parseTokenAmount(amount, decimals = 18) {
    if (!amount || amount === '0' || amount === 0) return 0n;
    
    const amountStr = amount.toString();
    const [wholePart, fractionalPart = ''] = amountStr.split('.');
    
    // Validar que la parte entera sea un número válido
    if (!/^\d+$/.test(wholePart)) {
        throw new Error('Invalid amount format');
    }
    
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    const wholeBigInt = BigInt(wholePart) * BigInt(10 ** decimals);
    const fractionalBigInt = BigInt(paddedFractional);
    
    return wholeBigInt + fractionalBigInt;
}

// Función para verificar red correcta
function isCorrectNetwork(chainId) {
    return chainId === CONTRACTS_CONFIG.NETWORK.chainId;
}

// Función para actualizar dirección de contrato
function updateContractAddress(contractName, newAddress) {
    if (CONTRACTS_CONFIG.ADDRESSES[contractName] !== undefined) {
        CONTRACTS_CONFIG.ADDRESSES[contractName] = newAddress;
        console.log(`✅ Dirección actualizada para ${contractName}: ${newAddress}`);
    } else {
        console.error(`❌ Contrato ${contractName} no encontrado en configuración`);
    }
}

// Función para obtener información de red
function getNetworkInfo() {
    return CONTRACTS_CONFIG.NETWORK;
}

// Función para obtener información del token
function getTokenInfo() {
    return CONTRACTS_CONFIG.TOKEN;
}

// Función para obtener configuración de staking
function getStakingConfig() {
    return CONTRACTS_CONFIG.STAKING;
}

// Función para obtener configuración de auto-renounce
function getAutoRenounceConfig() {
    return CONTRACTS_CONFIG.AUTO_RENOUNCE;
}

// Función para obtener precio de DAYA desde el Oracle (optimizada)
async function getDAYAPrice(provider = null) {
    try {
        // Quick check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers not loaded');
        }
        
        // Use fallback provider for read-only operations
        if (!provider) {
            provider = new ethers.providers.JsonRpcProvider(CONTRACTS_CONFIG.NETWORK.rpcUrl);
        }
        
        const oracle = getContract('PRICE_ORACLE', provider);
        
        // Add timeout to the contract call
        const price = await Promise.race([
            oracle.getDAYAPrice(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Contract call timeout')), 2500)
            )
        ]);
        
        // Convert from 6 decimals to float (price / 1000000)
        const priceFloat = parseFloat(price.toString()) / 1000000;
        
        // Validate price is reasonable
        if (priceFloat <= 0 || priceFloat > 1000) {
            throw new Error('Invalid price received: ' + priceFloat);
        }
        
        return priceFloat;
        
    } catch (error) {
        console.warn('Error fetching price from Oracle, using fallback:', error.message);
        return 0.005; // Fallback price
    }
}

// Función para formatear precio en USD
function formatUSDPrice(dayaAmount, pricePerDAYA = null) {
    if (pricePerDAYA === null) {
        return '$0.00'; // Return placeholder if no price
    }
    const usdValue = parseFloat(dayaAmount) * pricePerDAYA;
    return `$${usdValue.toFixed(3)}`;
}

// Función para configurar StakingLimits con el contrato de staking
async function configureStakingLimits(signer) {
    try {
        if (!signer) {
            throw new Error("Signer is required");
        }

        const stakingLimits = getContract('STAKING_LIMITS', signer);
        const stakingAddress = CONTRACTS_CONFIG.ADDRESSES.STAKING;

        console.log('🔧 Configuring StakingLimits...');
        console.log('Staking contract address:', stakingAddress);

        // Verificar que el signer sea el owner del contrato
        const owner = await stakingLimits.owner();
        const signerAddress = await signer.getAddress();
        
        console.log('Contract owner:', owner);
        console.log('Signer address:', signerAddress);
        
        if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
            throw new Error(`Only the contract owner (${owner}) can configure StakingLimits`);
        }

        // Verificar si ya está configurado
        const currentStakingContract = await stakingLimits.stakingContract();
        if (currentStakingContract !== '0x0000000000000000000000000000000000000000') {
            console.log('⚠️ StakingLimits is already configured with:', currentStakingContract);
            if (currentStakingContract.toLowerCase() === stakingAddress.toLowerCase()) {
                console.log('✅ StakingLimits is already correctly configured');
                return true;
            }
        }

        const tx = await stakingLimits.setStakingContract(stakingAddress);
        console.log('Transaction sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('✅ StakingLimits configured successfully');
        console.log('Gas used:', receipt.gasUsed.toString());

        return true;
    } catch (error) {
        console.error('❌ Failed to configure StakingLimits:', error);
        return false;
    }
}

// Función para obtener métricas de sostenibilidad
async function getSustainabilityMetrics(provider = null) {
    try {
        if (!provider) {
            provider = new ethers.providers.JsonRpcProvider(CONTRACTS_CONFIG.NETWORK.rpcUrl);
        }
        
        const stakingLimits = getContract('STAKING_LIMITS', provider);
        
        // Obtener métricas básicas del contrato (funciones que existen)
        const totalStaked = await stakingLimits.currentTotalStaked();
        const totalUsers = await stakingLimits.currentTotalUsers();
        const totalCapacity = await stakingLimits.maxTotalStaking();
        const userCapacity = await stakingLimits.maxTotalUsers();
        
        // Calcular sustainability score manualmente
        const stakingUtilization = totalCapacity.gt(0) ? 
            totalStaked.mul(10000).div(totalCapacity) : ethers.BigNumber.from(0);
        const userUtilization = userCapacity.gt(0) ? 
            totalUsers.mul(10000).div(userCapacity) : ethers.BigNumber.from(0);
        
        const sustainabilityScore = stakingUtilization.add(userUtilization).div(2);
        
        return {
            totalStaked: formatTokenAmount(totalStaked),
            totalUsers: totalUsers.toString(),
            totalCapacity: formatTokenAmount(totalCapacity),
            userCapacity: userCapacity.toString(),
            sustainabilityScore: Math.max(0, 100 - sustainabilityScore.toNumber() / 100).toString()
        };
    } catch (error) {
        console.warn('Error obteniendo métricas de sostenibilidad:', error);
        return null;
    }
}

// Hacer funciones globales
window.CONTRACTS_CONFIG = CONTRACTS_CONFIG;
window.getContract = getContract;
window.formatTokenAmount = formatTokenAmount;
window.parseTokenAmount = parseTokenAmount;
window.isCorrectNetwork = isCorrectNetwork;
window.updateContractAddress = updateContractAddress;
window.getNetworkInfo = getNetworkInfo;
window.getTokenInfo = getTokenInfo;
window.getStakingConfig = getStakingConfig;
window.getAutoRenounceConfig = getAutoRenounceConfig;
window.getDAYAPrice = getDAYAPrice;
window.formatUSDPrice = formatUSDPrice;
window.configureStakingLimits = configureStakingLimits;
window.getSustainabilityMetrics = getSustainabilityMetrics;