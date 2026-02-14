// BASED DAYANA ($DAYA) - Airdrop Merkle Tree Implementation
// Handles airdrop functionality with Merkle proof verification

// Prevent redeclaration
if (typeof AirdropMerkle === 'undefined') {
    let AirdropMerkle;
    
AirdropMerkle = class {
    constructor() {
        this.merkleData = null;
        this.userEligibility = null;
        this.airdropStatus = null;
        this.updateInterval = null;
        
        this.init();
    }

    async init() {
        console.log('🪂 Initializing Airdrop Merkle...');
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Load initial airdrop status
        await this.loadAirdropStatus();
        
        // Load Merkle data (if available)
        await this.loadMerkleData();
        
        // Update UI
        this.updateAirdropUI();
    }

    // Load airdrop status from contract
    async loadAirdropStatus() {
        try {
            if (!window.modernWeb3 || !window.modernWeb3.contracts.airdrop) {
                this.airdropStatus = {
                    active: false,
                    deadline: 0,
                    totalAmount: 0
                };
                return;
            }

            const contract = window.modernWeb3.contracts.airdrop;
            
            // Get claim deadline from contract
            const deadline = await contract.claimDeadline();
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Airdrop is active if deadline is in the future
            const active = Number(deadline) > currentTime;

            this.airdropStatus = {
                active: active,
                deadline: Number(deadline),
                totalAmount: 0 // This would be set by admin
            };

            console.log('📊 Airdrop Status:', this.airdropStatus);

        } catch (error) {
            console.error('Error loading airdrop status:', error);
            this.airdropStatus = {
                active: false,
                deadline: 0,
                totalAmount: 0
            };
        }
    }

    // Load Merkle tree data using the generator
    async loadMerkleData() {
        try {
            // Wait for formatTokenAmount to be available
            const waitForFormatFunction = () => {
                return new Promise((resolve) => {
                    const checkFormat = () => {
                        if (typeof window.formatTokenAmount === 'function') {
                            resolve();
                        } else {
                            setTimeout(checkFormat, 100);
                        }
                    };
                    checkFormat();
                });
            };

            await waitForFormatFunction();

            // Use the Merkle tree generator for sample data
            if (window.loadSampleMerkleData) {
                this.merkleData = window.loadSampleMerkleData();
                console.log('🌳 Merkle data loaded from generator:', this.merkleData);
            } else {
                // Fallback to simple mock data
                this.merkleData = {
                    merkleRoot: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                    totalAmount: "2600000000000000000000", // 2600 tokens total
                    eligibleAddresses: 5,
                    claims: {
                        "0x742d35cc6635c0532925a3b8d400d2af9b1c2b6d": {
                            amount: "1000000000000000000000", // 1000 tokens
                            proof: ["0xabcd1234", "0xefgh5678"]
                        }
                    }
                };
                console.log('🌳 Fallback Merkle data loaded:', this.merkleData);
            }

        } catch (error) {
            console.error('Error loading Merkle data:', error);
            this.merkleData = null;
        }
    }

    // Check user eligibility
    async checkUserEligibility(userAddress) {
        if (!userAddress) {
            this.userEligibility = null;
            return;
        }

        try {
            // Use Merkle generator for eligibility check if available
            if (window.checkSampleEligibility) {
                const eligibilityData = window.checkSampleEligibility(userAddress);
                
                // Check if already claimed
                let hasClaimed = false;
                if (window.modernWeb3 && window.modernWeb3.contracts.airdrop) {
                    try {
                        hasClaimed = await window.modernWeb3.contracts.airdrop.hasClaimed(userAddress);
                    } catch (error) {
                        console.log('Could not check claim status from contract:', error.message);
                        hasClaimed = false;
                    }
                }

                this.userEligibility = {
                    ...eligibilityData,
                    hasClaimed: hasClaimed
                };
            } else {
                // Fallback to manual check
                const addressLower = userAddress.toLowerCase();
                const eligibleData = this.merkleData?.claims[addressLower];

                if (eligibleData) {
                    let hasClaimed = false;
                    if (window.modernWeb3 && window.modernWeb3.contracts.airdrop) {
                        try {
                            hasClaimed = await window.modernWeb3.contracts.airdrop.hasClaimed(userAddress);
                        } catch (error) {
                            hasClaimed = false;
                        }
                    }

                    this.userEligibility = {
                        isEligible: true,
                        amount: eligibleData.amount,
                        proof: eligibleData.proof,
                        hasClaimed: hasClaimed,
                        formattedAmount: window.formatTokenAmount(eligibleData.amount)
                    };
                } else {
                    this.userEligibility = {
                        isEligible: false,
                        amount: "0",
                        proof: [],
                        hasClaimed: false,
                        formattedAmount: "0"
                    };
                }
            }

            console.log('👤 User eligibility:', this.userEligibility);

        } catch (error) {
            console.error('Error checking user eligibility:', error);
            this.userEligibility = null;
        }
    }

    // Claim airdrop with Merkle proof
    async claimAirdrop() {
        try {
            if (!window.modernWeb3 || !window.modernWeb3.isConnected) {
                throw new Error('Wallet not connected');
            }

            if (!this.userEligibility || !this.userEligibility.isEligible) {
                throw new Error('Not eligible for airdrop');
            }

            if (this.userEligibility.hasClaimed) {
                throw new Error('Airdrop already claimed');
            }

            const contract = window.modernWeb3.contracts.airdrop;
            
            console.log('🔄 Claiming airdrop...');
            console.log('Amount:', this.userEligibility.amount);
            console.log('Proof:', this.userEligibility.proof);

            // Call the contract's claim function with Merkle proof
            const claimTx = await contract.claim(
                this.userEligibility.amount,
                this.userEligibility.proof
            );
            
            await claimTx.wait();
            
            console.log('✅ Airdrop claimed successfully!');
            
            // Update eligibility status
            this.userEligibility.hasClaimed = true;
            
            // Update UI
            this.updateAirdropUI();
            
            // Show success message
            this.showNotification('Airdrop claimed successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error claiming airdrop:', error);
            this.showNotification('Error claiming airdrop: ' + error.message, 'error');
        }
    }

    // Update airdrop UI
    updateAirdropUI() {
        this.updateStatusCards();
        this.updateClaimInterface();
        this.updateStatistics();
    }

    // Update status cards
    updateStatusCards() {
        // Airdrop Status
        const statusIndicator = document.getElementById('airdrop-status-indicator');
        const statusText = document.getElementById('airdrop-status-text');
        
        if (statusIndicator && statusText) {
            if (this.airdropStatus && this.airdropStatus.active) {
                statusIndicator.className = 'w-3 h-3 rounded-full bg-green-400';
                statusText.textContent = 'Active';
            } else {
                statusIndicator.className = 'w-3 h-3 rounded-full bg-red-400';
                statusText.textContent = 'Inactive';
            }
        }

        // User Eligibility
        const eligibilityIcon = document.getElementById('eligibility-icon');
        const claimableAmount = document.getElementById('claimable-amount');
        
        if (eligibilityIcon && claimableAmount) {
            if (!window.modernWeb3 || !window.modernWeb3.isConnected) {
                eligibilityIcon.className = 'fa-solid fa-question-circle text-gray-500';
                claimableAmount.textContent = 'Connect Wallet';
            } else if (this.userEligibility && this.userEligibility.isEligible) {
                if (this.userEligibility.hasClaimed) {
                    eligibilityIcon.className = 'fa-solid fa-check-circle text-green-400';
                    claimableAmount.textContent = 'Already Claimed';
                } else {
                    eligibilityIcon.className = 'fa-solid fa-gift text-orange-400';
                    claimableAmount.textContent = `${parseFloat(this.userEligibility.formattedAmount).toLocaleString()} DAYA`;
                }
            } else {
                eligibilityIcon.className = 'fa-solid fa-times-circle text-red-400';
                claimableAmount.textContent = 'Not Eligible';
            }
        }

        // Claim Deadline
        const claimDeadline = document.getElementById('claim-deadline');
        if (claimDeadline && this.airdropStatus && this.airdropStatus.deadline > 0) {
            const deadline = new Date(this.airdropStatus.deadline * 1000);
            const now = new Date();
            const timeLeft = deadline.getTime() - now.getTime();
            
            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                claimDeadline.textContent = `${days}d ${hours}h`;
            } else {
                claimDeadline.textContent = 'Expired';
            }
        } else if (claimDeadline) {
            claimDeadline.textContent = '--';
        }
    }

    // Update claim interface
    updateClaimInterface() {
        const connectRequired = document.getElementById('airdrop-connect-required');
        const claimInterface = document.getElementById('airdrop-claim-interface');
        const claimBtn = document.getElementById('claim-airdrop-btn');
        const alreadyClaimed = document.getElementById('already-claimed');
        
        if (!connectRequired || !claimInterface) return;

        if (!window.modernWeb3 || !window.modernWeb3.isConnected) {
            // Show connect wallet interface
            connectRequired.classList.remove('hidden');
            claimInterface.classList.add('hidden');
        } else {
            // Show claim interface
            connectRequired.classList.add('hidden');
            claimInterface.classList.remove('hidden');
            
            // Update claim details
            const claimAmountDisplay = document.getElementById('claim-amount-display');
            const userAddressDisplay = document.getElementById('user-address-display');
            const claimStatusDisplay = document.getElementById('claim-status-display');
            
            if (claimAmountDisplay && this.userEligibility) {
                claimAmountDisplay.textContent = this.userEligibility.isEligible ? 
                    `${parseFloat(this.userEligibility.formattedAmount).toLocaleString()} DAYA` : '0 DAYA';
            }
            
            if (userAddressDisplay && window.modernWeb3.userAddress) {
                userAddressDisplay.textContent = `${window.modernWeb3.userAddress.slice(0, 6)}...${window.modernWeb3.userAddress.slice(-4)}`;
            }
            
            if (claimStatusDisplay) {
                if (!this.userEligibility) {
                    claimStatusDisplay.textContent = 'Checking...';
                } else if (!this.userEligibility.isEligible) {
                    claimStatusDisplay.textContent = 'Not Eligible';
                } else if (this.userEligibility.hasClaimed) {
                    claimStatusDisplay.textContent = 'Already Claimed';
                } else {
                    claimStatusDisplay.textContent = 'Ready to Claim';
                }
            }
            
            // Update claim button and already claimed message
            if (this.userEligibility && this.userEligibility.isEligible && this.userEligibility.hasClaimed) {
                claimBtn.classList.add('hidden');
                alreadyClaimed.classList.remove('hidden');
            } else {
                claimBtn.classList.remove('hidden');
                alreadyClaimed.classList.add('hidden');
                
                // Enable/disable claim button
                const canClaim = this.userEligibility && 
                                this.userEligibility.isEligible && 
                                !this.userEligibility.hasClaimed &&
                                this.airdropStatus && 
                                this.airdropStatus.active;
                
                claimBtn.disabled = !canClaim;
            }
        }
    }

    // Update statistics
    updateStatistics() {
        const totalAirdropAmount = document.getElementById('total-airdrop-amount');
        const claimedAmount = document.getElementById('claimed-amount');
        const eligibleAddresses = document.getElementById('eligible-addresses');
        const timeRemaining = document.getElementById('time-remaining');
        
        if (totalAirdropAmount && this.merkleData) {
            const total = window.formatTokenAmount(this.merkleData.totalAmount);
            totalAirdropAmount.textContent = `${parseFloat(total).toLocaleString()}`;
        }
        
        if (eligibleAddresses && this.merkleData) {
            eligibleAddresses.textContent = this.merkleData.eligibleAddresses.toLocaleString();
        }
        
        if (timeRemaining && this.airdropStatus && this.airdropStatus.deadline > 0) {
            const deadline = new Date(this.airdropStatus.deadline * 1000);
            const now = new Date();
            const timeLeft = deadline.getTime() - now.getTime();
            
            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                timeRemaining.textContent = `${days} days`;
            } else {
                timeRemaining.textContent = 'Expired';
            }
        }
        
        // Claimed amount would need to be tracked separately
        if (claimedAmount) {
            claimedAmount.textContent = '--';
        }
    }

    // Start periodic updates
    startPeriodicUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(async () => {
            await this.loadAirdropStatus();
            
            if (window.modernWeb3 && window.modernWeb3.isConnected) {
                await this.checkUserEligibility(window.modernWeb3.userAddress);
            }
            
            this.updateAirdropUI();
        }, 30000);
    }

    // Stop periodic updates
    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Use the global notification system if available
        if (window.showNotification) {
            return window.showNotification(message, type);
        }
        
        // Fallback to simple alert
        alert(message);
    }

    // Handle wallet connection changes
    async onWalletConnected(userAddress) {
        await this.checkUserEligibility(userAddress);
        this.updateAirdropUI();
    }

    // Handle wallet disconnection
    onWalletDisconnected() {
        this.userEligibility = null;
        this.updateAirdropUI();
    }
}

