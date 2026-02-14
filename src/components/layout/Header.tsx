import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Menu, X, Wallet, ChevronDown, LayoutDashboard, Shield, Coins, Settings, Wind } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navLinks = [
  { name: 'Why Invest', href: '#invest', icon: LayoutDashboard },
  { name: 'Utility', href: '#utility', icon: Settings },
  { name: 'Strategies', href: '#strategies', icon: Coins },
  { name: 'Airdrop', href: '#airdrop', icon: Wind },
  { name: 'Security', href: '#security', icon: Shield },
  { name: 'Tokenomics', href: '#tokenomics', icon: Coins },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <img src="/images/logo.png" className="h-12 w-12 rounded-full border-2 border-orange-500/20 group-hover:border-orange-500/50 transition-all" alt="BASED DAYANA" />
            <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full -z-10 group-hover:bg-orange-500/40 transition-all"></div>
          </div>
          <span className="text-xl font-black tracking-tighter text-gradient hidden sm:block">BASED DAYANA</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-gray-400 hover:text-orange-500 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => isConnected ? disconnect() : connect({ connector: connectors[0] })}
            className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-black px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
          >
            <Wallet size={18} />
            <span>{isConnected ? truncateAddress(address!) : 'CONNECT WALLET'}</span>
          </button>

          <button
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-20 bg-black/95 backdrop-blur-xl transition-all duration-300 ease-in-out transform",
          isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}
      >
        <div className="flex flex-col p-6 space-y-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 text-lg font-bold text-gray-300 hover:text-orange-500 transition-colors p-3 rounded-xl hover:bg-white/5"
            >
              <link.icon size={24} className="text-orange-500" />
              <span>{link.name}</span>
            </a>
          ))}
          <button
            onClick={() => {
              isConnected ? disconnect() : connect({ connector: connectors[0] });
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-black p-4 rounded-2xl font-black text-lg transition-all active:scale-95"
          >
            <Wallet size={24} />
            <span>{isConnected ? truncateAddress(address!) : 'CONNECT WALLET'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
