// BASED DAYANA ($DAYA) - Contract Status Check
// Verifica el estado del contrato DAYA para el countdown

class ContractStatusCheck {
    constructor() {
        this.contractAddress = '0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A';
        this.contractABI = [
            "function deploymentTime() view returns (uint256)",
            "function ownershipAutoRenounced() view returns (bool)",
            "function isOwnershipAutoRenounced() view returns (bool)",
            "function getTimeUntilAutoRenounce() view returns (uint256)",
            "function getAutoRenounceInfo() view returns (tuple(uint256 deployTime, uint256 renounceTime, bool isRenounced, uint256 timeRemaining))"
        ];
        
        this.init();
    }

    async init() {
        console.log('🔍 Starting Contract Status Check...');
        
        // Wait for ethers to be available
        await this.waitForEthers();
        
        // Check contract status
        await this.checkContractStatus();
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

    async checkContractStatus() {
        try {
            console.log('📊 Checking DAYA contract status...');
            
            // Use public RPC
            const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
            const contract = new ethers.Contract(this.contractAddress, this.contractABI, provider);
            
            // Check if contract exists
            const code = await provider.getCode(this.contractAddress);
            if (code === '0x') {
                console.log('❌ Contract does not exist at this address');
                this.showError('Contract not found');
                return;
            }
            
            console.log('✅ Contract exists, checking functions...');
            
            // Try different functions to get auto-renounce info
            let contractInfo = null;
            
            try {
                // Try the main function
                const [deployTime, renounceTime, isRenounced, timeRemaining] = await contract.getAutoRenounceInfo();
                contractInfo = {
                    deployTime: deployTime.toNumber(),
                    renounceTime: renounceTime.toNumber(),
                    isRenounced: isRenounced,
                    timeRemaining: timeRemaining.toNumber()
                };
                console.log('✅ getAutoRenounceInfo() successful');
            } catch (error) {
                console.log('⚠️ getAutoRenounceInfo() failed, trying individual functions...');
                
                try {
                    // Try individual functions
                    const [deployTime, isRenounced] = await Promise.all([
                        contract.deploymentTime(),
                        contract.ownershipAutoRenounced()
                    ]);
                    
                    const deployTimestamp = deployTime.toNumber();
                    const renounceTimestamp = deployTimestamp + (60 * 24 * 60 * 60); // 60 days
                    const currentTime = Math.floor(Date.now() / 1000);
                    const timeRemaining = Math.max(0, renounceTimestamp - currentTime);
                    
                    contractInfo = {
                        deployTime: deployTimestamp,
                        renounceTime: renounceTimestamp,
                        isRenounced: isRenounced,
                        timeRemaining: timeRemaining
                    };
                    console.log('✅ Individual functions successful');
                } catch (individualError) {
                    console.log('❌ Individual functions also failed:', individualError.message);
                    this.showError('Contract functions not available');
                    return;
                }
            }
            
            // Display results
            this.displayContractInfo(contractInfo);
            
        } catch (error) {
            console.error('❌ Contract status check failed:', error);
            this.showError('Connection failed: ' + error.message);
        }
    }

    displayContractInfo(contractInfo) {
        console.log('📊 Contract Info:', contractInfo);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const deployDate = new Date(contractInfo.deployTime * 1000);
        const renounceDate = new Date(contractInfo.renounceTime * 1000);
        
        console.log('📅 Deploy Date:', deployDate.toLocaleString());
        console.log('📅 Renounce Date:', renounceDate.toLocaleString());
        console.log('⏰ Time Remaining:', contractInfo.timeRemaining, 'seconds');
        console.log('🔒 Is Renounced:', contractInfo.isRenounced);
        
        // Update countdown display
        this.updateCountdownDisplay(contractInfo);
    }

    updateCountdownDisplay(contractInfo) {
        const display = document.getElementById('countdown-display');
        if (!display) {
            console.log('❌ Countdown display element not found');
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

    showError(message) {
        const display = document.getElementById('countdown-display');
        if (display) {
            display.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-orange-400 font-bold">
                        Unable to connect to contract
                    </div>
                    <div class="text-gray-400 text-sm mt-2">
                        ${message}
                    </div>
                    <div class="text-gray-500 text-xs mt-1">
                        Contract: ${this.contractAddress}
                    </div>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Initializing Contract Status Check...');
    
    // Wait a bit for other systems to initialize
    setTimeout(() => {
        window.contractStatusCheck = new ContractStatusCheck();
    }, 2000);
});

// Make globally available
window.ContractStatusCheck = ContractStatusCheck;