// Global airdrop instance
window.airdropMerkle = null;

// Global function for claiming airdrop (called from HTML)
window.claimAirdrop = async function() {
    if (window.airdropMerkle) {
        await window.airdropMerkle.claimAirdrop();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🪂 Initializing Airdrop Merkle...');
    
    // Initialize immediately
    window.airdropMerkle = new AirdropMerkle();
    
    // Setup wallet connection monitoring
    function setupWalletMonitoring() {
        // Use the new modern implementation
        if (window.modernWeb3) {
            // Monitor connection changes
            const checkConnection = () => {
                if (window.modernWeb3.isConnected && window.airdropMerkle) {
                    window.airdropMerkle.onWalletConnected(window.modernWeb3.userAddress);
                } else if (!window.modernWeb3.isConnected && window.airdropMerkle) {
                    window.airdropMerkle.onWalletDisconnected();
                }
            };
            
            // Check connection every 2 seconds
            setInterval(checkConnection, 2000);
            
            // Check initial connection
            checkConnection();
            
            console.log('✅ Modern wallet monitoring configured');
        } else {
            // Retry after a short delay
            setTimeout(setupWalletMonitoring, 500);
        }
    }
    
    // Start monitoring
    setupWalletMonitoring();
    
    console.log('🪂 Airdrop Merkle integration initialized');
});

    // Make class available globally
    window.AirdropMerkle = AirdropMerkle;
} else {
    console.log('🪂 AirdropMerkle already loaded, skipping');
}
