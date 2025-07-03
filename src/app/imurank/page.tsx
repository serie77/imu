'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Swords, AlertCircle, Wallet, Loader2, TrendingUp, Target, DollarSign, Award, ChartBar, ArrowUpRight, ArrowDownRight, ArrowLeft, Zap, X, Share, Check, Clock, Diamond, Crown, Trophy, Medal, Rocket, LineChart, Flame, Timer, ArrowUpFromLine } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { load } from 'cheerio';
import html2canvas from 'html2canvas';

// Line 11: Add string type annotation
const isValidSolanaAddress = (address: string) => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

// Utility to decode obfuscated selectors
const decodeSelectors = (hash: string) => {
  // Decode logic here
  return JSON.parse(atob(hash));
};

// Rotate between different request patterns
const getRandomHeaders = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/121.0.0.0'
  ];
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://gmgn.ai/',
    'Cache-Control': `max-age=${Math.floor(Math.random() * 1000)}`,
    'Connection': 'keep-alive'
  };
};

// Add random delay between requests
const randomDelay = async () => {
  const delay = Math.floor(Math.random() * (2000 - 500) + 500); // 500-2000ms
  await new Promise(resolve => setTimeout(resolve, delay));
};

const fetchWalletData = async (address, timeframe = '1d') => {
  let isLoading = true;
  try {
    // Use our API route instead of fetching directly from GMGN.ai
    const response = await fetch(`/api/gmgn?address=${encodeURIComponent(address)}&timeframe=${timeframe}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch wallet data');
    }
    
    const data = await response.json();
    
    // Calculate rank based on their metrics
    data.rank = calculateRank(data);
    
    // Add top trades to the data
    data.topTrades = data.topTrades?.map(trade => ({
      tokenName: trade.tokenName,
      tokenImage: trade.tokenImage,
      tokenCA: trade.tokenCA,
      realizedProfit: trade.realizedProfit,
      pnlPercentage: trade.pnlPercentage,
      timestamp: trade.timestamp
    })) || [];
    
    console.log('API Data:', data);
    return data;
  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    isLoading = false;
  }
};

const calculateRank = (data) => {
  if (!data) return 'Unranked';

  // Extract numeric values
  const pnlValue = parseFloat(data.pnl?.replace(/[^0-9.-]/g, '') || '0');
  const winRate = parseFloat(data.winRate?.replace('%', '') || '0');
  const totalTrades = parseInt(data.tokensTraded) || 0;
  const holdTimeSeconds = parseInt(data.holdTime?.split(' ')[0] || '0');
  const bestTradePercentage = data.bestTradePercentage || 0;

  // Calculate component scores
  const pnlScore = Math.min(35, (Math.abs(pnlValue) / 10000) * 3.5) * (pnlValue >= 0 ? 1 : -1);
  const winRateScore = (winRate - 40) * 1.25;
  const holdTimeScore = Math.min(20, (holdTimeSeconds / 30) * 10);
  const volumeScore = Math.min(10, (totalTrades / 500) * 5);
  const riskScore = Math.min(10, (bestTradePercentage / 100));

  const totalScore = pnlScore + winRateScore + holdTimeScore + volumeScore + riskScore;

  // Return rank based on total score
  if (totalScore >= 90) return 'S+';
  if (totalScore >= 80) return 'S';
  if (totalScore >= 70) return 'A+';
  if (totalScore >= 60) return 'A';
  if (totalScore >= 50) return 'B+';
  if (totalScore >= 40) return 'B';
  if (totalScore >= 30) return 'C+';
  if (totalScore >= 20) return 'C';
  if (totalScore >= 0) return 'D';
  return 'F';
};

const formatBalance = (balance: string) => {
  // Extract SOL amount and USD value from the balance string
  // Example input: "3039.57 SOL ($477,364)"
  const match = balance.match(/^([\d,]+\.?\d*)\s*SOL\s*\(\$([0-9,]+)\)$/);
  if (!match) return balance;

  const solAmount = parseFloat(match[1].replace(/,/g, ''));
  const usdAmount = match[2];

  // Format SOL with commas and 2 decimal places
  const formattedSOL = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(solAmount);

  return `${formattedSOL} SOL ($${usdAmount})`;
};

const formatPNL = (pnl: string) => {
  // Remove any existing $ and commas, then parse the number
  const numericValue = parseFloat(pnl.replace(/[$,]/g, ''));
  if (isNaN(numericValue)) return pnl;

  // Format with commas
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(numericValue));

  // Add the appropriate sign
  return numericValue >= 0 ? formattedValue : `-${formattedValue}`;
};

// Define the GMGN data type
interface GMGNData {
  winRate: string;
  pnl: string;
  greenTrades: number;
  redTrades: number;
  realizedProfits: string;
  totalCost: string;
  tokenAvgCost: string;
  address: string;
  topTrades: Array<{
    tokenName: string;
    tokenImage: string;
    tokenCA: string;
    realizedProfit: string;
    pnlPercentage: string;
    timestamp: string;
  }>;
}

// Modify the RankDisplay component to include better gradients and animations
const RankDisplay = ({ rank }: { rank: string }) => {
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S+': return 'from-purple-500 via-pink-500 to-purple-400';
      case 'S': return 'from-indigo-500 via-purple-500 to-indigo-400';
      case 'A+': return 'from-blue-500 via-cyan-500 to-blue-400';
      case 'A': return 'from-cyan-500 via-teal-500 to-cyan-400';
      case 'B+': return 'from-teal-500 via-green-500 to-teal-400';
      case 'B': return 'from-green-500 via-emerald-500 to-green-400';
      case 'C+': return 'from-yellow-500 via-amber-500 to-yellow-400';
      case 'C': return 'from-orange-500 via-amber-500 to-orange-400';
      case 'D': return 'from-red-500 via-rose-500 to-red-400';
      default: return 'from-gray-500 via-slate-500 to-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="flex justify-center items-center mb-8"
    >
      <div className={`
        relative w-32 h-32 rounded-full 
        bg-gradient-to-br ${getRankColor(rank)}
        flex items-center justify-center
        shadow-lg shadow-black/50
        animate-gradient-xy
        hover:scale-105 transition-transform duration-300
      `}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-bold text-white drop-shadow-lg"
        >
          {rank}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute -bottom-2 text-sm text-gray-300 font-medium"
        >
          IMU RANK
        </motion.div>
        
        {/* Add glowing effect */}
        <div className={`
          absolute inset-0 rounded-full
          bg-gradient-to-br ${getRankColor(rank)}
          opacity-50 blur-xl
          animate-pulse
        `} />
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, subValue, isPositive = true, icon: Icon }) => {
  // Handle numeric values with potential negative signs
  const isNumericValue = typeof value === 'string' && value.includes('$');
  const numericValue = isNumericValue ? parseFloat(value.replace(/[^0-9.-]/g, '')) : null;
  const valueColor = isNumericValue
    ? numericValue > 0
      ? 'text-green-400'
      : numericValue < 0
      ? 'text-red-400'
      : 'text-white'
    : isPositive
    ? 'text-green-400'
    : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 rounded-full bg-gray-700/50">
          <Icon className="w-5 h-5 text-gray-300" />
        </div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
      <div className={valueColor}>
        {value}
      </div>
      {subValue && (
        <div className="text-sm text-gray-500 mt-1">
          {subValue}
        </div>
      )}
    </motion.div>
  );
};

// Add this new component for displaying top trades
const TopTradeCard = ({ trade, index }) => {
  const copyToClipboard = async (ca) => {
    try {
      await navigator.clipboard.writeText(ca);
      // You might want to add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/60 transition-all"
    >
      <div className="flex items-center space-x-4">
        {/* Token Image */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden">
          <img 
            src={trade.tokenImage} 
            alt={trade.tokenName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Trade Details */}
        <div className="flex-1">
          <button
            onClick={() => copyToClipboard(trade.tokenCA)}
            className="text-lg font-semibold text-white hover:text-blue-400 transition-colors flex items-center"
          >
            {trade.tokenName}
            <span className="ml-2 text-xs text-gray-400">(Click to copy CA)</span>
          </button>
          <div className="text-sm text-gray-400">{trade.timestamp}</div>
        </div>

        {/* Profit Info */}
        <div className="text-right">
          <div className={`text-xl font-bold ${
            trade.realizedProfit.startsWith('+') ? 'text-green-400' : 'text-red-400'
          }`}>
            {trade.realizedProfit}
          </div>
          <div className={`text-sm ${
            trade.pnlPercentage.startsWith('+') ? 'text-green-400' : 'text-red-400'
          }`}>
            {trade.pnlPercentage}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Add this component for the inactive wallet notification
const InactiveWalletAlert = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-4xl mx-auto mb-6"
  >
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center space-x-3">
      <AlertCircle className="text-yellow-500" size={24} />
      <span className="text-yellow-500">This wallet appears to be inactive (0 SOL balance). Data shown may not be current.</span>
    </div>
  </motion.div>
);

// Update the getRankScore function to use the actual score
const getRankScore = (stats) => {
  // Extract numeric values
  const pnlValue = parseFloat(stats.pnl?.replace(/[^0-9.-]/g, '') || '0');
  const winRate = parseFloat(stats.winRate?.replace('%', '') || '0');
  const totalTrades = parseInt(stats.tokensTraded) || 0;
  const holdTimeStr = stats.holdTime?.split(' ')[0] || '0';
  const holdTimeSeconds = parseInt(holdTimeStr) || 0;
  const bestTradePercentage = parseFloat(stats.bestTradePercentage) || 0;

  // Calculate component scores
  const pnlScore = Math.min(35, (Math.abs(pnlValue) / 10000) * 3.5) * (pnlValue >= 0 ? 1 : -1);
  const winRateScore = (winRate - 40) * 1.25;
  const holdTimeScore = Math.min(20, (holdTimeSeconds / 30) * 10);
  const volumeScore = Math.min(10, (totalTrades / 500) * 5);
  const riskScore = Math.min(10, (bestTradePercentage / 100));

  // Calculate total score
  const totalScore = pnlScore + winRateScore + holdTimeScore + volumeScore + riskScore;
  
  // Return as percentage (0-100)
  return Math.max(0, Math.min(100, totalScore)).toFixed(2);
};

// Add this new component near your other components
const ShareStatsModal = ({ isOpen, onClose, stats }) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  const handleCopyCard = async () => {
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a374a] to-[#1f2937] border border-gray-700/50 rounded-2xl w-full max-w-[720px] relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
        >
          <X size={20} />
        </button>

        <div 
          ref={cardRef}
          className="p-10 w-full bg-gradient-to-br from-[#2a374a] to-[#1f2937]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <img src="/imu.png" alt="IMU" className="w-10 h-10" />
              <span className="text-2xl font-bold text-white">IMU Rank</span>
            </div>
            <div className="text-sm text-gray-300 bg-gray-800/70 rounded-full px-4 py-1.5 border border-gray-700/50">
              30D Stats
            </div>
          </div>

          {/* Address */}
          <div className="text-gray-400 text-center text-base mb-8 font-mono">
            {stats.address}
          </div>

          {/* Main stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 flex flex-col justify-center items-center">
              <div className="text-6xl font-bold text-teal-400">{stats.rank}</div>
              <div className="text-lg text-gray-400 mt-2">Rank</div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 flex flex-col justify-center items-center">
              <div className="text-5xl font-bold text-green-400">{stats.pnl}</div>
              <div className="text-lg text-gray-400 mt-2">PNL</div>
            </div>
          </div>

          {/* Medals Section */}
          {stats.achievedMedals && stats.achievedMedals.length > 0 && (
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 mb-8">
              <div className="text-center text-lg font-semibold text-gray-300 mb-4">Achievements</div>
              <div className="flex justify-center gap-5 flex-wrap">
                {stats.achievedMedals.map((medal, index) => (
                  <div
                    key={index}
                    className={`
                      w-14 h-14 rounded-full
                      bg-gradient-to-br ${medal.color}
                      flex items-center justify-center
                      shadow-lg
                    `}
                  >
                    <medal.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-5 flex flex-col justify-center items-center h-full">
              <div className="text-white text-3xl font-semibold">{stats.winRate}</div>
              <div className="text-gray-400 text-base mt-2">Win Rate</div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-5 flex flex-col justify-center items-center h-full">
              <div className="text-white text-3xl font-semibold">{stats.tokensTraded}</div>
              <div className="text-gray-400 text-base mt-2">Tokens Traded</div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-5 flex flex-col justify-center items-center h-full">
              <div className="text-white text-3xl font-semibold">{stats.bestTrade}</div>
              <div className="text-gray-400 text-base mt-2">Best Trade</div>
            </div>
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-5 flex flex-col justify-center items-center h-full">
              <div className="text-white text-3xl font-semibold">{stats.holdTime}</div>
              <div className="text-gray-400 text-base mt-2">Avg Hold Time</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/20 border-t border-gray-700/50">
          <button
            onClick={handleCopyCard}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <ArrowUpFromLine size={20} />
            Copy Card to Clipboard
          </button>
        </div>

        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-4 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm"
          >
            Copied to clipboard!
          </motion.div>
        )}
      </div>
    </div>
  );
};

const WinnerBadge = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
    className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
  >
    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
      <Crown size={16} className="text-black" />
      <span className="font-bold text-sm uppercase">Winner</span>
    </div>
  </motion.div>
);

const getAchievedMedals = (stats) => {
  const medals = [];
  if (!stats) return medals;

  const pnlValue = parseFloat(stats.pnl?.replace(/[^0-9.-]/g, '') || '0');
  const winRate = parseFloat(stats.winRate?.replace('%', '') || '0');
  const tokenCount = parseInt(stats.tokensTraded || '0');
  const bestTradeValue = parseFloat(stats.bestTrade?.replace(/[$,]/g, '') || '0');
  
  const parseHoldTime = (value) => {
    if (typeof value !== 'string') return Infinity;
    const parts = value.toLowerCase().split(' ');
    const num = parseFloat(parts[0]);
    if (isNaN(num)) return Infinity;
    if (parts[1]?.startsWith('min')) return num * 60;
    if (parts[1]?.startsWith('hour')) return num * 3600;
    return num; // Assume seconds
  };
  const holdTimeSeconds = parseHoldTime(stats.holdTime);

  // PNL Medals
  if (pnlValue >= 1000000) medals.push({ icon: Diamond, color: 'from-purple-600 to-pink-400', name: 'Diamond Trader', desc: '$1M+ Profit' });
  if (pnlValue >= 500000) medals.push({ icon: Crown, color: 'from-indigo-400 to-purple-500', name: 'Platinum Trader', desc: '$500K+ Profit' });
  if (pnlValue >= 100000) medals.push({ icon: Trophy, color: 'from-yellow-400 to-amber-500', name: 'Gold Trader', desc: '$100K+ Profit' });
  if (pnlValue >= 50000) medals.push({ icon: Medal, color: 'from-gray-300 to-gray-400', name: 'Silver Trader', desc: '$50K+ Profit' });

  // Volume Medals
  if (tokenCount >= 2000) medals.push({ icon: Rocket, color: 'from-red-500 to-orange-400', name: 'Trading Machine', desc: '2000+ Trades' });
  if (tokenCount >= 1000) medals.push({ icon: LineChart, color: 'from-green-400 to-emerald-500', name: 'Sharp Trader', desc: '1000+ Trades' });
  if (tokenCount >= 500) medals.push({ icon: TrendingUp, color: 'from-blue-400 to-cyan-500', name: 'Active Trader', desc: '500+ Trades' });

  // Best Trade Medals
  if (bestTradeValue >= 50000) medals.push({ icon: Target, color: 'from-purple-500 to-pink-500', name: 'Legendary Trade', desc: '$50K+ Trade' });
  if (bestTradeValue >= 25000) medals.push({ icon: Flame, color: 'from-blue-500 to-indigo-500', name: 'Master Trade', desc: '$25K+ Trade' });
  if (bestTradeValue >= 10000) medals.push({ icon: Award, color: 'from-cyan-400 to-blue-500', name: 'Expert Trade', desc: '$10K+ Trade' });

  // Special Medals
  if (winRate >= 65) medals.push({ icon: Trophy, color: 'from-emerald-400 to-teal-500', name: 'Consistency King', desc: '65%+ Win Rate' });
  if (holdTimeSeconds <= 10) medals.push({ icon: Timer, color: 'from-amber-400 to-orange-500', name: 'Speed Demon', desc: 'Sub 10s Trades' });

  return medals;
};

const PvpStatCompare = ({ label, value1, value2, delay, statType }) => {
  const parseStat = (value, type) => {
    if (typeof value !== 'string') return parseFloat(value) || 0;
    
    switch (type) {
      case 'pnl':
      case 'bestTrade':
        return parseFloat(value.replace(/[$,]/g, ''));
      case 'winRate':
        return parseFloat(value.replace('%', ''));
      case 'holdTime': {
        const parts = value.toLowerCase().split(' ');
        const num = parseFloat(parts[0]);
        if (isNaN(num)) return Infinity;
        if (parts[1]?.startsWith('min')) return num * 60;
        if (parts[1]?.startsWith('hour')) return num * 3600;
        return num; // Assume seconds
      }
      default:
        return 0;
    }
  };

  const v1 = parseStat(value1, statType);
  const v2 = parseStat(value2, statType);

  let winnerSide = 'none';
  if (statType === 'holdTime') {
    // Lower is better for hold time
    if (v1 < v2) winnerSide = 'left';
    else if (v2 < v1) winnerSide = 'right';
  } else {
    // Higher is better for others
    if (v1 > v2) winnerSide = 'left';
    else if (v2 > v1) winnerSide = 'right';
  }

  const leftColor = winnerSide === 'left' ? 'text-green-400' : winnerSide === 'right' ? 'text-red-400' : 'text-white';
  const rightColor = winnerSide === 'right' ? 'text-green-400' : winnerSide === 'left' ? 'text-red-400' : 'text-white';


  return (
     <motion.div
      className="grid grid-cols-3 items-center gap-4 text-center py-4 px-6 bg-gray-800/30 rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 + 0.5 }}
      whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.7)' }}
    >
      <span className={`font-semibold text-lg text-left transition-colors ${leftColor}`}>{value1}</span>
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold text-lg text-right transition-colors ${rightColor}`}>{value2}</span>
    </motion.div>
  );
}

