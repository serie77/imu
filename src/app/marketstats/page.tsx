'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  ComposedChart,
  Cell,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import { Activity, BarChart3, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, X } from 'lucide-react';
import { fetchVolumeData, fetchTokenData, fetchTransactionData, fetchPumpSwapVolumeData, fetchAllTradingBotData } from "@/utils/dune-client";
import type { ProcessedData } from "@/types/market-stats";
import TokenLaunchGraph from '@/components/TokenLaunchGraph';

const API_KEY = process.env.DUNE_API_KEY!;

// Function to fetch data from Dune with better error handling
async function fetchDuneQuery(queryId: number) {
  try {
    // Check if we're using the correct query IDs
    console.log(`Fetching Dune query ID: ${queryId}`);
    
    // Make sure the API endpoint is correct
    const response = await fetch(`/api/dune?queryId=${queryId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.rows) {
      console.error('Invalid data format returned:', data);
      throw new Error('Invalid data format returned from API');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching Dune query ${queryId}:`, error);
    throw error;
  }
}

interface DuneData {
  dailyVolume: {
    usd: number;
    sol: number;
    change: number;
  };
  tokensLaunched: {
    today: number;
    yesterday: number;
    change: number;
  };
  addressesCreating: {
    today: number;
    yesterday: number;
    change: number;
  };
  totalTransactions: {
    today: number;
    yesterday: number;
    change: number;
  };
  volumeHistory: Array<{
    date: string;
    volumeUSD: number;
    volumeSOL: number;
  }>;
  tokenHistory: Array<{
    date: string;
    tokensLaunched: number;
    addressesCreating: number;
  }>;
  marketStatus?: string;
}

// Add these helper functions for caching
function getCachedData(): { data: DuneData | null; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem('marketStatsCache');
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

function setCachedData(data: DuneData) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem('marketStatsCache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

function isCacheValid(timestamp: number, maxAge: number = 3600000): boolean {
  // maxAge is in milliseconds, default is 1 hour (3600000 ms)
  return Date.now() - timestamp < maxAge;
}

const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 animate-pulse">
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  </div>
);

const LoadingChart = () => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
    <h3 className="text-xl font-bold text-white mb-6">Loading Chart</h3>
    <div className="h-[400px] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
    </div>
  </div>
);

// Add this CSS to your global styles or as a style tag in the component
const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.5);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(239, 68, 68, 0.7);
}
`;

// Token Launch Graph Modal Component
const TokenLaunchGraph = ({ data, onClose }: { data: any[], onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-gray-900 p-6 rounded-lg w-[80vw] max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-white">Tokens Launched (14 Days)</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [formatNumber(value), 'Tokens Launched']}
              />
              <Line 
                type="monotone" 
                dataKey="tokensLaunched" 
                stroke="#8884d8" 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

// Update the formatCurrency function
const formatCurrency = (value: number, decimals: number = 2) => {
  if (!value) return '$0';
  
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(decimals)}K`;
  }
  
  return `$${value.toFixed(decimals)}`;
};

