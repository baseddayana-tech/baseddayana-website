import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from './useContract';
import { ethers } from 'ethers';

export function useStaking() {
    const { address } = useAccount();
    const stakingContract = useContract('STAKING');
    const [stakeInfo, setStakeInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStakeInfo = useCallback(async () => {
        if (!stakingContract || !address) return;
        try {
            const info = await stakingContract.stakes(address);
            setStakeInfo(info);
        } catch (error) {
            console.error('Error fetching stake info:', error);
        }
    }, [stakingContract, address]);

    useEffect(() => {
        fetchStakeInfo();
    }, [fetchStakeInfo]);

    const stake = async (amount: string, tierIndex: number) => {
        if (!stakingContract) throw new Error('Contract not initialized');
        setIsLoading(true);
        try {
            const tx = await stakingContract.stake(
                ethers.parseEther(amount),
                tierIndex
            );
            await tx.wait();
            await fetchStakeInfo();
        } finally {
            setIsLoading(false);
        }
    };

    const unstake = async () => {
        if (!stakingContract) throw new Error('Contract not initialized');
        setIsLoading(true);
        try {
            const tx = await stakingContract.unstake();
            await tx.wait();
            await fetchStakeInfo();
        } finally {
            setIsLoading(false);
        }
    };

    return { stakeInfo, isLoading, stake, unstake, fetchStakeInfo };
}
