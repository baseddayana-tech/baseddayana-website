// BASED DAYANA ($DAYA) - Basic Staking (Simplified)
// Uses only the functions available in the deployed StakingStandalone contract

class BasicStaking {
    constructor() {
        this.contract = null;
        this.userStakeInfo = null;
        
this.init();
    }

    async init() {
        console.log('🚀 Initializing Basic Staking System...');
        
        // Wait for Web3 to be ready
        await this.waitForWeb3();
        
        // Initialize contract if connected
        if (window.modernWeb3 && window.modernWeb3.isConnected) {
            await this.initializeContract();
        }
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Start auto-update loop
        this.startAutoUpdate();
        
        console.log('✅ Basic Staking System Ready');
    }

    async waitForWeb3() {
        return new Promise((resolve) => {
            const checkWeb3 = () => {
                if (window.modernWeb3) {
                    resolve();
                } else {
                    setTimeout(checkWeb3, 100);
                }
            };
            checkWeb3();
        });
    }

    async initializeContract() {
        try {
            const contractAddress = CONTRACTS_CONFIG.ADDRESSES.STAKING;
            
            this.contract = new ethers.Contract(
                contractAddress,
                STAKING_ABI,
                window.modernWeb3.signer
            );
            
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
        } catch (error) {
            console.error('Error initializing staking:', error);
        }
    }

    setupEventListeners() {
        // Basic staking buttons
        document.getElementById('stake-btn')?.addEventListener('click', () => {
            this.showStakingModal();
        });
        
        document.getElementById('unstake-btn')?.addEventListener('click', () => {
            this.unstake();
        });
        
        document.getElementById('calculate-rewards-btn')?.addEventListener('click', () => {
            this.calculateAndShowRewards();
        });
    }

    // ✅ Load user stake info using correct function name and fields
    async loadUserStakeInfo() {
        if (!this.contract || !window.modernWeb3.userAddress) return;
        
        try {
            // CORRECTED: Use getStakeInfo instead of getUserStakeInfo
            const stakeInfo = await this.contract.getStakeInfo(window.modernWeb3.userAddress);
            
            // CORRECTED: Map to the 5 fields actually returned by the contract
            this.userStakeInfo = {
                amount: stakeInfo.amount.toString(),           // uint256 amount
                since: stakeInfo.since.toString(),             // uint256 since
                stakingPeriod: stakeInfo.stakingPeriod.toString(), // uint256 stakingPeriod
                rewards: stakeInfo.rewards.toString(),         // uint256 rewards
                compounded: stakeInfo.compounded               // bool compounded
            };
            
            console.log('📊 Stake Info Loaded:', this.userStakeInfo);
            
        } catch (error) {
            console.error('Error loading user stake info:', error);
            this.userStakeInfo = null;
        }
    }

    // ✅ Calculate current rewards using contract function
    async calculateCurrentRewards() {
        if (!this.contract || !window.modernWeb3.userAddress) return '0';
        
        try {
            const rewards = await this.contract.calculateRewards(window.modernWeb3.userAddress);
            return rewards.toString();
        } catch (error) {
            console.error('Error calculating rewards:', error);
            return '0';
        }
    }

    // ✅ Show staking modal with tier selection
    async showStakingModal() {
        try {
            // Get available staking tiers from contract
            const tiers = await this.getStakingTiers();
            
            // Get user balance
            const balance = await window.modernWeb3.contracts.dayaToken.balanceOf(window.modernWeb3.userAddress);
            const formattedBalance = formatTokenAmount(balance);
            
            // Create modal HTML
            const modal = this.createStakingModal(tiers, formattedBalance);
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('Error showing staking modal:', error);
            this.showNotification('Error loading staking options', 'error');
        }
    }

    // ✅ Get staking tiers from contract
    async getStakingTiers() {
        try {
            const tiers = await this.contract.getStakingTiers();
            return tiers.map((tier, index) => ({
                index,
                period: tier.period.toString(),
                apyBps: tier.apyBps.toString(),
                apy: (parseInt(tier.apyBps.toString()) / 100).toFixed(1) // Convert basis points to percentage
            }));
        } catch (error) {
            console.error('Error getting staking tiers:', error);
            // Fallback to config if contract call fails
            return CONTRACTS_CONFIG.STAKING.tiers.map((tier, index) => ({
                index,
                period: tier.period,
                apyBps: tier.apy * 100,
                apy: tier.apy
            }));
        }
    }

