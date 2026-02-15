export const CONTRACT_ABIS = {
    DAYA_TOKEN: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function maxWalletAmount() view returns (uint256)",
        "function maxTxAmount() view returns (uint256)",
        "function tradingEnabled() view returns (bool)",
        "function getTimeUntilAutoRenounce() view returns (uint256)",
        "function getAutoRenounceInfo() view returns (tuple(uint256 deployTime, uint256 renounceTime, bool isRenounced, uint256 timeRemaining))",
    ],
    AIRDROP: [
        "function dayaToken() view returns (address)",
        "function merkleRoot() view returns (bytes32)",
        "function claimDeadline() view returns (uint256)",
        "function hasClaimed(address) view returns (bool)",
        "function claim(uint256 _amount, bytes32[] calldata _merkleProof)",
    ],
    STAKING: [
        "function stakes(address) view returns (tuple(uint256 amount, uint256 since, uint256 stakingPeriod, uint256 rewards, bool compounded))",
        "function stake(uint256 _amount, uint256 _tierIndex)",
        "function unstake()",
        "function calculateRewards(address _staker) view returns (uint256)",
        "function getStakingTiers() view returns (tuple(uint256 period, uint256 apyBps)[])",
        "function earlyUnstakePenaltyBps() view returns (uint256)",
    ],
    VESTING: [
        "function vestingSchedules(address) view returns (tuple(uint256 totalAmount, uint256 start, uint256 cliff, uint256 duration, uint256 released, bool revocable, bool revoked))",
        "function getReleasableAmount(address) view returns (uint256)",
    ],
    PRICE_ORACLE: [
        "function getDAYAPrice() view returns (uint256)",
        "function getFormattedPrice() view returns (string)",
    ],
    STAKING_LIMITS: [
        "function currentTotalStaked() view returns (uint256)",
        "function maxTotalStaking() view returns (uint256)",
        "function currentTotalUsers() view returns (uint256)",
        "function maxTotalUsers() view returns (uint256)",
    ]
};

export const CONTRACT_ADDRESSES = {
    DAYA_TOKEN: "0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A",
    AIRDROP: "0xE406833d7f473B43FB2729C8d8D8FA3861Efc42b",
    STAKING: "0x9EDb752c8Afae710c637Fe08ca0f822AEaEcbE8D",
    VESTING: "0x9cd187f6bCf624c230d21de05Df7d23343Dea16A",
    PRICE_ORACLE: "0x54dcd3d9fc04f94451b386bf656d4c7804be98d4",
    STAKING_LIMITS: "0x8c6ef5cec6cf374f037be1cf22bb576e25a7a2ed",
};

export const NETWORK_CONFIG = {
    name: "Base Mainnet",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
};
