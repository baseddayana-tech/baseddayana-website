// BASED DAYANA ($DAYA) - Modern Web3 Integration
// Implementación moderna usando Web3Modal v3 y WalletConnect v2

class ModernWeb3 {
    constructor() {
        this.web3Modal = null;
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.isConnected = false;
        this.contracts = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 [LOG] Initializing Modern Web3...');
        
        try {
            // Configure Web3Modal
            await this.setupWeb3Modal();
            
            // Check existing connection
            await this.checkExistingConnection();
            
            console.log('✅ [LOG] Modern Web3 initialized successfully');
        } catch (error) {
            console.error('❌ [LOG] Error initializing Modern Web3:', error);
        }
    }

    async setupWeb3Modal() {
        // Wait for Web3Modal to be available
        await this.waitForWeb3Modal();
        
        try {
            const projectId = '9aa3d95b3bc440fa88ea12eaa4456161'; // Infura Project ID
            
            this.web3Modal = new window.Web3Modal.default({
                projectId: projectId,
                themeMode: 'dark',
                themeVariables: {
                    '--w3m-color-mix': '#F97316',
                    '--w3m-color-mix-strength': 40,
                    '--w3m-accent': '#F97316',
                    '--w3m-border-radius-master': '12px'
                },
                chains: [8453], // Base Mainnet
                defaultChain: {
                    chainId: 8453,
                    name: 'Base',
                    currency: 'ETH',
                    explorerUrl: 'https://basescan.org',
                    rpcUrl: 'https://mainnet.base.org'
                },
                // Enhanced wallet support
                featuredWalletIds: [
                    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
                    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
                    'fd20dc426fb37566d208305f0e130e9be0d2b1468da7791a94b1536defbcfcfc', // Rainbow
                    'fd20dc426fb37566d208305f0e130e9be0d2b1468da7791a94b1536defbcfcfc'  // Coinbase
                ],
                // Wallet connection options
                enableNetworkView: true,
                enableAccountView: true,
                enableExplorer: true,
                // Mobile support
                mobileWallets: [
                    {
                        id: 'metamask',
                        name: 'MetaMask',
                        links: {
                            native: 'metamask://',
                            universal: 'https://metamask.app.link'
                        }
                    },
                    {
                        id: 'trust',
                        name: 'Trust Wallet',
                        links: {
                            native: 'trust://',
                            universal: 'https://link.trustwallet.com'
                        }
                    }
                ]
            });
            
            console.log('✅ Web3Modal configured successfully');
        } catch (error) {
            console.error('❌ Error configuring Web3Modal:', error);
            // Fallback to direct MetaMask connection
            this.web3Modal = null;
        }
    }

    async waitForWeb3Modal() {
        return new Promise((resolve) => {
            const checkWeb3Modal = () => {
                if (typeof window.Web3Modal !== 'undefined' && window.Web3Modal.default) {
                    resolve();
                } else {
                    setTimeout(checkWeb3Modal, 100);
                }
            };
            checkWeb3Modal();
        });
    }

    async connectWallet() {
        try {
            console.log('🔄 Connecting wallet...');
            
            // Wait for ethers to be available with timeout
            const ethersAvailable = await this.waitForEthers();
            if (!ethersAvailable) {
                console.log('⚠️ Ethers not available, trying basic connection...');
                return await this.connectBasic();
            }
            
            // Try Web3Modal first, then fallback to direct connections
            if (this.web3Modal) {
                try {
                    return await this.connectWithWeb3Modal();
                } catch (web3ModalError) {
                    console.warn('⚠️ Web3Modal connection failed, trying direct connections:', web3ModalError);
                    return await this.connectWithDirectWallets();
                }
            } else {
                console.log('⚠️ Web3Modal not available, using direct wallet connections');
                return await this.connectWithDirectWallets();
            }

        } catch (error) {
            console.error('❌ Error connecting wallet:', error);
            this.showError('Error connecting wallet: ' + error.message);
            return false;
        }
    }

