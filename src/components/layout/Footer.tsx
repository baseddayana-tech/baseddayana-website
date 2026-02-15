import React from 'react';
import { Twitter, Send, Github, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="border-t border-gray-900 bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="relative mb-10">
            <img src="/images/logo.png" className="h-16 w-16 rounded-full border-2 border-orange-500/30" alt="Logo" />
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full -z-10"></div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Join the <span className="text-gradient">DAYA</span> Revolution
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl font-medium">
            Become part of our rapidly growing community and shape the future of decentralized finance on Base.
          </p>

          <div className="flex justify-center items-center space-x-6 mb-20">
            {[
              { icon: Send, href: 'https://t.me/based_dayana', label: 'Telegram' },
              { icon: Twitter, href: 'https://x.com/BasedDayana', label: 'Twitter' },
              { icon: Github, href: 'https://github.com/baseddayana-tech/baseddayana-contracts', label: 'GitHub' },
              { icon: Mail, href: 'mailto:info@dayanacoin.xyz', label: 'Email' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/20 border border-gray-800 transition-all hover:scale-110 active:scale-95"
                title={social.label}
              >
                <social.icon size={24} />
              </a>
            ))}
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-900 to-transparent mb-12"></div>

          <div className="flex flex-col md:flex-row justify-between items-center w-full text-sm text-gray-500 font-bold tracking-tighter">
            <p>COPYRIGHT © {new Date().getFullYear()} BASED DAYANA. ALL RIGHTS RESERVED.</p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-orange-500 transition-colors">TERMS OF USE</a>
              <a href="#" className="hover:text-orange-500 transition-colors">PRIVACY POLICY</a>
              <a href="https://basescan.org" target="_blank" className="text-blue-500/50 hover:text-blue-500 transition-colors">POWERED BY BASE</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