    // ✅ Create staking modal
    createStakingModal(tiers, balance) {
        const modal = document.createElement('div');
        modal.id = 'staking-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-orange-400">Stake Your DAYA</h3>
                    <button onclick="document.getElementById('staking-modal').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="mb-6">
                    <p class="text-gray-300 mb-2">Your Balance: <span class="text-white font-bold">${balance} DAYA</span></p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    ${tiers.map(tier => `
                        <div class="bg-gray-700 p-4 rounded-lg border-2 border-transparent hover:border-orange-500 cursor-pointer tier-option" data-tier-index="${tier.index}">
                            <h4 class="text-lg font-bold text-white mb-2">Tier ${tier.index + 1} - ${tier.period} Days</h4>
                            <p class="text-3xl font-bold text-green-400 mb-2">${tier.apy}% APY</p>
                            <p class="text-sm text-gray-300">Lock period: ${tier.period} days</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-300 mb-2">Amount to Stake:</label>
                    <div class="flex gap-2">
                        <input type="number" id="stake-amount-input" class="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white" placeholder="Enter amount...">
                        <button onclick="document.getElementById('stake-amount-input').value = '${balance}'" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">MAX</button>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <button id="execute-stake-btn" class="flex-1 bg-orange-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Stake DAYA
                    </button>
                    <button onclick="document.getElementById('staking-modal').remove()" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Setup tier selection
        modal.querySelectorAll('.tier-option').forEach(option => {
            option.addEventListener('click', function() {
                modal.querySelectorAll('.tier-option').forEach(opt => opt.classList.remove('border-orange-500'));
                this.classList.add('border-orange-500');
                modal.querySelector('#execute-stake-btn').disabled = false;
            });
        });
        
        // Setup stake button
        modal.querySelector('#execute-stake-btn').addEventListener('click', () => {
            const selectedTier = modal.querySelector('.tier-option.border-orange-500');
            if (!selectedTier) {
                this.showNotification('Please select a tier', 'warning');
                return;
            }
            
            const tierIndex = parseInt(selectedTier.dataset.tierIndex);
            const amount = modal.querySelector('#stake-amount-input').value;
            
            if (!amount || parseFloat(amount) <= 0) {
                this.showNotification('Please enter a valid amount', 'warning');
                return;
            }
            
            modal.remove();
            this.stake(amount, tierIndex);
        });
        
        return modal;
    }

    // ✅ Stake tokens (basic function from contract)
    async stake(amount, tierIndex) {
        try {
            const amountWei = parseTokenAmount(amount, 18);
            
            // First approve tokens
            const tokenContract = window.modernWeb3.contracts.dayaToken;
            this.showNotification('📝 Approving tokens...', 'info');
            
            const approveTx = await tokenContract.approve(this.contract.address, amountWei);
            await approveTx.wait();
            
            // Execute staking
            this.showNotification('🚀 Staking tokens...', 'info');
            const stakeTx = await this.contract.stake(amountWei, tierIndex);
            await stakeTx.wait();
            
            // Update UI
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
            this.showNotification(`✅ Successfully staked ${amount} DAYA!`, 'success');
            
        } catch (error) {
            console.error('Error staking:', error);
            this.showNotification('❌ Error staking: ' + error.message, 'error');
        }
    }

    // ✅ Unstake tokens (basic function from contract)
    async unstake() {
        try {
            if (!this.userStakeInfo || this.userStakeInfo.amount === '0') {
                this.showNotification('You have no active stake', 'info');
                return;
            }
            
            const stakingPeriodDays = parseInt(this.userStakeInfo.stakingPeriod);
            const stakeSince = parseInt(this.userStakeInfo.since);
            const currentTime = Math.floor(Date.now() / 1000);
            const stakingPeriodSeconds = stakingPeriodDays * 24 * 60 * 60;
            const timeElapsed = currentTime - stakeSince;
            
            // Check if early unstake (before period ends)
            const isEarlyUnstake = timeElapsed < stakingPeriodSeconds;
            const penaltyBps = await this.contract.earlyUnstakePenaltyBps();
            const penaltyPercent = parseInt(penaltyBps.toString()) / 100;
            
            // Calculate rewards
            const rewards = await this.calculateCurrentRewards();
            const totalAmount = BigInt(this.userStakeInfo.amount) + BigInt(rewards);
            const totalFormatted = formatTokenAmount(totalAmount.toString());
            
            // Show confirmation
            const message = isEarlyUnstake 
                ? `⚠️ Early unstake penalty: ${penaltyPercent}%\n\nYou will receive approximately:\n${formatTokenAmount(totalAmount.toString())} DAYA (after ${penaltyPercent}% penalty)\n\nContinue?`
                : `You will receive:\n${totalFormatted} DAYA (stake + rewards)\n\nContinue?`;
            
            if (!confirm(message)) return;
            
            this.showNotification('🔄 Unstaking...', 'info');
            const tx = await this.contract.unstake();
            await tx.wait();
            
            // Update UI
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
            this.showNotification('✅ Successfully unstaked!', 'success');
            
        } catch (error) {
            console.error('Error unstaking:', error);
            this.showNotification('❌ Error unstaking: ' + error.message, 'error');
        }
    }

    // Calculate and show projected rewards
    async calculateAndShowRewards() {
        try {
            if (!this.userStakeInfo || this.userStakeInfo.amount === '0') {
                this.showNotification('You need to stake first', 'info');
                return;
            }
            
            const rewards = await this.calculateCurrentRewards();
            const rewardsFormatted = formatTokenAmount(rewards);
            const stakedAmount = formatTokenAmount(this.userStakeInfo.amount);
            const total = formatTokenAmount((BigInt(this.userStakeInfo.amount) + BigInt(rewards)).toString());
            
            this.showNotification(
                `📊 Current Rewards:\n${rewardsFormatted} DAYA\n\nStaked: ${stakedAmount} DAYA\nTotal: ${total} DAYA`,
                'info'
            );
            
        } catch (error) {
            console.error('Error calculating rewards:', error);
            this.showNotification('Error calculating rewards', 'error');
        }
    }

    // Update UI
    updateStakingUI() {
        const dashboard = document.getElementById('staking-dashboard');
        if (dashboard) {
            dashboard.innerHTML = this.generateDashboardHTML();
        }
    }

    // Generate dashboard HTML
    generateDashboardHTML() {
        if (!this.userStakeInfo || this.userStakeInfo.amount === '0') {
            return this.generateNoStakeHTML();
        }
        
        const stakedAmount = formatTokenAmount(this.userStakeInfo.amount);
        const rewards = formatTokenAmount(this.userStakeInfo.rewards);
        const stakingPeriod = this.userStakeInfo.stakingPeriod;
        
        // Calculate APY from staking period
        const tiers = CONTRACTS_CONFIG.STAKING.tiers;
        const matchingTier = tiers.find(t => t.period.toString() === stakingPeriod);
        const apy = matchingTier ? matchingTier.apy : 'N/A';
        
        // Calculate time remaining
        const stakeSince = parseInt(this.userStakeInfo.since);
        const currentTime = Math.floor(Date.now() / 1000);
        const stakingPeriodSeconds = parseInt(stakingPeriod) * 24 * 60 * 60;
        const timeElapsed = currentTime - stakeSince;
        const timeRemaining = Math.max(0, stakingPeriodSeconds - timeElapsed);
        const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60));
        
        return `
            <div class="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-orange-400 mb-4">Your Staking Position</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Staked Amount</p>
                        <p class="text-2xl font-bold text-white">${stakedAmount} DAYA</p>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">APY</p>
                        <p class="text-2xl font-bold text-green-400">${apy}%</p>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Current Rewards</p>
                        <p class="text-2xl font-bold text-yellow-400">${rewards} DAYA</p>
                    </div>
                </div>
                
                <div class="bg-gray-700 p-4 rounded mb-6">
                    <p class="text-gray-400 mb-2">Staking Period</p>
                    <p class="text-white font-bold">${stakingPeriod} days (${daysRemaining} days remaining)</p>
                    <div class="mt-2 w-full bg-gray-600 rounded-full h-2">
                        <div class="bg-orange-500 h-2 rounded-full" style="width: ${((timeElapsed / stakingPeriodSeconds) * 100).toFixed(1)}%"></div>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    <button id="calculate-rewards-btn" class="px-6 py-3 rounded bg-purple-500 hover:bg-purple-600 text-white font-bold">
                        📊 Calculate Rewards
                    </button>
                    
                    <button id="unstake-btn" class="px-6 py-3 rounded bg-red-500 hover:bg-red-600 text-white font-bold">
                        🔓 Unstake
                    </button>
                </div>
                
                ${daysRemaining > 0 ? `
                    <div class="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
                        <p class="text-yellow-400 text-sm">
                            ⚠️ Unstaking before the period ends will incur a 25% penalty
                        </p>
                    </div>
                ` : `
                    <div class="mt-4 p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                        <p class="text-green-400 text-sm">
                            ✅ Staking period complete! You can unstake without penalty
                        </p>
                    </div>
                `}
            </div>
        `;
    }

    generateNoStakeHTML() {
        return `
            <div class="bg-gray-800 rounded-lg p-8 text-center">
                <h3 class="text-2xl font-bold text-orange-400 mb-4">Start Staking DAYA</h3>
                <p class="text-gray-300 mb-6">Choose your staking tier and start earning rewards</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    ${CONTRACTS_CONFIG.STAKING.tiers.map((tier, index) => `
                        <div class="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-lg border border-gray-600">
                            <h4 class="text-lg font-bold text-white mb-2">Tier ${index + 1}</h4>
                            <p class="text-3xl font-bold text-green-400 mb-2">${tier.apy}%</p>
                            <p class="text-sm text-gray-300">${tier.period} days</p>
                        </div>
                    `).join('')}
                </div>
                
                <button id="stake-btn" class="bg-orange-500 text-white font-bold px-8 py-4 rounded-lg hover:bg-orange-600 transition-transform hover:scale-105">
                    Start Staking Now
                </button>
                
                <div class="mt-8 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                    <p class="text-blue-300 text-sm">
                        💡 The longer you stake, the higher your APY!
                    </p>
                </div>
            </div>
        `;
    }

    startAutoUpdate() {
        setInterval(async () => {
            if (this.contract && window.modernWeb3.isConnected) {
                await this.loadUserStakeInfo();
                this.updateStakingUI();
            }
        }, 30000); // Update every 30 seconds
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 max-w-sm ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        } text-white shadow-lg`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm whitespace-pre-line">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 text-xl font-bold">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize basic staking system
let basicStaking;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        basicStaking = new BasicStaking();
    });
} else {
    basicStaking = new BasicStaking();
}

// Make it globally available
window.basicStaking = basicStaking;

// Backward compatibility: make enhancedStaking point to basicStaking
window.enhancedStaking = basicStaking;
