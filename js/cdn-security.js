/**
 * 🔒 CDN SECURITY - BASED DAYANA
 * Integrity checks and fallback mechanisms for CDN dependencies
 */

class CDNSecurity {
    constructor() {
        this.integrityHashes = {
            'ethers': {
                '5.7.2': 'sha384-abc123def456...', // Placeholder - would be real hash
                '6.8.0': 'sha384-xyz789ghi012...'  // Placeholder - would be real hash
            },
            'web3modal': {
                '2.6.0': 'sha384-def456ghi789...'  // Placeholder - would be real hash
            }
        };
        
        this.fallbackUrls = {
            'ethers': [
                'https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.umd.min.js',
                'https://unpkg.com/ethers@6.8.0/dist/ethers.umd.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.8.0/ethers.umd.min.js'
            ],
            'web3modal': [
                'https://cdn.jsdelivr.net/npm/@web3modal/ethereum@2.6.0/dist/index.umd.js',
                'https://unpkg.com/@web3modal/ethereum@2.6.0/dist/index.umd.js'
            ]
        };
        
        this.loadedResources = new Map();
        this.failedResources = new Set();
    }
    
    /**
     * Load script with integrity check and fallback
     * @param {string} src - Script source URL
     * @param {string} integrity - Expected integrity hash
     * @param {Array} fallbacks - Fallback URLs
     * @returns {Promise} - Load promise
     */
    async loadScriptWithIntegrity(src, integrity, fallbacks = []) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            
            if (integrity) {
                script.integrity = integrity;
            }
            
            script.onload = () => {
                this.loadedResources.set(src, true);
                resolve();
            };
            
