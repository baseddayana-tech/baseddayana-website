import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORK_CONFIG } from '../config/constants';

interface TokenInfo {
    totalSupply: string;
    totalSupplyRaw: bigint;
    name: string;
    symbol: string;
    tradingEnabled: boolean;
}

/**
 * Hook to read token info from the DAYA token contract.
 * Uses a read-only provider — no wallet connection needed.
 */
export function useTokenInfo() {
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTokenInfo = useCallback(async () => {
        try {
            setIsLoading(true);
            const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESSES.DAYA_TOKEN,
                CONTRACT_ABIS.DAYA_TOKEN,
                provider
            );

            const [totalSupply, name, symbol, tradingEnabled] = await Promise.all([
                contract.totalSupply(),
                contract.name(),
                contract.symbol(),
                contract.tradingEnabled(),
            ]);

            const supplyBigInt = BigInt(totalSupply.toString());
            const supplyFormatted = ethers.formatEther(totalSupply);
            const supplyNumber = Number(supplyFormatted);

            // Format as "1B", "500M", etc.
            let displaySupply: string;
            if (supplyNumber >= 1_000_000_000) {
                displaySupply = `${(supplyNumber / 1_000_000_000).toFixed(supplyNumber % 1_000_000_000 === 0 ? 0 : 1)}B`;
            } else if (supplyNumber >= 1_000_000) {
                displaySupply = `${(supplyNumber / 1_000_000).toFixed(supplyNumber % 1_000_000 === 0 ? 0 : 1)}M`;
            } else {
                displaySupply = supplyNumber.toLocaleString();
            }

            setTokenInfo({
                totalSupply: `${displaySupply} $${symbol}`,
                totalSupplyRaw: supplyBigInt,
                name,
                symbol,
                tradingEnabled,
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching token info:', err);
            setError('Unable to load token data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTokenInfo();
    }, [fetchTokenInfo]);

    return { tokenInfo, isLoading, error };
}