    async waitForEthers(timeout = 5000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkEthers = () => {
                if (typeof ethers !== 'undefined' && ethers.providers) {
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    resolve(false);
                } else {
                    setTimeout(checkEthers, 100);
                }
            };
            checkEthers();
        });
    }

    async connectBasic() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            this.provider = window.ethereum;
            this.userAddress = accounts[0];
            this.isConnected = true;

            // Update UI
            this.updateUI();

            console.log('✅ Basic wallet connection successful:', this.userAddress);
            return true;

        } catch (error) {
            console.error('❌ Basic connection failed:', error);
            return false;
        }
    }

    async connectWithWeb3Modal() {
        // Open connection modal
        this.provider = await this.web3Modal.open();
        
        if (!this.provider) {
            throw new Error('Could not connect wallet through Web3Modal');
        }

        // Create signer with ethers verification
        if (!ethers.providers || !ethers.providers.Web3Provider) {
            throw new Error('Ethers.js is not fully loaded');
        }
        
        this.signer = new ethers.providers.Web3Provider(this.provider).getSigner();
        this.userAddress = await this.signer.getAddress();
        this.isConnected = true;

        // Check correct network
        const network = await this.signer.provider.getNetwork();
        if (Number(network.chainId) !== 8453) {
            await this.switchToBaseNetwork();
        }

        // Setup listeners
        this.setupEventListeners();

        // Initialize contracts
        await this.initializeContracts();

        // Update UI
        this.updateUI();

        console.log('✅ Wallet connected via Web3Modal:', this.userAddress);
        return true;
    }

    async connectWithDirectWallets() {
        // Try MetaMask first (most common)
        if (typeof window.ethereum !== 'undefined') {
            try {
                return await this.connectDirectMetaMask();
            } catch (metaMaskError) {
                console.warn('MetaMask connection failed:', metaMaskError);
            }
        }

        // Try other wallet providers
        const walletProviders = [
            { name: 'Coinbase', provider: window.coinbaseWalletExtension },
            { name: 'Trust', provider: window.trustwallet },
            { name: 'Rainbow', provider: window.rainbow }
        ];

        for (const wallet of walletProviders) {
            if (wallet.provider) {
                try {
                    console.log(`🔄 Trying ${wallet.name} wallet...`);
                    return await this.connectWithProvider(wallet.provider, wallet.name);
                } catch (error) {
                    console.warn(`${wallet.name} connection failed:`, error);
                }
            }
        }

        throw new Error('No compatible wallet found. Please install MetaMask, Coinbase Wallet, Trust Wallet, or Rainbow Wallet.');
    }

    async connectWithProvider(provider, walletName) {
        // Request account access
        const accounts = await provider.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error(`No accounts found in ${walletName}. Please unlock your wallet.`);
        }

        // Create provider and signer
        this.provider = provider;
        this.signer = new ethers.providers.Web3Provider(this.provider).getSigner();
        this.userAddress = accounts[0];
        this.isConnected = true;

        // Check network
        const network = await this.signer.provider.getNetwork();
        if (Number(network.chainId) !== 8453) {
            await this.switchToBaseNetwork();
        }

        // Setup listeners
        this.setupEventListeners();

        // Initialize contracts
        await this.initializeContracts();

        // Update UI
        this.updateUI();

        console.log(`✅ ${walletName} wallet connected:`, this.userAddress);
        return true;
    }

    async connectDirectMetaMask() {
        try {
            // Check if MetaMask is available
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            // Check if ethers is available
            if (typeof ethers === 'undefined' || !ethers.providers) {
                throw new Error('Ethers.js is not loaded. Please reload the page.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            // Create provider and signer
            this.provider = window.ethereum;
            this.signer = new ethers.providers.Web3Provider(this.provider).getSigner();
            this.userAddress = accounts[0];
            this.isConnected = true;

            // Check network
            const network = await this.signer.provider.getNetwork();
            if (Number(network.chainId) !== 8453) {
                await this.switchToBaseNetwork();
            }

            // Setup listeners
            this.setupEventListeners();

            // Initialize contracts
            await this.initializeContracts();

            // Update UI
            this.updateUI();

            console.log('✅ MetaMask connected directly:', this.userAddress);
            return true;

        } catch (error) {
            console.error('❌ Error connecting MetaMask directly:', error);
            this.showError('Error connecting MetaMask: ' + error.message);
            return false;
        }
    }

    async disconnectWallet() {
        try {
            if (this.web3Modal) {
                await this.web3Modal.close();
            }
            
            this.provider = null;
            this.signer = null;
            this.userAddress = null;
            this.isConnected = false;
            this.contracts = {};
            
            this.updateUI();
            console.log('🔌 Wallet disconnected');
        } catch (error) {
            console.error('❌ Error disconnecting wallet:', error);
        }
    }

    setupEventListeners() {
        if (this.provider) {
            // Listen for account changes
            this.provider.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.userAddress = accounts[0];
                    this.updateUI();
                }
            });

            // Listen for network changes
            this.provider.on('chainChanged', (chainId) => {
                console.log('Network changed:', chainId);
                if (Number(chainId) !== 8453) {
                    this.switchToBaseNetwork();
                }
            });

            // Listen for disconnection
            this.provider.on('disconnect', () => {
                this.disconnectWallet();
            });
        }
    }

    async switchToBaseNetwork() {
        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base Mainnet
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                // Add network if it doesn't exist
                await this.provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x2105',
                        chainName: 'Base Mainnet',
                        nativeCurrency: {
                            name: 'Ethereum',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://mainnet.base.org'],
                        blockExplorerUrls: ['https://basescan.org']
                    }]
                });
            }
        }
    }

    async initializeContracts() {
        try {
            if (!this.signer) {
                console.log('⚠️ No signer available to initialize contracts');
                return;
            }

            // Check that contract functions are available
            if (typeof window.getContract !== 'function') {
                console.error('❌ getContract function not available');
                return;
            }

            this.contracts = {
                dayaToken: window.getContract('DAYA_TOKEN', this.signer),
                staking: window.getContract('STAKING', this.signer),
                rewards: window.getContract('REWARD_DISTRIBUTION', this.signer),
                airdrop: window.getContract('AIRDROP', this.signer),
                vesting: window.getContract('VESTING', this.signer),
                governance: window.getContract('GOVERNANCE', this.signer)
            };
            
            console.log('✅ Contracts initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing contracts:', error);
            // Don't throw error to avoid breaking connection
        }
    }

    async checkExistingConnection() {
        try {
            // Check if ethers is available
            if (typeof ethers === 'undefined' || !ethers.providers) {
                console.log('⚠️ Ethers.js not available to check existing connection');
                return;
            }

            // Check Web3Modal connection if available
            if (this.web3Modal && typeof this.web3Modal.getIsConnected === 'function') {
                const isConnected = this.web3Modal.getIsConnected();
                if (isConnected) {
                    this.provider = this.web3Modal.getWalletProvider();
                    this.signer = new ethers.providers.Web3Provider(this.provider).getSigner();
                    this.userAddress = await this.signer.getAddress();
                    this.isConnected = true;
                    
                    this.setupEventListeners();
                    await this.initializeContracts();
                    this.updateUI();
                    
                    console.log('✅ Existing Web3Modal connection detected:', this.userAddress);
                    return;
                }
            }

            // Fallback: check direct MetaMask connection
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.provider = window.ethereum;
                    this.signer = new ethers.providers.Web3Provider(this.provider).getSigner();
                    this.userAddress = accounts[0];
                    this.isConnected = true;
                    
                    this.setupEventListeners();
                    await this.initializeContracts();
                    this.updateUI();
                    
                    console.log('✅ Existing MetaMask connection detected:', this.userAddress);
                }
            }
        } catch (error) {
            console.error('❌ Error checking existing connection:', error);
        }
    }

    updateUI() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const mobileBtn = document.getElementById('connect-wallet-mobile-btn');
        
        if (connectBtn) {
            if (this.isConnected && this.userAddress) {
                const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                connectBtn.innerHTML = `<i class="fa-solid fa-wallet mr-2"></i>${shortAddress}`;
                connectBtn.classList.add('bg-green-600', 'hover:bg-green-500');
                connectBtn.classList.remove('bg-orange-500', 'hover:bg-orange-400');
            } else {
                connectBtn.innerHTML = 'CONNECT WALLET';
                connectBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
                connectBtn.classList.add('bg-orange-500', 'hover:bg-orange-400');
            }
        }
        
        if (mobileBtn) {
            if (this.isConnected && this.userAddress) {
                const shortAddress = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                mobileBtn.innerHTML = `<i class="fa-solid fa-wallet mr-2"></i>${shortAddress}`;
                mobileBtn.classList.add('bg-green-600', 'hover:bg-green-500');
                mobileBtn.classList.remove('bg-orange-500', 'hover:bg-orange-400');
            } else {
                mobileBtn.innerHTML = 'CONNECT WALLET';
                mobileBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
                mobileBtn.classList.add('bg-orange-500', 'hover:bg-orange-400');
            }
        }
    }

    showError(message) {
        console.error('❌ ERROR:', message);
        if (window.showError) {
            window.showError(message);
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        console.log('✅ SUCCESS:', message);
        if (window.showSuccess) {
            window.showSuccess(message);
        }
    }

    showInfo(message) {
        console.log('ℹ️ INFO:', message);
        if (window.showInfo) {
            window.showInfo(message);
        }
    }

    showWarning(message) {
        console.warn('⚠️ WARNING:', message);
        if (window.showWarning) {
            window.showWarning(message);
        }
    }

    // Methods to interact with contracts
    async getDayaBalance() {
        try {
            if (!this.contracts.dayaToken || !this.userAddress) return '0';
            
            const balance = await this.contracts.dayaToken.balanceOf(this.userAddress);
            return window.formatTokenAmount(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    async getTokenInfo() {
        try {
            if (!this.contracts.dayaToken) return null;
            
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                this.contracts.dayaToken.name(),
                this.contracts.dayaToken.symbol(),
                this.contracts.dayaToken.decimals(),
                this.contracts.dayaToken.totalSupply()
            ]);
            
            return {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: window.formatTokenAmount(totalSupply)
            };
        } catch (error) {
            console.error('Error getting token info:', error);
            return null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.modernWeb3 = new ModernWeb3();

    // Setup event listeners
    const connectBtn = document.getElementById('connect-wallet-btn');
    const mobileBtn = document.getElementById('connect-wallet-mobile-btn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (!window.modernWeb3.isConnected) {
                await window.modernWeb3.connectWallet();
            } else {
                await window.modernWeb3.disconnectWallet();
            }
        });
    }
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', async () => {
            if (!window.modernWeb3.isConnected) {
                await window.modernWeb3.connectWallet();
            } else {
                await window.modernWeb3.disconnectWallet();
            }
        });
    }

    console.log('🚀 Modern Web3 Integration initialized');
});
