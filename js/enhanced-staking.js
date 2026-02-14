// BASED DAYANA ($DAYA) - Enhanced Staking Features
// Implements: Auto-Compound, Tier 4 Strategy, Early Adopter Benefits, Governance

class EnhancedStaking {
    constructor() {
        this.contract = null;
        this.userStakeInfo = null;
        this.autoCompoundInterval = null;
        this.notifications = [];
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Enhanced Staking System...');
        
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
        
        console.log('✅ Enhanced Staking System Ready');
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
            // In production, this would use the enhanced contract address
            const contractAddress = CONTRACTS_CONFIG.ADDRESSES.STAKING;
            const contractABI = STAKING_ABI; // Extended with new functions
            
            this.contract = new ethers.Contract(
                contractAddress,
                contractABI,
                window.modernWeb3.signer
            );
            
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
        } catch (error) {
            console.error('Error initializing enhanced staking:', error);
        }
    }

    setupEventListeners() {
        // Strategy buttons
        document.getElementById('activate-tier4-strategy')?.addEventListener('click', () => {
            this.activateTier4Strategy();
        });
        
        document.getElementById('toggle-auto-compound')?.addEventListener('click', () => {
            this.toggleAutoCompound();
        });
        
        document.getElementById('compound-now')?.addEventListener('click', () => {
            this.compoundRewards();
        });
        
        document.getElementById('claim-early-adopter')?.addEventListener('click', () => {
            this.showEarlyAdopterBenefits();
        });

        // Enhanced staking form
        const stakingForm = document.getElementById('enhanced-staking-form');
        if (stakingForm) {
            stakingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEnhancedStaking();
            });
        }
    }

    // ✅ STRATEGY 1: TIER 4 MAXIMUM PROFIT STRATEGY
    async activateTier4Strategy() {
        try {
            this.showNotification('🎯 Activating Tier 4 Strategy - Maximum Profit Mode!', 'info');
            
            // Check current balance
            const balance = await window.modernWeb3.contracts.dayaToken.balanceOf(window.modernWeb3.userAddress);
            const formattedBalance = formatTokenAmount(balance);
            
            const tier4MinAmount = 25000; // 25,000 DAYA minimum
            
            if (parseFloat(formattedBalance) < tier4MinAmount) {
                this.showNotification(`❌ You need at least ${tier4MinAmount} DAYA for Tier 4. You have ${formattedBalance} DAYA.`, 'error');
                return;
            }
            
            // Calculate potential earnings
            const currentAPY = 30; // Base APY for Tier 4
            const earlyAdopterBonus = 5; // Extra 5% if early adopter
            const totalAPY = currentAPY + (await this.isEarlyAdopter() ? earlyAdopterBonus : 0);
            const potentialEarnings = (parseFloat(formattedBalance) * totalAPY / 100);
            
            // Show strategy confirmation
            const confirmed = await this.showStrategyConfirmation({
                strategy: 'Tier 4 - Diamond Strategy',
                amount: formattedBalance,
                period: '365 days',
                apy: `${totalAPY}%`,
                potentialEarnings: potentialEarnings.toFixed(2),
                autoCompound: true
            });
            
            if (confirmed) {
                await this.executeStakingStrategy(balance, 3, true); // Tier 4 index = 3
            }
            
        } catch (error) {
            console.error('Error in Tier 4 strategy:', error);
            this.showNotification('❌ Error activating Tier 4 strategy', 'error');
        }
    }

    // ✅ STRATEGY 2: AUTO-COMPOUND REWARDS
    async toggleAutoCompound() {
        try {
            if (!this.userStakeInfo || this.userStakeInfo.stakedAmount === '0') {
                this.showNotification('❌ You need to stake first to enable auto-compound', 'error');
                return;
            }

            this.showNotification('🔄 Toggling Auto-Compound...', 'info');
            
            const tx = await this.contract.toggleAutoCompound();
            await tx.wait();
            
            // Update UI
            await this.loadUserStakeInfo();
            this.updateAutoCompoundUI();
            
            this.showNotification(
                `✅ Auto-Compound ${this.userStakeInfo.autoCompound ? 'ENABLED' : 'DISABLED'}! 
                ${this.userStakeInfo.autoCompound ? 'Rewards will compound automatically with 0.5% bonus!' : ''}`, 
                'success'
            );
            
            // Start auto-compound monitoring if enabled
            if (this.userStakeInfo.autoCompound) {
                this.startAutoCompoundMonitoring();
            } else {
                this.stopAutoCompoundMonitoring();
            }
            
        } catch (error) {
            console.error('Error toggling auto-compound:', error);
            this.showNotification('❌ Error toggling auto-compound', 'error');
        }
    }

    async compoundRewards() {
        try {
            if (!this.userStakeInfo || this.userStakeInfo.currentRewards === '0') {
                this.showNotification('❌ No rewards available to compound', 'error');
                return;
            }

            this.showNotification('🔄 Compounding rewards...', 'info');
            
            const tx = await this.contract.compoundRewards();
            await tx.wait();
            
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
            this.showNotification('✅ Rewards compounded successfully! +0.5% compound bonus applied!', 'success');
            
        } catch (error) {
            console.error('Error compounding rewards:', error);
            this.showNotification('❌ Error compounding rewards', 'error');
        }
    }

    // ✅ STRATEGY 3: EARLY ADOPTER BENEFITS
    async showEarlyAdopterBenefits() {
        try {
            const isEarly = await this.isEarlyAdopter();
            const earlyAdopterEndTime = await this.getEarlyAdopterEndTime();
            const timeRemaining = earlyAdopterEndTime - Math.floor(Date.now() / 1000);
            
            if (!isEarly && timeRemaining > 0) {
                // Show early adopter opportunity
                const modal = this.createEarlyAdopterModal(timeRemaining);
                document.body.appendChild(modal);
            } else if (isEarly) {
                // Show current benefits
                this.showEarlyAdopterStatus();
            } else {
                this.showNotification('❌ Early adopter period has ended', 'info');
            }
            
        } catch (error) {
            console.error('Error showing early adopter benefits:', error);
        }
    }

    // ✅ STRATEGY 4: COMMUNITY GOVERNANCE
    async showGovernancePanel() {
        try {
            if (!this.userStakeInfo || this.userStakeInfo.votingPower === '0') {
                this.showNotification('❌ You need to stake to participate in governance', 'error');
                return;
            }

            const governanceModal = this.createGovernanceModal();
            document.body.appendChild(governanceModal);
            
        } catch (error) {
            console.error('Error showing governance panel:', error);
        }
    }

    // Helper Methods
    async executeStakingStrategy(amount, tierIndex, autoCompound) {
        try {
            // First approve tokens
            const tokenContract = window.modernWeb3.contracts.dayaToken;
            this.showNotification('📝 Approving tokens...', 'info');
            
            const approveTx = await tokenContract.approve(this.contract.address, amount);
            await approveTx.wait();
            
            // Execute staking
            this.showNotification('🚀 Executing staking strategy...', 'info');
            const stakeTx = await this.contract.stake(amount, tierIndex, autoCompound);
            await stakeTx.wait();
            
            // Update UI
            await this.loadUserStakeInfo();
            this.updateStakingUI();
            
            this.showNotification('🎉 Strategy activated successfully! Welcome to maximum profit mode!', 'success');
            
            // Start monitoring if auto-compound is enabled
            if (autoCompound) {
                this.startAutoCompoundMonitoring();
            }
            
        } catch (error) {
            console.error('Error executing staking strategy:', error);
            this.showNotification('❌ Error executing strategy: ' + error.message, 'error');
        }
    }

    async loadUserStakeInfo() {
        if (!this.contract || !window.modernWeb3.userAddress) return;
        
        try {
            const stakeInfo = await this.contract.getUserStakeInfo(window.modernWeb3.userAddress);
            
            this.userStakeInfo = {
                stakedAmount: stakeInfo.stakedAmount.toString(),
                stakingPeriod: stakeInfo.stakingPeriod.toString(),
                currentRewards: stakeInfo.currentRewards.toString(),
                autoCompound: stakeInfo.autoCompound,
                compoundCount: stakeInfo.compoundCount.toString(),
                totalEarned: stakeInfo.totalEarned.toString(),
                tierName: stakeInfo.tierName,
                currentAPY: stakeInfo.currentAPY.toString(),
                votingPower: stakeInfo.votingPower_.toString(),
                isEarlyAdopter: stakeInfo.isEarlyAdopter_
            };
            
        } catch (error) {
            console.error('Error loading user stake info:', error);
        }
    }

    updateStakingUI() {
        if (!this.userStakeInfo) return;
        
        // Update staking dashboard
        const dashboard = document.getElementById('staking-dashboard');
        if (dashboard) {
            dashboard.innerHTML = this.generateDashboardHTML();
        }
        
        // Update strategy recommendations
        this.updateStrategyRecommendations();
        
        // Update auto-compound status
        this.updateAutoCompoundUI();
    }

    generateDashboardHTML() {
        if (!this.userStakeInfo || this.userStakeInfo.stakedAmount === '0') {
            return this.generateNoStakeHTML();
        }
        
        const stakedAmount = formatTokenAmount(this.userStakeInfo.stakedAmount);
        const currentRewards = formatTokenAmount(this.userStakeInfo.currentRewards);
        const totalEarned = formatTokenAmount(this.userStakeInfo.totalEarned);
        const apy = (parseInt(this.userStakeInfo.currentAPY) / 100).toFixed(1);
        
        return `
            <div class="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-orange-400 mb-4">
                    🏆 ${this.userStakeInfo.tierName}
                    ${this.userStakeInfo.isEarlyAdopter ? ' 🌟 Early Adopter' : ''}
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Staked Amount</p>
                        <p class="text-2xl font-bold text-white">${stakedAmount} DAYA</p>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Current APY</p>
                        <p class="text-2xl font-bold text-green-400">${apy}%</p>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Pending Rewards</p>
                        <p class="text-2xl font-bold text-yellow-400">${currentRewards} DAYA</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Auto-Compound Status</p>
                        <p class="text-lg font-bold ${this.userStakeInfo.autoCompound ? 'text-green-400' : 'text-red-400'}">
                            ${this.userStakeInfo.autoCompound ? '✅ ENABLED (+0.5% bonus)' : '❌ DISABLED'}
                        </p>
                        <button id="toggle-auto-compound" class="mt-2 px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white">
                            ${this.userStakeInfo.autoCompound ? 'Disable' : 'Enable'} Auto-Compound
                        </button>
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded">
                        <p class="text-gray-400">Governance Power</p>
                        <p class="text-lg font-bold text-blue-400">${formatTokenAmount(this.userStakeInfo.votingPower)} votes</p>
                        <button onclick="enhancedStaking.showGovernancePanel()" class="mt-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white">
                            Vote on Proposals
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    ${parseFloat(currentRewards) > 0 ? `
                        <button id="compound-now" class="px-6 py-3 rounded bg-green-500 hover:bg-green-600 text-white font-bold">
                            🔄 Compound Now (+0.5% bonus)
                        </button>
                    ` : ''}
                    
                    <button onclick="enhancedStaking.calculateProjectedEarnings()" class="px-6 py-3 rounded bg-purple-500 hover:bg-purple-600 text-white">
                        📊 Calculate Projections
                    </button>
                    
                </div>
                
                <div class="mt-6 p-4 bg-gray-700 rounded">
                    <h4 class="font-bold text-orange-400 mb-2">🎯 Your Performance</h4>
                    <p class="text-gray-300">Total Earned: <span class="text-green-400 font-bold">${totalEarned} DAYA</span></p>
                    <p class="text-gray-300">Compounds: <span class="text-blue-400 font-bold">${this.userStakeInfo.compoundCount}</span></p>
                    <p class="text-gray-300">Staking Period: <span class="text-white font-bold">${this.userStakeInfo.stakingPeriod} days</span></p>
                </div>
            </div>
        `;
    }

    generateNoStakeHTML() {
        return `
            <div class="bg-gray-800 rounded-lg p-8 text-center">
                <h3 class="text-2xl font-bold text-orange-400 mb-4">🚀 Start Your Profit Journey</h3>
                <p class="text-gray-300 mb-6">Choose your optimal staking strategy for maximum returns</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="bg-gradient-to-r from-yellow-600 to-yellow-500 p-6 rounded-lg">
                        <h4 class="text-xl font-bold text-white mb-2">💎 Tier 4 Strategy</h4>
                        <p class="text-yellow-100 mb-2">Maximum Profit Mode</p>
                        <p class="text-2xl font-bold text-white">up to 35% APY</p>
                        <p class="text-sm text-yellow-100 mt-2">Early adopters get +5% bonus!</p>
                        <button id="activate-tier4-strategy" class="mt-4 px-6 py-2 rounded bg-white text-yellow-600 font-bold hover:bg-gray-100">
                            Activate Strategy
                        </button>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-lg">
                        <h4 class="text-xl font-bold text-white mb-2">🔄 Auto-Compound</h4>
                        <p class="text-green-100 mb-2">Set & Forget</p>
                        <p class="text-2xl font-bold text-white">+0.5% Bonus</p>
                        <p class="text-sm text-green-100 mt-2">Automatic reward reinvestment</p>
                        <button onclick="enhancedStaking.showStakingOptions()" class="mt-4 px-6 py-2 rounded bg-white text-green-600 font-bold hover:bg-gray-100">
                            Start Staking
                        </button>
                    </div>
                </div>
                
                ${await this.getEarlyAdopterTimeRemaining() > 0 ? `
                    <div class="bg-gradient-to-r from-purple-600 to-purple-500 p-4 rounded-lg mb-6">
                        <h4 class="text-lg font-bold text-white">🌟 Early Adopter Bonus Active!</h4>
                        <p class="text-purple-100">Get up to +5% extra APY - Limited Time!</p>
                        <div id="early-adopter-countdown" class="text-white font-bold text-xl mt-2"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Auto-compound monitoring
    startAutoCompoundMonitoring() {
        if (this.autoCompoundInterval) return;
        
        this.autoCompoundInterval = setInterval(async () => {
            if (!this.userStakeInfo || !this.userStakeInfo.autoCompound) return;
            
            const rewards = await this.calculateCurrentRewards();
            const minRewardsForCompound = parseTokenAmount('10', 18); // 10 DAYA minimum
            
            if (BigInt(rewards) >= minRewardsForCompound) {
                console.log('🔄 Auto-compound threshold reached, compounding rewards...');
                await this.compoundRewards();
            }
        }, 60000); // Check every minute
    }

    stopAutoCompoundMonitoring() {
        if (this.autoCompoundInterval) {
            clearInterval(this.autoCompoundInterval);
            this.autoCompoundInterval = null;
        }
    }

    startAutoUpdate() {
        setInterval(async () => {
            if (this.contract && window.modernWeb3.isConnected) {
                await this.loadUserStakeInfo();
                this.updateStakingUI();
            }
        }, 30000); // Update every 30 seconds
    }

    // Utility methods
    async isEarlyAdopter() {
        if (!this.contract) return false;
        try {
            return await this.contract.isEarlyAdopter(window.modernWeb3.userAddress);
        } catch {
            return false;
        }
    }

    async getEarlyAdopterEndTime() {
        if (!this.contract) return 0;
        try {
            const endTime = await this.contract.earlyAdopterEndTime();
            return parseInt(endTime.toString());
        } catch {
            return 0;
        }
    }

    async getEarlyAdopterTimeRemaining() {
        const endTime = await this.getEarlyAdopterEndTime();
        return Math.max(0, endTime - Math.floor(Date.now() / 1000));
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
        } text-white`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">×</button>
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

// Initialize enhanced staking system
let enhancedStaking;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enhancedStaking = new EnhancedStaking();
    });
} else {
    enhancedStaking = new EnhancedStaking();
}

// Make it globally available
window.enhancedStaking = enhancedStaking;
