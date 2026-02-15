import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORK_CONFIG } from '../config/constants';

interface AutoRenounceInfo {
    deployTime: number;
    renounceTime: number;
    isRenounced: boolean;
    timeRemaining: number;
}

/**
 * Hook to read auto-renounce countdown from the DAYA token contract.
 * Uses a read-only provider — no wallet connection needed.
 */
export function useAutoRenounce() {
    const [info, setInfo] = useState<AutoRenounceInfo | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('Loading...');
    const [error, setError] = useState<string | null>(null);

    const fetchInfo = useCallback(async () => {
        try {
            const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESSES.DAYA_TOKEN,
                CONTRACT_ABIS.DAYA_TOKEN,
                provider
            );

            const result = await contract.getAutoRenounceInfo();
            const data: AutoRenounceInfo = {
                deployTime: Number(result.deployTime),
                renounceTime: Number(result.renounceTime),
                isRenounced: result.isRenounced,
                timeRemaining: Number(result.timeRemaining),
            };
            setInfo(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching auto-renounce info:', err);
            setError('Unable to load contract data');
        }
    }, []);

    useEffect(() => {
        fetchInfo();
        // Refresh every 5 minutes from the contract
        const interval = setInterval(fetchInfo, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchInfo]);

    // Client-side countdown ticker (updates every second)
    useEffect(() => {
        if (!info) return;

        if (info.isRenounced || info.timeRemaining <= 0) {
            setTimeLeft('RENOUNCED ✅');
            return;
        }

        // Calculate the target timestamp from contract data
        const targetTimestamp = (info.renounceTime) * 1000; // Convert to ms

        const timer = setInterval(() => {
            const now = Date.now();
            const diff = targetTimestamp - now;

            if (diff <= 0) {
                setTimeLeft('RENOUNCED ✅');
                clearInterval(timer);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [info]);

    return { info, timeLeft, error, isRenounced: info?.isRenounced ?? false };
}
