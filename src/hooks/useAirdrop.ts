import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from './useContract';
import { ethers } from 'ethers';

export function useAirdrop() {
    const { address } = useAccount();
    const airdropContract = useContract('AIRDROP');
    const [isClaimed, setIsClaimed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const checkClaimStatus = useCallback(async () => {
        if (!airdropContract || !address) return;
        try {
            const status = await airdropContract.hasClaimed(address);
            setIsClaimed(status);
        } catch (error) {
            console.error('Error checking airdrop status:', error);
        }
    }, [airdropContract, address]);

    useEffect(() => {
        checkClaimStatus();
    }, [checkClaimStatus]);

    const claim = async (amount: string, proof: string[]) => {
        if (!airdropContract) throw new Error('Contract not initialized');
        setIsLoading(true);
        try {
            const tx = await airdropContract.claim(
                ethers.parseEther(amount),
                proof
            );
            await tx.wait();
            setIsClaimed(true);
        } finally {
            setIsLoading(false);
        }
    };

    return { isClaimed, isLoading, claim, checkClaimStatus };
}
