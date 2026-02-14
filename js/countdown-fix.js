// BASED DAYANA ($DAYA) - Countdown Fix
// Soluciona los problemas de conexión del countdown

class CountdownFix {
    constructor() {
        this.contractAddress = '0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A';
        this.contractABI = [
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
            },
            {
                "inputs": [],
                "name": "deploymentTime",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "ownershipAutoRenounced",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        this.providers = [
            'https://mainnet.base.org',
            'https://base-mainnet.g.alchemy.com/v2/demo',
            'https://base.blockpi.network/v1/rpc/public'
        ];
        
        this.currentProviderIndex = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Countdown Fix...');
        
        // Wait for ethers to be available
        await this.waitForEthers();
        
        // Try to get contract data
        await this.getContractData();
        
        // Start periodic updates
        this.startPeriodicUpdates();
    }

    async waitForEthers() {
        return new Promise((resolve) => {
            const checkEthers = () => {
                if (typeof window.ethers !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkEthers, 100);
                }
            };
            checkEthers();
        });
    }

    async getContractData() {
        try {
            console.log('📊 Attempting to get contract data...');
            
            // Try current provider
            const provider = new ethers.providers.JsonRpcProvider(this.providers[this.currentProviderIndex]);
            const contract = new ethers.Contract(this.contractAddress, this.contractABI, provider);
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Provider timeout')), 5000)
            );
            
            const contractPromise = this.getContractInfo(contract);
            const result = await Promise.race([contractPromise, timeoutPromise]);
            
            console.log('✅ Contract data retrieved successfully');
            this.updateCountdownDisplay(result);
            this.retryCount = 0; // Reset retry count on success
            
        } catch (error) {
            console.log(`❌ Provider ${this.currentProviderIndex + 1} failed:`, error.message);
            await this.handleProviderError();
        }
    }

    async getContractInfo(contract) {
        try {
            // Try the main function first
            const [deployTime, renounceTime, isRenounced, timeRemaining] = await contract.getAutoRenounceInfo();
            
            return {
                isRenounced: isRenounced,
                timeRemaining: timeRemaining.toNumber(),
                deployTime: deployTime.toNumber(),
                renounceTime: renounceTime.toNumber()
            };
        } catch (error) {
            console.log('⚠️ getAutoRenounceInfo failed, trying individual functions...');
            
            // Fallback to individual functions
            const [deployTime, isRenounced] = await Promise.all([
                contract.deploymentTime(),
                contract.ownershipAutoRenounced()
            ]);
            
            const deployTimestamp = deployTime.toNumber();
            const renounceTimestamp = deployTimestamp + (60 * 24 * 60 * 60); // 60 days
            const currentTime = Math.floor(Date.now() / 1000);
            const timeRemaining = Math.max(0, renounceTimestamp - currentTime);
            
            return {
                isRenounced: isRenounced,
                timeRemaining: timeRemaining,
                deployTime: deployTimestamp,
                renounceTime: renounceTimestamp
            };
        }
    }

    async handleProviderError() {
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
            console.log('❌ All providers failed, switching to next provider...');
            this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
            this.retryCount = 0;
        }
        
        // Show connection error
        this.updateCountdownDisplay({ 
            isFallback: true, 
            error: `Provider ${this.currentProviderIndex + 1} failed (attempt ${this.retryCount})` 
        });
        
        // Retry after delay
        setTimeout(() => {
            this.getContractData();
        }, 2000);
    }

    updateCountdownDisplay(contractInfo) {
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
                    <div class="text-gray-500 text-xs mt-1">
                        Retrying automatically...
                    </div>
                </div>
            `;
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
        } else {
            const timeInfo = this.formatTimeRemaining(contractInfo.timeRemaining);
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

    formatTimeRemaining(seconds) {
        if (seconds <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = seconds % 60;
        
        return { days, hours, minutes, seconds: secs };
    }

    startPeriodicUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.getContractData();
        }, 30000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Countdown Fix...');
    
    // Wait a bit for other systems to initialize
    setTimeout(() => {
        window.countdownFix = new CountdownFix();
    }, 1000);
});

// Make globally available
window.CountdownFix = CountdownFix;
