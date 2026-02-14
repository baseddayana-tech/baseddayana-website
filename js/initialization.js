// BASED DAYANA ($DAYA) - Application Initialization
// Robust initialization system for the dApp

class ApplicationInitializer {
    constructor() {
        this.initializationSteps = [];
        this.currentStep = 0;
        this.isInitialized = false;
        this.errors = [];
    }

    addStep(name, fn, dependencies = []) {
        this.initializationSteps.push({
            name,
            fn,
            dependencies,
            completed: false,
            error: null
        });
    }

    async initialize() {
        console.log('🚀 Starting BASED DAYANA dApp initialization...');
        
        try {
            // Step 1: Verify core dependencies
            this.addStep('Verify Dependencies', this.verifyDependencies.bind(this));
            
            // Step 2: Initialize utility functions
            this.addStep('Initialize Utilities', this.initializeUtilities.bind(this));
            
            // Step 3: Initialize Web3 system
            this.addStep('Initialize Web3', this.initializeWeb3.bind(this));
            
            // Step 4: Initialize Merkle system
            this.addStep('Initialize Merkle', this.initializeMerkle.bind(this));
            
            // Step 5: Initialize notifications
            this.addStep('Initialize Notifications', this.initializeNotifications.bind(this));
            
            // Step 6: Initialize UI
            this.addStep('Initialize UI', this.initializeUI.bind(this));
            
            // Execute all steps
            await this.executeSteps();
            
            this.isInitialized = true;
            console.log('✅ BASED DAYANA dApp initialized successfully');
            
            // Trigger initialization complete event
            window.dispatchEvent(new CustomEvent('dappInitialized'));
            
        } catch (error) {
            console.error('❌ Critical initialization error:', error);
            this.showInitializationError(error);
        }
    }

    async executeSteps() {
        for (let i = 0; i < this.initializationSteps.length; i++) {
            const step = this.initializationSteps[i];
            
            try {
                console.log(`🔄 Executing step ${i + 1}: ${step.name}`);
                
                // Check dependencies
                const unmetDependencies = step.dependencies.filter(dep => 
                    !this.initializationSteps.find(s => s.name === dep)?.completed
                );
                
                if (unmetDependencies.length > 0) {
                    throw new Error(`Unmet dependencies: ${unmetDependencies.join(', ')}`);
                }
                
                // Execute step
                await step.fn();
                step.completed = true;
                
                console.log(`✅ Step ${i + 1} completed: ${step.name}`);
                
            } catch (error) {
                step.error = error;
                this.errors.push({ step: step.name, error });
                console.error(`❌ Step ${i + 1} failed: ${step.name}`, error);
                
                // Continue with other steps unless it's critical
                if (this.isCriticalStep(step.name)) {
                    throw error;
                }
            }
        }
    }

    isCriticalStep(stepName) {
        const criticalSteps = ['Verify Dependencies', 'Initialize Utilities'];
        return criticalSteps.includes(stepName);
    }

    async verifyDependencies() {
        const requiredDependencies = [
            { name: 'ethers', check: () => typeof ethers !== 'undefined' },
            { name: 'formatTokenAmount', check: () => typeof window.formatTokenAmount === 'function' },
            { name: 'parseTokenAmount', check: () => typeof window.parseTokenAmount === 'function' }
        ];

        const missing = requiredDependencies.filter(dep => !dep.check());
        
        if (missing.length > 0) {
            throw new Error(`Missing critical dependencies: ${missing.map(d => d.name).join(', ')}`);
        }

        console.log('✅ All critical dependencies verified');
    }

    async initializeUtilities() {
        // Ensure utility functions are available globally
        if (!window.formatTokenAmount) {
            throw new Error('formatTokenAmount function not available');
        }
        
        if (!window.parseTokenAmount) {
            throw new Error('parseTokenAmount function not available');
        }

        console.log('✅ Utility functions initialized');
    }

    async initializeWeb3() {
        // Wait for modernWeb3 to be available
        const waitForWeb3 = () => {
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
        };

        await waitForWeb3();
        console.log('✅ Web3 system initialized');
    }

    async initializeMerkle() {
        // Wait for airdrop system to be available
        const waitForAirdrop = () => {
            return new Promise((resolve) => {
                const checkAirdrop = () => {
                    if (window.airdropMerkle) {
                        resolve();
                    } else {
                        setTimeout(checkAirdrop, 100);
                    }
                };
                checkAirdrop();
            });
        };

        await waitForAirdrop();
        console.log('✅ Merkle system initialized');
    }

    async initializeNotifications() {
        // Wait for notification system to be available
        const waitForNotifications = () => {
            return new Promise((resolve) => {
                const checkNotifications = () => {
                    if (window.notificationSystem) {
                        resolve();
                    } else {
                        setTimeout(checkNotifications, 100);
                    }
                };
                checkNotifications();
            });
        };

        await waitForNotifications();
        console.log('✅ Notification system initialized');
    }

    async initializeUI() {
        // Setup UI event listeners and initial state
        this.setupUIEventListeners();
        this.updateInitialUIState();
        console.log('✅ UI initialized');
    }

    setupUIEventListeners() {
        // Setup wallet connection buttons
        const connectButtons = [
            'connect-wallet-btn',
            'connect-wallet-mobile-btn',
            'airdrop-connect-btn'
        ];

        connectButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', async () => {
                    if (window.modernWeb3) {
                        if (!window.modernWeb3.isConnected) {
                            await window.modernWeb3.connectWallet();
                        } else {
                            await window.modernWeb3.disconnectWallet();
                        }
                    }
                });
            }
        });

        // Setup mobile menu
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    updateInitialUIState() {
        // Update initial UI state
        const statusElements = [
            'airdrop-status-indicator',
            'airdrop-status-text',
            'claimable-amount',
            'eligibility-icon'
        ];

        statusElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId.includes('status')) {
                    element.textContent = 'Loading...';
                } else if (elementId.includes('indicator')) {
                    element.className = 'w-3 h-3 rounded-full bg-gray-500';
                }
            }
        });
    }

    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; text-align: center; z-index: 9999;">
                <strong>Initialization Error:</strong> ${error.message}
                <button onclick="location.reload()" style="margin-left: 1rem; padding: 0.5rem 1rem; background: white; color: #ef4444; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentStep: this.currentStep,
            totalSteps: this.initializationSteps.length,
            errors: this.errors,
            completedSteps: this.initializationSteps.filter(s => s.completed).length
        };
    }
}

// Initialize the application
window.applicationInitializer = new ApplicationInitializer();

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM ready, starting application initialization...');
    window.applicationInitializer.initialize();
});

console.log('🔧 Application Initializer loaded');


