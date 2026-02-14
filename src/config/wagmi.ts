import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Based Dayana' }),
    // Replace with your own WalletConnect projectId
    walletConnect({ projectId: '3fcc6b4440003df2436d4f8842af5646' }), 
  ],
  transports: {
    [base.id]: http(),
  },
});
