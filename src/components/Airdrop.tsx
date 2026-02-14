import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Wallet, ShieldAlert, Check, Wind } from 'lucide-react';
import { useAccount, useConnect, useConnectors } from 'wagmi';
import { useAirdrop } from '../hooks/useAirdrop';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Airdrop: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const connectors = useConnectors();
    const { isClaimed, isLoading, claim } = useAirdrop();
    const [claimAmount] = useState('10000'); // Example amount
    const [proof] = useState<string[]>([]); // This would normally come from an API

    const handleClaim = async () => {
        try {
            await claim(claimAmount, proof);
        } catch (error) {
            console.error('Claim failed:', error);
        }
    };

    return (
        <section id="airdrop" className="py-24 bg-gradient-to-b from-gray-900/50 to-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black mb-6"
                    >
                        🪂 <span className="text-gradient">DAYA Airdrop</span> Status
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Participate in our exclusive airdrops using Merkle tree technology for fair and gas-efficient distribution.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { title: 'Airdrop Status', val: 'Active', icon: CheckCircle2, sub: 'Current campaign status', color: 'text-green-500' },
                        { title: 'Your Eligibility', val: isConnected ? `${claimAmount} DAYA` : 'Connect Wallet', icon: Wind, sub: 'Tokens available to claim', color: 'text-orange-500' },
                        { title: 'Claim Deadline', val: '45 Days Left', icon: Clock, sub: 'Time remaining to claim', color: 'text-blue-500' },
                    ].map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-800/40 rounded-3xl p-8 border border-gray-700/50 hover:border-orange-500/30 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{card.title}</h3>
                                <card.icon size={20} className={card.color} />
                            </div>
                            <div className={cn("text-2xl font-black mb-2", card.color)}>{card.val}</div>
                            <p className="text-xs text-gray-500 font-bold">{card.sub}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-gray-800/20 rounded-[40px] p-8 md:p-12 border border-gray-800 max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl font-black text-white mb-8">Claim Your Airdrop</h3>
                            
                            {!isConnected ? (
                                <div className="text-center py-10 bg-black/40 rounded-3xl border border-dashed border-gray-700">
                                    <Wallet size={48} className="text-gray-600 mb-4 mx-auto" />
                                    <p className="text-gray-400 mb-8 font-bold">Connect your wallet to check eligibility</p>
                                    <button 
                                        onClick={() => connect({ connector: connectors[0] })}
                                        className="bg-orange-500 text-black px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-all"
                                    >
                                        CONNECT WALLET
                                    </button>
                                </div>
                            ) : isClaimed ? (
                                <div className="text-center py-10 bg-green-500/10 rounded-3xl border border-green-500/20">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                                        <Check size={32} className="text-black" />
                                    </div>
                                    <h4 className="text-2xl font-black text-green-500 mb-2">CLAIMED SUCCESSFULLY!</h4>
                                    <p className="text-gray-400 font-bold">Thank you for being part of Based Dayana</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-black/60 rounded-3xl p-6 border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-bold uppercase">Claimable Amount</span>
                                            <span className="text-white font-black">{claimAmount} DAYA</span>
                                        </div>
                                        <div className="h-px bg-white/5 w-full"></div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-bold uppercase">Network</span>
                                            <span className="text-blue-500 font-black">Base Mainnet</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleClaim}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black py-5 rounded-2xl text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                                    >
                                        {isLoading ? 'PROCESSING...' : 'CLAIM AIRDROP NOW'}
                                    </button>
                                    <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-500 font-bold">
                                        <ShieldAlert size={12} />
                                        <span>GAS FEES APPLY (BASE NETWORK)</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-white mb-4">How it works</h3>
                            {[
                                { t: 'Merkle Distribution', d: 'Secure and gas-efficient way to distribute tokens' },
                                { t: 'One-time Claim', d: 'Each eligible address can claim once per campaign' },
                                { t: 'Base Native', d: 'Fully optimized for the Base L2 ecosystem' }
                            ].map((item, i) => (
                                <div key={i} className="flex space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Check size={18} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white text-sm mb-1">{item.t}</h4>
                                        <p className="text-gray-500 text-xs font-bold leading-relaxed">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