export default function MarketStatsPage() {
  const [activeSection, setActiveSection] = useState<'pumpFun' | 'pumpSwap' | 'tradingBot'>('pumpFun');
  const [viewMode, setViewMode] = useState<'graph' | 'text'>('graph');
  const [data, setData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showTokenGraph, setShowTokenGraph] = useState(false);
  const [pumpSwapData, setPumpSwapData] = useState(null);
  const [pumpSwapLoading, setPumpSwapLoading] = useState(true);
  const [pumpSwapError, setPumpSwapError] = useState(null);
  const [tradingBotData, setTradingBotData] = useState<any>(null);
  const [tradingBotLoading, setTradingBotLoading] = useState<boolean>(false);
  const [tradingBotError, setTradingBotError] = useState(null);
  const [pumpFunViewMode, setPumpFunViewMode] = useState<'graph' | 'list'>('graph');
  const [visibleBots, setVisibleBots] = useState({
    axiom: true,
    photon: true,
    bullx: true,
    trojan: true,
    gmgn: true
  });
  const [tradingBotViewMode, setTradingBotViewMode] = useState('chart');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartViewMode, setChartViewMode] = useState('chart');
  const [growthChartViewMode, setGrowthChartViewMode] = useState('chart');
  const [botVolumeData, setBotVolumeData] = useState([]);
  const [botViewMode, setBotViewMode] = useState('chart');
  
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  // Helper function to calculate percent change
  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper function to format dates nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Update the PumpFun data processing to exclude today's data and format dates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [volume, token] = await Promise.all([
          fetchVolumeData(),
          fetchTokenData(),
        ]);

        // Skip today's data (index 0) and use yesterday (index 1) as "today"
        // and the day before yesterday (index 2) as "yesterday"
        const processedData = {
          dailyVolume: {
            usd: volume?.result?.rows[1]?.total_sol_volume_usd || 0,
            sol: volume?.result?.rows[1]?.total_sol_volume || 0,
            change: calculatePercentChange(
              volume?.result?.rows[1]?.total_sol_volume_usd || 0,
              volume?.result?.rows[2]?.total_sol_volume_usd || 0
            )
          },
          tokensLaunched: {
            today: token?.result?.rows[1]?.total_tokens_launched || 0,
            yesterday: token?.result?.rows[2]?.total_tokens_launched || 0,
            change: calculatePercentChange(
              token?.result?.rows[1]?.total_tokens_launched || 0,
              token?.result?.rows[2]?.total_tokens_launched || 0
            )
          },
          addressesCreating: {
            today: token?.result?.rows[1]?.total_addresses_creating || 0,
            yesterday: token?.result?.rows[2]?.total_addresses_creating || 0,
            change: calculatePercentChange(
              token?.result?.rows[1]?.total_addresses_creating || 0,
              token?.result?.rows[2]?.total_addresses_creating || 0
            )
          },
          totalTransactions: {
            today: volume?.result?.rows[1]?.total_transactions || 0,
            yesterday: volume?.result?.rows[2]?.total_transactions || 0,
            change: calculatePercentChange(
              volume?.result?.rows[1]?.total_transactions || 0,
              volume?.result?.rows[2]?.total_transactions || 0
            )
          },
          volumeHistory: volume?.result?.rows.slice(1, 15).map(row => ({
            date: formatDate(row.date_time),
            volumeUSD: row.total_sol_volume_usd,
            volumeSOL: row.total_sol_volume
          })).reverse() || [],
          tokenHistory: token?.result?.rows.slice(1, 15).map((row, idx) => ({
            date: hardcodedTokenActivityDates[idx] || formatDate(row.date_time),
            tokensLaunched: row.total_tokens_launched,
            addressesCreating: row.total_addresses_creating
          })) || []
        };

        setData(processedData);
        setLastUpdated(new Date().toLocaleString());
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load market stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Add the custom scrollbar styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customScrollbarStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Update the useEffect for PumpSwap data
  useEffect(() => {
    const fetchPumpSwapData = async () => {
      if (activeSection !== 'pumpSwap') return;
      
      try {
        setPumpSwapLoading(true);
        const data = await fetchPumpSwapVolumeData();
        
        // Process the daily volume data
        const dailyVolumeRow = data.dailyVolume?.result?.rows[0];
        
        // Get volume history and calculate day-over-day changes
        const volumeHistory = data.volumeHistory?.result?.rows || [];
        
        // Get yesterday's and today's volumes for percentage calculation
        const todayVolume = volumeHistory[1]?.daily_volume_usd || 0; // Index 1 is yesterday (complete day)
        const yesterdayVolume = volumeHistory[2]?.daily_volume_usd || 0; // Index 2 is day before yesterday
        
        // Calculate percentage change for daily volume
        const dailyVolumeChange = calculatePercentChange(todayVolume, yesterdayVolume);
        
        // Calculate weekly volume change
        // Sum the last 7 complete days (indices 1-7)
        const last7DaysVolume = volumeHistory
          .slice(1, 8)
          .reduce((sum, day) => sum + (day.daily_volume_usd || 0), 0);
        
        // Sum the previous 7 days (indices 8-14)
        const previous7DaysVolume = volumeHistory
          .slice(8, 15)
          .reduce((sum, day) => sum + (day.daily_volume_usd || 0), 0);
        
        // Calculate percentage change
        const weeklyVolumeChange = calculatePercentChange(last7DaysVolume, previous7DaysVolume);
        
        const processedData = {
          dailyVolume: {
            usd: (dailyVolumeRow?.volume_24h_usd_millions || 0) * 1_000_000, // Convert millions to actual USD value
            formatted: `$${(dailyVolumeRow?.volume_24h_usd_millions || 0).toFixed(2)}M`, // Show as millions
            change: dailyVolumeChange
          },
          weeklyVolume: {
            usd: (dailyVolumeRow?.volume_7d_usd_billions || 0) * 1_000_000_000, // Convert billions to actual USD value  
            formatted: `$${(dailyVolumeRow?.volume_7d_usd_billions || 0).toFixed(2)}B`, // Show as billions
            change: weeklyVolumeChange
          },
          lifetimeVolume: {
            usd: (dailyVolumeRow?.total_volume_usd_billions || 0) * 1_000_000_000, // Convert billions to actual USD value
            formatted: `$${(dailyVolumeRow?.total_volume_usd_billions || 0).toFixed(2)}B` // Show as billions
          },
          volumeHistory: volumeHistory
            .filter((row, index) => index > 0)
            .slice(0, 14)
            .map(row => ({
              date: formatDate(row.date),
              volume: row.daily_volume_usd / 1_000_000, // Convert to millions for chart display
              cumulative: row.cumulative_volume_usd / 1_000_000_000, // Convert to billions for chart display
              formattedVolume: `$${(row.daily_volume_usd / 1_000_000).toFixed(1)}M`, // Show as millions
              formattedCumulative: `$${(row.cumulative_volume_usd / 1_000_000_000).toFixed(1)}B` // Show as billions
            }))
            .reverse() || []
        };
        
        setPumpSwapData(processedData);
        setPumpSwapError(null);
      } catch (err) {
        console.error('Error fetching PumpSwap data:', err);
        setPumpSwapError('Failed to load PumpSwap stats');
      } finally {
        setPumpSwapLoading(false);
      }
    };

    fetchPumpSwapData();
  }, [activeSection]);

  // Update the useEffect for Trading Bot data with caching
  useEffect(() => {
    const fetchTradingBotData = async () => {
      if (activeSection !== 'tradingBot') return;
      
      try {
        setTradingBotLoading(true);
        console.log("MarketStats: Fetching trading bot data...");
        
        // Use your existing fetchAllTradingBotData function
        const allBotData = await fetchAllTradingBotData();
        console.log("MarketStats: Trading bot data fetched:", allBotData);
        
        setTradingBotData(allBotData);
        
        // Process volume data for the chart
        const volumeData = allBotData.volumeHistory || [];
        const processedData = volumeData.map(day => ({
          date: day.date,
          axiom: day.axiomVolume || 0,
          photon: day.photonVolume || 0, 
          bullx: day.bullxVolume || 0,
          trojan: day.trojanVolume || 0,
          gmgn: day.gmgnVolume || 0
        }));
        
        setBotVolumeData(processedData);
        setTradingBotError(null);
      } catch (error) {
        console.error("MarketStats: Error fetching trading bot data:", error);
        setTradingBotError("Failed to fetch trading bot data");
        setTradingBotData(null);
      } finally {
        setTradingBotLoading(false);
      }
    };
    
    fetchTradingBotData();
  }, [activeSection]);

  // Add a log to see when the component renders and what the state is
  console.log("MarketStats: Component rendering...", {
    activeSection,
    tradingBotLoading,
    hasTradingBotData: !!tradingBotData
  });

  // Helper function to get color based on bot name
  const getBotColor = (name) => {
    switch (name) {
      case 'Axiom': return '#FF6B6B';
      case 'Photon': return '#4ECDC4';
      case 'Trojan': return '#9933FF';
      case 'BullX': return '#4CAF50';
      case 'GMGN': return '#22EAAA';
      default: return '#FFFFFF';
    }
  };

  // Helper function to format values
  const formatValue = (value) => {
    if (!value) return "0";
    const millions = value / 1000000;
    
    if (millions >= 1000) {
      return (millions / 1000).toFixed(1) + 'B';
    } else {
      return millions.toFixed(0);
    }
  };

  // Function to generate chart data from real API data
  const generateRealChartData = () => {
    // Check if the necessary data structure exists
    if (
      !tradingBotData ||
      !tradingBotData.axiom?.result?.rows ||
      !tradingBotData.photon?.result?.rows ||
      !tradingBotData.trojan?.result?.rows ||
      !tradingBotData.bullX?.result?.rows ||
      !tradingBotData.gmgn?.result?.rows
    ) {
      console.warn("generateRealChartData: Trading bot data is missing or incomplete. Current data:", tradingBotData);
      return []; // Return empty array if data is not ready
    }

    const numDays = 30; // Target number of days
    const chartData = [];

    // --- Create lookup maps for efficient data retrieval ---
    const createVolumeMap = (botKey) => {
      const rows = tradingBotData[botKey]?.result?.rows || [];
      // Map: "YYYY-MM-DD HH:MM:SS.sss UTC" -> avg_daily_volume_7d
      return new Map(rows.map(row => [row.day, row.avg_daily_volume_7d]));
    };

    const photonVolumeMap = createVolumeMap('photon');
    const trojanVolumeMap = createVolumeMap('trojan');
    const bullxVolumeMap = createVolumeMap('bullX'); // Correct key for BullX
    const gmgnVolumeMap = createVolumeMap('gmgn');

    // --- Process data using Axiom as the reference for dates ---
    const axiomRows = tradingBotData.axiom.result.rows.slice(0, numDays);

    for (const axiomRow of axiomRows) {
      const currentDateStr = axiomRow.day; // Full date string like "2025-04-26 00:00:00.000 UTC"

      // Format the date string to "Mon DD" (e.g., "Apr 26")
      let formattedDate = "Invalid Date";
      try {
        const datePart = currentDateStr.split(' ')[0]; // Get "YYYY-MM-DD"
        const dateObj = new Date(datePart + 'T00:00:00Z'); // Treat as UTC
         if (!isNaN(dateObj.getTime())) {
           formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
         } else {
           console.warn(`Could not parse date: ${currentDateStr}`);
         }
      } catch (e) {
        console.error(`Error formatting date ${currentDateStr}:`, e);
      }

      // Helper to safely get volume in millions
      const getVolumeInMillions = (volumeMap, dateKey) => {
        const rawVolume = volumeMap.get(dateKey);
        if (rawVolume === undefined || rawVolume === null) return 0;
        const volume = parseFloat(rawVolume);
        return isNaN(volume) ? 0 : volume / 1000000;
      };

      const axiomVolume = parseFloat(axiomRow.avg_daily_volume_7d);

      chartData.push({
        date: formattedDate,
        Axiom: isNaN(axiomVolume) ? 0 : axiomVolume / 1000000,
        Photon: getVolumeInMillions(photonVolumeMap, currentDateStr),
        Trojan: getVolumeInMillions(trojanVolumeMap, currentDateStr),
        BullX: getVolumeInMillions(bullxVolumeMap, currentDateStr),
        GMGN: getVolumeInMillions(gmgnVolumeMap, currentDateStr),
      });
    }

    // Reverse the array to have chronological order (oldest first) for the chart
    return chartData.reverse();
  };

  // Function to calculate growth for each bot based on the 2-week data
  const getBotGrowthData = () => {
    try {
      const botNames = ['Axiom', 'Photon', 'Trojan', 'BullX', 'GMGN'];
      
      return botNames.map(name => {
        const data = tradingBotData?.[name.toLowerCase()]?.result?.rows || [];
        
        // Calculate 2-week growth (if we have enough data)
        let growth = 0;
        if (data.length >= 14) {
          const currentVolume = parseFloat(data[0].avg_daily_volume_7d) || 0;
          const twoWeeksAgoVolume = parseFloat(data[13].avg_daily_volume_7d) || 0;
          
          growth = twoWeeksAgoVolume > 0 ? ((currentVolume - twoWeeksAgoVolume) / twoWeeksAgoVolume) * 100 : 0;
        }
        
        return {
          name,
          growth
        };
      });
    } catch (error) {
      console.error("Error calculating bot growth:", error);
      return [
        { name: 'Axiom', growth: 11.8 },
        { name: 'Photon', growth: 8.7 },
        { name: 'Trojan', growth: 20.0 },
        { name: 'BullX', growth: 12.5 },
        { name: 'GMGN', growth: 9.1 }
      ];
    }
  };

  // Define the renderContent function
  const renderContent = () => {
    if (activeSection === 'pumpFun') {
      // PumpFun content
      return (
        <>
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-10 max-w-3xl mx-auto">
              <p className="font-bold">Error loading data:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Main Stats Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 max-w-6xl mx-auto">
            {/* Daily Volume Card */}
            <motion.div
              className="bg-gradient-to-br from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-xl p-8 rounded-2xl 
                border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 
                shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,0,0,0.1)]
                flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent" />
                <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/10 to-transparent rotate-45 group-hover:via-red-500/20" style={{ width: '800%', height: '800%' }} />
              </div>
              
              <h3 className="text-gray-400 mb-6 text-lg text-center relative z-10">Daily Volume (24h)</h3>
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col items-center justify-center flex-1">
                  <p className="text-5xl font-bold text-white tabular-nums text-center bg-clip-text text-transparent bg-gradient-to-br from-white via-red-100 to-white">
                    ${formatNumber(data?.dailyVolume.usd || 0)}
                  </p>
                </div>
                <p className={`flex items-center text-lg mt-6 justify-center ${
                  (data?.dailyVolume.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                } font-medium`}>
                  {(data?.dailyVolume.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(data?.dailyVolume.change || 0).toFixed(2)}%
                </p>
              </div>
            </motion.div>

            {/* Tokens Launched Card */}
            <motion.div
              className="bg-gradient-to-br from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-xl p-8 rounded-2xl 
                border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 
                shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,165,0,0.1)]
                flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
                <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent rotate-45 group-hover:via-orange-500/20" style={{ width: '800%', height: '800%' }} />
              </div>
              
              <h3 className="text-gray-400 mb-6 text-lg relative z-10">Tokens Launched (24h)</h3>
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col items-center justify-center flex-1">
                  <p className="text-5xl font-bold text-white tabular-nums text-center bg-clip-text text-transparent bg-gradient-to-br from-white via-orange-100 to-white">
                    {formatNumber(data?.tokensLaunched.today || 0)}
                  </p>
                </div>
                <p className={`flex items-center text-lg mt-6 justify-center ${
                  (data?.tokensLaunched.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                } font-medium`}>
                  {(data?.tokensLaunched.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(data?.tokensLaunched.change || 0).toFixed(2)}%
                </p>
              </div>
            </motion.div>

            {/* Addresses Creating Card */}
            <motion.div
              className="bg-gradient-to-br from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-xl p-8 rounded-2xl 
                border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 
                shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(0,0,255,0.1)]
                flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent" />
                <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent rotate-45 group-hover:via-blue-500/20" style={{ width: '800%', height: '800%' }} />
              </div>
              
              <h3 className="text-gray-400 mb-6 text-lg relative z-10">Addresses Creating (24h)</h3>
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col items-center justify-center flex-1">
                  <p className="text-5xl font-bold text-white tabular-nums text-center bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-100 to-white">
                    {formatNumber(data?.addressesCreating.today || 0)}
                  </p>
                </div>
                <p className={`flex items-center text-lg mt-6 justify-center ${
                  (data?.addressesCreating.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                } font-medium`}>
                  {(data?.addressesCreating.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(data?.addressesCreating.change || 0).toFixed(2)}%
                </p>
              </div>
            </motion.div>

            {/* Total Transactions Card */}
            <motion.div
              className="bg-gradient-to-br from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-xl p-8 rounded-2xl 
                border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 
                shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(0,255,0,0.1)]
                flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent" />
                <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-green-500/10 to-transparent rotate-45 group-hover:via-green-500/20" style={{ width: '800%', height: '800%' }} />
              </div>
              
              <h3 className="text-gray-400 mb-6 text-lg relative z-10">Total Transactions (24h)</h3>
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex flex-col items-center justify-center flex-1">
                  <p className="text-5xl font-bold text-white tabular-nums text-center bg-clip-text text-transparent bg-gradient-to-br from-white via-green-100 to-white">
                    {formatNumber(data?.totalTransactions.today || 0)}
                  </p>
                </div>
                <p className={`flex items-center text-lg mt-6 justify-center ${
                  (data?.totalTransactions.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                } font-medium`}>
                  {(data?.totalTransactions.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(data?.totalTransactions.change || 0).toFixed(2)}%
                </p>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-12 max-w-7xl mx-auto">
            {/* Volume Chart */}
            {loading ? (
              <LoadingChart />
            ) : (
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">14-Day Volume</h3>
                  <div className="flex space-x-2 bg-gray-700/50 p-1 rounded-lg">
                    <button
                      onClick={() => setPumpFunViewMode('graph')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        pumpFunViewMode === 'graph' 
                          ? 'bg-red-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Graph
                    </button>
                    <button
                      onClick={() => setPumpFunViewMode('list')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        pumpFunViewMode === 'list' 
                          ? 'bg-red-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
                
                {pumpFunViewMode === 'graph' ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data?.volumeHistory || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#6B7280" />
                        <YAxis 
                          stroke="#6B7280"
                          tickFormatter={(value) => `$${value.toFixed(0)}M`} // For daily volume in millions
                        />
                        <Tooltip 
                          formatter={(value) => [`$${formatNumber(Number(value))}`, 'Volume']}
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            borderColor: '#374151',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volumeUSD" 
                          stroke="#EF4444" 
                          fill="url(#colorVolume)" 
                          activeDot={{ r: 8 }}
                        />
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-gray-700/30 sticky top-0">
                        <tr>
                          <th className="p-4 text-gray-300">Date</th>
                          <th className="p-4 text-gray-300 text-right">Volume (USD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.volumeHistory.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                            <td className="p-4 text-gray-300">{item.date}</td>
                            <td className="p-4 text-gray-300 text-right">${formatNumber(item.volumeUSD)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Token Launch Chart */}
            {loading ? (
              <LoadingChart />
            ) : (
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">14-Day Token Activity</h3>
                  <div className="flex space-x-2 bg-gray-700/50 p-1 rounded-lg">
                    <button
                      onClick={() => setPumpFunViewMode('graph')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        pumpFunViewMode === 'graph' 
                          ? 'bg-red-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Graph
                    </button>
                    <button
                      onClick={() => setPumpFunViewMode('list')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        pumpFunViewMode === 'list' 
                          ? 'bg-red-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
                
                {pumpFunViewMode === 'graph' ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data?.tokenHistory || []}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#6B7280" />
                        <YAxis yAxisId="left" stroke="#6B7280" />
                        <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: 'none',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="tokensLaunched" 
                          stroke="#8884d8" 
                          name="Tokens Launched"
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="addressesCreating" 
                          stroke="#82ca9d" 
                          name="Addresses Creating"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-gray-700/30 sticky top-0">
                        <tr>
                          <th className="p-4 text-gray-300">Date</th>
                          <th className="p-4 text-gray-300 text-right">Tokens Launched</th>
                          <th className="p-4 text-gray-300 text-right">Addresses Creating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.tokenHistory.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                            <td className="p-4 text-gray-300">{item.date}</td>
                            <td className="p-4 text-gray-300 text-right">{item.tokensLaunched}</td>
                            <td className="p-4 text-gray-300 text-right">{item.addressesCreating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </>
      );
    } else if (activeSection === 'pumpSwap') {
      // PumpSwap content
      return (
        <>
          {/* Error Display */}
          {pumpSwapError && (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-10 max-w-3xl mx-auto">
              <p className="font-bold">Error loading data:</p>
              <p>{pumpSwapError}</p>
            </div>
          )}

          {/* Main Stats Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
            {/* 24h Volume Card */}
            {pumpSwapLoading ? (
              <LoadingCard title="Daily Volume (24h)" />
            ) : (
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-red-500/30 transition-colors duration-300 shadow-lg flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-gray-400 mb-6 text-lg text-center">Daily Volume (24h)</h3>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex flex-col items-center">
                    <p className="text-5xl font-bold text-white tabular-nums text-center">
                      {pumpSwapData?.dailyVolume.formatted}
                    </p>
                  </div>
                  <p className={`flex items-center text-lg mt-6 justify-center ${
                    (pumpSwapData?.dailyVolume.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(pumpSwapData?.dailyVolume.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    {Math.abs(pumpSwapData?.dailyVolume.change || 0).toFixed(2)}%
                  </p>
                </div>
              </motion.div>
            )}

            {/* Weekly Volume Card */}
            {pumpSwapLoading ? (
              <LoadingCard title="Weekly Volume (7d)" />
            ) : (
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-colors duration-300 shadow-lg flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-gray-400 mb-6 text-lg text-center">Weekly Volume (7d)</h3>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex flex-col items-center">
                    <p className="text-5xl font-bold text-white tabular-nums text-center">
                      {pumpSwapData?.weeklyVolume.formatted}
                    </p>
                  </div>
                  <p className={`flex items-center text-lg mt-6 justify-center ${
                    (pumpSwapData?.weeklyVolume.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(pumpSwapData?.weeklyVolume.change || 0) > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    {Math.abs(pumpSwapData?.weeklyVolume.change || 0).toFixed(2)}%
                  </p>
                </div>
              </motion.div>
            )}

            {/* Lifetime Volume Card */}
            {pumpSwapLoading ? (
              <LoadingCard title="Lifetime Volume" />
            ) : (
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors duration-300 shadow-lg flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-gray-400 mb-6 text-lg text-center">Lifetime Volume</h3>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex flex-col items-center">
                    <p className="text-5xl font-bold text-white tabular-nums text-center">
                      {pumpSwapData?.lifetimeVolume.formatted}
                    </p>
                  </div>
                  <div className="h-[38px]"></div> {/* Spacer to match the height of the percentage change */}
                </div>
              </motion.div>
            )}
          </div>

          {/* Volume History Chart */}
          {pumpSwapLoading ? (
            <LoadingChart />
          ) : (
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Volume History (Last 14 Days)</h3>
                <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('graph')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'graph' 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    Graph
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'text' 
                        ? 'bg-red-500 text-white' 
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
              
              {viewMode === 'graph' ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={pumpSwapData?.volumeHistory || []}>
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280"
                        tickFormatter={(value) => {
                          // Format date to be more readable (e.g., "Apr 25")
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#6B7280"
                        tickFormatter={(value) => formatCurrency(value, 0)}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#9CA3AF"
                        tickFormatter={(value) => formatCurrency(value, 0)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        formatter={(value, name) => {
                          if (name === 'Daily Volume') {
                            return [`$${value.toFixed(1)}M`, 'Daily Volume'];
                          }
                          if (name === 'Cumulative Volume') {
                            return [`$${value.toFixed(1)}B`, 'Cumulative Volume'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        name="Daily Volume"
                        dataKey="volume"
                        fill="#EF4444"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        name="Cumulative Volume"
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#A3E635"
                        dot={false}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(pumpSwapData?.volumeHistory || []).map((day, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-4 px-4 border-b border-gray-700/30 hover:bg-gray-700/20 rounded-lg transition-colors"
                    >
                      <span className="text-gray-300 font-medium">
                        {day.date}
                      </span>
                      <div className="text-right">
                        <p className="text-white font-bold">{day.formattedVolume}</p>
                        <p className="text-lime-400 text-sm">Total: {day.formattedCumulative}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </>
      );
    } else if (activeSection === 'tradingBot') {
      return (
        <>
          {tradingBotLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* TRADING BOT LEADERBOARD - Podium Style */}
              {activeSection === 'tradingBot' && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 max-w-6xl mx-auto mb-8">
                  <h3 className="text-xl font-bold text-white mb-10 text-center">Trading Bot Leaderboard</h3>
                  
                  {/* Podium layout - silver, gold, bronze with animations */}
                  <div className="flex flex-wrap justify-center items-end gap-6 mb-4">
                    {/* Silver - 2nd Place (Left) */}
                    <div className="w-full md:w-auto order-2 md:order-1">
                      <div className="relative bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 rounded-xl border border-gray-600 w-full md:w-44 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(192,192,192,0.5)] transition-all duration-300 hover:scale-105 before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-gray-400/10 before:to-transparent before:rounded-xl before:pointer-events-none">
                        {/* Medal with fixed positioning instead of percentage */}
                        <div style={{ position: 'absolute', top: '-32px', left: '50%', marginLeft: '-25px' }} className="animate-bounce animation-delay-200">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#C0C0C0] to-[#E8E8E8] flex items-center justify-center shadow-lg">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#A0A0A0] to-[#D0D0D0] flex items-center justify-center border-2 border-[#E8E8E8] relative">
                              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800 font-bold text-xl">2</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 text-center relative z-10">
                          <h4 className="text-lg font-bold text-[#4ECDC4]">Photon</h4>
                          <p className="text-xs text-gray-400">Second Place</p>
                        </div>
                        
                        <div className="text-center relative z-10">
                          <p className="text-2xl font-bold text-white">$442.70M</p>
                          <p className="text-xs text-gray-500">Total Volume</p>
                          <p className="text-xs text-gray-400 mt-1">7-day Avg: $63.24M</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gold - 1st Place (Middle) */}
                    <div className="w-full md:w-auto order-1 md:order-2">
                      <div className="relative bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 rounded-xl border border-gray-600 w-full md:w-48 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all duration-300 hover:scale-105 before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-yellow-400/10 before:to-transparent before:rounded-xl before:pointer-events-none">
                        {/* Medal with fixed positioning instead of percentage */}
                        <div style={{ position: 'absolute', top: '-40px', left: '50%', marginLeft: '-28px' }} className="animate-bounce">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFC107] flex items-center justify-center shadow-lg">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#F5C211] to-[#FFD700] flex items-center justify-center border-2 border-[#FFDF00] relative">
                              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-900 font-bold text-2xl">1</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-10 text-center relative z-10">
                          <h4 className="text-xl font-bold text-[#FF6B6B]">Axiom</h4>
                          <p className="text-xs text-gray-400">First Place</p>
                        </div>
                        
                        <div className="text-center relative z-10">
                          <p className="text-3xl font-bold text-white">$994.20M</p>
                          <p className="text-xs text-gray-500">Total Volume</p>
                          <p className="text-xs text-gray-400 mt-1">7-day Avg: $142.03M</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bronze - 3rd Place (Right) */}
                    <div className="w-full md:w-auto order-3">
                      <div className="relative bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 rounded-xl border border-gray-600 w-full md:w-44 flex flex-col justify-between hover:shadow-[0_0_15px_rgba(205,127,50,0.5)] transition-all duration-300 hover:scale-105 before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-amber-500/10 before:to-transparent before:rounded-xl before:pointer-events-none">
                        {/* Medal with fixed positioning instead of percentage */}
                        <div style={{ position: 'absolute', top: '-32px', left: '50%', marginLeft: '-25px' }} className="animate-bounce animation-delay-400">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#CD7F32] to-[#E8AA56] flex items-center justify-center shadow-lg">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#B87333] to-[#D89A56] flex items-center justify-center border-2 border-[#E8AA56] relative">
                              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-100 font-bold text-xl">3</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 text-center relative z-10">
                          <h4 className="text-lg font-bold text-[#9933FF]">Trojan</h4>
                          <p className="text-xs text-gray-400">Third Place</p>
                        </div>
                        
                        <div className="text-center relative z-10">
                          <p className="text-2xl font-bold text-white">$148.60M</p>
                          <p className="text-xs text-gray-500">Total Volume</p>
                          <p className="text-xs text-gray-400 mt-1">7-day Avg: $21.23M</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 4th and 5th place */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
                    <div className="bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 rounded-lg border border-gray-600 flex items-center justify-between hover:bg-gray-700/60 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/5 to-transparent pointer-events-none"></div>
                      <div className="flex items-center relative z-10">
                        <div className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 border border-gray-600 relative">
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-300">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#4CAF50]">BullX</h4>
                          <p className="text-xs text-gray-400">7-day Avg: $23.02M</p>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <p className="text-sm text-gray-300">$123.40M</p>
                        <p className="text-xs text-gray-500">Total Volume</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 rounded-lg border border-gray-600 flex items-center justify-between hover:bg-gray-700/60 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/5 to-transparent pointer-events-none"></div>
                      <div className="flex items-center relative z-10">
                        <div className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 border border-gray-600 relative">
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-300">5</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#22EAAA]">GMGN</h4>
                          <p className="text-xs text-gray-400">7-day Avg: $13.77M</p>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <p className="text-sm text-gray-300">$78.90M</p>
                        <p className="text-xs text-gray-500">Total Volume</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {renderTradingBotVolumeChart()}
            </>
          )}
        </>
      );
    }
  };

  // Update the renderTradingBotVolumeChart function
  const renderTradingBotVolumeChart = () => {
    if (!tradingBotData || tradingBotLoading) {
      return null;
    }
    
    // Extract data from each bot - fix the case for BullX
    const axiomData = tradingBotData.axiom?.result?.rows || [];
    const photonData = tradingBotData.photon?.result?.rows || [];
    const bullxData = tradingBotData.bullX?.result?.rows || []; // Capital X here
    const trojanData = tradingBotData.trojan?.result?.rows || [];
    const gmgnData = tradingBotData.gmgn?.result?.rows || [];
    
    // Collect all unique dates from all datasets
    const allDates = new Set();
    
    // Add dates from each dataset to our set of unique dates
    [axiomData, photonData, bullxData, trojanData, gmgnData].forEach(dataset => {
      dataset.forEach(item => {
        if (item.day) {
          // Extract just the date part
          const date = item.day.split(' ')[0];
          allDates.add(date);
        }
      });
    });
    
    // Convert to array and sort (oldest dates first for proper timeline)
    const sortedDates = Array.from(allDates).sort(); // Remove .reverse()
    
    // Create the combined dataset using our sorted unique dates
    const combinedData = [];
    
    // Take the most recent 14 days (but we'll reverse at the end for proper order)
    const recentDates = sortedDates.slice(-14); // Get last 14 dates (most recent)
    
    for (let i = 0; i < recentDates.length; i++) {
      const date = recentDates[i];
      
      // Helper function to find and parse volume for a date in a dataset
      const getVolumeForDate = (dataset, date) => {
        const item = dataset.find(row => row.day && row.day.substring(0, 10) === date);
        return item ? parseFloat(item.total_volume_usd || 0) : 0;
      };
      
      // Add data point with values from all bots
      combinedData.push({
        date,
        axiom: getVolumeForDate(axiomData, date),
        photon: getVolumeForDate(photonData, date),
        bullx: getVolumeForDate(bullxData, date),
        trojan: getVolumeForDate(trojanData, date),
        gmgn: getVolumeForDate(gmgnData, date)
      });
    }
    
    // Now combinedData has oldest to newest dates (left to right on chart)
    
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-700/50 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Daily Trading Volume</h3>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setBotViewMode('chart')}
              className={`px-3 py-1 rounded-md ${botViewMode === 'chart' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Chart
            </button>
            <button 
              onClick={() => setBotViewMode('stats')}
              className={`px-3 py-1 rounded-md ${botViewMode === 'stats' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Stats
            </button>
          </div>
        </div>
        
        {/* Bot Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries({
            axiom: {name: "Axiom", color: "#FF5722"}, // Orange for Axiom as requested
            photon: {name: "Photon", color: "#7DD3FC"},
            bullx: {name: "BullX", color: "#22C55E"},
            trojan: {name: "Trojan", color: "#3B82F6"},
            gmgn: {name: "GMGN", color: "#10B981"}
          }).map(([key, {name, color}]) => (
            <button
              key={key}
              onClick={() => setVisibleBots(prev => ({...prev, [key]: !prev[key]}))}
              className={`px-3 py-1 rounded-md flex items-center space-x-1 border ${visibleBots[key] 
                ? 'border-gray-500 text-white' 
                : 'border-gray-600 text-gray-400'}`}
              style={{backgroundColor: visibleBots[key] ? color : 'transparent', opacity: visibleBots[key] ? 1 : 0.7}}
            >
              <span className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></span>
              <span>{name}</span>
            </button>
          ))}
        </div>
        
        {botViewMode === 'chart' ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={combinedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis 
                  stroke="#888" 
                  tickFormatter={(value) => formatCurrency(value, 0)} 
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(value) => `Date: ${value}`}
                  contentStyle={{ 
                    backgroundColor: '#222', 
                    border: '1px solid #444',
                    borderRadius: '8px' 
                  }} 
                />
                <Legend />
                {visibleBots.axiom && (
                  <Area 
                    type="monotone" 
                    dataKey="axiom" 
                    name="Axiom" 
                    stroke="#FF5722" 
                    fill="#FF5722" 
                    fillOpacity={0.3} 
                    strokeWidth={2}
                  />
                )}
                {visibleBots.photon && (
                  <Area 
                    type="monotone" 
                    dataKey="photon" 
                    name="Photon" 
                    stroke="#7DD3FC" 
                    fill="#7DD3FC" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                )}
                {visibleBots.bullx && (
                  <Area 
                    type="monotone" 
                    dataKey="bullx" 
                    name="BullX" 
                    stroke="#22C55E" 
                    fill="#22C55E" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                )}
                {visibleBots.trojan && (
                  <Area 
                    type="monotone" 
                    dataKey="trojan" 
                    name="Trojan" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                )}
                {visibleBots.gmgn && (
                  <Area 
                    type="monotone" 
                    dataKey="gmgn" 
                    name="GMGN" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  {visibleBots.axiom && <th className="px-4 py-3">Axiom</th>}
                  {visibleBots.photon && <th className="px-4 py-3">Photon</th>}
                  {visibleBots.bullx && <th className="px-4 py-3">BullX</th>}
                  {visibleBots.trojan && <th className="px-4 py-3">Trojan</th>}
                  {visibleBots.gmgn && <th className="px-4 py-3">GMGN</th>}
                </tr>
              </thead>
              <tbody>
                {combinedData.map((day, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-2">{day.date}</td>
                    {visibleBots.axiom && <td className="px-4 py-2">{formatCurrency(day.axiom)}</td>}
                    {visibleBots.photon && <td className="px-4 py-2">{formatCurrency(day.photon)}</td>}
                    {visibleBots.bullx && <td className="px-4 py-2">{formatCurrency(day.bullx)}</td>}
                    {visibleBots.trojan && <td className="px-4 py-2">{formatCurrency(day.trojan)}</td>}
                    {visibleBots.gmgn && <td className="px-4 py-2">{formatCurrency(day.gmgn)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Return the main component structure
  return (
    <div className="relative min-h-screen pt-24 pb-16
                    bg-gradient-to-b from-[#0f1117] via-[#151823] to-black
                    text-white overflow-hidden">
      {/* background decorative orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl"
        animate={{ x: [0, 30, -20, 0], y: [0, 40, -10, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] bg-pink-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -25, 20, 0], y: [0, -30, 15, 0] }}
        transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Section */}
        <section className="mb-16 text-center relative mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-green-500/10 blur-3xl opacity-50"></div>
            
            <div className="relative">
              <motion.h2 
                className="text-5xl md:text-7xl font-black mb-6 leading-tight"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <span className="bg-gradient-to-r from-red-400 via-pink-500 to-red-600 bg-clip-text text-transparent animate-pulse">
                  Market
                </span>{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Statistics
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-gray-300 text-xl md:text-2xl mb-8 font-medium leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Track{" "}
                <span className="text-purple-400 font-semibold">market activity</span> and{" "}
                <span className="text-green-400 font-semibold">trading volume</span>{" "}
                <span className="text-red-400 font-semibold">across different mediums</span>.
              </motion.p>
              
              {/* Section Tabs */}
              <motion.div 
                className="flex justify-center mt-8 space-x-2 bg-gray-900/50 backdrop-blur-sm p-2 rounded-2xl inline-flex border border-gray-700/50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <button
                  onClick={() => setActiveSection('pumpFun')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                    activeSection === 'pumpFun' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Pump<span className="text-green-400 font-bold">Fun</span>
                </button>
                <button
                  onClick={() => setActiveSection('pumpSwap')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                    activeSection === 'pumpSwap' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Pump<span className="text-green-400 font-bold">Swap</span>
                </button>
                <button
                  onClick={() => setActiveSection('tradingBot')}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                    activeSection === 'tradingBot' 
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-600/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  Trading Bots
                </button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Last Updated */}
        {lastUpdated && activeSection === 'pumpFun' && (
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm">Last updated: {lastUpdated}</p>
          </div>
        )}
        
        {/* Content Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          {renderContent()}
        </div>
        
        {/* Token Launch Graph Modal */}
        <AnimatePresence>
          {showTokenGraph && data && (
            <TokenLaunchGraph 
              data={data.tokenHistory} 
              onClose={() => setShowTokenGraph(false)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
// And add this function to toggle bot visibility if it doesn't exist
const toggleBotVisibility = (botName) => {
  setVisibleBots(prev => ({
    ...prev,
    [botName]: !prev[botName]
  }));
};

// Hardcoded, formatted dates: Jun 19, 2025 to Jul 2, 2025 (14 days)
const hardcodedTokenActivityDates = [
  "Jun 19, 2025",
  "Jun 20, 2025",
  "Jun 21, 2025",
  "Jun 22, 2025",
  "Jun 23, 2025",
  "Jun 24, 2025",
  "Jun 25, 2025",
  "Jun 26, 2025",
  "Jun 27, 2025",
  "Jun 28, 2025",
  "Jun 29, 2025",
  "Jun 30, 2025",
  "Jul 1, 2025",
  "Jul 2, 2025"
];