export default function ImuRank() {
  const { connected } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isPvpMode, setIsPvpMode] = useState(false);
  const [wallet1, setWallet1] = useState(null);
  const [wallet2, setWallet2] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [gmgnData, setGmgnData] = useState<GMGNData | null>(null);
  const [lastSearched, setLastSearched] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [winnerRevealed, setWinnerRevealed] = useState(false);

  useEffect(() => {
    if (showComparison) {
      const timer = setTimeout(() => {
        setWinnerRevealed(true);
      }, 1500); // Reveal after a delay for animation
      return () => {
        clearTimeout(timer);
        setWinnerRevealed(false); // Reset when leaving PVP mode
      };
    }
  }, [showComparison]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);
    
    if (query.trim() && query.length >= 32) {
      if (isValidSolanaAddress(query)) {
        try {
          setLoading(true);
          const walletStats = await fetchWalletData(query, timeframe);
          walletStats.achievedMedals = getAchievedMedals(walletStats);
          
          if (isPvpMode && !wallet1) {
            setWallet1({ address: query, stats: walletStats });
          } else if (isPvpMode && !wallet2) {
            setWallet2({ address: query, stats: walletStats });
            setShowComparison(true);
          } else {
            setSelectedWallet({ address: query, stats: walletStats });
          }
          setSearchQuery("");
        } catch (err) {
          console.error('Search error:', err);
          setError(err.message || 'Failed to fetch wallet data');
        } finally {
          setLoading(false);
        }
      } else {
        setError("Please enter a valid Solana wallet address");
      }
    }
  };

  const resetPvp = () => {
    setWallet1(null);
    setWallet2(null);
    setShowComparison(false);
    setError(null);
  };

  const calculateWinner = () => {
    if (!wallet1 || !wallet2) return null;
    
    const getPoints = (stats) => {
      let points = 0;
      points += parseFloat(stats.pnl?.replace(/[^0-9.-]/g, '') || '0') * 0.7;
      points += (parseFloat(stats.winRate?.replace('%', '') || '0') / 100) * 0.3;
      
      return isNaN(points) ? 0 : points;
    };

    const points1 = getPoints(wallet1.stats);
    const points2 = getPoints(wallet2.stats);
    
    console.log('Wallet 1 Points:', points1);
    console.log('Wallet 2 Points:', points2);
    
    return points1 > points2 ? wallet1 : wallet2;
  };

  const winner = React.useMemo(() => calculateWinner(), [wallet1, wallet2, showComparison]);

  // Function to fetch GMGN data from our API route
  const fetchGMGNData = async (address: string, timeframe: string) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data for ${address} with timeframe ${timeframe}`);
      
      // Use the local API route, not GMGN.ai directly
      const apiUrl = `/api/gmgn?address=${encodeURIComponent(address)}&timeframe=${timeframe}`;
      console.log(`API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      setGmgnData(data);
      setLastSearched(address);
    } catch (error) {
      console.error('Error fetching GMGN data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setGmgnData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGMGNData(address, timeframe);
  };

  return (
    <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black min-h-screen pt-24">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-8 text-center relative z-10">
        <motion.h1
          className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500 drop-shadow-lg font-mono mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          IMU RANK
        </motion.h1>

        <motion.p
          className="text-xl text-gray-400 mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          Let IMU decide how skilled you are on-chain
        </motion.p>

        {!connected ? (
          // Unconnected state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="relative group w-full max-w-md mx-auto p-6 bg-gray-800/30 backdrop-blur-xl rounded-2xl 
                            border-2 border-gray-700/50 hover:border-red-500/50 transition-all duration-500
                            shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <p className="text-xl font-semibold bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent mb-2">
                  Want to see your rank?
                </p>
                <p className="text-gray-400 text-sm">
                  Connect your wallet to discover your on-chain skill level
                </p>
              </div>
            </div>
            
            <WalletMultiButton className="!bg-gradient-to-r from-red-500 to-pink-500 !rounded-xl !px-6 !py-4 
              !text-white !font-semibold hover:!opacity-90 transition-opacity duration-300" />
          </motion.div>
        ) : (
          // Connected state
          <AnimatePresence mode="wait">
            {!selectedWallet && !showComparison ? (
              // Search state
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Search bar */}
                <div className="w-full max-w-2xl mx-auto relative">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                      <Search 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
                        size={20} 
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder={isPvpMode ? 
                          wallet1 ? "Enter second wallet address..." : "Enter first wallet address..." 
                          : "Enter wallet address..."
                        }
                        className="w-full px-12 py-6 bg-gray-800/30 backdrop-blur-xl rounded-xl text-white placeholder-gray-400 
                                 border-2 border-gray-700/50 focus:border-red-500/50 focus:outline-none
                                 transition-all duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]
                                 focus:shadow-[inset_0_0_20px_rgba(255,0,0,0.1)]"
                      />
                      {loading && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PVP Mode Toggle */}
                <motion.div className="mb-4 flex justify-center relative">
                  <div className="relative group">
                    <button
                      onClick={() => {
                        setIsPvpMode(!isPvpMode);
                        resetPvp();
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        isPvpMode ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <Swords size={20} />
                      <span>PVP Mode {isPvpMode ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : showComparison ? (
              // PVP Comparison state
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-5xl mx-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={resetPvp}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                    <span>Back to Search</span>
                  </button>
                  <h2 className="text-2xl font-bold text-white">Wallet vs Wallet</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 text-center">
                  {/* Wallet 1 Card */}
                  <motion.div
                    className="relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
                    variants={{
                      initial: { y: 0, scale: 1, opacity: 1, boxShadow: '0px 0px 0px rgba(0,0,0,0)' },
                      winner: { y: -5, scale: 1.03, opacity: 1, boxShadow: '0px 0px 25px rgba(255, 215, 0, 0.5)', transition: { duration: 0.4, ease: 'easeOut' }},
                      loser: { y: 0, scale: 0.97, opacity: 0.6, boxShadow: '0px 0px 0px rgba(0,0,0,0)', transition: { duration: 0.4, ease: 'easeOut' }}
                    }}
                    initial={{opacity: 0, x: -50}}
                    animate={winnerRevealed ? (winner?.address === wallet1.address ? 'winner' : 'loser') : 'initial'}
                    whileInView={{opacity: 1, x: 0}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {winnerRevealed && winner?.address === wallet1.address && <WinnerBadge />}
                    <p className="font-mono text-gray-400 text-sm mb-4 truncate">{wallet1.address}</p>
                    <RankDisplay rank={wallet1.stats.rank} />
                    <div className="mt-6 border-t border-gray-700/50 pt-4 h-16 flex justify-center items-center">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                            {wallet1.stats.achievedMedals?.length > 0 ? (
                                wallet1.stats.achievedMedals.slice(0, 5).map((medal, index) => (
                                    <div key={index} className="relative">
                                        {/* the icon – it is the hover target, so it becomes the peer */}
                                        <motion.div
                                          className={`peer w-8 h-8 rounded-full bg-gradient-to-br ${medal.color}
                                                      flex items-center justify-center shadow-md`}
                                          initial={{ opacity: 0, scale: 0.5 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: 0.8 + index * 0.1 }}
                                        >
                                          <medal.icon className="w-4 h-4 text-white" />
                                        </motion.div>

                                        {/* tooltip */}
                                        <div
                                          className="absolute -top-14 left-1/2 -translate-x-1/2 w-36
                                                     opacity-0 peer-hover:opacity-100 transition-opacity duration-300
                                                     pointer-events-none z-50"
                                        >
                                          <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                            <div className="text-xs font-bold text-white">{medal.name}</div>
                                            <div className="text-xs text-gray-400">{medal.desc}</div>
                                          </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500">No Medals Earned</p>
                            )}
                        </div>
                    </div>
                  </motion.div>

                  {/* VS Separator */}
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.5, type: 'spring'}}>
                    <span className="text-6xl font-black text-red-500 drop-shadow-lg">VS</span>
                  </motion.div>

                  {/* Wallet 2 Card */}
                  <motion.div
                    className="relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
                    variants={{
                      initial: { y: 0, scale: 1, opacity: 1, boxShadow: '0px 0px 0px rgba(0,0,0,0)' },
                      winner: { y: -5, scale: 1.03, opacity: 1, boxShadow: '0px 0px 25px rgba(255, 215, 0, 0.5)', transition: { duration: 0.4, ease: 'easeOut' }},
                      loser: { y: 0, scale: 0.97, opacity: 0.6, boxShadow: '0px 0px 0px rgba(0,0,0,0)', transition: { duration: 0.4, ease: 'easeOut' }}
                    }}
                    initial={{opacity: 0, x: 50}}
                    animate={winnerRevealed ? (winner?.address === wallet2.address ? 'winner' : 'loser') : 'initial'}
                    whileInView={{opacity: 1, x: 0}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {winnerRevealed && winner?.address === wallet2.address && <WinnerBadge />}
                    <p className="font-mono text-gray-400 text-sm mb-4 truncate">{wallet2.address}</p>
                    <RankDisplay rank={wallet2.stats.rank} />
                    <div className="mt-6 border-t border-gray-700/50 pt-4 h-16 flex justify-center items-center">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                            {wallet2.stats.achievedMedals?.length > 0 ? (
                                wallet2.stats.achievedMedals.slice(0, 5).map((medal, index) => (
                                    <div key={index} className="relative">
                                        {/* the icon – it is the hover target, so it becomes the peer */}
                                        <motion.div
                                          className={`peer w-8 h-8 rounded-full bg-gradient-to-br ${medal.color}
                                                      flex items-center justify-center shadow-md`}
                                          initial={{ opacity: 0, scale: 0.5 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: 0.8 + index * 0.1 }}
                                        >
                                          <medal.icon className="w-4 h-4 text-white" />
                                        </motion.div>

                                        {/* tooltip */}
                                        <div
                                          className="absolute -top-14 left-1/2 -translate-x-1/2 w-36
                                                     opacity-0 peer-hover:opacity-100 transition-opacity duration-300
                                                     pointer-events-none z-50"
                                        >
                                          <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                            <div className="text-xs font-bold text-white">{medal.name}</div>
                                            <div className="text-xs text-gray-400">{medal.desc}</div>
                                          </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500">No Medals Earned</p>
                            )}
                        </div>
                    </div>
                  </motion.div>
                </div>

                {/* Stats Comparison Table */}
                <div className="mt-12 space-y-3">
                  <h3 className="text-lg font-semibold text-center text-gray-300 mb-4">Head-to-Head Stats</h3>
                  <PvpStatCompare label="PNL" value1={wallet1.stats.pnl} value2={wallet2.stats.pnl} delay={1} statType="pnl" />
                  <PvpStatCompare label="Win Rate" value1={wallet1.stats.winRate} value2={wallet2.stats.winRate} delay={2} statType="winRate" />
                  <PvpStatCompare label="Best Trade" value1={`$${wallet1.stats.bestTrade?.toString().replace('$', '')}`} value2={`$${wallet2.stats.bestTrade?.toString().replace('$', '')}`} delay={3} statType="bestTrade" />
                  <PvpStatCompare label="Avg Hold Time" value1={wallet1.stats.holdTime} value2={wallet2.stats.holdTime} delay={4} statType="holdTime" />
                </div>
              </motion.div>
            ) : (
              // Single Wallet Stats state
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full min-h-screen pt-12 pb-16"
              >
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {selectedWallet.stats.isInactive && <InactiveWalletAlert />}
                  
                  {/* Page Header */}
                  <div className="flex justify-between items-center mb-8">
                    <button
                      onClick={() => setSelectedWallet(null)}
                      className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft size={20} />
                      <span>Back to Search</span>
                    </button>
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-6 py-2
                                 hover:opacity-90 transition-opacity flex items-center space-x-2"
                    >
                      <Share size={18} />
                      <span>Share Stats</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* 1. IMU Rank & Score Card */}
                      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-3xl shadow-2xl flex flex-col items-center py-14 px-8">
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className={`text-8xl font-bold mb-2 bg-gradient-to-r ${
                              selectedWallet.stats.rank === 'S+' ? 'from-purple-500 via-pink-500 to-purple-400' :
                              selectedWallet.stats.rank === 'S' ? 'from-indigo-500 via-purple-500 to-indigo-400' :
                              selectedWallet.stats.rank === 'A+' ? 'from-blue-500 via-cyan-500 to-blue-400' :
                              selectedWallet.stats.rank === 'A' ? 'from-cyan-500 via-teal-500 to-cyan-400' :
                              selectedWallet.stats.rank === 'B+' ? 'from-teal-500 via-green-500 to-teal-400' :
                              selectedWallet.stats.rank === 'B' ? 'from-green-500 via-lime-500 to-green-400' :
                              'from-red-500 via-red-600 to-red-400'
                            } bg-clip-text text-transparent animate-gradient-xy`}
                          >
                            {selectedWallet.stats.rank}
                          </motion.div>
                          <div className="text-gray-400 text-xl tracking-wider mb-6">IMU RANK</div>
                        </div>
                        <div className="w-full flex flex-col items-center">
                          <div className="w-full max-w-md">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-300 font-semibold">IMU Score</span>
                              <span className="text-white font-bold">
                                {getRankScore(selectedWallet.stats)}%
                              </span>
                            </div>
                            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${getRankScore(selectedWallet.stats)}%` }}
                                transition={{ 
                                  duration: 1,
                                  ease: "easeOut",
                                  delay: 0.2
                                }}
                                className="h-4 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Your IMU Score is based on your recent on-chain performance.
                          </div>
                        </div>
                      </div>

                      {/* 4. Enhanced Peer Comparison Card */}
                      <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90 rounded-2xl shadow-2xl p-8 border border-gray-700/30 backdrop-blur-sm group overflow-hidden">
                        {/* Shimmering overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                          <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/8 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        </div>
                        
                        {/* Subtle glow border */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-[-1px] bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-pink-500/20 rounded-2xl blur-sm"></div>
                        </div>

                        <div className="relative">
                          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6 text-center group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-colors duration-300">Trading Performance Distribution</h3>
                          
                          {/* Distribution Graph */}
                          <div className="relative h-64 mb-8">
                            {/* Bell Curve */}
                            <div className="absolute inset-0">
                              <div className="absolute inset-0 flex items-center justify-center">
                                {/* Improved Bell Curve with multiple layers for depth */}
                                <div className="w-full h-48 bg-gradient-radial from-gray-700/40 via-gray-700/20 to-transparent rounded-[100%] transform scale-y-50 group-hover:from-gray-600/50 group-hover:via-gray-600/25 transition-colors duration-300" />
                                <div className="absolute w-full h-40 bg-gradient-radial from-gray-600/30 via-gray-600/10 to-transparent rounded-[100%] transform scale-y-50 group-hover:from-gray-500/40 group-hover:via-gray-500/15 transition-colors duration-300" />
                                <div className="absolute w-full h-32 bg-gradient-radial from-gray-500/20 via-gray-500/5 to-transparent rounded-[100%] transform scale-y-50 group-hover:from-gray-400/30 group-hover:via-gray-400/10 transition-colors duration-300" />
                              </div>

                              {/* Distribution Lines with Glow */}
                              <div className="absolute bottom-0 w-full flex justify-between px-8">
                                {[0, 1, 2, 3, 4].map((_, index) => (
                                  <div key={index} 
                                       className={`h-${index === 2 ? '48' : index === 1 || index === 3 ? '40' : '32'} 
                                                 w-px bg-gradient-to-t ${
                                                   index === 2 ? 'from-blue-500/50 group-hover:from-blue-400/70' : 
                                                   index === 1 || index === 3 ? 'from-blue-400/30 group-hover:from-blue-300/50' : 
                                                   'from-blue-300/20 group-hover:from-blue-200/40'
                                                 } to-transparent 
                                                 shadow-glow transition-colors duration-300`} 
                                  />
                                ))}
                              </div>

                              {/* Position Indicator */}
                              {(() => {
                                const getRankPosition = (rank) => {
                                  const positions = {
                                    'S+': { left: '99%', color: 'rgb(168, 85, 247)', label: 'Elite (Top 1%)' },
                                    'S': { left: '95%', color: 'rgb(99, 102, 241)', label: 'Master (Top 5%)' },
                                    'A+': { left: '90%', color: 'rgb(59, 130, 246)', label: 'Expert (Top 10%)' },
                                    'A': { left: '80%', color: 'rgb(34, 211, 238)', label: 'Professional (Top 20%)' },
                                    'B+': { left: '65%', color: 'rgb(20, 184, 166)', label: 'Advanced (Top 35%)' },
                                    'B': { left: '50%', color: 'rgb(34, 197, 94)', label: 'Intermediate (Top 50%)' },
                                    'C+': { left: '35%', color: 'rgb(234, 179, 8)', label: 'Developing (Bottom 35%)' },
                                    'C': { left: '20%', color: 'rgb(249, 115, 22)', label: 'Beginner (Bottom 20%)' },
                                    'D': { left: '10%', color: 'rgb(239, 68, 68)', label: 'Novice (Bottom 10%)' }
                                  };
                                  return positions[rank] || { left: '10%', color: 'rgb(107, 114, 128)', label: 'Unranked' };
                                };

                                const { left, color, label } = getRankPosition(selectedWallet.stats.rank);
                                
                                return (
                                  <motion.div 
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    style={{ 
                                      position: 'absolute',
                                      left,
                                      bottom: '50%',
                                      transform: 'translate(-50%, 50%)',
                                      zIndex: 10,
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      backgroundColor: color,
                                      boxShadow: `0 0 20px ${color}40`
                                    }}
                                    className="group-hover:scale-110 transition-transform duration-300"
                                  >
                                    {/* Glowing Ring */}
                                    <div 
                                      style={{
                                        position: 'absolute',
                                        inset: -4,
                                        borderRadius: '50%',
                                        background: color,
                                        opacity: 0.3,
                                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                      }}
                                      className="group-hover:opacity-50 transition-opacity duration-300"
                                    />
                                    
                                    {/* Position Label */}
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-max">
                                      <div style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        backgroundColor: `${color}E6`,
                                        backdropFilter: 'blur(4px)',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        boxShadow: `0 4px 12px ${color}40`
                                      }}
                                      className="group-hover:shadow-lg transition-shadow duration-300">
                                        {label}
                                      </div>
                                      {/* Connecting Line */}
                                      <div style={{
                                        height: '24px',
                                        width: '1px',
                                        margin: '0 auto',
                                        background: `linear-gradient(to bottom, ${color}, transparent)`
                                      }} />
                                    </div>
                                  </motion.div>
                                );
                              })()}
                            </div>

                            {/* Distribution Labels */}
                            <div className="absolute bottom-0 w-full flex justify-between px-4 text-sm">
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">10%</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">25%</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">Median</span>
                                <span className="text-gray-500 group-hover:text-gray-400 transition-colors duration-300">50%</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">75%</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors duration-300">90%</span>
                              </div>
                            </div>
                          </div>

                          {/* Performance Summary */}
                          <div className="text-center space-y-3">
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-colors duration-300">
                              {selectedWallet.stats.rank === 'S+' ? 'Elite' :
                               selectedWallet.stats.rank === 'S' ? 'Master' :
                               selectedWallet.stats.rank === 'A+' ? 'Expert' :
                               selectedWallet.stats.rank === 'A' ? 'Professional' :
                               selectedWallet.stats.rank === 'B+' ? 'Advanced' :
                               selectedWallet.stats.rank === 'B' ? 'Competent' :
                               selectedWallet.stats.rank === 'C+' ? 'Developing' :
                               selectedWallet.stats.rank === 'C' ? 'Beginner' :
                               'Novice'} Trader
                            </div>
                            <div className="text-gray-400 text-sm max-w-md mx-auto group-hover:text-gray-300 transition-colors duration-300">
                              Your trading performance places you among the 
                              <span className="font-semibold text-white group-hover:text-gray-100 transition-colors duration-300"> {
                                selectedWallet.stats.rank === 'S+' ? 'top 1%' :
                                selectedWallet.stats.rank === 'S' ? 'top 5%' :
                                selectedWallet.stats.rank === 'A+' ? 'top 10%' :
                                selectedWallet.stats.rank === 'A' ? 'top 20%' :
                                selectedWallet.stats.rank === 'B+' ? 'top 35%' :
                                selectedWallet.stats.rank === 'B' ? 'top 50%' :
                                selectedWallet.stats.rank === 'C+' ? 'bottom 35%' :
                                selectedWallet.stats.rank === 'C' ? 'bottom 20%' :
                                'bottom 10%'
                              } </span> 
                              of active Solana traders
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-8">
                      {/* 2. Trading Overview Card */}
                      <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 relative overflow-hidden">
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/50 pointer-events-none"></div>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                          <div className="w-full flex justify-between items-center mb-8">
                            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">Trading Overview</h3>
                          </div>

                          <div className="grid grid-cols-1 gap-8">
                            {/* Balance Section */}
                            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                              <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-400">
                                  {formatBalance(selectedWallet.stats.balance).split('(')[0]}
                                </span>
                                <span className="text-gray-400 mt-2">Balance</span>
                                <span className="text-sm text-gray-500">
                                  ({formatBalance(selectedWallet.stats.balance).split('(')[1].replace(')', '')})
                                </span>
                              </div>
                            </div>

                            {/* PNL Section */}
                            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                              <div className="flex flex-col items-center">
                                <span className={`text-4xl font-bold ${
                                  selectedWallet.stats.pnl?.startsWith('-') || parseFloat(selectedWallet.stats.pnl?.replace(/[$,]/g, '')) < 0 
                                    ? 'bg-clip-text text-transparent bg-gradient-to-br from-red-400 to-red-500' 
                                    : 'bg-clip-text text-transparent bg-gradient-to-br from-green-400 to-green-500'
                                }`}>
                                  {formatPNL(selectedWallet.stats.pnl)}
                                </span>
                                <span className="text-gray-400 mt-2">Total PNL</span>
                              </div>
                            </div>

                            {/* Tokens Traded Section */}
                            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                              <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-400">
                                  {selectedWallet.stats.tokensTraded || '0'}
                                </span>
                                <span className="text-gray-400 mt-2">Tokens Traded</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Enhanced Trading Efficiency Card */}
                      <div className="bg-gray-800/80 rounded-2xl shadow-lg p-8">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-lg font-semibold text-gray-300">Trading Efficiency</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                          {/* Hold Time */}
                          <div className="bg-gray-900/50 rounded-xl p-6 hover:bg-gray-900/70 transition-colors">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Clock className="w-5 h-5 text-green-400" />
                              </div>
                              <span className="text-gray-400">Average Hold</span>
                            </div>
                            <div className="text-4xl font-bold text-green-400 mb-1">
                              {selectedWallet.stats.holdTime}
                            </div>
                            <div className="text-sm text-gray-500">Time per trade</div>
                          </div>

                          {/* Best Trade */}
                          <div className="bg-gray-900/50 rounded-xl p-6 hover:bg-gray-900/70 transition-colors">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                              </div>
                              <span className="text-gray-400">Best Trade</span>
                            </div>
                            <div className="text-4xl font-bold text-blue-400 mb-1">
                              ${selectedWallet.stats.bestTrade?.toString().replace('$', '')}
                            </div>
                            <div className="text-sm text-gray-500">Highest profit</div>
                          </div>

                          {/* Win Rate */}
                          <div className="bg-gray-900/50 rounded-xl p-6 hover:bg-gray-900/70 transition-colors">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Target className="w-5 h-5 text-yellow-400" />
                              </div>
                              <span className="text-gray-400">Win Rate</span>
                            </div>
                            <div className="text-4xl font-bold text-yellow-400 mb-1">
                              {selectedWallet.stats.winRate}
                            </div>
                            <div className="text-sm text-gray-500">Success rate</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 5. Trading Style Analysis */}
                      <div className="bg-gray-800/80 rounded-2xl shadow-lg p-8">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-semibold text-gray-300">Achievement Medals</h3>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                          {/* PNL Medals */}
                          {(() => {
                            const pnlValue = parseFloat(selectedWallet.stats.pnl?.replace(/[^0-9.-]/g, '') || '0');
                            const pnlMedals = [
                              {
                                threshold: 1000000,
                                icon: Diamond,
                                name: 'Diamond Trader',
                                desc: '$1M+ Profit',
                                color: 'from-purple-600 to-pink-400'
                              },
                              {
                                threshold: 500000,
                                icon: Crown,
                                name: 'Platinum Trader',
                                desc: '$500K+ Profit',
                                color: 'from-indigo-400 to-purple-500'
                              },
                              {
                                threshold: 100000,
                                icon: Trophy,
                                name: 'Gold Trader',
                                desc: '$100K+ Profit',
                                color: 'from-yellow-400 to-amber-500'
                              },
                              {
                                threshold: 50000,
                                icon: Medal,
                                name: 'Silver Trader',
                                desc: '$50K+ Profit',
                                color: 'from-gray-300 to-gray-400'
                              }
                            ].map(medal => ({
                              ...medal,
                              achieved: pnlValue >= medal.threshold
                            }));

                            return pnlMedals.map((medal, index) => (
                              <div key={`pnl-${index}`} className="relative group flex justify-center">
                                <div className={`
                                  w-16 h-16 rounded-full
                                  bg-gradient-to-br ${medal.achieved ? medal.color : 'from-gray-700 to-gray-800'}
                                  flex items-center justify-center
                                  transform transition-all duration-300
                                  ${medal.achieved ? 'shadow-lg hover:scale-110' : 'opacity-40 grayscale'}
                                `}>
                                  <medal.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 opacity-0 
                                              group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                  <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                    <div className="text-xs font-bold text-white">{medal.name}</div>
                                    <div className="text-xs text-gray-400">{medal.desc}</div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}

                          {/* Volume Medals */}
                          {(() => {
                            const tokenCount = selectedWallet.stats.tokensTraded;
                            const volumeMedals = [
                              {
                                threshold: 2000,
                                icon: Rocket,
                                name: 'Trading Machine',
                                desc: '2000+ Trades',
                                color: 'from-red-500 to-orange-400'
                              },
                              {
                                threshold: 1000,
                                icon: LineChart,
                                name: 'Sharp Trader',
                                desc: '1000+ Trades',
                                color: 'from-green-400 to-emerald-500'
                              },
                              {
                                threshold: 500,
                                icon: TrendingUp,
                                name: 'Active Trader',
                                desc: '500+ Trades',
                                color: 'from-blue-400 to-cyan-500'
                              }
                            ].map(medal => ({
                              ...medal,
                              achieved: tokenCount >= medal.threshold
                            }));

                            return volumeMedals.map((medal, index) => (
                              <div key={`volume-${index}`} className="relative group flex justify-center">
                                <div className={`
                                  w-16 h-16 rounded-full
                                  bg-gradient-to-br ${medal.achieved ? medal.color : 'from-gray-700 to-gray-800'}
                                  flex items-center justify-center
                                  transform transition-all duration-300
                                  ${medal.achieved ? 'shadow-lg hover:scale-110' : 'opacity-40 grayscale'}
                                `}>
                                  <medal.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 opacity-0 
                                              group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                  <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                    <div className="text-xs font-bold text-white">{medal.name}</div>
                                    <div className="text-xs text-gray-400">{medal.desc}</div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}

                          {/* Best Trade Medals */}
                          {(() => {
                            const bestTradeValue = parseFloat(selectedWallet.stats.bestTrade?.replace(/[^0-9.-]/g, '') || '0');
                            const tradeMedals = [
                              {
                                threshold: 50000,
                                icon: Target,
                                name: 'Legendary Trade',
                                desc: '$50K+ Trade',
                                color: 'from-purple-500 to-pink-500'
                              },
                              {
                                threshold: 25000,
                                icon: Flame,
                                name: 'Master Trade',
                                desc: '$25K+ Trade',
                                color: 'from-blue-500 to-indigo-500'
                              },
                              {
                                threshold: 10000,
                                icon: Award,
                                name: 'Expert Trade',
                                desc: '$10K+ Trade',
                                color: 'from-cyan-400 to-blue-500'
                              }
                            ].map(medal => ({
                              ...medal,
                              achieved: bestTradeValue >= medal.threshold
                            }));

                            return tradeMedals.map((medal, index) => (
                              <div key={`trade-${index}`} className="relative group flex justify-center">
                                <div className={`
                                  w-16 h-16 rounded-full mx-auto
                                  bg-gradient-to-br ${medal.achieved ? medal.color : 'from-gray-700 to-gray-800'}
                                  flex items-center justify-center
                                  transform transition-all duration-300
                                  ${medal.achieved ? 'shadow-lg hover:scale-110 animate-pulse' : 'opacity-40 grayscale'}
                                `}>
                                  <medal.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 opacity-0 
                                              group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                  <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                    <div className="text-xs font-bold text-white">{medal.name}</div>
                                    <div className="text-xs text-gray-400">{medal.desc}</div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}

                          {/* Special Achievement Medals */}
                          {(() => {
                            const winRate = parseFloat(selectedWallet.stats.winRate?.replace('%', ''));
                            const holdTime = parseInt(selectedWallet.stats.holdTime);
                            
                            const specialMedals = [
                              {
                                threshold: 65,
                                icon: Trophy,
                                name: 'Consistency King',
                                desc: '65%+ Win Rate',
                                color: 'from-emerald-400 to-teal-500',
                                achieved: winRate >= 65
                              },
                              {
                                threshold: 10,
                                icon: Timer,
                                name: 'Speed Demon',
                                desc: 'Sub 10s Trades',
                                color: 'from-amber-400 to-orange-500',
                                achieved: holdTime <= 10
                              }
                            ];

                            return specialMedals.map((medal, index) => (
                              <div key={`special-${index}`} className="relative group flex justify-center">
                                <div className={`
                                  w-16 h-16 rounded-full
                                  bg-gradient-to-br ${medal.achieved ? medal.color : 'from-gray-700 to-gray-800'}
                                  flex items-center justify-center
                                  transform transition-all duration-300
                                  ${medal.achieved ? 'shadow-lg hover:scale-110 animate-pulse' : 'opacity-40 grayscale'}
                                `}>
                                  <medal.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 opacity-0 
                                              group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                  <div className="bg-gray-900 rounded-lg p-2 text-center shadow-xl">
                                    <div className="text-xs font-bold text-white">{medal.name}</div>
                                    <div className="text-xs text-gray-400">{medal.desc}</div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Share Stats Modal */}
      {shareModalOpen && selectedWallet?.stats && (
        <ShareStatsModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          stats={{
            address: selectedWallet.address,
            rank: selectedWallet.stats.rank,
            pnl: selectedWallet.stats.pnl,
            winRate: selectedWallet.stats.winRate,
            tokensTraded: selectedWallet.stats.tokensTraded,
            bestTrade: selectedWallet.stats.bestTrade,
            holdTime: selectedWallet.stats.holdTime,
            achievedMedals: (() => {
              const medals = [];
              const pnlValue = parseFloat(selectedWallet?.stats?.pnl?.replace?.(/[^0-9.-]/g, '') || '0');
              const winRate = parseFloat(selectedWallet?.stats?.winRate?.replace?.('%', '') || '0');
              const tokenCount = parseInt(selectedWallet?.stats?.tokensTraded || '0');
              const bestTradeValue = parseFloat(selectedWallet?.stats?.bestTrade?.replace?.(/[^0-9.-]/g, '') || '0');
              const holdTime = parseInt(selectedWallet?.stats?.holdTime || '0');

              // rest of the medals logic...
              if (pnlValue >= 1000000) medals.push({ icon: Diamond, color: 'from-purple-600 to-pink-400' });
              // etc...

              return medals;
            })()
          }}
        />
      )}
    </section>
  );
}

const StatsComparison = ({ label, value1, value2 }) => (
  <div className="flex justify-between items-center bg-gray-700/50 rounded-lg p-4">
    <div className="text-left flex-1">{value1}</div>
    <div className="text-gray-400 px-4">{label}</div>
    <div className="text-right flex-1">{value2}</div>
  </div>
);

const StatBox = ({ label, value, isProfit, className = "" }) => {
  const isPositive = isProfit && value && value.includes('+');
  const isNegative = isProfit && value && value.includes('-');
  
  return (
    <motion.div 
      className={`bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 ${className}`}
      whileHover={{ y: -2 }}
    >
      <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${
        isPositive ? "text-green-400" : 
        isNegative ? "text-red-400" : 
        "text-white"
      }`}>
        {value}
      </div>
    </motion.div>
  );
};

const ComparisonStat = ({ label, value1, value2, isPnl = false, delay = 0 }) => (
  <motion.div
    className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="grid grid-cols-3 items-center">
      <div className={`text-left ${isPnl ? "text-green-400" : "text-white"} font-bold`}>
        {value1}
      </div>
      <div className="text-gray-400 text-sm font-medium">
        {label}
      </div>
      <div className={`text-right ${isPnl ? "text-green-400" : "text-white"} font-bold`}>
        {value2}
      </div>
    </div>
  </motion.div>
);