// BASED DAYANA ($DAYA) - Network Fallback Configuration
// Handles network issues and provides offline functionality

class NetworkFallback {
    constructor() {
        this.isOnline = navigator.onLine;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.fallbackMode = false;
        
        this.init();
    }

    init() {
        console.log('🌐 Initializing Network Fallback System...');
        
        // Monitor network status
        window.addEventListener('online', () => {
            console.log('✅ Network connection restored');
            this.isOnline = true;
            this.retryCount = 0;
        });
        
        window.addEventListener('offline', () => {
            console.log('❌ Network connection lost');
            this.isOnline = false;
            this.activateFallbackMode();
        });
        
        // Check initial network status
        if (!this.isOnline) {
            this.activateFallbackMode();
        }
    }

    activateFallbackMode() {
        console.log('🔄 Activating fallback mode...');
        this.fallbackMode = true;
        
        // Show fallback notification
        this.showFallbackNotification();
        
        // Create minimal Web3 implementation
        this.createMinimalWeb3();
    }

    showFallbackNotification() {
        const notification = document.createElement('div');
        notification.id = 'network-fallback-notification';
        notification.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; background: #f59e0b; color: white; padding: 1rem; text-align: center; z-index: 9999;">
                <strong>Offline Mode:</strong> Using fallback Web3 implementation. Some features may be limited.
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 1rem; padding: 0.5rem 1rem; background: white; color: #f59e0b; border: none; border-radius: 4px; cursor: pointer;">
                    Dismiss
                </button>
            </div>
        `;
        document.body.appendChild(notification);
    }

    createMinimalWeb3() {
        console.log('🔧 Creating minimal Web3 implementation...');
        
        // Ensure ethers is available
        if (typeof window.ethers === 'undefined') {
            window.ethers = {
                providers: {
                    Web3Provider: function(provider) {
                        return {
                            getSigner: () => ({
                                getAddress: async () => {
                                    try {
                                        const accounts = await provider.request({ method: 'eth_accounts' });
                                        return accounts[0];
                                    } catch (error) {
                                        console.error('Error getting address:', error);
                                        return null;
                                    }
                                },
                                signMessage: async (message) => {
                                    try {
                                        return await provider.request({
                                            method: 'personal_sign',
                                            params: [message, await this.getAddress()]
                                        });
                                    } catch (error) {
                                        console.error('Error signing message:', error);
                                        throw error;
                                    }
                                }
                            }),
                            getNetwork: async () => {
                                try {
                                    const chainId = await provider.request({ method: 'eth_chainId' });
                                    return {
                                        chainId: parseInt(chainId, 16)
                                    };
                                } catch (error) {
                                    console.error('Error getting network:', error);
                                    return { chainId: 8453 }; // Default to Base
                                }
                            }
                        };
                    }
                },
                utils: {
                    formatUnits: (amount, decimals = 18) => {
                        try {
                            if (!amount || amount === '0') return '0';
                            
                            // Handle BigNumber-like objects
                            if (amount && typeof amount.toString === 'function') {
                                amount = amount.toString();
                            }
                            
                            const divisor = Math.pow(10, decimals);
                            const result = parseFloat(amount) / divisor;
                            return result.toFixed(4);
                        } catch (error) {
                            console.error('Error formatting units:', error);
                            return '0';
                        }
                    },
                    parseUnits: (amount, decimals = 18) => {
                        try {
                            if (!amount) return '0';
                            
                            const multiplier = Math.pow(10, decimals);
                            return (parseFloat(amount) * multiplier).toString();
                        } catch (error) {
                            console.error('Error parsing units:', error);
                            return '0';
                        }
                    },
                    formatEther: (amount) => {
                        return this.formatUnits(amount, 18);
                    },
                    parseEther: (amount) => {
                        return this.parseUnits(amount, 18);
                    }
                },
                BigNumber: {
                    from: (value) => ({
                        toString: () => value.toString(),
                        toNumber: () => parseFloat(value),
                        isZero: () => value === '0' || value === 0
                    })
                }
            };
        }
        
        console.log('✅ Minimal Web3 implementation created');
    }

    async retryConnection() {
        if (this.retryCount >= this.maxRetries) {
            console.log('❌ Max retries reached, staying in fallback mode');
            return false;
        }
        
        this.retryCount++;
        console.log(`🔄 Retrying connection (${this.retryCount}/${this.maxRetries})...`);
        
        try {
            // Test network connectivity
            const response = await fetch('https://api.github.com', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            this.isOnline = true;
            this.fallbackMode = false;
            this.retryCount = 0;
            
            console.log('✅ Network connection restored');
            return true;
        } catch (error) {
            console.log('❌ Network still unavailable');
            return false;
        }
    }

    isFallbackMode() {
        return this.fallbackMode;
    }

    getNetworkStatus() {
        return {
            isOnline: this.isOnline,
            fallbackMode: this.fallbackMode,
            retryCount: this.retryCount
        };
    }
}

// Initialize network fallback system
window.networkFallback = new NetworkFallback();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkFallback;
}

