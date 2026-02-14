// BASED DAYANA ($DAYA) - Ultra Modern Wallet Connection 2024
// Uses the latest Web3 technologies: Web3Modal v4, Ethers v6, and modern best practices

class UltraModernWallet {
    constructor() {
        this.web3Modal = null;
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.isConnected = false;
        this.chainId = 8453; // Base Mainnet
        
        // Modern wallet configurations
        this.walletConfig = {
            projectId: '9aa3d95b3bc440fa88ea12eaa4456161', // WalletConnect Project ID
            chains: {
                base: {
                    chainId: 8453,
                    name: 'Base',
                    currency: 'ETH',
                    explorerUrl: 'https://basescan.org',
                    rpcUrl: 'https://mainnet.base.org'
                }
            },
            metadata: {
                name: 'BASED DAYANA',
                description: 'Revolutionary DeFi Ecosystem',
                url: 'https://baseddayana.xyz',
                icons: ['https://baseddayana.xyz/images/logo.png']
            }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Ultra Modern Wallet System...');
        
        try {
            // Wait for dependencies to load
            await this.waitForDependencies();
            
            // Initialize Web3Modal v4
            await this.initializeWeb3Modal();
            
            // Check for existing connections
            await this.checkExistingConnection();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Ultra Modern Wallet System initialized');
        } catch (error) {
            console.error('❌ Error initializing wallet system:', error);
        }
    }

    async waitForDependencies(timeout = 10000) {
        console.log('⏳ Waiting for Web3 dependencies...');
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkDependencies = () => {
                // Check both window.ethers and global ethers
                const ethersReady = typeof window.ethers !== 'undefined' || typeof ethers !== 'undefined';
                
                if (ethersReady) {
                    console.log('✅ Dependencies ready');
                    // Make sure ethers is available globally
                    if (typeof window.ethers === 'undefined' && typeof ethers !== 'undefined') {
                        window.ethers = ethers;
                    }
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    console.warn('⚠️ Dependencies timeout, using fallback');
                    resolve(false);
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }

    async initializeWeb3Modal() {
        try {
            // Try Web3Modal v4 first
            if (typeof window.createWeb3Modal !== 'undefined') {
                console.log('🔧 Initializing Web3Modal v4...');
                
                this.web3Modal = window.createWeb3Modal({
                    projectId: this.walletConfig.projectId,
                    chains: [this.walletConfig.chains.base],
                    defaultChain: this.walletConfig.chains.base,
                    metadata: this.walletConfig.metadata,
                    themeMode: 'dark',
                    themeVariables: {
                        '--w3m-accent': '#F97316',
                        '--w3m-color-mix': '#F97316',
                        '--w3m-color-mix-strength': 40
                    },
                    featuredWalletIds: [
                        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
                        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
                        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
                        'fd20dc426fb37566d208305f0e130e9be0d2b1468da7791a94b1536defbcfcfc'  // Coinbase
                    ]
                });
                
                console.log('✅ Web3Modal v4 initialized');
                return;
            }
            
            // Fallback to older Web3Modal
            if (typeof window.Web3Modal !== 'undefined') {
                console.log('🔧 Using Web3Modal fallback...');
                
                this.web3Modal = new window.Web3Modal({
                    cacheProvider: true,
                    providerOptions: {
                        walletconnect: {
                            package: window.WalletConnectProvider,
                            options: {
                                infuraId: this.walletConfig.projectId
                            }
                        }
                    }
                });
                
                console.log('✅ Web3Modal fallback initialized');
                return;
            }
            
            console.warn('⚠️ No Web3Modal available, will use direct connections');
            
        } catch (error) {
            console.error('❌ Error initializing Web3Modal:', error);
        }
    }

    async connectWallet() {
        try {
            console.log('🔄 Connecting wallet...');
            
            // Update UI to show connecting state
            this.updateConnectionState('connecting');
            
            // Try modern Web3Modal first
            if (this.web3Modal && typeof this.web3Modal.connect === 'function') {
                return await this.connectWithWeb3Modal();
            }
            
            // Try legacy Web3Modal
            if (window.Web3Modal && typeof window.Web3Modal === 'function') {
                return await this.connectWithLegacyWeb3Modal();
            }
            
            // Fallback to direct MetaMask connection
            return await this.connectDirectMetaMask();
            
        } catch (error) {
            console.error('❌ Connection error:', error);
            this.showError(`Connection failed: ${error.message}`);
            this.updateConnectionState('disconnected');
            return false;
        }
    }

    async connectWithLegacyWeb3Modal() {
        try {
            console.log('🔗 Using Legacy Web3Modal...');
            
            // Create Web3Modal instance if not exists
            if (!this.web3Modal) {
                this.web3Modal = new window.Web3Modal({
                    cacheProvider: true,
                    providerOptions: {}
                });
            }
            
            const provider = await this.web3Modal.connect();
            
            if (!provider) {
                throw new Error('No provider returned from Web3Modal');
            }
            
            // Create ethers provider (v5 syntax)
            this.provider = new ethers.providers.Web3Provider(provider);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Check network
            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== this.chainId) {
                await this.switchToBaseNetwork();
            }
            
            this.isConnected = true;
            this.updateConnectionState('connected');
            
            // Setup provider listeners
            this.setupProviderListeners(provider);
            
            console.log('✅ Legacy Web3Modal connection successful:', this.userAddress);
            this.showSuccess('Wallet connected successfully!');
            
            return true;
            
        } catch (error) {
            console.error('❌ Legacy Web3Modal connection failed:', error);
            throw error;
        }
    }

    async connectWithWeb3Modal() {
        try {
            console.log('🔗 Opening Web3Modal...');
            
            // Open the modal
            const provider = await this.web3Modal.connect();
            
            if (!provider) {
                throw new Error('No provider returned from Web3Modal');
            }
            
            // Create ethers provider (v5 syntax)
            this.provider = new ethers.providers.Web3Provider(provider);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Check network
            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== this.chainId) {
                await this.switchToBaseNetwork();
            }
            
            this.isConnected = true;
            this.updateConnectionState('connected');
            
            // Setup provider listeners
            this.setupProviderListeners(provider);
            
            console.log('✅ Web3Modal connection successful:', this.userAddress);
            this.showSuccess('Wallet connected successfully!');
            
            return true;
            
        } catch (error) {
            console.error('❌ Web3Modal connection failed:', error);
            throw error;
        }
    }

    async connectDirectMetaMask() {
        try {
            console.log('🦊 Connecting directly to MetaMask...');
            
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            // Create ethers provider (v5 syntax)
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = accounts[0];

            // Check network
            const network = await this.provider.getNetwork();
            if (Number(network.chainId) !== this.chainId) {
                await this.switchToBaseNetwork();
            }

            this.isConnected = true;
            this.updateConnectionState('connected');

            // Setup provider listeners
            this.setupProviderListeners(window.ethereum);

            console.log('✅ MetaMask connection successful:', this.userAddress);
            this.showSuccess('MetaMask connected successfully!');

            return true;

        } catch (error) {
            console.error('❌ MetaMask connection failed:', error);
            
            if (error.code === 4001) {
                throw new Error('Connection rejected by user');
            } else if (error.code === -32002) {
                throw new Error('Connection request already pending');
            }
            
            throw error;
        }
    }

    async switchToBaseNetwork() {
        try {
            console.log('🔄 Switching to Base network...');
            
            const ethereum = this.provider?.provider || window.ethereum;
            
            if (!ethereum) {
                throw new Error('No ethereum provider available');
            }

            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${this.chainId.toString(16)}` }]
                });
                
                console.log('✅ Switched to Base network');
                
            } catch (switchError) {
                // Add network if it doesn't exist
                if (switchError.code === 4902) {
                    console.log('🔄 Adding Base network...');
                    
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${this.chainId.toString(16)}`,
                            chainName: 'Base',
                            nativeCurrency: {
                                name: 'Ethereum',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org']
                        }]
                    });
                    
