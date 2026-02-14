// BASED DAYANA ($DAYA) - Integración Web3
// Funciones para interactuar con los contratos desplegados

class DayanaWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.userAddress = null;
        this.isConnected = false;
        
        this.init();
    }

    // Esperar a que ethers esté disponible
    async waitForEthers() {
        return new Promise((resolve) => {
            const checkEthers = () => {
                if (typeof ethers !== 'undefined' && ethers.providers) {
                    resolve();
                } else {
                    setTimeout(checkEthers, 100);
                }
            };
            checkEthers();
        });
    }

    async init() {
        // Esperar a que ethers esté disponible
        await this.waitForEthers();
        
        // Verificar si MetaMask está disponible
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log('✅ MetaMask detectado');
        } else {
            console.log('❌ MetaMask no detectado');
        }
        
        // Escuchar cambios de cuenta
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.userAddress = accounts[0];
                    this.updateUI();
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
        }
    }

    // Conectar wallet
    async connectWallet() {
        try {
            // Asegurar que ethers esté disponible
            await this.waitForEthers();
            
            if (!this.provider) {
                throw new Error('MetaMask no está instalado');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.signer = await this.provider.getSigner();
            this.userAddress = accounts[0];
            this.isConnected = true;

            // Verificar red
            const network = await this.provider.getNetwork();
            if (!window.isCorrectNetwork(Number(network.chainId))) {
                await this.switchToBaseNetwork();
            }

            // Inicializar contratos
            await this.initializeContracts();
            
            this.updateUI();
            console.log('✅ Wallet conectado:', this.userAddress);
            
            return true;
        } catch (error) {
            console.error('❌ Error conectando wallet:', error);
            this.showError('Error conectando wallet: ' + error.message);
            return false;
        }
    }

    // Desconectar wallet
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.userAddress = null;
        this.isConnected = false;
        this.updateUI();
        console.log('🔌 Wallet desconectado');
    }

    // Cambiar a Base Network
    async switchToBaseNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base Mainnet
            });
        } catch (switchError) {
            // Si la red no está agregada, agregarla
            if (switchError.code === 4902) {
                await window.ethereum.request({
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

    // Inicializar contratos
    async initializeContracts() {
        try {
            // Asegurar que ethers esté disponible
            await this.waitForEthers();
            
            this.contracts = {
                dayaToken: window.getContract('DAYA_TOKEN', this.signer),
                staking: window.getContract('STAKING', this.signer),
                rewards: window.getContract('REWARD_DISTRIBUTION', this.signer),
                airdrop: window.getContract('AIRDROP', this.signer),
                merkleAirdrop: window.getContract('AIRDROP', this.signer),
                vesting: window.getContract('VESTING', this.signer)
            };
            console.log('✅ Contratos inicializados');
        } catch (error) {
            console.error('❌ Error inicializando contratos:', error);
        }
    }

    // Obtener balance de DAYA
    async getDayaBalance() {
        try {
            if (!this.contracts.dayaToken || !this.userAddress) return '0';
            
            const balance = await this.contracts.dayaToken.balanceOf(this.userAddress);
            return window.formatTokenAmount(balance);
        } catch (error) {
            console.error('Error obteniendo balance:', error);
            return '0';
        }
    }

    // Obtener información de staking
    async getStakingInfo() {
        try {
            if (!this.contracts.staking || !this.userAddress) return null;
            
            const [stakedAmount, pendingRewards, stakingTime] = await Promise.all([
                this.contracts.staking.stakedAmount(this.userAddress),
                this.contracts.staking.pendingRewards(this.userAddress),
                this.contracts.staking.stakingTime(this.userAddress)
            ]);
            
            return {
                stakedAmount: window.formatTokenAmount(stakedAmount),
                pendingRewards: window.formatTokenAmount(pendingRewards),
                stakingTime: Number(stakingTime),
                isStaking: Number(stakedAmount) > 0
            };
        } catch (error) {
            console.error('Error obteniendo info de staking:', error);
            return null;
        }
    }

    // Hacer staking
    async stake(amount) {
        try {
            if (!this.contracts.dayaToken || !this.contracts.staking) {
                throw new Error('Contratos no inicializados');
            }

            const amountWei = window.parseTokenAmount(amount);
            
            // Verificar balance
            const balance = await this.contracts.dayaToken.balanceOf(this.userAddress);
            if (balance < amountWei) {
                throw new Error('Balance insuficiente');
            }

            // Verificar allowance
            const allowance = await this.contracts.dayaToken.allowance(
                this.userAddress, 
                window.CONTRACTS_CONFIG.ADDRESSES.STAKING
            );
            
            if (allowance < amountWei) {
                console.log('🔄 Aprobando tokens...');
                const approveTx = await this.contracts.dayaToken.approve(
                    window.CONTRACTS_CONFIG.ADDRESSES.STAKING,
                    amountWei
                );
                await approveTx.wait();
                console.log('✅ Tokens aprobados');
            }

            // Hacer staking
            console.log('🔄 Haciendo staking...');
            const stakeTx = await this.contracts.staking.stake(amountWei);
            await stakeTx.wait();
            
            console.log('✅ Staking completado');
            this.showSuccess(`¡Staking de ${amount} DAYA completado!`);
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error en staking:', error);
            this.showError('Error en staking: ' + error.message);
        }
    }

    // Retirar staking
    async unstake() {
        try {
            if (!this.contracts.staking) {
                throw new Error('Contrato de staking no inicializado');
            }

            console.log('🔄 Retirando staking...');
            const unstakeTx = await this.contracts.staking.unstake();
            await unstakeTx.wait();
            
            console.log('✅ Staking retirado');
            this.showSuccess('¡Staking retirado exitosamente!');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error retirando staking:', error);
            this.showError('Error retirando staking: ' + error.message);
        }
    }

    // Reclamar rewards
    async claimRewards() {
        try {
            if (!this.contracts.staking) {
                throw new Error('Contrato de staking no inicializado');
            }

            console.log('🔄 Reclamando rewards...');
            const claimTx = await this.contracts.staking.claimRewards();
            await claimTx.wait();
            
            console.log('✅ Rewards reclamados');
            this.showSuccess('¡Rewards reclamados exitosamente!');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error reclamando rewards:', error);
            this.showError('Error reclamando rewards: ' + error.message);
        }
    }

    // Verificar si puede reclamar airdrop
    async canClaimAirdrop() {
        try {
            if (!this.contracts.airdrop || !this.userAddress) return false;
            
            return await this.contracts.airdrop.isClaimable(this.userAddress);
        } catch (error) {
            console.error('Error verificando airdrop:', error);
            return false;
        }
    }

    // Reclamar airdrop
    async claimAirdrop() {
        try {
            if (!this.contracts.airdrop) {
                throw new Error('Contrato de airdrop no inicializado');
            }

            console.log('🔄 Reclamando airdrop...');
            const claimTx = await this.contracts.airdrop.claim();
            await claimTx.wait();
            
            console.log('✅ Airdrop reclamado');
            this.showSuccess('¡Airdrop reclamado exitosamente!');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error reclamando airdrop:', error);
            this.showError('Error reclamando airdrop: ' + error.message);
        }
    }

    // Obtener información del token
    async getTokenInfo() {
        try {
            if (!this.contracts.dayaToken) return null;
            
            const [name, symbol, decimals, totalSupply, autoRenounceInfo] = await Promise.all([
                this.contracts.dayaToken.name(),
                this.contracts.dayaToken.symbol(),
                this.contracts.dayaToken.decimals(),
                this.contracts.dayaToken.totalSupply(),
                this.contracts.dayaToken.getAutoRenounceInfo()
            ]);
            
            return {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: window.formatTokenAmount(totalSupply),
                autoRenounce: {
                    deployTime: Number(autoRenounceInfo.deployTime),
                    renounceTime: Number(autoRenounceInfo.renounceTime),
                    isRenounced: autoRenounceInfo.isRenounced,
                    timeRemaining: Number(autoRenounceInfo.timeRemaining)
                }
            };
        } catch (error) {
            console.error('Error obteniendo info del token:', error);
            return null;
        }
    }

    // Actualizar UI
    updateUI() {
        // Actualizar botón de conexión
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            if (this.isConnected) {
                connectBtn.textContent = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                connectBtn.classList.add('bg-green-500');
                connectBtn.classList.remove('bg-orange-500');
            } else {
                connectBtn.textContent = 'CONNECT WALLET';
                connectBtn.classList.remove('bg-green-500');
                connectBtn.classList.add('bg-orange-500');
            }
        }

        // Actualizar información si está conectado
        if (this.isConnected) {
            this.updateDashboard();
        }
    }

    // Actualizar dashboard
    async updateDashboard() {
        try {
            // Actualizar balance
            const balance = await this.getDayaBalance();
            const balanceElement = document.getElementById('daya-balance');
            if (balanceElement) {
                balanceElement.textContent = `${parseFloat(balance).toLocaleString()} DAYA`;
            }

            // Actualizar info de staking
            const stakingInfo = await this.getStakingInfo();
            if (stakingInfo) {
                const stakedElement = document.getElementById('staked-amount');
                const rewardsElement = document.getElementById('pending-rewards');
                
                if (stakedElement) {
                    stakedElement.textContent = `${parseFloat(stakingInfo.stakedAmount).toLocaleString()} DAYA`;
                }
                if (rewardsElement) {
                    rewardsElement.textContent = `${parseFloat(stakingInfo.pendingRewards).toLocaleString()} DAYA`;
                }
            }

        } catch (error) {
            console.error('Error actualizando dashboard:', error);
        }
    }

    // Mostrar mensaje de éxito
    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('✅ SUCCESS:', message);
        // Aquí puedes agregar tu sistema de notificaciones
    }

    // Mostrar mensaje de error
    showError(message) {
        // Implementar notificación de error
        console.error('❌ ERROR:', message);
        // Aquí puedes agregar tu sistema de notificaciones
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global
    window.dayanaWeb3 = new DayanaWeb3();

    // Configurar event listeners
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (!window.dayanaWeb3.isConnected) {
                await window.dayanaWeb3.connectWallet();
            }
        });
    }

    console.log('🚀 BASED DAYANA Web3 Integration inicializado');
});

// Funciones auxiliares globales
window.stakeDaya = async (amount) => {
    if (window.dayanaWeb3) {
        await window.dayanaWeb3.stake(amount);
    }
};

window.unstakeDaya = async () => {
    if (window.dayanaWeb3) {
        await window.dayanaWeb3.unstake();
    }
};

window.claimRewards = async () => {
    if (window.dayanaWeb3) {
        await window.dayanaWeb3.claimRewards();
    }
};

window.claimAirdrop = async () => {
    if (window.dayanaWeb3) {
        await window.dayanaWeb3.claimAirdrop();
    }
};
