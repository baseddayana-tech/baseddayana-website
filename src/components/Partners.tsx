import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowUpRight } from 'lucide-react';

export const Partners: React.FC = () => {
    return (
        <section id="partners" className="bg-gray-900/50 py-24">
            <div className="container mx-auto px-4 text-center">
                <motion.h2 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black mb-6"
                >
                    Strategic <span className="text-gradient">Partners</span>
                </motion.h2>
                <p className="mt-4 text-gray-400 max-w-3xl mx-auto mb-16 text-lg">
                    We are actively seeking partnerships with leading projects in the DeFi space.
                </p>
                
                <div className="flex flex-wrap justify-center items-center gap-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-black/60 p-12 rounded-[32px] border border-gray-800 w-full max-w-md group hover:border-orange-500/30 transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={20} className="text-orange-500" />
                        </div>
                        <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                            <Mail size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Your Project Here?</h3>
                        <p className="text-gray-400 mb-8 font-bold">Interested in collaborating with the Based Dayana ecosystem?</p>
                        <a 
                            href="mailto:partnerships@dayanacoin.xyz"
                            className="text-orange-500 font-black text-lg underline underline-offset-8 decoration-2 hover:text-orange-400 transition-colors"
                        >
                            partnerships@dayanacoin.xyz
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
