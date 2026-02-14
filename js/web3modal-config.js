// BASED DAYANA ($DAYA) - Web3Modal Configuration
// Modern Web3Modal configuration for multi-wallet support

const Web3ModalConfig = {
    // WalletConnect Project ID
    projectId: '9aa3d95b3bc440fa88ea12eaa4456161',
    
    // App Metadata
    metadata: {
        name: 'BASED DAYANA',
        description: 'Revolutionary DeFi Ecosystem - The Future of Decentralized Finance',
        url: 'https://baseddayana.xyz',
        icons: ['https://baseddayana.xyz/images/logo.png']
    },
    
    // Base Network Configuration
    chains: [
        {
            chainId: 8453,
            name: 'Base',
            currency: 'ETH',
            explorerUrl: 'https://basescan.org',
            rpcUrl: 'https://mainnet.base.org'
        }
    ],
    
    // Theme Configuration
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#F97316',
        '--w3m-color-mix': '#F97316',
        '--w3m-color-mix-strength': 40,
        '--w3m-font-family': 'Poppins, sans-serif',
        '--w3m-border-radius-master': '12px',
        '--w3m-z-index': 9999
    },
    
    // Featured Wallets (prioritized in modal)
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        'fd20dc426fb37566d208305f0e130e9be0d2b1468da7791a94b1536defbcfcfc', // Coinbase Wallet
        '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4'  // Binance Web3 Wallet
    ],
    
    // Wallet Connection Options
    enableNetworkView: true,
    enableAccountView: true,
    enableExplorer: true,
    
    // Mobile Wallet Support
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
        },
        {
            id: 'rainbow',
            name: 'Rainbow',
            links: {
                native: 'rainbow://',
                universal: 'https://rainbow.me'
            }
        },
        {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            links: {
                native: 'cbwallet://',
                universal: 'https://go.cb-w.com'
            }
        }
    ],
    
    // Desktop Wallet Support
    desktopWallets: [
        {
            id: 'metamask',
            name: 'MetaMask',
            links: {
                native: 'metamask://',
                universal: 'https://metamask.io'
            }
        },
        {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            links: {
                native: 'coinbase-wallet://',
                universal: 'https://www.coinbase.com/wallet'
            }
        }
    ],
    
    // Web Wallet Support
    webWallets: [
        {
            id: 'metamask',
            name: 'MetaMask',
            homepage: 'https://metamask.io',
            chains: ['eip155:8453']
        }
    ],
    
    // Custom Tokens for Base Network
    tokens: {
        8453: {
            address: '0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A',
            symbol: 'DAYA',
            name: 'BASED DAYANA',
            decimals: 18,
            image: 'https://baseddayana.xyz/images/logo.png'
        }
    }
};

// Validation function
function validateWeb3ModalConfig() {
    const errors = [];
    
    if (!Web3ModalConfig.projectId) {
        errors.push('Missing WalletConnect Project ID');
    }
    
    if (!Web3ModalConfig.metadata.name) {
        errors.push('Missing app name in metadata');
    }
    
    if (!Web3ModalConfig.chains || Web3ModalConfig.chains.length === 0) {
        errors.push('Missing chain configuration');
    }
    
    if (errors.length > 0) {
        console.error('❌ Web3Modal Configuration Errors:', errors);
        return false;
    }
    
    return true;
}

// Initialize Web3Modal with configuration
async function initializeWeb3ModalWithConfig() {
    try {
        console.log('🔧 Initializing Web3Modal with DAYANA configuration...');
        
        // Validate configuration
        if (!validateWeb3ModalConfig()) {
            throw new Error('Invalid Web3Modal configuration');
        }
        
        // Check if createWeb3Modal is available (v4)
        if (typeof window.createWeb3Modal !== 'undefined') {
            console.log('🎯 Using Web3Modal v4...');
            
            const modal = window.createWeb3Modal({
                projectId: Web3ModalConfig.projectId,
                chains: Web3ModalConfig.chains,
                defaultChain: Web3ModalConfig.chains[0],
                metadata: Web3ModalConfig.metadata,
                themeMode: Web3ModalConfig.themeMode,
                themeVariables: Web3ModalConfig.themeVariables,
                featuredWalletIds: Web3ModalConfig.featuredWalletIds,
                enableNetworkView: Web3ModalConfig.enableNetworkView,
                enableAccountView: Web3ModalConfig.enableAccountView,
                enableExplorer: Web3ModalConfig.enableExplorer,
                mobileWallets: Web3ModalConfig.mobileWallets,
                desktopWallets: Web3ModalConfig.desktopWallets,
                webWallets: Web3ModalConfig.webWallets
            });
            
            console.log('✅ Web3Modal v4 configured successfully');
            return modal;
        }
        
        // Fallback to Web3Modal v1/v2
        if (typeof window.Web3Modal !== 'undefined') {
            console.log('🔄 Using Web3Modal fallback...');
            
            const providerOptions = {
                walletconnect: {
                    package: window.WalletConnectProvider || {},
                    options: {
                        infuraId: Web3ModalConfig.projectId,
                        rpc: {
                            8453: Web3ModalConfig.chains[0].rpcUrl
                        },
                        chainId: 8453,
                        bridge: 'https://bridge.walletconnect.org'
                    }
                }
            };
            
            const modal = new window.Web3Modal({
                network: 'mainnet',
                cacheProvider: true,
                theme: Web3ModalConfig.themeMode,
                providerOptions
            });
            
            console.log('✅ Web3Modal fallback configured');
            return modal;
        }
        
        throw new Error('No Web3Modal implementation found');
        
    } catch (error) {
        console.error('❌ Error initializing Web3Modal:', error);
        return null;
    }
}

// Enhanced wallet detection
function detectAvailableWallets() {
    const wallets = [];
    
    // MetaMask
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        wallets.push({
            name: 'MetaMask',
            id: 'metamask',
            provider: window.ethereum,
            icon: 'https://github.com/MetaMask/brand-resources/raw/master/SVG/metamask-fox.svg'
        });
    }
    
    // Coinbase Wallet
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet) {
        wallets.push({
            name: 'Coinbase Wallet',
            id: 'coinbase',
            provider: window.ethereum,
            icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4'
        });
    }
    
    // Trust Wallet
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isTrust) {
        wallets.push({
            name: 'Trust Wallet',
            id: 'trust',
            provider: window.ethereum,
            icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg'
        });
    }
    
    // Generic Ethereum provider
    if (typeof window.ethereum !== 'undefined' && wallets.length === 0) {
        wallets.push({
            name: 'Web3 Wallet',
            id: 'ethereum',
            provider: window.ethereum,
            icon: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.webp'
        });
    }
    
    console.log('🔍 Detected wallets:', wallets.map(w => w.name));
    return wallets;
}

// Export configuration and functions
if (typeof window !== 'undefined') {
    window.Web3ModalConfig = Web3ModalConfig;
    window.initializeWeb3ModalWithConfig = initializeWeb3ModalWithConfig;
    window.detectAvailableWallets = detectAvailableWallets;
    
    console.log('⚙️ Web3Modal configuration loaded');
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Web3ModalConfig,
        initializeWeb3ModalWithConfig,
        detectAvailableWallets
    };
}