                    console.log('✅ Base network added and switched');
                } else {
                    throw switchError;
                }
            }
            
        } catch (error) {
            console.error('❌ Network switch failed:', error);
            this.showWarning('Please manually switch to Base network');
        }
    }

    setupProviderListeners(provider) {
        if (!provider || !provider.on) return;

        // Account changes
        provider.on('accountsChanged', (accounts) => {
            console.log('👤 Account changed:', accounts);
            
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.userAddress = accounts[0];
                this.updateConnectionState('connected');
            }
        });

        // Network changes
        provider.on('chainChanged', (chainId) => {
            console.log('🌐 Network changed:', chainId);
            
            const newChainId = parseInt(chainId, 16);
            if (newChainId !== this.chainId) {
                this.showWarning('Please switch to Base network');
            }
            
            // Reload to handle network change
            setTimeout(() => window.location.reload(), 1000);
        });

        // Disconnection
        provider.on('disconnect', (error) => {
            console.log('🔌 Provider disconnected:', error);
            this.disconnect();
        });
    }

    async checkExistingConnection() {
        try {
            // Check Web3Modal cache
            if (this.web3Modal && this.web3Modal.cachedProvider) {
                console.log('🔍 Checking cached Web3Modal connection...');
                return await this.connectWithWeb3Modal();
            }
            
            // Check MetaMask
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log('🔍 Found existing MetaMask connection...');
                    return await this.connectDirectMetaMask();
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking existing connection:', error);
        }
    }

    async disconnect() {
        try {
            console.log('🔌 Disconnecting wallet...');
            
            // Clear Web3Modal cache
            if (this.web3Modal && typeof this.web3Modal.clearCachedProvider === 'function') {
                this.web3Modal.clearCachedProvider();
            }
            
            // Reset state
            this.provider = null;
            this.signer = null;
            this.userAddress = null;
            this.isConnected = false;
            
            this.updateConnectionState('disconnected');
            
            console.log('✅ Wallet disconnected');
            
        } catch (error) {
            console.error('❌ Disconnect error:', error);
        }
    }

    updateConnectionState(state) {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const mobileBtn = document.getElementById('connect-wallet-mobile-btn');
        const modernBtn = document.getElementById('modern-connect-btn');
        
        const buttons = [connectBtn, mobileBtn, modernBtn].filter(btn => btn);
        
        buttons.forEach(button => {
            if (state === 'connected' && this.userAddress) {
                const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                button.innerHTML = `<i class="fa-solid fa-wallet mr-2"></i>${shortAddress}`;
                button.className = button.className.replace(/bg-orange-\d+|hover:bg-orange-\d+/g, '');
                button.className += ' bg-green-600 hover:bg-green-500';
                
            } else if (state === 'connecting') {
                button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Connecting...';
                button.disabled = true;
                
            } else {
                button.innerHTML = 'CONNECT WALLET';
                button.disabled = false;
                button.className = button.className.replace(/bg-green-\d+|hover:bg-green-\d+/g, '');
                button.className += ' bg-orange-500 hover:bg-orange-400';
            }
        });
        
        // Update airdrop UI if connected
        if (state === 'connected' && this.userAddress && window.updateAirdropUI) {
            window.updateAirdropUI(this.userAddress);
        }
    }

    setupEventListeners() {
        // Connect buttons
        const connectBtn = document.getElementById('connect-wallet-btn');
        const mobileBtn = document.getElementById('connect-wallet-mobile-btn');
        const modernBtn = document.getElementById('modern-connect-btn');
        
        [connectBtn, mobileBtn, modernBtn].forEach(button => {
            if (button) {
                button.addEventListener('click', async () => {
                    if (this.isConnected) {
                        await this.disconnect();
                    } else {
                        await this.connectWallet();
                    }
                });
            }
        });
    }

    // Utility methods for UI feedback
    showSuccess(message) {
        console.log('✅ SUCCESS:', message);
        this.showNotification(message, 'success');
    }

    showError(message) {
        console.error('❌ ERROR:', message);
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        console.warn('⚠️ WARNING:', message);
        this.showNotification(message, 'warning');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-black'
        };
        
        notification.className += ` ${colors[type] || colors.success}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'exclamation'}-circle mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Contract interaction helpers
    async getBalance(tokenAddress) {
        if (!this.provider || !this.userAddress) return '0';
        
        try {
            if (!tokenAddress) {
                // ETH balance
                const balance = await this.provider.getBalance(this.userAddress);
                return ethers.utils.formatEther(balance);
            } else {
                // Token balance
                const contract = new ethers.Contract(
                    tokenAddress,
                    ['function balanceOf(address) view returns (uint256)'],
                    this.provider
                );
                const balance = await contract.balanceOf(this.userAddress);
                return ethers.utils.formatEther(balance);
            }
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    async sendTransaction(to, value, data = '0x') {
        if (!this.signer) throw new Error('No signer available');
        
        try {
            const tx = await this.signer.sendTransaction({
                to,
                value: ethers.utils.parseEther(value.toString()),
                data
            });
            
            console.log('📤 Transaction sent:', tx.hash);
            this.showSuccess(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
            
            return tx;
        } catch (error) {
            console.error('❌ Transaction failed:', error);
            this.showError(`Transaction failed: ${error.message}`);
            throw error;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.ultraModernWallet = new UltraModernWallet();
    
    // Also create backward compatibility
    window.modernWeb3 = window.ultraModernWallet;
    window.dayanaWeb3 = window.ultraModernWallet;
    
    console.log('🚀 Ultra Modern Wallet integration initialized');
});
