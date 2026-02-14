// ============================================
// Real Contract Countdown - BASED DAYANA
// Gets actual countdown from deployed contract
// ============================================

(function() {
    console.log('🔍 Getting Real Contract Countdown...');
    console.log('='.repeat(60));
    
    const CONTRACT_ADDRESS = '0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A'; // BASED DAYANA Token Contract
    const NETWORK = 'Base Mainnet';
    const CHAIN_ID = 8453;
    
    const CONTRACT_ABI = [
        "function getAutoRenounceInfo() view returns (tuple(uint256 deployTime, uint256 renounceTime, bool isRenounced, uint256 timeRemaining))",
        "function deploymentTime() view returns (uint256)",
        "function ownershipAutoRenounced() view returns (bool)"
    ];
    
    let intervalId = null;
    let currentTimeRemaining = 0;

    // Function to get contract info with multiple provider options
    async function getContractInfo() {
        try {
            if (typeof window.ethers === 'undefined') {
                throw new Error('Ethers.js not loaded');
            }

            // Use only the RPC provider allowed by CSP
            const providers = [
                'https://mainnet.base.org'
            ];

            for (let i = 0; i < providers.length; i++) {
                try {
                    // Use ethers v5 or v6 compatible syntax
                    let provider;
                    if (ethers.providers && ethers.providers.JsonRpcProvider) {
                        // Ethers v5
                        provider = new ethers.providers.JsonRpcProvider(providers[i]);
                    } else if (ethers.JsonRpcProvider) {
                        // Ethers v6
                        provider = new ethers.JsonRpcProvider(providers[i]);
                    } else {
                        throw new Error('No compatible JsonRpcProvider found');
                    }
                    
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                    
                    // Add timeout
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 5000)
                    );
                    
                    const contractPromise = contract.getAutoRenounceInfo();
                    const result = await Promise.race([contractPromise, timeoutPromise]);
                    
                    console.log('✅ Contract info retrieved from provider', i + 1);
                    
                    // Handle both ethers v5 and v6 number formats
                    let timeRemaining;
                    if (typeof result.timeRemaining === 'bigint') {
                        // Ethers v6 - BigInt
                        timeRemaining = Number(result.timeRemaining);
                    } else if (result.timeRemaining.toNumber) {
                        // Ethers v5 - BigNumber
                        timeRemaining = result.timeRemaining.toNumber();
                    } else {
                        // Direct number
                        timeRemaining = Number(result.timeRemaining);
                    }
                    
                    return {
                        isRenounced: result.isRenounced,
                        timeRemaining: timeRemaining
                    };
                } catch (error) {
                    console.log(`⚠️ Provider ${i + 1} failed:`, error.message);
                    if (i === providers.length - 1) {
                        throw error;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ All providers failed:', error.message);
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
                    <div class="text-orange-400 font-bold">
                        Unable to connect to contract
                    </div>
                    <div class="text-gray-400 text-sm mt-2">
                        Please check your internet connection
                    </div>
                </div>
            `;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            return;
        }
        
        if (contractInfo.isRenounced) {
            display.innerHTML = `
                <div class="text-green-400 font-bold text-center">
                    🎉 OWNERSHIP RENOUNCED! 🎉
                </div>
                <div class="text-green-300 text-sm mt-1 text-center">
                    Contract is now fully decentralized!
                </div>
            `;
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        } else {
            const timeInfo = formatTimeRemaining(contractInfo.timeRemaining);
            display.innerHTML = `
                <div class="grid grid-cols-4 gap-2 text-center">
                    <div class="bg-red-800 p-2 rounded">
                        <div class="text-xl font-bold">${timeInfo.days}</div>
                        <div class="text-xs">Days</div>
                    </div>
                    <div class="bg-red-800 p-2 rounded">
                        <div class="text-xl font-bold">${timeInfo.hours.toString().padStart(2, '0')}</div>
                        <div class="text-xs">Hours</div>
                    </div>
                    <div class="bg-red-800 p-2 rounded">
                        <div class="text-xl font-bold">${timeInfo.minutes.toString().padStart(2, '0')}</div>
                        <div class="text-xs">Minutes</div>
                    </div>
                    <div class="bg-red-800 p-2 rounded">
                        <div class="text-xl font-bold">${timeInfo.seconds.toString().padStart(2, '0')}</div>
                        <div class="text-xs">Seconds</div>
                    </div>
                </div>
                <div class="text-orange-300 text-sm mt-2 text-center">
                    Until automatic ownership renouncement
                </div>
            `;
        }
    }
    
    // Main function
    async function initializeRealCountdown() {
        console.log('🚀 Initializing Real Contract Countdown...');
        
        // Show loading state
        const display = document.getElementById('countdown-display');
        if (display) {
            display.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-gray-400 font-bold">
                        Loading countdown...
                    </div>
                </div>
            `;
        }
        
        let contractInfo = await getContractInfo();
        updateCountdownDisplay(contractInfo);
        
        if (!contractInfo.isFallback && !contractInfo.isRenounced) {
            console.log('⏰ Setting up real-time updates...');
            currentTimeRemaining = contractInfo.timeRemaining;
            
            // Clear any existing interval
            if (intervalId) {
                clearInterval(intervalId);
            }
            
            intervalId = setInterval(() => {
                currentTimeRemaining--;
                if (currentTimeRemaining < 0) {
                    clearInterval(intervalId);
                    updateCountdownDisplay({ isRenounced: true });
                } else {
                    updateCountdownDisplay({ timeRemaining: currentTimeRemaining });
                }
            }, 1000);
            
            // Refresh from contract every 5 minutes
            setInterval(async () => {
                const newInfo = await getContractInfo();
                if (!newInfo.isFallback) {
                    currentTimeRemaining = newInfo.timeRemaining;
                    updateCountdownDisplay(newInfo);
                }
            }, 300000); // 5 minutes
        }
    }
    
    // Wait for ethers to load properly
    function waitForEthers() {
        return new Promise((resolve) => {
            const maxAttempts = 30; // 3 seconds maximum
            let attempts = 0;
            
            const checkEthers = () => {
                attempts++;
                
                // Check if ethers is available (simplified check)
                if (typeof window.ethers !== 'undefined') {
                    console.log('✅ Ethers.js is ready for countdown');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ Ethers.js not available after 3 seconds');
                    resolve(); // Resolve anyway to show error message
                } else {
                    console.log(`⏳ Countdown waiting for ethers... (${attempts}/${maxAttempts})`);
                    setTimeout(checkEthers, 100);
                }
            };
            
            checkEthers();
        });
    }

    // Initialize when both DOM and ethers are ready
    async function init() {
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        await waitForEthers();
        await initializeRealCountdown();
    }
    
    init();
    
    console.log('='.repeat(60));
})();
