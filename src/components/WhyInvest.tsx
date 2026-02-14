import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react';

const features = [
  {
    title: 'Powerful Utility',
    description: 'Demand is built-in. $DAYA is the key to staking rewards, governance rights, and exclusive access to our growing ecosystem.',
    icon: TrendingUp,
  },
  {
    title: 'Zero Tax, Max Gains',
    description: 'With 0% buy/sell tax, your investment is maximized. Every dollar you put in works for you, not for the taxman.',
    icon: Zap,
  },
  {
    title: 'Auto-Renounce Security',
    description: '🤖 Ownership automatically renounces in 60 days. Mathematical guarantee of full decentralization - impossible rug pull!',
    icon: ShieldCheck,
  },
];

export const WhyInvest: React.FC = () => {
  return (
    <section id="invest" className="bg-gray-900/50 py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-6"
        >
            Why $DAYA is Your Next <span className="text-gradient">100x Opportunity</span>
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-gray-400 max-w-3xl mx-auto mb-16 text-lg"
        >
            We are not just a meme. We are a movement with a clear vision and the fundamentals to achieve exponential growth.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/40 p-10 rounded-3xl border border-gray-800 content-card group"
            >
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform">
                <feature.icon size={32} className="text-orange-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
