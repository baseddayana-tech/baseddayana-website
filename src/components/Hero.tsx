import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState('Loading...');
    const [isCopied, setIsCopied] = useState(false);
    const CA = "0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A";

    // Simulate auto-renounce countdown logic
    useEffect(() => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 45); // Placeholder for 45 days

        const timer = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft('RENOUNCED');
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
    }, []);

    const copyCA = () => {
        navigator.clipboard.writeText(CA);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent -z-10"></div>
            
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center lg:text-left"
                    >
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full mb-6"
                        >
                            <Zap size={14} className="text-orange-500 fill-orange-500" />
                            <span className="text-xs font-bold text-orange-500 tracking-wider">REVOLUTIONARY DeFi ECOSYSTEM</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-black leading-none mb-6">
                            Beyond a Token: <br />
                            <span className="text-gradient glow-text">The Future of DeFi</span>
                        </h1>

                        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            BASED DAYANA ($DAYA) is pioneering a community-owned ecosystem for staking, 
                            governance, and exclusive rewards. Join the next evolution in decentralized finance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                            <a 
                                href="https://app.uniswap.org/explore/tokens/base/0xb6FA6E89479C2A312B6BbebD3db06f4832CcE04A"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto bg-orange-500 text-black px-8 py-4 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30"
                            >
                                BUY $DAYA NOW
                            </a>
                            <a 
                                href="https://app.analytixaudit.com/Dayana"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-gray-700 hover:border-orange-500/50 px-8 py-4 rounded-full font-bold transition-all"
                            >
                                <ShieldCheck size={20} className="text-orange-500" />
                                <span>VIEW AUDIT</span>
                            </a>
                        </div>

                        {/* CA Box */}
                        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl max-w-lg mx-auto lg:mx-0">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Contract Address (BASE)</label>
                            <div className="flex items-center space-x-3 bg-black/50 p-3 rounded-xl border border-white/5">
                                <code className="flex-1 text-sm font-mono text-gray-300 truncate">{CA}</code>
                                <button 
                                    onClick={copyCA}
                                    className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors group"
                                >
                                    {isCopied ? <span className="text-xs text-orange-500 font-bold">COPIED!</span> : <Copy size={18} className="text-gray-500 group-hover:text-orange-500" />}
                                </button>
                                <a href={`https://basescan.org/token/${CA}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors">
                                    <ExternalLink size={18} className="text-gray-500 hover:text-orange-500" />
                                </a>
                            </div>
                        </div>

                        {/* Auto-Renounce Widget */}
                        <div className="mt-8 p-6 bg-gradient-to-br from-orange-900/40 to-black/60 rounded-3xl border border-orange-500/20 max-w-lg mx-auto lg:mx-0">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black text-orange-400 tracking-tighter">🤖 AUTO-RENOUNCE COUNTDOWN</h4>
                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                            </div>
                            <div className="text-3xl font-black font-mono text-white mb-2 tracking-tight">
                                {timeLeft}
                            </div>
                            <p className="text-[10px] text-orange-300/70 font-bold leading-tight">
                                Ownership automatically renounced - Guaranteed decentralization - Impossible rug pull
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 animate-floating">
                            <img 
                                src="/images/dayana.png" 
                                alt="BASED DAYANA Art" 
                                className="w-full max-w-md mx-auto orange-glow"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/10 blur-[120px] -z-10 rounded-full"></div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
