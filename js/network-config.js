// BASED DAYANA ($DAYA) - Network Configuration
// Base Mainnet configuration and network utilities

const BASE_NETWORK_CONFIG = {
    chainId: 8453,
    chainName: 'Base Mainnet',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: [
        'https://mainnet.base.org',
        'https://base-mainnet.g.alchemy.com/v2/demo',
        'https://base-mainnet.infura.io/v3/demo'
    ],
    blockExplorerUrls: [
        'https://basescan.org'
    ],
    iconUrls: [
        'https://base.org/favicon.ico'
    ]
};

class NetworkManager {
    constructor() {
        this.currentNetwork = null;
        this.isCorrectNetwork = false;
    }

    async checkNetwork() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('No Web3 provider found');
            }

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkId = parseInt(chainId, 16);
            
            this.currentNetwork = networkId;
            this.isCorrectNetwork = networkId === BASE_NETWORK_CONFIG.chainId;
            
            return {
                current: networkId,
                required: BASE_NETWORK_CONFIG.chainId,
                isCorrect: this.isCorrectNetwork,
                networkName: this.getNetworkName(networkId)
            };
        } catch (error) {
            console.error('Error checking network:', error);
            return {
                current: null,
                required: BASE_NETWORK_CONFIG.chainId,
                isCorrect: false,
                error: error.message
            };
        }
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            8453: 'Base Mainnet',
            84531: 'Base Sepolia',
            11155111: 'Sepolia Testnet',
            5: 'Goerli Testnet'
        };
        return networks[chainId] || `Unknown Network (${chainId})`;
    }

    async switchToBaseNetwork() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('No Web3 provider found');
            }

            // Try to switch to Base Mainnet
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }] // Base Mainnet chainId in hex
            });

            console.log('✅ Switched to Base Mainnet');
            return true;

        } catch (switchError) {
            if (switchError.code === 4902) {
                // Network not added, add it
                return await this.addBaseNetwork();
            } else {
                throw switchError;
            }
        }
    }

    async addBaseNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [BASE_NETWORK_CONFIG]
            });

            console.log('✅ Base Mainnet added to wallet');
            return true;

        } catch (error) {
            console.error('Error adding Base network:', error);
            throw error;
        }
    }

    async ensureCorrectNetwork() {
        const networkStatus = await this.checkNetwork();
        
        if (!networkStatus.isCorrect) {
            console.log(`🔄 Switching from ${networkStatus.networkName} to Base Mainnet...`);
            
            try {
                await this.switchToBaseNetwork();
                
                // Verify switch was successful
                const newStatus = await this.checkNetwork();
                if (newStatus.isCorrect) {
                    console.log('✅ Successfully switched to Base Mainnet');
                    return true;
                } else {
                    throw new Error('Failed to switch to Base Mainnet');
                }
            } catch (error) {
                console.error('❌ Failed to switch network:', error);
                throw error;
            }
        } else {
            console.log('✅ Already on Base Mainnet');
            return true;
        }
    }

    setupNetworkListeners() {
        if (typeof window.ethereum !== 'undefined') {
            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                const networkId = parseInt(chainId, 16);
                console.log('Network changed to:', this.getNetworkName(networkId));
                
                if (networkId !== BASE_NETWORK_CONFIG.chainId) {
                    this.showNetworkWarning();
                } else {
                    this.hideNetworkWarning();
                }
            });

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    console.log('Wallet disconnected');
                }
            });
        }
    }

    showNetworkWarning() {
        // Remove existing warning if any
        this.hideNetworkWarning();
        
        const warningDiv = document.createElement('div');
        warningDiv.id = 'network-warning';
        warningDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; background: #f59e0b; color: white; padding: 1rem; text-align: center; z-index: 9999;">
                <strong>⚠️ Wrong Network:</strong> Please switch to Base Mainnet to use BASED DAYANA.
                <button onclick="window.networkManager.switchToBaseNetwork()" style="margin-left: 1rem; padding: 0.5rem 1rem; background: white; color: #f59e0b; border: none; border-radius: 4px; cursor: pointer;">
                    Switch to Base
                </button>
            </div>
        `;
        document.body.appendChild(warningDiv);
    }

    hideNetworkWarning() {
        const existingWarning = document.getElementById('network-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
    }

    getNetworkInfo() {
        return {
            config: BASE_NETWORK_CONFIG,
            current: this.currentNetwork,
            isCorrect: this.isCorrectNetwork
        };
    }
}

// Initialize network manager
window.networkManager = new NetworkManager();

// Setup network listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.networkManager.setupNetworkListeners();
});

console.log('🌐 Network Manager loaded');


