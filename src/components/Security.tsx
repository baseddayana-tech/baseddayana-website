import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Shield, Droplets, Search, ExternalLink } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../config/constants';
import { useAutoRenounce } from '../hooks/useAutoRenounce';

export const Security: React.FC = () => {
    const { info } = useAutoRenounce();

    // Derive the renounce period from contract data, fallback to "60" if not loaded
    const renounceDays = info
        ? Math.ceil((info.renounceTime - info.deployTime) / (60 * 60 * 24))
        : 60;

    const securityFeatures = [
        {
            icon: Bot,
            title: 'Auto-Renounce',
            description: `Ownership automatically renounces in ${renounceDays} days - no human intervention needed`
        },
        {
            icon: Shield,
            title: 'Rug-Pull Proof',
            description: `Mathematical guarantee - impossible to prevent decentralization after ${renounceDays} days`
        },
        {
            icon: Droplets,
            title: 'Zero Fees',
            description: '0% transfer fees permanently - no hidden taxes or honeypot mechanisms'
        },
        {
            icon: Search,
            title: 'Verified & Transparent',
            description: 'Fully verified on BaseScan with open source code and security audits'
        }
    ];

    const contractLinks = [
        { name: '🪙 DAYA Token', address: CONTRACT_ADDRESSES.DAYA_TOKEN },
        { name: '⚡ Staking Contract', address: CONTRACT_ADDRESSES.STAKING },
        { name: '🪂 Airdrop Contract', address: CONTRACT_ADDRESSES.AIRDROP },
        { name: '🔒 Vesting Contract', address: CONTRACT_ADDRESSES.VESTING },
    ];

    return (
        <section id="security" className="py-24 bg-gray-900/30">
            <div className="container mx-auto px-4 text-center">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black mb-6"
                >
                    🤖 Auto-Renounce <span className="text-gradient">Security Innovation</span>
                </motion.h2>
                <p className="mt-4 text-gray-400 max-w-3xl mx-auto mb-16 text-lg">
                    BASED DAYANA is the first token on Base with automatic ownership renouncement, providing mathematical guarantee of decentralization.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {securityFeatures.map((feat, i) => (
                        <motion.div
                            key={feat.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-black/40 p-8 rounded-3xl border border-gray-800 hover:border-orange-500/30 transition-all group"
                        >
                            <feat.icon size={40} className="text-orange-500 mb-6 mx-auto group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black text-white mb-3">{feat.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feat.description}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-black border border-orange-500/20 rounded-[40px] p-10 md:p-16 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>

                        <h3 className="text-3xl font-black text-white mb-10 relative z-10">🎯 Why <span className="text-orange-500">Auto-Renounce</span> Matters</h3>

                        <div className="grid md:grid-cols-2 gap-12 text-left relative z-10">
                            <ul className="space-y-6">
                                {[
                                    { t: 'Ultimate Security', d: `No developer can rug pull after ${renounceDays} days` },
                                    { t: 'Community Trust', d: 'Mathematical proof of decentralization' },
                                    { t: 'Innovation First', d: 'First auto-renounce token on Base network' },
                                    { t: 'Exchange Ready', d: 'Meets highest security standards' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start space-x-4">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        </div>
                                        <div>
                                            <h5 className="font-black text-orange-500 text-lg leading-none mb-1">{item.t}</h5>
                                            <p className="text-gray-400 text-sm">{item.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="bg-gray-900/80 rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Verified Ecosystem (BASE)</h4>
                                <div className="space-y-4">
                                    {contractLinks.map((link) => (
                                        <div key={link.name} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-gray-300">{link.name}</span>
                                                <a href={`https://basescan.org/address/${link.address}`} target="_blank" className="text-orange-500 hover:text-orange-400 transition-colors">
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                            <div className="bg-black border border-white/5 p-2 rounded-lg font-mono text-[10px] text-gray-500 truncate group-hover:text-orange-500/70 transition-colors">
                                                {link.address}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
