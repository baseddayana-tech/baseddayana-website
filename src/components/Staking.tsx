import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, ChevronRight, Lock, Unlock, Zap, Info, Wallet } from 'lucide-react';
import { useAccount, useConnect, useConnectors } from 'wagmi';
import { useStaking } from '../hooks/useStaking';
import { ethers } from 'ethers';

const tiers = [
    { period: 30, apy: 8, label: 'Bronze' },
    { period: 90, apy: 12, label: 'Silver' },
    { period: 180, apy: 15, label: 'Gold' },
    { period: 365, apy: 20, label: 'Platinum' },
];

export const Staking: React.FC = () => {
    const { isConnected } = useAccount();
    const { connect } = useConnect();
    const connectors = useConnectors();
    const { stakeInfo, isLoading, stake, unstake } = useStaking();
    const [amount, setAmount] = useState('');
    const [selectedTier, setSelectedTier] = useState(0);

    const handleStake = async () => {
        if (!amount || isNaN(Number(amount))) return;
        try {
            await stake(amount, selectedTier);
            setAmount('');
        } catch (error) {
            console.error('Stake failed:', error);
        }
    };

    const hasStake = stakeInfo && BigInt(stakeInfo.amount.toString()) > 0n;

    return (
        <section id="staking" className="py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black mb-6"
                    >
                        ⚡ <span className="text-gradient">Sustainable Staking</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Earn passive income by securing the network. Choose your tier and start earning $DAYA rewards today.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Staking Controls */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-gray-900/50 rounded-[32px] p-8 border border-gray-800">
                                <h3 className="text-xl font-black text-white mb-8 flex items-center">
                                    <Zap size={20} className="text-orange-500 mr-2" />
                                    Choose Your Tier
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                    {tiers.map((tier, i) => (
                                        <button
                                            key={tier.label}
                                            onClick={() => setSelectedTier(i)}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all text-center group",
                                                selectedTier === i 
                                                    ? "bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20" 
                                                    : "bg-black/40 border-gray-800 text-gray-400 hover:border-orange-500/30"
                                            )}
                                        >
                                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{tier.label}</div>
                                            <div className="text-xl font-black">{tier.apy}%</div>
                                            <div className="text-[10px] font-bold opacity-60">{tier.period} Days</div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Amount to Stake</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-black border border-gray-800 focus:border-orange-500 rounded-2xl p-4 font-black text-xl text-white outline-none transition-all pr-20"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-orange-500">DAYA</div>
                                        </div>
                                    </div>

                                    {!isConnected ? (
                                        <button 
                                            onClick={() => connect({ connector: connectors[0] })}
                                            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <Wallet size={18} />
                                            <span>CONNECT WALLET TO STAKE</span>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleStake}
                                            disabled={isLoading || !amount}
                                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black py-4 rounded-2xl text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                                        >
                                            {isLoading ? 'PROCESSING...' : 'STAKE $DAYA'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-orange-500/5 rounded-2xl p-6 border border-orange-500/10 flex items-start space-x-4">
                                <Info size={20} className="text-orange-500 flex-shrink-0 mt-1" />
                                <p className="text-xs text-orange-200/60 leading-relaxed font-bold">
                                    Staking your tokens locks them for the selected period. Early unstaking is subject to a 25% penalty. 
                                    Rewards are calculated based on the APY of your chosen tier.
                                </p>
                            </div>
                        </div>

                        {/* Staking Stats */}
                        <div className="lg:col-span-5">
                            <div className="bg-gradient-to-br from-gray-900 to-black rounded-[32px] p-8 border border-gray-800 h-full relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -z-10 group-hover:bg-orange-500/10 transition-all"></div>
                                
                                <h3 className="text-xl font-black text-white mb-10 flex items-center">
                                    <Coins size={20} className="text-orange-500 mr-2" />
                                    Your Staking Info
                                </h3>

                                {hasStake ? (
                                    <div className="space-y-8">
                                        <div className="bg-black/60 p-6 rounded-3xl border border-white/5">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Staked</div>
                                            <div className="text-3xl font-black text-white">{ethers.formatEther(stakeInfo.amount)} <span className="text-sm text-orange-500">$DAYA</span></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Rewards</div>
                                                <div className="text-xl font-black text-green-500">+{ethers.formatEther(stakeInfo.rewards)}</div>
                                            </div>
                                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">APY</div>
                                                <div className="text-xl font-black text-blue-500">{tiers[stakeInfo.tierIndex || 0].apy}%</div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={unstake}
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/5"
                                        >
                                            <Unlock size={18} />
                                            <span>UNSTAKE TOKENS</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                            <Lock size={32} className="text-gray-600" />
                                        </div>
                                        <p className="text-gray-500 font-bold max-w-[200px]">No active stakes found. Stake your tokens to earn rewards.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
