/**
 * 🤖 Telegram Airdrop Bot Integration
 * Integra el bot de Telegram con el frontend del airdrop
 */

class TelegramAirdropIntegration {
    constructor() {
        this.botUsername = '@BasedDayana_Bot'; // Username real del bot
        this.telegramBotUrl = 'https://t.me/BasedDayana_Bot'; // URL real del bot
        this.botConfig = {
            coinSymbol: 'DAYA',
            coinName: 'Based Dayana',
            airdropAmount: '500',
            referralReward: '25',
            coinPrice: null, // Will be loaded from Oracle
            network: 'Base Mainnet',
            websiteUrl: 'https://baseddayana.xyz',
            explorerUrl: 'https://basescan.org/token/0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A'
        };
        this.currentPrice = 0.005; // Fallback price
        this.init();
    }

    init() {
        console.log('🤖 Telegram Airdrop Bot Integration initialized');
        
        // Update UI immediately with fallback price
        this.updateAirdropSection();
        this.setupEventListeners();
        
        // Load current price from Oracle in background (non-blocking)
        this.loadCurrentPrice();
        
        // Update price every 5 minutes
        setInterval(() => {
            this.loadCurrentPrice();
        }, 5 * 60 * 1000);
    }

    /**
     * 💰 Load current DAYA price from Oracle with timeout
     */
    async loadCurrentPrice() {
        try {
            if (typeof window.getDAYAPrice === 'function') {
                // Add timeout to prevent hanging
                const pricePromise = window.getDAYAPrice();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Oracle timeout')), 3000)
                );
                
                this.currentPrice = await Promise.race([pricePromise, timeoutPromise]);
                console.log('💰 Price loaded from Oracle:', this.currentPrice);
                
                // Update UI if already rendered
                this.updatePriceDisplays();
            }
        } catch (error) {
            console.warn('⚠️ Failed to load price from Oracle (using fallback):', error.message);
            this.currentPrice = 0.005; // Keep fallback
            // Still update displays with fallback price
            this.updatePriceDisplays();
        }
    }

    /**
     * 🔄 Update price displays in existing UI
     */
    updatePriceDisplays() {
        // Update airdrop amount USD display
        const airdropUsdElements = document.querySelectorAll('.airdrop-usd-value');
        airdropUsdElements.forEach(el => {
            const usdValue = parseFloat(this.botConfig.airdropAmount) * this.currentPrice;
            el.textContent = `≈ $${usdValue.toFixed(2)} USD`;
        });

        // Update referral USD display
        const referralUsdElements = document.querySelectorAll('.referral-usd-value');
        referralUsdElements.forEach(el => {
            const usdValue = parseFloat(this.botConfig.referralReward) * this.currentPrice;
            el.textContent = `≈ $${usdValue.toFixed(3)} USD`;
        });
    }

    /**
     * 📱 Actualiza la sección de airdrop con integración del bot
     */
    updateAirdropSection() {
        // Actualizar el título y descripción
        this.updateAirdropHeader();
        
        // Agregar botón de Telegram
        this.addTelegramButton();
        
        // Agregar información del bot
        this.addBotInformation();
        
        // Actualizar estadísticas
        this.updateBotStats();
    }

    /**
     * 📝 Actualiza el header de la sección airdrop
     */
    updateAirdropHeader() {
        const header = document.querySelector('#airdrop .text-center.mb-12');
        if (header) {
            header.innerHTML = `
                <h2 class="text-3xl md:text-4xl font-bold mb-4">
                    🤖 <span class="text-gradient">Telegram Airdrop Bot</span>
                </h2>
                <p class="text-gray-400 max-w-2xl mx-auto">
                    Join our exclusive airdrop through our Telegram bot with referral rewards, 
                    social verification, and instant distribution notifications.
                </p>
            `;
        }
    }

    /**
     * 🔘 Agrega el botón principal de Telegram
     */
    addTelegramButton() {
        const connectPanel = document.querySelector('#airdrop-connect-required');
        if (connectPanel) {
            connectPanel.innerHTML = `
                <div class="text-center py-8">
                    <i class="fa-brands fa-telegram text-6xl text-blue-400 mb-4"></i>
                    <h3 class="text-2xl font-bold text-white mb-4">Join via Telegram Bot</h3>
                    <p class="text-gray-400 mb-6">
                        Complete tasks, get verified, and earn extra rewards through referrals
                    </p>
                    
                    <!-- Telegram Bot Button -->
                    <a href="${this.telegramBotUrl}?start=website" 
                       target="_blank" 
                       class="inline-block bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold px-8 py-4 rounded-full hover:from-blue-400 hover:to-blue-300 transition-all transform hover:scale-105 mb-4">
                        <i class="fa-brands fa-telegram mr-2"></i>
                        Start Airdrop Bot
                    </a>
                    
                    <div class="flex justify-center items-center space-x-4 mt-6">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-orange-400">${this.botConfig.airdropAmount}</div>
                            <div class="text-sm text-gray-500">DAYA Tokens</div>
                            <div class="text-xs text-gray-600 airdrop-usd-value">≈ $${(parseFloat(this.botConfig.airdropAmount) * this.currentPrice).toFixed(2)} USD</div>
                        </div>
                        <div class="text-orange-400">+</div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-400">${this.botConfig.referralReward}</div>
                            <div class="text-sm text-gray-500">Per Referral</div>
                            <div class="text-xs text-gray-600 referral-usd-value">≈ $${(parseFloat(this.botConfig.referralReward) * this.currentPrice).toFixed(3)} USD</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 📋 Agrega información detallada del bot
     */
    addBotInformation() {
        // Buscar o crear el panel de información
        let infoPanel = document.querySelector('#telegram-bot-info');
        if (!infoPanel) {
            const airdropSection = document.querySelector('#airdrop .container');
            if (airdropSection) {
                infoPanel = document.createElement('div');
                infoPanel.id = 'telegram-bot-info';
                airdropSection.appendChild(infoPanel);
            }
        }

        if (infoPanel) {
            infoPanel.innerHTML = `
                <div class="bg-gray-800/30 rounded-2xl p-8 border border-gray-700 mt-12">
                    <h3 class="text-2xl font-bold text-white mb-8 text-center">
                        🎯 How to Participate
                    </h3>
                    
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Step 1 -->
                        <div class="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div class="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-white font-bold">1</span>
                            </div>
                            <h4 class="text-lg font-bold text-white mb-2">Start Bot</h4>
                            <p class="text-sm text-gray-400">Click the button above to start the Telegram bot</p>
                        </div>
                        
                        <!-- Step 2 -->
                        <div class="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div class="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-white font-bold">2</span>
                            </div>
                            <h4 class="text-lg font-bold text-white mb-2">Join Groups</h4>
                            <p class="text-sm text-gray-400">Join our Telegram channels and verify membership</p>
                        </div>
                        
                        <!-- Step 3 -->
                        <div class="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div class="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-white font-bold">3</span>
                            </div>
                            <h4 class="text-lg font-bold text-white mb-2">Follow Twitter</h4>
                            <p class="text-sm text-gray-400">Follow our Twitter account and submit your profile</p>
                        </div>
                        
                        <!-- Step 4 -->
                        <div class="bg-gray-900/50 rounded-xl p-6 text-center">
                            <div class="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-white font-bold">4</span>
                            </div>
                            <h4 class="text-lg font-bold text-white mb-2">Submit Wallet</h4>
                            <p class="text-sm text-gray-400">Provide your Base network wallet address</p>
                        </div>
                    </div>
                    
                    <!-- Referral System -->
                    <div class="mt-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-6 border border-green-500/30">
                        <h4 class="text-xl font-bold text-white mb-4 text-center">
                            🔗 Referral System
                        </h4>
                        <div class="grid md:grid-cols-3 gap-4 text-center">
                            <div>
                                <div class="text-2xl font-bold text-orange-400 mb-2">${this.botConfig.airdropAmount}</div>
                                <div class="text-white font-semibold mb-1">Base Reward</div>
                                <div class="text-xs text-gray-500 airdrop-usd-value">≈ $${(parseFloat(this.botConfig.airdropAmount) * this.currentPrice).toFixed(2)} USD</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-green-400 mb-2">+${this.botConfig.referralReward}</div>
                                <div class="text-white font-semibold mb-1">Per Referral</div>
                                <div class="text-xs text-gray-500 referral-usd-value">≈ $${(parseFloat(this.botConfig.referralReward) * this.currentPrice).toFixed(3)} USD</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-blue-400 mb-2">♾️</div>
                                <div class="text-white font-semibold mb-1">No Limit</div>
                                <div class="text-xs text-gray-500">Unlimited referrals</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bot Features -->
                    <div class="mt-8">
                        <h4 class="text-xl font-bold text-white mb-6 text-center">
                            ⚡ Bot Features
                        </h4>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-shield-alt text-green-400"></i>
                                <span class="text-gray-300">Anti-bot protection</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-users text-blue-400"></i>
                                <span class="text-gray-300">Membership verification</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-database text-purple-400"></i>
                                <span class="text-gray-300">Persistent data storage</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-ban text-red-400"></i>
                                <span class="text-gray-300">Duplicate prevention</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-chart-line text-orange-400"></i>
                                <span class="text-gray-300">Real-time stats</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-redo text-gray-400"></i>
                                <span class="text-gray-300">Restart capability</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 📊 Actualiza las estadísticas del bot
     */
    updateBotStats() {
        // Actualizar status del airdrop
        const statusText = document.querySelector('#airdrop-status-text');
        const statusIndicator = document.querySelector('#airdrop-status-indicator');
        
        if (statusText && statusIndicator) {
            statusText.textContent = 'Active via Bot';
            statusText.className = 'text-2xl font-bold text-green-400 mb-2';
            statusIndicator.className = 'w-3 h-3 rounded-full bg-green-400 animate-pulse';
        }

        // Actualizar elegibilidad
        const eligibilityIcon = document.querySelector('#eligibility-icon');
        const claimableAmount = document.querySelector('#claimable-amount');
        
        if (eligibilityIcon) {
            eligibilityIcon.className = 'fa-brands fa-telegram text-blue-400';
        }
        
        if (claimableAmount) {
            claimableAmount.innerHTML = `
                <div class="text-2xl font-bold text-blue-400 mb-2">Join Bot</div>
            `;
        }

        // Actualizar deadline
        const claimDeadline = document.querySelector('#claim-deadline');
        if (claimDeadline) {
            claimDeadline.textContent = 'Via Telegram';
            claimDeadline.className = 'text-2xl font-bold text-blue-400 mb-2';
        }
    }

    /**
     * 🎧 Configura event listeners
     */
    setupEventListeners() {
        // Redirigir clics del botón de conectar wallet al bot de Telegram
        const connectBtns = document.querySelectorAll('#airdrop-connect-btn, [data-action="airdrop-connect"]');
        connectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTelegramBot();
            });
        });

        // Agregar referral code al localStorage si viene de un enlace de referido
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        if (referralCode) {
            localStorage.setItem('dayanaReferralCode', referralCode);
            console.log('💰 Referral code saved:', referralCode);
        }
    }

    /**
     * 📱 Abre el bot de Telegram con parámetros
     */
    openTelegramBot(referralCode = null) {
        let botUrl = this.telegramBotUrl;
        
        // Usar código de referido si está disponible
        const savedReferral = localStorage.getItem('dayanaReferralCode');
        const refCode = referralCode || savedReferral || 'website';
        
        botUrl += `?start=${refCode}`;
        
        console.log('🤖 Opening Telegram bot:', botUrl);
        window.open(botUrl, '_blank');
        
        // Mostrar notificación
        this.showNotification('Opening Telegram bot...', 'info');
    }

    /**
     * 🔔 Muestra notificaciones
     */
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform translate-x-full`;
        
        // Colores según el tipo
        const colors = {
            info: 'bg-blue-500 text-white',
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-orange-500 text-white'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fa-brands fa-telegram"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * 📈 Obtiene estadísticas del bot (simuladas)
     */
    getBotStats() {
        // En una implementación real, esto haría una llamada a la API del bot
        return {
            totalParticipants: Math.floor(Math.random() * 1000) + 500,
            totalRewards: Math.floor(Math.random() * 50000) + 10000,
            activeReferrals: Math.floor(Math.random() * 200) + 50
        };
    }
}

// 🚀 Inicializar cuando el DOM esté listo (optimizado)
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.telegramAirdrop = new TelegramAirdropIntegration();
    } catch (error) {
        console.warn('Non-critical error initializing Telegram integration:', error);
        // Continue page load even if telegram integration fails
    }
});

// 📤 Exponer funciones útiles globalmente
window.openDayanaBot = (referralCode) => {
    if (window.telegramAirdrop) {
        window.telegramAirdrop.openTelegramBot(referralCode);
    }
};
