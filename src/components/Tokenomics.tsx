import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Supply', value: '1B $DAYA' },
  { label: 'Buy/Sell Tax', value: '0% / 0%' },
  { label: 'Liquidity', value: 'Community-Funded' },
];

export const Tokenomics: React.FC = () => {
  return (
    <section id="tokenomics" className="py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-6 mb-16">
          <img src="/public/images/tok.svg" alt="Tokenomics" className="w-16 h-16 animate-pulse" 
               onError={(e) => e.currentTarget.src = "/images/logo.png"} />
          <h2 className="text-4xl md:text-5xl font-black">Tokenomics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/50 p-12 rounded-3xl border border-gray-800 content-card relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] -z-10 group-hover:bg-orange-500/10 transition-all"></div>
              <h3 className="text-lg font-bold text-orange-400 uppercase tracking-widest mb-4">{stat.label}</h3>
              <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
