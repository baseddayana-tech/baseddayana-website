import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { getContract } from '../utils/contracts';
import { CONTRACT_ADDRESSES } from '../config/constants';

export function clientToSigner(client: any) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  const signer = new ethers.JsonRpcSigner(provider, account.address);
  return signer;
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return useMemo(
    () => (walletClient ? clientToSigner(walletClient) : undefined),
    [walletClient]
  );
}

export function useContract(name: keyof typeof CONTRACT_ADDRESSES) {
  const signer = useEthersSigner();
  
  return useMemo(() => {
    if (!signer) return null;
    return getContract(name, signer);
  }, [name, signer]);
}