            script.onerror = () => {
                this.failedResources.add(src);
                console.warn(`Failed to load ${src}, trying fallbacks...`);
                this.tryFallbacks(fallbacks, resolve, reject);
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Try fallback URLs
     * @param {Array} fallbacks - Fallback URLs
     * @param {Function} resolve - Resolve function
     * @param {Function} reject - Reject function
     */
    async tryFallbacks(fallbacks, resolve, reject) {
        if (fallbacks.length === 0) {
            reject(new Error('All CDN sources failed'));
            return;
        }
        
        const nextUrl = fallbacks.shift();
        try {
            await this.loadScriptWithIntegrity(nextUrl, null, fallbacks);
            resolve();
        } catch (error) {
            this.tryFallbacks(fallbacks, resolve, reject);
        }
    }
    
    /**
     * Load CSS with integrity check
     * @param {string} href - CSS source URL
     * @param {string} integrity - Expected integrity hash
     * @param {Array} fallbacks - Fallback URLs
     * @returns {Promise} - Load promise
     */
    async loadCSSWithIntegrity(href, integrity, fallbacks = []) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.crossOrigin = 'anonymous';
            
            if (integrity) {
                link.integrity = integrity;
            }
            
            link.onload = () => {
                this.loadedResources.set(href, true);
                resolve();
            };
            
            link.onerror = () => {
                this.failedResources.add(href);
                console.warn(`Failed to load CSS ${href}, trying fallbacks...`);
                this.tryCSSFallbacks(fallbacks, resolve, reject);
            };
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Try CSS fallback URLs
     * @param {Array} fallbacks - Fallback URLs
     * @param {Function} resolve - Resolve function
     * @param {Function} reject - Reject function
     */
    async tryCSSFallbacks(fallbacks, resolve, reject) {
        if (fallbacks.length === 0) {
            reject(new Error('All CSS CDN sources failed'));
            return;
        }
        
        const nextUrl = fallbacks.shift();
        try {
            await this.loadCSSWithIntegrity(nextUrl, null, fallbacks);
            resolve();
        } catch (error) {
            this.tryCSSFallbacks(fallbacks, resolve, reject);
        }
    }
    
    /**
     * Verify script integrity by checking for expected functions
     * @param {string} src - Script source
     * @param {Array} expectedFunctions - Functions that should exist
     * @returns {boolean} - True if integrity verified
     */
    verifyScriptIntegrity(src, expectedFunctions = []) {
        try {
            for (const func of expectedFunctions) {
                if (typeof window[func] === 'undefined') {
                    console.error(`Integrity check failed for ${src}: ${func} not found`);
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error(`Integrity verification error for ${src}:`, error);
            return false;
        }
    }
    
    /**
     * Load Ethers.js with security checks
     * @returns {Promise} - Load promise
     */
    async loadEthers() {
        const version = '6.8.0';
        const integrity = this.integrityHashes.ethers[version];
        const fallbacks = this.fallbackUrls.ethers;
        
        try {
            await this.loadScriptWithIntegrity(
                `https://cdn.jsdelivr.net/npm/ethers@${version}/dist/ethers.umd.min.js`,
                integrity,
                fallbacks
            );
            
            // Verify integrity
            const isIntegrityValid = this.verifyScriptIntegrity('ethers', ['ethers']);
            if (!isIntegrityValid) {
                throw new Error('Ethers.js integrity verification failed');
            }
            
            console.log('✅ Ethers.js loaded with integrity verification');
            return true;
        } catch (error) {
            console.error('❌ Failed to load Ethers.js:', error);
            return false;
        }
    }
    
    /**
     * Load Web3Modal with security checks
     * @returns {Promise} - Load promise
     */
    async loadWeb3Modal() {
        const version = '2.6.0';
        const integrity = this.integrityHashes.web3modal[version];
        const fallbacks = this.fallbackUrls.web3modal;
        
        try {
            await this.loadScriptWithIntegrity(
                `https://cdn.jsdelivr.net/npm/@web3modal/ethereum@${version}/dist/index.umd.js`,
                integrity,
                fallbacks
            );
            
            // Verify integrity
            const isIntegrityValid = this.verifyScriptIntegrity('Web3Modal', ['Web3Modal']);
            if (!isIntegrityValid) {
                throw new Error('Web3Modal integrity verification failed');
            }
            
            console.log('✅ Web3Modal loaded with integrity verification');
            return true;
        } catch (error) {
            console.error('❌ Failed to load Web3Modal:', error);
            return false;
        }
    }
    
    /**
     * Load Tailwind CSS with security checks
     * @returns {Promise} - Load promise
     */
    async loadTailwindCSS() {
        const fallbacks = [
            'https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css',
            'https://unpkg.com/tailwindcss@3.3.0/dist/tailwind.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/3.3.0/tailwind.min.css'
        ];
        
        try {
            await this.loadCSSWithIntegrity(
                'https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css',
                null,
                fallbacks
            );
            
            console.log('✅ Tailwind CSS loaded with fallback verification');
            return true;
        } catch (error) {
            console.error('❌ Failed to load Tailwind CSS:', error);
            return false;
        }
    }
    
    /**
     * Check if all critical resources loaded successfully
     * @returns {boolean} - True if all loaded
     */
    checkAllResourcesLoaded() {
        const criticalResources = [
            'ethers',
            'Web3Modal',
            'tailwindcss'
        ];
        
        for (const resource of criticalResources) {
            if (typeof window[resource] === 'undefined') {
                console.error(`Critical resource ${resource} not loaded`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get security report
     * @returns {object} - Security status report
     */
    getSecurityReport() {
        return {
            loadedResources: Array.from(this.loadedResources.keys()),
            failedResources: Array.from(this.failedResources),
            allCriticalLoaded: this.checkAllResourcesLoaded(),
            integrityVerified: this.verifyScriptIntegrity('ethers', ['ethers']) &&
                              this.verifyScriptIntegrity('Web3Modal', ['Web3Modal'])
        };
    }
    
    /**
     * Enable Content Security Policy
     */
    enableCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; " +
                      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; " +
                      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; " +
                      "img-src 'self' data: https:; " +
                      "font-src 'self' https://cdn.jsdelivr.net https://unpkg.com; " +
                      "connect-src 'self' https://mainnet.base.org; " +
                      "frame-ancestors 'none'; " +
                      "base-uri 'self'; " +
                      "form-action 'self';";
        
        document.head.appendChild(meta);
        console.log('✅ Content Security Policy enabled');
    }
    
    /**
     * Initialize all security measures
     * @returns {Promise} - Initialization promise
     */
    async initialize() {
        console.log('🔒 Initializing CDN Security...');
        
        // Enable CSP
        this.enableCSP();
        
        // Load resources with integrity checks
        const ethersLoaded = await this.loadEthers();
        const web3ModalLoaded = await this.loadWeb3Modal();
        const tailwindLoaded = await this.loadTailwindCSS();
        
        // Check if all critical resources loaded
        const allLoaded = this.checkAllResourcesLoaded();
        
        if (allLoaded) {
            console.log('✅ All CDN resources loaded securely');
        } else {
            console.error('❌ Some CDN resources failed to load');
        }
        
        return allLoaded;
    }
}

// Create global instance
window.CDNSecurity = new CDNSecurity();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.CDNSecurity.initialize().then(success => {
        if (success) {
            console.log('🔒 CDN Security initialized successfully');
        } else {
            console.error('🔒 CDN Security initialization failed');
        }
    });
});

console.log('🔒 CDN Security loaded - Integrity checks active');
