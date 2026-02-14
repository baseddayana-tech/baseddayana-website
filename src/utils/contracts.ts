import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORK_CONFIG } from '../config/constants';

export const getContract = (name: keyof typeof CONTRACT_ADDRESSES, signerOrProvider: ethers.Signer | ethers.Provider) => {
    const address = CONTRACT_ADDRESSES[name];
    const abi = CONTRACT_ABIS[name as keyof typeof CONTRACT_ABIS];
    
    if (!address || !abi) {
        throw new Error(`Contract ${name} not found in configuration`);
    }

    return new ethers.Contract(address, abi, signerOrProvider);
};

export const getReadOnlyProvider = () => {
    return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
};
