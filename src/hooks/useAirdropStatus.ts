import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORK_CONFIG } from '../config/constants';

interface AirdropStatus {
    isActive: boolean;
    hasMerkleRoot: boolean;
    claimDeadline: number;
    daysRemaining: number;
    deadlineDisplay: string;
    statusLabel: string;
}

/**
 * Hook to read airdrop status from the contract.
 * Uses a read-only provider — no wallet connection needed.
 */
export function useAirdropStatus() {
    const [status, setStatus] = useState<AirdropStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESSES.AIRDROP,
                CONTRACT_ABIS.AIRDROP,
                provider
            );

            const [merkleRoot, claimDeadline] = await Promise.all([
                contract.merkleRoot(),
                contract.claimDeadline(),
            ]);

            const deadlineTimestamp = Number(claimDeadline);
            const now = Math.floor(Date.now() / 1000);
            const hasMerkleRoot = merkleRoot !== ethers.ZeroHash;
            const isExpired = deadlineTimestamp > 0 && now > deadlineTimestamp;
            const isActive = hasMerkleRoot && !isExpired;

            let daysRemaining = 0;
            let deadlineDisplay = 'Not Started';
            let statusLabel = 'Pending';

            if (!hasMerkleRoot) {
                statusLabel = 'Not Started';
                deadlineDisplay = 'TBD';
            } else if (isExpired) {
                statusLabel = 'Ended';
                deadlineDisplay = 'Expired';
            } else if (deadlineTimestamp > 0) {
                daysRemaining = Math.ceil((deadlineTimestamp - now) / (60 * 60 * 24));
                deadlineDisplay = `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left`;
                statusLabel = 'Active';
            }

            setStatus({
                isActive,
                hasMerkleRoot,
                claimDeadline: deadlineTimestamp,
                daysRemaining,
                deadlineDisplay,
                statusLabel,
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching airdrop status:', err);
            setError('Unable to load airdrop data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, isLoading, error };
}
