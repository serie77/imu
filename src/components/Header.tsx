'use client';

import { motion } from "framer-motion";
import { Clipboard, Github } from "lucide-react";
import Link from "next/link";
import WalletButton from './WalletButton';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActiveRoute = (path: string) => {
    return pathname === path;
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-sm text-white shadow-lg font-mono border-b border-gray-800 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-6">
        <Link href="/" className="relative group">
          <motion.span 
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            IMU
          </motion.span>
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 transition-all duration-200 group-hover:w-full"></span>
        </Link>

        <motion.div 
          className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/50"
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-gray-400 text-sm">CA: 0x123...789</span>
          <motion.button 
            className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigator.clipboard.writeText("0x123...789")}
          >
            <Clipboard className="h-4 w-4" />
          </motion.button>
        </motion.div>

        <a
          href="https://x.com/imuagent"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          href="/imurank"
          className={`relative group px-4 py-2 text-sm font-medium rounded-lg overflow-hidden transition-all duration-300
            ${isActiveRoute('/imurank') 
              ? 'bg-gradient-to-r from-red-500/40 to-red-600/40 text-white' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <span className="relative z-10">IMU Rank</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all duration-300"></div>
          {isActiveRoute('/imurank') && (
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5 w-full bg-red-500"
              layoutId="underline"
            />
          )}
        </Link>

        <Link
          href="/marketstats"
          className={`relative group px-4 py-2 text-sm font-medium rounded-lg overflow-hidden transition-all duration-300
            ${isActiveRoute('/marketstats') 
              ? 'bg-gradient-to-r from-blue-500/40 to-blue-600/40 text-white' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <span className="relative z-10">Market Stats</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
          {isActiveRoute('/marketstats') && (
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500"
              layoutId="underline"
            />
          )}
        </Link>

        <Link
          href="/kol"
          className={`relative group px-4 py-2 text-sm font-medium rounded-lg overflow-hidden transition-all duration-300
            ${isActiveRoute('/kol') 
              ? 'bg-gradient-to-r from-emerald-500/40 to-emerald-600/40 text-white' 
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <span className="relative z-10">KOL Stats</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/20 group-hover:to-emerald-600/20 transition-all duration-300"></div>
          {isActiveRoute('/kol') && (
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-500"
              layoutId="underline"
            />
          )}
        </Link>

        <a
          href="#"
          tabIndex={-1}
          aria-disabled="true"
          className="relative group px-4 py-2 text-sm font-medium text-gray-500 bg-gray-800/60 rounded-lg overflow-hidden transition-all duration-300 opacity-50 pointer-events-none cursor-not-allowed"
          title="Coming soon!"
        >
          <span className="relative z-10">GitBook</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-600/0 transition-all duration-300"></div>
        </a>

        <div className="relative z-50">
          <WalletButton />
        </div>
      </div>
    </motion.header>
  );
}