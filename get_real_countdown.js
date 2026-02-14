// ============================================
// Get Real Countdown - BASED DAYANA
// Gets actual countdown from deployed contract
// ============================================

(function() {
    console.log('🔍 Getting Real Contract Countdown...');
    console.log('='.repeat(60));
    
    const CONTRACT_ADDRESS = '0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A'; // BASED DAYANA Token Contract
    const NETWORK = 'Base Mainnet';
    const CHAIN_ID = 8453;
    
    const CONTRACT_ABI = [
        {
            "inputs": [],
            "name": "getAutoRenounceInfo",
            "outputs": [
                {"internalType": "uint256", "name": "deployTime", "type": "uint256"},
                {"internalType": "uint256", "name": "renounceTime", "type": "uint256"},
                {"internalType": "bool", "name": "isRenounced", "type": "bool"},
                {"internalType": "uint256", "name": "timeRemaining", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    let intervalId = null;

    // Function to get contract info with multiple provider options
    async function getContractInfo() {
        try {
            let provider;
            
            // Try multiple provider methods
            if (typeof window.ethers !== 'undefined') {
                // Try with public RPC first (no wallet needed)
                try {
                    provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                    
                    const [deployTime, renounceTime, isRenounced, timeRemaining] = await contract.getAutoRenounceInfo();
                    
                    console.log('✅ Contract info retrieved via public RPC');
                    return {
                        isRenounced: isRenounced,
                        timeRemaining: timeRemaining.toNumber()
                    };
                } catch (publicRpcError) {
                    console.log('⚠️ Public RPC failed, trying wallet provider...');
                    
                    // Fallback to wallet provider
                    if (typeof window.ethereum !== 'undefined') {
                        provider = new ethers.providers.Web3Provider(window.ethereum);
                        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                        
                        const [deployTime, renounceTime, isRenounced, timeRemaining] = await contract.getAutoRenounceInfo();
                        
                        console.log('✅ Contract info retrieved via wallet provider');
                        return {
                            isRenounced: isRenounced,
                            timeRemaining: timeRemaining.toNumber()
                        };
                    }
                    
                    throw new Error('No provider available');
                }
            } else {
                throw new Error('Ethers.js not loaded');
            }
            
        } catch (error) {
            console.error('❌ Could not get real contract info:', error.message);
            return { isFallback: true };
        }
    }
    
    // Format time remaining
    function formatTimeRemaining(seconds) {
        if (seconds <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = seconds % 60;
        
        return { days, hours, minutes, seconds: secs };
    }
    
    // Update countdown display
    function updateCountdownDisplay(contractInfo) {
        const display = document.getElementById('countdown-display');
        if (!display) {
            console.log('❌ Countdown display element not found');
            return;
        }

        if (contractInfo.isFallback) {
            display.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-gray-400 font-bold">
                        Countdown Unavailable
                    </div>
                    <div class="text-gray-500 text-sm mt-2">
                        Unable to connect to contract
                    </div>
                </div>
            `;
            return;
        }

        if (contractInfo.isRenounced) {
            display.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-green-400 font-bold text-lg">
                        ✅ OWNERSHIP RENOUNCED
                    </div>
                    <div class="text-gray-400 text-sm mt-2">
                        Contract is fully decentralized
                    </div>
                </div>
            `;
            return;
        }

        const timeRemaining = contractInfo.timeRemaining;
        const formatted = formatTimeRemaining(timeRemaining);

        display.innerHTML = `
            <div class="text-center">
                <div class="grid grid-cols-4 gap-2 text-center">
                    <div class="bg-gray-800 rounded-lg p-2">
                        <div class="text-2xl font-bold text-orange-400">${formatted.days}</div>
                        <div class="text-xs text-gray-400">Days</div>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-2">
                        <div class="text-2xl font-bold text-orange-400">${formatted.hours}</div>
                        <div class="text-xs text-gray-400">Hours</div>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-2">
                        <div class="text-2xl font-bold text-orange-400">${formatted.minutes}</div>
                        <div class="text-xs text-gray-400">Minutes</div>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-2">
                        <div class="text-2xl font-bold text-orange-400">${formatted.seconds}</div>
                        <div class="text-xs text-gray-400">Seconds</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Start countdown updates
    function startCountdown() {
        console.log('🕐 Starting countdown updates...');
        
        // Initial update
        getContractInfo().then(updateCountdownDisplay);
        
        // Update every 30 seconds
        intervalId = setInterval(async () => {
            const contractInfo = await getContractInfo();
            updateCountdownDisplay(contractInfo);
        }, 30000);
    }

    // Stop countdown updates
    function stopCountdown() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log('⏹️ Countdown updates stopped');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startCountdown);
    } else {
        startCountdown();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', stopCountdown);

    // Make functions globally available
    window.startRealCountdown = startCountdown;
    window.stopRealCountdown = stopCountdown;
    window.getRealContractInfo = getContractInfo;

    console.log('✅ Real countdown system initialized');
})();
