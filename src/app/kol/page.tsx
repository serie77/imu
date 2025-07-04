'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Award, UserMinus, ThumbsUp, ThumbsDown, X, Eye, Search, AlertTriangle, SearchX, Users, Target, Swords, Twitter, MessageSquare, Send, Tag, Edit, Twitch, Maximize2, WifiOff, Wifi, Info, Loader2, Brain, Copy, Zap, Hash } from "lucide-react";
import kolData from "./kolData.json"; // Assuming this has { name, solana_address, twitter, profile_picture }
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from "@solana/web3.js";

// --- Constants ---
// IMPORTANT: You must replace this with the actual mint address of your token.
// Using Wrapped SOL's address as a valid placeholder to prevent app crashes.
const OUR_TOKEN_MINT_ADDRESS = "7BFKwYhnNfMhCFjPGjd7tb1iX9NGkgoRDT1D8viDpump";
const REQUIRED_TOKEN_AMOUNT = 200000;
const ALL_TAGS = ["VIP", "Bag Holder", "Streamer", "Inactive"];

// --- Helper Functions ---

// Function to validate Solana addresses (keep existing)
const isValidSolanaAddress = (address: string) => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

// Add this helper function to render proper brand icons
const getLinkIcon = (type: string, size: number = 22) => {
  switch (type.toLowerCase()) {
    case 'twitch':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path 
            d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" 
            fill="#9146FF"
          />
        </svg>
      );
    case 'kick':
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2">
          <path 
            d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" 
            fill="#53fc18"
          />
        </svg>
      );
    case 'telegram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.56-.44.7-.9.43l-2.46-1.81-1.19 1.14c-.13.13-.24.24-.49.24l.17-2.43 4.45-4.02c.19-.17-.04-.27-.3-.1l-5.5 3.46-2.37-.74c-.52-.16-.53-.52.11-.77l9.27-3.57c.43-.16.81.1.67.77z" 
            fill="#0088cc"
          />
        </svg>
      );
    case 'discord':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path 
            d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" 
            fill="#5865F2"
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path 
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" 
            fill="#FF0000"
          />
        </svg>
      );
    default:
      return <ExternalLink size={size} />;
  }
};

// Function to fetch and scrape data from GMGN.AI
// IMPORTANT: Replace mock data with actual scraping logic (Playwright/Cheerio)
// You'll need selectors for 30d PNL specifically if available.
const fetchTraderStats = async (address: string) => {
  console.log(`Fetching stats for ${address}...`); // Add logging
  try {
    // --- ACTUAL SCRAPING LOGIC NEEDED HERE ---
    // Example using fetch (if GMGN has an API or simple HTML)
    // const response = await fetch(`/api/gmgn-scrape?address=${address}&timeframe=30d`); // Example API route
    // if (!response.ok) throw new Error('Failed to fetch data via API');
    // const data = await response.json();
    // return data; // Should match the structure below

    // --- MOCK DATA (Replace this section) ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const mockPnlValue = (Math.random() * 2000 - 1000).toFixed(2);
    const mockWinRate = (Math.random() * 50 + 50).toFixed(1);
    const mockGreen = Math.floor(Math.random() * 100);
    const mockRed = Math.floor(Math.random() * 50);
    const ranks = ['S+', 'S', 'A', 'B', 'C', 'D', 'F'];
    const mockRank = ranks[Math.floor(Math.random() * ranks.length)];
    return {
      rank: mockRank,
      dailyPNL: `${(Math.random() * 500 - 250).toFixed(2)} SOL`, // Keep for popup consistency
      monthlyPNL: `${mockPnlValue} SOL`, // This is the key one for profitability
      winRate: `${mockWinRate}%`,
      greenTrades: mockGreen,
      redTrades: mockRed,
      bestTrade: `+${(Math.random() * 100).toFixed(2)} SOL`, // Needs specific scraping
    };
    // --- END MOCK DATA ---

  } catch (error) {
    console.error(`Error fetching trader stats for ${address}:`, error);
    // Return null or a default error state object
    return null;
  }
};

// --- Main Component ---

interface GMGNData {
  balance?: string;
  pnl: string;
  winRate: string;
  tokensTraded: number;
  bestTrade?: string;
  bestTradePercentage?: number;
  holdTime?: string;
  address?: string;
  timeframe?: string;
  isInactive?: boolean;
  rank?: string;
  // Remove fields that don't exist in the API response
  greenTrades?: number;
  redTrades?: number;
  winStreak?: string;
  avgTradeSize?: string;
  topTrades?: Array<{
    tokenName: string;
    tokenImage: string;
    tokenCA: string;
    realizedProfit: string;
    pnlPercentage: string;
    timestamp: string;
  }>;
  realizedProfits?: string;
  totalCost?: string;
  tokenAvgCost?: string;
}

interface VoteNotification {
  id: number;
  message: string;
  type: 'up' | 'down' | 'error' | 'success';
  isOwnVote?: boolean;
}

// Add proper interfaces at the top of the file, after the existing interfaces

interface KOL {
  id?: string;
  name: string;
  solana_address: string;
  twitter?: string;
  profile_picture?: string;
  banner_url?: string;
  tags?: string[];
  links?: Array<{
    type: string;
    url: string;
  }>;
  communityNotes?: string[];
  tradingStyle?: string[];
}

interface Comment {
  id: string;
  author_wallet: string;
  message: string;
  timestamp: string;
}

interface Vote {
  kol_address: string;
  net_votes: number;
  vote_type: 'up' | 'down';
  kol_name?: string;
  wallet?: string;
}

// Add this type assertion right after the import:
const typedKolData: KOL[] = kolData as KOL[];

export default function KOLPage() {
  const { publicKey, connected, signMessage } = useWallet();
  const { connection } = useConnection();
  
  // State for votes: { [address]: count }
  const [kolVotes, setKolVotes] = useState<{ [key: string]: number }>({});
  // State for selected KOL for popup
  const [selectedKOL, setSelectedKOL] = useState<KOL | null>(null);
  // State for vote notifications
  const [voteNotifications, setVoteNotifications] = useState<VoteNotification[]>([]);
  // Add these state variables to your component
  const [mostLikedKOL, setMostLikedKOL] = useState<KOL | null>(null);
  const [leastLikedKOL, setLeastLikedKOL] = useState<KOL | null>(null);
  // Add state to track which KOLs the user has voted for
  const [userVotedKOLs, setUserVotedKOLs] = useState<{ [key: string]: 'up' | 'down' }>({});
  // Add state for search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('votes');

  // Add new state for GMGN data
  const [selectedKOLData, setSelectedKOLData] = useState<GMGNData | null>(null);
  const [loadingGMGNData, setLoadingGMGNData] = useState(false);
  const [gmgnError, setGmgnError] = useState<string | null>(null);

  // New State for Profile Modal & Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  
  // New State for Token Gating
  const [userHasToken, setUserHasToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  // Add state for active tag filters
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);

  // Add state for active tag and request edit modal
  const [activeTag, setActiveTag] = useState<string>('All');
  const [isRequestEditInfoModalOpen, setIsRequestEditInfoModalOpen] = useState(false);

  // Add state for tooltip
  const [showCurationTooltip, setShowCurationTooltip] = useState(false);

  // Add these state variables near the other useState declarations in the KOLPage component
  const [showCommunityNoteModal, setShowCommunityNoteModal] = useState(false);
  const [communityNote, setCommunityNote] = useState("");
  const [communityNoteError, setCommunityNoteError] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // --- Data Fetching & Checks ---

  const checkUserTokenBalance = useCallback(async () => {
    if (!publicKey) {
      setUserHasToken(false);
      return;
    }
    setIsCheckingToken(true);
    try {
      const response = await fetch('/api/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: publicKey.toString(),
          mint: OUR_TOKEN_MINT_ADDRESS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserHasToken(data.balance >= REQUIRED_TOKEN_AMOUNT);
      } else {
        console.error("API Error checking token balance:", data.error);
        setUserHasToken(false);
      }
      
    } catch (error) {
      console.error("Failed to check token balance via API:", error);
      setUserHasToken(false);
    } finally {
      setIsCheckingToken(false);
    }
  }, [publicKey]);

  // --- Effects ---

  // Effect to automatically remove old notifications
  useEffect(() => {
    if (voteNotifications.length > 0) {
      const timer = setTimeout(() => {
        setVoteNotifications(prev => prev.slice(1)); // Remove the oldest notification
      }, 5000); // Remove after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [voteNotifications]);

  // Update the fetchVotes function in the KOLPage component
  const fetchVotes = async () => {
    try {
      console.log('Fetching votes from database...');
      const response = await fetch('/api/kol/votes');
      const data = await response.json();
      
      console.log('Votes data:', data);
      
      if (data.success && Array.isArray(data.votes)) {
        // Convert the votes array to the format your component expects
        const votesObj: { [key: string]: number } = {};
        data.votes.forEach((vote: Vote) => {
          votesObj[vote.kol_address] = vote.net_votes;
        });
        
        console.log('Processed votes:', votesObj);
        setKolVotes(votesObj);
        
        // Update most/least liked KOLs
        updateMostLeastLikedKOLs(votesObj);
      } else {
        console.log('No votes data available or invalid format:', data);
        // Initialize with empty object if no votes data
        setKolVotes({});
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
      // Initialize with empty object on error
      setKolVotes({});
    }
  };

  // Add this function to check user's votes when they connect their wallet
  const fetchUserVotes = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    try {
      console.log('Fetching user votes for wallet:', walletAddress);
      const response = await fetch('/api/kol/check-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterWallet: walletAddress,
        }),
      });
      
      const data = await response.json();
      console.log('User votes data:', data);
      
      if (data.success && Array.isArray(data.votes)) {
        // Convert to the format your component expects
        const userVotesObj: { [key: string]: 'up' | 'down' } = {};
        data.votes.forEach((vote: Vote) => {
          userVotesObj[vote.kol_address] = vote.vote_type;
        });
        
        console.log('Processed user votes:', userVotesObj);
        setUserVotedKOLs(userVotesObj);
      }
    } catch (error: any) {
      console.error('Error fetching user votes:', error);
    }
  };

  // Update the useEffect to fetch user votes when wallet connects
  useEffect(() => {
    // Fetch votes from the database
    fetchVotes();
    
    // Fetch user's votes when wallet connects
    if (connected && publicKey) {
      fetchUserVotes(publicKey.toString());
      checkUserTokenBalance();
    } else {
      setUserHasToken(false);
    }
  }, [publicKey, connected, checkUserTokenBalance]);

  // --- Memoized Calculations ---

  // Calculate Most/Least Liked KOLs
  const { mostLikedKOL: calculatedMostLikedKOL, leastLikedKOL: calculatedLeastLikedKOL } = useMemo(() => {
    let mostLikedAddr: string | null = null;
    let leastLikedAddr: string | null = null;
    let maxVotes = -Infinity;
    let minVotes = Infinity;

    for (const address in kolVotes) {
      if (kolVotes[address] > maxVotes) {
        maxVotes = kolVotes[address];
        mostLikedAddr = address;
      }
      if (kolVotes[address] < minVotes) {
        minVotes = kolVotes[address];
        leastLikedAddr = address;
      }
    }

    return {
      mostLikedKOL: mostLikedAddr ? typedKolData.find((k: KOL) => k.solana_address === mostLikedAddr) || null : null,
      leastLikedKOL: leastLikedAddr ? typedKolData.find((k: KOL) => k.solana_address === leastLikedAddr) || null : null,
    };
  }, [kolVotes]);

  // Hardcoded Most/Least Profitable KOLs (as requested)
  // Replace with dynamic fetching/calculation if needed later
  const mostProfitableKOL = useMemo(() => typedKolData.find((k: KOL) => k.name === "West") || null, []); // Example
  const leastProfitableKOL = useMemo(() => typedKolData.find((k: KOL) => k.name === "Pow") || null, []); // Example

  // --- Handlers ---

  // Handle voting
  const handleVote = async (address: string, voteType: 'up' | 'down') => {
    try {
      // Check if wallet is connected
      if (!connected || !publicKey) {
        // Show notification to connect wallet
        const newNotification: VoteNotification = {
          id: Date.now(),
          message: "Please connect your wallet to vote",
          type: "error" as const,
        };
        setVoteNotifications(prev => [...prev.slice(-4), newNotification]);
        return;
      }
      
      console.log(`Voting ${voteType} for ${address}`);
      
      // Call the API to record the vote
      const voteResponse = await fetch('/api/kol/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kolAddress: address,
          voterWallet: publicKey.toString(),
          voteType: voteType,
        }),
      });
      
      const data = await voteResponse.json();
      console.log('Vote response:', data);
      
      if (data.success) {
        // Update local state with the new vote count
        setKolVotes(prevVotes => ({
          ...prevVotes,
          [address]: data.votes.net_votes,
        }));
        
        // Update user's voted KOLs
        setUserVotedKOLs(prevVoted => {
          if (prevVoted[address] === voteType) {
            // If toggling off, remove from voted KOLs
            const newVoted = { ...prevVoted };
            delete newVoted[address];
            return newVoted;
          } else {
            // Otherwise update with new vote type
            return {
              ...prevVoted,
              [address]: voteType,
            };
          }
        });
        
        // Find the KOL name
        const kol = typedKolData.find((k: KOL) => k.solana_address === address);
        
        if (kol) {
          // Show notification for your own vote
          const newNotification: VoteNotification = {
            id: Date.now(),
            message: `You have ${voteType === 'up' ? 'upvoted' : 'downvoted'} ${kol.name}`,
            type: voteType,
            isOwnVote: true, // Mark as your own vote
          };
          setVoteNotifications(prev => [...prev.slice(-4), newNotification]);
        }
        
        // Refresh the most/least liked KOLs
        fetchVotes();
        
        // Store user's votes in localStorage for persistence
        if (typeof window !== 'undefined') {
          const userVotes = JSON.parse(localStorage.getItem('userVotes') || '[]') as Array<{kolAddress: string, voteType: 'up' | 'down'}>;
          const existingVoteIndex = userVotes.findIndex((v: {kolAddress: string, voteType: 'up' | 'down'}) => v.kolAddress === address);
          
          if (existingVoteIndex >= 0) {
            // Update existing vote
            userVotes[existingVoteIndex] = { kolAddress: address, voteType };
          } else {
            // Add new vote
            userVotes.push({ kolAddress: address, voteType });
          }
          
          localStorage.setItem('userVotes', JSON.stringify(userVotes));
        }
      } else {
        // Show error notification
        const newNotification: VoteNotification = {
          id: Date.now(),
          message: data.message || "Error recording vote",
          type: "error" as const,
        };
        setVoteNotifications(prev => [...prev.slice(-4), newNotification]);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      // Show error notification
      const newNotification: VoteNotification = {
        id: Date.now(),
        message: "Error submitting vote",
        type: "error" as const,
      };
      setVoteNotifications(prev => [...prev.slice(-4), newNotification]);
    }
  };

  // Handle selecting a KOL to view profile
  const handleSelectKOL = (kol: KOL) => {
    if (!kol || !kol.solana_address) {
      console.error("Invalid KOL object passed to handleSelectKOL:", kol);
      return;
    }
    console.log(`[KOL SELECT] Selected KOL: ${kol.name} (${kol.solana_address})`);
    setSelectedKOL(kol);
    fetchComments(kol.solana_address);
    
    // ✅ Add this line to fetch GMGN data when KOL is selected
    fetchGMGNData(kol.solana_address);
  };

  // Handle closing the popup
  const handleClosePopup = () => {
    setSelectedKOL(null);
  };

  // Update the updateMostLeastLikedKOLs function to be more robust
  const updateMostLeastLikedKOLs = (votesObj: { [key: string]: number }) => {
    console.log('Updating most/least liked KOLs with votes:', votesObj);
    
    // Find KOL with highest vote count
    let highestVotes = -Infinity;
    let highestVotesKOL: KOL | null = null;
    
    // Find KOL with lowest vote count
    let lowestVotes = Infinity;
    let lowestVotesKOL: KOL | null = null;
    
    // Iterate through all KOLs - use the properly typed variable
    typedKolData.forEach((kol: KOL) => {
      const votes = votesObj[kol.solana_address] || 0;
      
      if (votes > highestVotes) {
        highestVotes = votes;
        highestVotesKOL = kol;
      }
      
      if (votes < lowestVotes) {
        lowestVotes = votes;
        lowestVotesKOL = kol;
      }
    });

    
    
    // Update state with the results
    setMostLikedKOL(highestVotesKOL);
    setLeastLikedKOL(lowestVotesKOL);
  };

  // Add a function to set up real-time vote notifications
  const setupVoteNotifications = () => {
    // Create an EventSource connection to the server for SSE (Server-Sent Events)
    const eventSource = new EventSource('/api/kol/vote-stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received vote notification:', data);
        
        if (data.type === 'vote' && data.vote) {
          // Skip notifications for your own votes (we already showed those in handleVote)
          if (publicKey && data.vote.wallet === publicKey.toString()) {
            console.log('Skipping notification for own vote');
            return;
          }
          
          // Add notification for other people's votes
          const newNotification: VoteNotification = {
            id: Date.now(),
            message: `${data.vote.wallet.slice(0, 6)}...${data.vote.wallet.slice(-4)} ${data.vote.vote_type === 'up' ? 'upvoted' : 'downvoted'} ${data.vote.kol_name || 'Unknown KOL'}`,
            type: data.vote.vote_type as 'up' | 'down',
            isOwnVote: false, // Mark as someone else's vote
          };
          setVoteNotifications(prev => [...prev.slice(-4), newNotification]);
          
          // Update vote counts
          if (data.vote.kol_address) {
            setKolVotes(prevVotes => ({
              ...prevVotes,
              [data.vote.kol_address]: data.vote.net_votes,
            }));
            
            // Update most/least liked KOLs
            fetchVotes();
          }
        }
      } catch (error) {
        console.error('Error processing vote notification:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      
      // Try to reconnect after a delay
      setTimeout(() => setupVoteNotifications(), 5000);
    };
    
    // Clean up on component unmount
    return () => {
      eventSource.close();
    };
  };

  // Update the useEffect to include the vote notifications setup
  useEffect(() => {
    // Fetch votes from the database
    fetchVotes();
    
    // Fetch user's votes when wallet connects
    if (connected && publicKey) {
      fetchUserVotes(publicKey.toString());
    }
    
    // Set up real-time vote notifications
    const cleanup = setupVoteNotifications();
    
    return cleanup;
  }, [publicKey, connected]);

  // Add a function to filter and sort KOLs
  const getFilteredAndSortedKOLs = () => {
    // Filter by tag first
    let filtered: KOL[] = typedKolData;
    if (activeTag !== 'All') {
      filtered = typedKolData.filter((kol: KOL) => kol.tags && kol.tags.includes(activeTag));
    }
    
    // Then filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((kol: KOL) => 
        kol.name.toLowerCase().includes(term) || 
        kol.solana_address.toLowerCase().includes(term) ||
        (kol.twitter && kol.twitter.toLowerCase().includes(term))
      );
    }
    
    // Then sort
    return filtered.sort((a: KOL, b: KOL) => {
      if (sortOption === 'votes') return (kolVotes[b.solana_address] || 0) - (kolVotes[a.solana_address] || 0);
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  };
  
  // Get filtered and sorted KOLs
  const filteredKOLs = getFilteredAndSortedKOLs();

  // Add function to fetch GMGN data
  const fetchGMGNData = async (address: string) => {
    if (!address) return;
    
    setLoadingGMGNData(true);
    setGmgnError(null);
    setSelectedKOLData(null); // Clear previous data
    
    try {
      // Always use 30d timeframe as the API expects
      const apiUrl = `/api/gmgn?address=${encodeURIComponent(address)}&timeframe=30d`;
      console.log(`[GMGN] Fetching data from: ${apiUrl}`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[GMGN] Received data:`, data);
      
      // The API already returns the rank, so we don't need to calculate it
      if (!data || !data.pnl) {
          throw new Error("No trading data could be found for this wallet.");
      }
      
      setSelectedKOLData(data);
    } catch (error) {
      console.error('[GMGN] Error fetching data:', error);
      setGmgnError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSelectedKOLData(null);
    } finally {
      setLoadingGMGNData(false);
    }
  };
  
  // Calculate rank based on GMGN data (same as in IMURank)
  const calculateRankGMGN = (data: GMGNData) => {
    if (!data) return 'N/A';
    
    // Extract numeric values
    const pnlValue = parseFloat(data.pnl?.replace(/[^0-9.-]/g, '') || '0');
    const winRate = parseFloat(data.winRate?.replace('%', '') || '0');
    const totalTrades = (data.greenTrades || 0) + (data.redTrades || 0);
    const tokensTraded = data.tokensTraded || totalTrades;
    
    // Parse hold time (assuming it's in format like "30 seconds")
    const holdTimeStr = data.holdTime || '0';
    const holdTimeMatch = holdTimeStr.match(/(\d+)\s*(second|minute|hour)/i);
    let holdTimeSeconds = 0;
    if (holdTimeMatch) {
      const value = parseInt(holdTimeMatch[1]);
      const unit = holdTimeMatch[2].toLowerCase();
      if (unit.startsWith('second')) holdTimeSeconds = value;
      else if (unit.startsWith('minute')) holdTimeSeconds = value * 60;
      else if (unit.startsWith('hour')) holdTimeSeconds = value * 3600;
    }
    
    // Extract best trade percentage
    const bestTradeValue = parseFloat(data.bestTrade?.replace(/[$,]/g, '') || '0');
    const bestTradePercentage = data.bestTradePercentage || (bestTradeValue > 0 ? (bestTradeValue / (pnlValue || 1)) * 100 : 0);

    // Calculate component scores (matching IMU rank page logic)
    const pnlScore = Math.min(35, (Math.abs(pnlValue) / 10000) * 3.5) * (pnlValue >= 0 ? 1 : -1);
    const winRateScore = (winRate - 40) * 1.25;
    const holdTimeScore = Math.min(20, (holdTimeSeconds / 30) * 10);
    const volumeScore = Math.min(10, (tokensTraded / 500) * 5);
    const riskScore = Math.min(10, (bestTradePercentage / 100));

    const totalScore = pnlScore + winRateScore + holdTimeScore + volumeScore + riskScore;

    console.log(`[RANK CALCULATION] PNL: ${pnlValue} (${pnlScore}), Win Rate: ${winRate}% (${winRateScore}), Hold Time: ${holdTimeSeconds}s (${holdTimeScore}), Volume: ${tokensTraded} (${volumeScore}), Risk: ${bestTradePercentage}% (${riskScore}), Total: ${totalScore}`);

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

  // Replace your calculateSentimentScore function with this:
  const calculateSentimentScore = (data: GMGNData | null, voteCount: number): number => {
    if (!data) return 0;

    // Use the EXACT same rank calculation from IMU rank page
    const calculateRank = (data: any) => {
      if (!data) return 'F';

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

    // Calculate the rank
    const rank = calculateRank(data);
    
    // Check if inactive
    const isInactive = data.isInactive || (data.tokensTraded && data.tokensTraded < 10);
    if (isInactive) {
      return Math.max(5, Math.round(voteCount * 0.1)); // Very low score for inactive accounts
    }

    // Normalize rank score (out of 50 points for 50% weight)
    let rankScore = 0;
    
    // Handle letter grades
    switch (rank) {
      case 'S+': rankScore = 50; break;
      case 'S': rankScore = 45; break;
      case 'A+': rankScore = 40; break;
      case 'A': rankScore = 35; break;
      case 'B+': rankScore = 30; break;
      case 'B': rankScore = 25; break;
      case 'C+': rankScore = 20; break;
      case 'C': rankScore = 15; break;
      case 'D': rankScore = 10; break;
      case 'F': rankScore = 5; break;
      default: rankScore = 0; break;
    }

    // Normalize votes (out of 35 points for 35% weight)
    const clampedVotes = Math.max(-50, Math.min(50, voteCount));
    const normalizedVotes = ((clampedVotes + 50) / 100) * 35;

    // Activity score (up to 25 points for 25% weight)
    let activityScore = 0;
    if (data.tokensTraded) {
      if (data.tokensTraded >= 2000) activityScore = 25;
      else if (data.tokensTraded >= 1000) activityScore = 20;
      else if (data.tokensTraded >= 500) activityScore = 15;
      else if (data.tokensTraded >= 200) activityScore = 10;
      else if (data.tokensTraded >= 100) activityScore = 5;
      else if (data.tokensTraded >= 50) activityScore = 2;
    }

    const sentimentScore = Math.min(100, rankScore + normalizedVotes + activityScore);

    console.log(`[SENTIMENT CALCULATION] Rank: ${rank} (${rankScore}), Votes: ${voteCount} (${normalizedVotes}), Activity: ${data.tokensTraded} (${activityScore}), Final: ${sentimentScore}`);

    return Math.round(sentimentScore);
  };

  // --- New Handlers ---

  const fetchComments = async (kolAddress: string) => {
    console.log(`[COMMENTS] Fetching comments for KOL: ${kolAddress}`);
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/kol/comments?kol_address=${kolAddress}`);
      const data = await response.json();
      console.log(`[COMMENTS] Fetched ${data.comments?.length || 0} comments`);
      if (data.success) setComments(data.comments);
    } catch (error: any) {
      console.error("[COMMENTS] Error fetching comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!connected || !publicKey) return alert("Please connect your wallet to comment.");
    if (!userHasToken) return alert(`You need to hold at least ${REQUIRED_TOKEN_AMOUNT} tokens to comment.`);
    if (!newComment.trim()) return;

    // Client-side rate limit check
    const userComments = comments.filter(c => c.author_wallet === publicKey.toString());
    if (userComments.length >= 3) {
      setCommentError("You have reached the maximum of 3 comments for this KOL.");
      return;
    }

    console.log(`[COMMENTS] Submitting comment for KOL: ${selectedKOL?.solana_address}`);
    try {
      const response = await fetch('/api/kol/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kol_address: selectedKOL?.solana_address,
          author_wallet: publicKey.toString(),
          message: newComment,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`[COMMENTS] Comment submitted successfully`);
        // Refresh comments
        if (selectedKOL) {
          fetchComments(selectedKOL.solana_address);
        }
        setNewComment("");
        setCommentError("");
      } else {
        setCommentError(data.error || "Failed to post comment.");
      }
    } catch (error) {
      console.error("[COMMENTS] Error submitting comment:", error);
      setCommentError("Failed to post comment. Please try again.");
    }
  };
  
  const handleTagFilterToggle = (tag: string) => {
    setActiveTagFilters(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Add this handler function after the other handlers
  const handleCommunityNoteSubmit = async () => {
    if (!connected || !publicKey) {
      setCommunityNoteError("Please connect your wallet to submit a note.");
      return;
    }

    if (!communityNote.trim()) {
      setCommunityNoteError("Please enter a note.");
      return;
    }

    if (communityNote.length > 200) {
      setCommunityNoteError("Note must be 200 characters or less.");
      return;
    }

    setIsSubmittingNote(true);
    setCommunityNoteError("");

    try {
      const response = await fetch('/api/kol/community-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kol_address: selectedKOL?.solana_address,
          submitter_wallet: publicKey.toString(),
          note: communityNote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCommunityNote("");
        setShowCommunityNoteModal(false);
        
        // Show multiple notifications for better visibility
        const successNotification: VoteNotification = {
          id: Date.now(),
          message: "✅ Community note submitted successfully!",
          type: "success" as const,
        };
        
        const reviewNotification: VoteNotification = {
          id: Date.now() + 1,
          message: "⏰ IMU team will review your note within 1 hour",
          type: "success" as const,
        };
        
        setVoteNotifications(prev => [
          ...prev.slice(-3), 
          successNotification, 
          reviewNotification
        ]);

        // Also show browser alert as backup
        alert("✅ Community note submitted! The IMU team will review it within 1 hour.");
        
      } else {
        setCommunityNoteError(data.error || "Failed to submit note.");
      }
    } catch (error) {
      console.error("Error submitting community note:", error);
      setCommunityNoteError("Failed to submit note. Please try again.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // --- Render ---

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

      {/* Notification Area - Fixed position below header */}
      <div className="fixed top-24 right-4 z-50 w-80">
        <NotificationArea notifications={voteNotifications} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Section - Now at the top with more spacing */}
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
                  Rate
                </span>{" "}
                <span className="text-white">the</span>{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                  KOLs
                </span>
                <br />
                <span className="text-white">Track the</span>{" "}
                <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent animate-pulse">
                  Profits
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-gray-300 text-xl md:text-2xl mb-8 font-medium leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Vote for your favorite{" "}
                <span className="text-purple-400 font-semibold">Key Opinion Leaders</span>{" "}
                and see who the community{" "}
                <span className="text-green-400 font-semibold">trusts the most</span>.
              </motion.p>
              
              {!connected && (
                <motion.div 
                  className="bg-gradient-to-r from-red-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm p-8 rounded-2xl border border-gradient-to-r border-red-500/30 mb-8 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <p className="text-xl mb-6 font-medium">Connect your wallet to vote for your favorite KOLs</p>
                  <WalletMultiButton />
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* All Key Opinion Leaders section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <header className="mb-8">
            {/* Top row: Title and Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">All Key Opinion Leaders</h2>
                
                {/* Curation Info Tooltip */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowCurationTooltip(true)}
                    onMouseLeave={() => setShowCurationTooltip(false)}
                    className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
                  >
                    <Info size={18} className="text-gray-400 hover:text-white transition-colors" />
                  </button>
                  {showCurationTooltip && (
                    <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 text-sm text-gray-300 z-50">
                      <div className="font-semibold mb-2 text-white">🎯 Curated Feed</div>
                      <p className="leading-relaxed">
                        We carefully curate our KOL feed with only the highest quality, most active traders. 
                        Think you belong on this list? <br/>
                        <span className="text-purple-400 font-medium">DM @imuagent on X</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search KOLs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 text-white placeholder-gray-400 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 w-48 sm:w-56"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 text-white font-semibold py-2 pl-4 pr-10 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 cursor-pointer"
                  >
                    <option value="votes">Sort by Votes</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom row: Filter Tags and Results Count */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-400 mr-2">Filter by Tag:</span>
                {['All', 'VIP', 'Bag Holder', 'Flipper', 'Streamer', 'CTO Lead', 'Dev'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${
                      activeTag === tag
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* Results Count */}
              {(searchTerm.trim() || activeTag !== 'All') && (
                <div className="text-sm text-gray-400">
                  {filteredKOLs.length} result{filteredKOLs.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          </header>

          {/* KOL Grid */}
          <AnimatePresence>
            <div className="grid grid-cols-1 gap-4 max-h-[65vh] overflow-y-auto pr-2">
              {filteredKOLs.map((kol, index) => (
                <KOLListItem
                  key={kol.id || `kol-${index}`}
                  kol={kol}
                  voteCount={kolVotes[kol.solana_address] || 0}
                  onVote={handleVote}
                  onSelect={handleSelectKOL}
                  userVoted={userVotedKOLs[kol.solana_address]}
                  userHasToken={userHasToken}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      </main>

      {/* KOL Detail Modal */}
      <AnimatePresence>
        {selectedKOL && (
          <KOLProfileModal 
            kol={selectedKOL}
            voteCount={kolVotes[selectedKOL.solana_address] || 0}
            comments={comments}
            loadingComments={loadingComments}
            onClose={() => setSelectedKOL(null)}
            onVote={handleVote}
            onCommentSubmit={handleCommentSubmit}
            newComment={newComment}
            setNewComment={setNewComment}
            commentError={commentError}
            userHasToken={userHasToken}
            onShowEditInfo={() => setShowEditInfoModal(true)}
            loadingGMGNData={loadingGMGNData}
            selectedKOLData={selectedKOLData}
            gmgnError={gmgnError}
            onShowCommunityNoteModal={() => setShowCommunityNoteModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditInfoModal && (
          <motion.div> {/* Edit Info Modal JSX */} </motion.div>
        )}
      </AnimatePresence>

      {/* Community Note Modal */}
      <AnimatePresence>
        {showCommunityNoteModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommunityNoteModal(false)}
          >
            <motion.div
              className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-gray-700/50 shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Add Community Note</h3>
                <button
                  onClick={() => setShowCommunityNoteModal(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note about {selectedKOL?.name}
                  </label>
                  <textarea
                    value={communityNote}
                    onChange={(e) => setCommunityNote(e.target.value)}
                    placeholder="Share insights about this KOL's trading style, expertise, or notable achievements..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {communityNote.length}/200 characters
                    </span>
                    {communityNoteError && (
                      <span className="text-xs text-red-400">{communityNoteError}</span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Review Process</p>
                      <p className="text-xs text-blue-200">
                        Your note will be reviewed by the IMU team within 1 hour. 
                        Only factual, trading-related insights will be approved and displayed publicly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCommunityNoteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommunityNoteSubmit}
                    disabled={!communityNote.trim() || isSubmittingNote}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmittingNote ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Component Definitions ---

// Notification Area Component
const NotificationArea = ({ notifications }: { notifications: VoteNotification[] }) => (
  <div className="space-y-2">
    <AnimatePresence>
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className={`p-3 rounded-lg shadow-lg ${
            notification.type === 'up' 
              ? notification.isOwnVote 
                ? 'bg-green-600/90 text-white' 
                : 'bg-green-500/90 text-white'
              : notification.type === 'down'
                ? notification.isOwnVote
                  ? 'bg-red-600/90 text-white'
                  : 'bg-red-500/90 text-white'
                : notification.type === 'error'
                  ? 'bg-yellow-600/90 text-white'
                  : notification.type === 'success'
                    ? 'bg-blue-600/90 text-white'
                    : 'bg-gray-700/90 text-white'
          }`}
        >
          {notification.type === 'up' && <ThumbsUp size={16} className="inline mr-2" />}
          {notification.type === 'down' && <ThumbsDown size={16} className="inline mr-2" />}
          {notification.type === 'error' && <AlertTriangle size={16} className="inline mr-2" />}
          {notification.type === 'success' && <Brain size={16} className="inline mr-2" />}
          {notification.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// Featured KOL Card Component
const FeaturedKOLCard = ({
  kol, votes, label, icon: Icon,
  color, bgColor, borderColor, onSelect
}: {
  kol: KOL | null;
  votes: number | undefined;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  onSelect: (kol: KOL) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.03 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={`relative rounded-2xl overflow-hidden shadow-xl
                ${bgColor} border ${borderColor} hover:border-transparent
                group`}
  >
    {/* glow ring */}
    <span
      className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                  bg-gradient-to-br ${color.replace("text", "from")}
                  blur-lg transition-opacity duration-500`}
    />
    <div className="relative p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${color}`}>
          <Icon size={18} className="mr-2" />
          <span className="font-semibold tracking-wide">{label}</span>
        </div>

        {/* votes pill */}
        {votes !== undefined && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium
                backdrop-blur-md
                ${
                  votes > 0 ? 'bg-green-400/10 text-green-300' :
                  votes < 0 ? 'bg-red-400/10 text-red-300' :
                  'bg-gray-400/10 text-gray-300'
          }`}>
            {votes > 0 ? `+${votes}` : votes}
          </div>
        )}
      </div>
      
      {/* profile row */}
      {kol ? (
        <button
          onClick={() => onSelect(kol)}
          className="flex items-center space-x-4 w-full hover:opacity-90"
        >
          <div className="w-14 h-14 rounded-full border-2 border-gray-600
                          overflow-hidden bg-gray-800 flex items-center justify-center">
            <span className="text-gray-300 text-xl font-bold select-none">
              {kol.name[0].toUpperCase()}
            </span>
            </div>
          <div className="text-left">
            <div className="font-semibold">{kol.name}</div>
            <div className="text-xs font-mono text-gray-400">
              {kol.solana_address.slice(0,4)}…{kol.solana_address.slice(-4)}
          </div>
            </div>
        </button>
      ) : (
        <div className="flex items-center justify-center h-20 text-gray-500">
          No data
        </div>
      )}
    </div>
  </motion.div>
);

// KOL List Item Component
const KOLListItem = ({ kol, voteCount, onVote, onSelect, userVoted, userHasToken }: { 
  kol: KOL, 
  voteCount: number, 
  onVote: (address: string, type: 'up' | 'down') => void, 
  onSelect: (kol: KOL) => void, 
  userVoted: string | undefined, 
  userHasToken: boolean 
}) => (
  <motion.div
    className="flex items-center justify-between p-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl 
               border border-transparent hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
    onClick={() => onSelect(kol)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <div className="flex items-center space-x-4">
      <div className="relative flex-shrink-0">
        <img 
          src={kol.profile_picture || '/default-avatar.png'} 
          alt={kol.name} 
          className="w-16 h-16 rounded-2xl object-cover bg-gray-700"
        />
        <div className="absolute -bottom-1 -right-1 p-1 bg-gray-900 rounded-full border-2 border-gray-900">
          <Wifi className="w-3 h-3 text-green-400" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{kol.name}</h3>
        <p className="text-sm text-gray-400">{kol.twitter ? `@${kol.twitter.split('/').pop()}` : 'No social link'}</p>
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      <div className="text-center">
        <div className={`font-bold text-lg ${voteCount > 0 ? 'text-green-400' : voteCount < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {voteCount}
        </div>
        <div className="text-xs text-gray-500">Votes</div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onVote(kol.solana_address, 'up');
        }} 
        className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-xl text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!userHasToken}
      >
        <ThumbsUp size={18}/>
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onVote(kol.solana_address, 'down');
        }}
        className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!userHasToken}
      >
        <ThumbsDown size={18}/>
      </button>
    </div>
  </motion.div>
);

// First, let's add the RankDisplay component to the KOL page
const RankDisplay = ({ rank, isLoading = false }: { rank: string; isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-400/20 flex items-center justify-center animate-pulse">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-purple-400/30 opacity-50 blur-xl animate-pulse" />
          <div className="w-12 h-12 bg-gray-700/50 rounded-full animate-spin" style={{ animation: 'spin 2s linear infinite' }}>
            <div className="w-full h-full rounded-full border-2 border-purple-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="flex justify-center items-center">
      <div className={`
        relative w-20 h-20 rounded-full 
        bg-gradient-to-br ${getRankColor(rank)}
        flex items-center justify-center
        shadow-lg shadow-black/50
      `}>
        <div className="text-3xl font-bold text-white drop-shadow-lg">
          {rank}
        </div>
        <div className={`
          absolute inset-0 rounded-full
          bg-gradient-to-br ${getRankColor(rank)}
          opacity-50 blur-xl
        `} />
      </div>
    </div>
  );
};
// Add function to calculate sentiment score
const calculateSentimentScore = (data: GMGNData | null, voteCount: number): number => {
  if (!data) return 0;

  // Use the EXACT same rank calculation from IMU rank page
  const calculateRank = (data: any) => {
    if (!data) return 'F';

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

  // Calculate the rank
  const rank = calculateRank(data);
  
  // Check if inactive
  const isInactive = data.isInactive || (data.tokensTraded && data.tokensTraded < 10);
  if (isInactive) {
    return Math.max(5, Math.round(voteCount * 0.1)); // Very low score for inactive accounts
  }

  // Normalize rank score (out of 50 points for 50% weight)
  let rankScore = 0;
  
  // Handle letter grades
  switch (rank) {
    case 'S+': rankScore = 50; break;
    case 'S': rankScore = 45; break;
    case 'A+': rankScore = 40; break;
    case 'A': rankScore = 35; break;
    case 'B+': rankScore = 30; break;
    case 'B': rankScore = 25; break;
    case 'C+': rankScore = 20; break;
    case 'C': rankScore = 15; break;
    case 'D': rankScore = 10; break;
    case 'F': rankScore = 5; break;
    default: rankScore = 0; break;
  }

  // Normalize votes (out of 35 points for 35% weight)
  const clampedVotes = Math.max(-50, Math.min(50, voteCount));
  const normalizedVotes = ((clampedVotes + 50) / 100) * 35;

  // Activity score (up to 25 points for 25% weight)
  let activityScore = 0;
  if (data.tokensTraded) {
    if (data.tokensTraded >= 2000) activityScore = 25;
    else if (data.tokensTraded >= 1000) activityScore = 20;
    else if (data.tokensTraded >= 500) activityScore = 15;
    else if (data.tokensTraded >= 200) activityScore = 10;
    else if (data.tokensTraded >= 100) activityScore = 5;
    else if (data.tokensTraded >= 50) activityScore = 2;
  }

  const sentimentScore = Math.min(100, rankScore + normalizedVotes + activityScore);

  console.log(`[SENTIMENT CALCULATION] Rank: ${rank} (${rankScore}), Votes: ${voteCount} (${normalizedVotes}), Activity: ${data.tokensTraded} (${activityScore}), Final: ${sentimentScore}`);

  return Math.round(sentimentScore);
};

// Replace the existing getKOLBannerGradient function with this simpler approach:
const getKOLBannerStyle = (profilePictureUrl: string) => {
  if (!profilePictureUrl) {
    return {
      background: 'linear-gradient(135deg, rgb(139,92,246) 0%, rgb(59,130,246) 100%)'
    };
  }
  
  return {
    backgroundImage: `
      linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%),
      url(${profilePictureUrl})
    `,
    backgroundSize: 'cover, 120% 120%',
    backgroundPosition: 'center, center',
    filter: 'blur(20px) saturate(1.5) brightness(0.6)',
    transform: 'scale(1.1)', // Slightly scale to hide blur edges
  };
};

// Add this function before the KOLProfileModal component:
const calculateRank = (data: any) => {
  if (!data) return 'F';

  // Extract numeric values
  const pnlValue = parseFloat(data.pnl?.replace(/[^0-9.-]/g, '') || '0');
  const winRate = parseFloat(data.winRate?.replace('%', '') || '0');
  const totalTrades = parseInt(data.tokensTraded) || 0;
  const holdTimeSeconds = parseInt(data.holdTime?.split(' ')[0] || '0');
  const bestTradePercentage = data.bestTradePercentage || 0;

  // Calculate component scores (same as IMU rank)
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

const KOLProfileModal = ({ 
  kol, 
  voteCount, 
  comments, 
  loadingComments, 
  onClose, 
  onVote, 
  onCommentSubmit, 
  newComment, 
  setNewComment, 
  commentError, 
  userHasToken, 
  onShowEditInfo,
  loadingGMGNData,
  selectedKOLData,
  gmgnError,
  onShowCommunityNoteModal
}: {
  kol: KOL;
  voteCount: number;
  comments: Comment[];
  loadingComments: boolean;
  onClose: () => void;
  onVote: (address: string, type: 'up' | 'down') => void;
  onCommentSubmit: () => void;
  newComment: string;
  setNewComment: (value: string) => void;
  commentError: string;
  userHasToken: boolean;
  onShowEditInfo: () => void;
  loadingGMGNData: boolean;
  selectedKOLData: GMGNData | null;
  gmgnError: string | null;
  onShowCommunityNoteModal: () => void;
}) => {
    const { connected, publicKey } = useWallet();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isAnimatingFullscreen, setIsAnimatingFullscreen] = useState(false);

    const handleCopyAddress = () => {
      navigator.clipboard.writeText(kol.solana_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const twitterHandle = kol.twitter?.split('/').pop() || kol.twitter;
    const imuRank = selectedKOLData ? calculateRank(selectedKOLData) : 'N/A';
    const sentimentScore = calculateSentimentScore(selectedKOLData, voteCount);
    const isInactive = kol.tags?.includes('Inactive') || selectedKOLData?.isInactive;
    const bannerStyle = getKOLBannerStyle(kol.profile_picture || '/default-avatar.png');

    const handleFullscreen = () => {
      setIsAnimatingFullscreen(true);
      setTimeout(() => {
        setIsFullscreen(!isFullscreen);
        setIsAnimatingFullscreen(false);
      }, 100);
    };

    return (
      <motion.div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center transition-all duration-500 ${isFullscreen ? 'p-0' : 'p-4'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-700/50 overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ 
            scale: 1, 
            y: 0,
            width: isFullscreen ? '100vw' : 'min(90vw, 112rem)',
            height: isFullscreen ? '100vh' : 'min(90vh, 60rem)',
            borderRadius: isFullscreen ? '0px' : '24px'
          }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full overflow-y-auto">
            <motion.div 
              className="relative overflow-hidden"
              style={bannerStyle}
              animate={{ 
                height: isFullscreen ? '200px' : '192px'
              }}
              transition={{ duration: 0.5 }}
            >
              {/* Remove the existing background gradient and img since it's now in the style */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
              
              {/* Rest of your banner content */}
              <motion.button
                onClick={handleFullscreen}
                className="absolute top-4 right-4 p-3 rounded-xl bg-black/40 hover:bg-black/60 transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isAnimatingFullscreen ? {
                  rotate: [0, 90, 180],
                  scale: [1, 1.2, 1]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{
                    rotate: isFullscreen ? 180 : 0
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Maximize2 
                    size={22} 
                    className={`transition-colors duration-300 ${isFullscreen ? 'text-blue-400' : 'text-white'} group-hover:text-blue-300`} 
                  />
                </motion.div>
                
                {isAnimatingFullscreen && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-blue-500/30"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="relative"
              animate={{ opacity: isAnimatingFullscreen ? 0.8 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="absolute left-8"
                animate={{ 
                  top: isFullscreen ? '-24px' : '-80px',
                  scale: isFullscreen ? 1.1 : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="w-40 h-40 rounded-2xl border-4 border-gray-900 bg-gray-800 overflow-hidden shadow-2xl relative">
                  <img src={kol.profile_picture} alt={kol.name} className="w-full h-full object-cover" />
                  <motion.div 
                    className={`absolute bottom-2 right-2 w-6 h-6 ${isInactive ? 'bg-gray-500' : 'bg-green-500'} rounded-full border-3 border-gray-900 flex items-center justify-center`}
                    animate={!isInactive ? {
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0.4)",
                        "0 0 0 8px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)"
                      ]
                    } : {}}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  >
                    {isInactive ? <WifiOff size={12} className="text-white" /> : <Wifi size={12} className="text-white" />}
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                className="px-8 pb-8"
                animate={{ 
                  paddingTop: isFullscreen ? '2rem' : '6rem'
                }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="absolute top-4 right-8 flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {kol.twitter && (
                    <motion.a 
                      href={`https://x.com/${twitterHandle}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-xl bg-black hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title={`Follow ${kol.name} on X`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </motion.a>
                  )}
                  
                  {kol.links?.map((link: { type: string; url: string }, index: number) => (
                    <motion.a 
                      key={`${link.type}-${index}`} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-xl bg-gray-900/50 hover:bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title={`${kol.name} on ${link.type.charAt(0).toUpperCase() + link.type.slice(1)}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + (index * 0.1) }}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {getLinkIcon(link.type, 20)}
                    </motion.a>
                  ))}
                </motion.div>

                {/* Name, Handle, and Tags - Responsive layout */}
                <motion.div 
                  className={`mb-6 ${isFullscreen ? 'flex items-start gap-8' : ''}`}
                  animate={{
                    marginTop: isFullscreen ? '0rem' : '0rem' // Adjust top spacing
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Profile picture spacer in fullscreen mode */}
                  {isFullscreen && <div className="w-40 flex-shrink-0"></div>}
                  
                  {/* Content section */}
                  <div className={`${isFullscreen ? 'flex-1 mt-4' : ''}`}>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">{kol.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">@</span>{twitterHandle}
                      </span>
                      <span className="text-gray-600">•</span>

                      <span className="flex items-center gap-2 font-mono text-xs">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyAddress(); }}
                          className="flex items-center gap-1 hover:text-white focus:outline-none"
                          title={copied ? 'Copied!' : 'Copy address'}
                        >
                          {kol.solana_address.slice(0, 6)}…{kol.solana_address.slice(-6)}
                          <Copy
                            size={12}
                            className={`ml-1 transition-colors ${copied ? 'text-green-400' : 'text-gray-400'}`}
                          />
                        </button>

                        <a
                          href={`https://solscan.io/account/${kol.solana_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-white"
                          title="View on Solscan"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {kol.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-700/30 px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Community Notes Section */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-300">Community Notes</h3>
                      <div className="relative group">
                        <Info 
                          size={16} 
                          className="text-gray-400 hover:text-gray-300 cursor-help transition-colors" 
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-xs text-gray-300 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="font-semibold mb-2">How Community Notes Work:</div>
                          <ul className="space-y-1">
                            <li>• Submit notes about this KOL's trading style, expertise, or notable achievements</li>
                            <li>• One note per wallet address allowed</li>
                            <li>• 200 character limit per note</li>
                            <li>• All submissions are reviewed by moderators</li>
                            <li>• Notes must be factual, respectful, and trading-related</li>
                          </ul>
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <span className="text-purple-400 font-medium">Click "Add Note" to contribute!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={onShowCommunityNoteModal} 
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20"
                      disabled={!connected}
                    >
                      <Edit size={14}/> Add Note
                    </button>
                  </div>
                  
                  {/* Community Notes Display */}
                  <div className="space-y-3">
                    {kol.communityNotes && kol.communityNotes.length > 0 ? (
                      kol.communityNotes.map((note: string, index: number) => (
                        <div 
                          key={index}
                          className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-400 font-medium">
                              Community Note #{index + 1}
                            </span>
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{note}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-12 h-12 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm mb-2">No community notes yet</p>
                        <p className="text-xs text-gray-400">Be the first to share insights about {kol.name}!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Stats Tags (could replace or supplement community notes) */}
                  {kol.tradingStyle && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="flex flex-wrap gap-2">
                        {kol.tradingStyle.map((style: string, index: number) => (
                          <span 
                            key={index}
                            className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Grid: Stats & Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left column for stats - reduce width */}
                  <div className="lg:col-span-1 space-y-4">
                    {/* Community Score Card */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200">
                      <h4 className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">Community Score</h4>
                      <div className="flex items-center justify-between mb-6">
                        <button 
                          onClick={() => onVote(kol.solana_address, 'up')} 
                          className="flex flex-col items-center gap-2 text-green-400 hover:text-green-300 disabled:opacity-50 transition-all duration-200 group" 
                          disabled={!userHasToken}
                        > 
                          <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <ThumbsUp size={20}/> 
                          </div>
                          <span className="text-xs">Upvote</span>
                        </button>
                        <span className={`text-4xl font-bold ${voteCount > 0 ? 'text-green-400' : voteCount < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {voteCount > 0 ? `+${voteCount}`: voteCount}
                        </span>
                        <button 
                          onClick={() => onVote(kol.solana_address, 'down')} 
                          className="flex flex-col items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50 transition-all duration-200 group" 
                          disabled={!userHasToken}
                        > 
                          <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <ThumbsDown size={20}/> 
                          </div>
                          <span className="text-xs">Downvote</span>
                        </button>
                      </div>

                      {/* Sentiment Score Section */}
                      <div className="border-t border-gray-700/50 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-400 text-sm uppercase tracking-wider">Sentiment Score</h4>
                          <div className="relative">
                            <button
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                              className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
                            >
                              <Info size={14} className="text-gray-400" />
                            </button>
                            {showTooltip && (
                              <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-xs text-gray-300 z-10">
                                <div className="font-semibold mb-2">How we calculate (Max: 100):</div>
                                <ul className="space-y-1">
                                  <li>• 50% - Trading performance (IMU Rank)</li>
                                  <li>• 35% - Community votes</li>
                                  <li>• 25% - Trading activity (tokens traded)</li>
                                  <li>• Penalty: Very low scores for inactive accounts</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        {loadingGMGNData ? (
                          <div className="flex flex-col justify-center items-center py-4">
                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-2"></div>
                            <div className="text-purple-300 text-xs">Calculating...</div>
                          </div>
                        ) : gmgnError ? (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-500">--</div>
                            <div className="text-xs text-red-400 mt-1">Failed to load data</div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                              {sentimentScore}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Rank: {imuRank} • Votes: {voteCount}
                              {selectedKOLData?.tokensTraded && selectedKOLData.tokensTraded >= 500 && (
                                <span className="block text-green-400">⚡ High Activity</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trading Stats Card */}
                    {selectedKOLData && (
                      <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 space-y-4">
                        <h4 className="font-semibold text-gray-400 text-sm uppercase tracking-wider">Trading Stats (30D)</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">PNL</span>
                            <span className={`font-semibold ${selectedKOLData.pnl.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                              {selectedKOLData.pnl}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Win Rate</span>
                            <span className="font-semibold">{selectedKOLData.winRate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Tokens Traded</span>
                            <span className="font-semibold">{selectedKOLData.tokensTraded}</span>
                          </div>
                          {selectedKOLData.bestTrade && selectedKOLData.bestTrade !== 'N/A' && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Best Trade</span>
                              <span className="font-semibold text-white">
                                {selectedKOLData.bestTrade}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right section for comments - spans remaining 3 columns and starts from left */}
                  <div className="lg:col-span-3">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
                      <h3 className="font-semibold mb-4 text-gray-300 uppercase tracking-wider text-sm">Community Discussion</h3>
                      <div className="space-y-4">
                        {/* Comment Input */}
                        <div className="flex items-start gap-3">
                          <textarea 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            placeholder={!connected ? "Connect wallet to comment" : !userHasToken ? "Token required to comment" : "Share your thoughts..."}
                            className="w-full bg-gray-900/50 rounded-xl p-4 text-sm border border-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                            rows={3}
                            disabled={!connected || !userHasToken}
                          />
                          <button 
                            onClick={onCommentSubmit}
                            disabled={!connected || !userHasToken || !newComment.trim()}
                            className="p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                          > 
                            <Send size={20} /> 
                          </button>
                        </div>
                        {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
                        
                        {/* Comments List - Better spacing and alignment */}
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {loadingComments ? (
                            <div className="text-center py-12">
                              <div className="inline-flex items-center gap-2 text-gray-500">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading comments...
                              </div>
                            </div>
                          ) : comments.length > 0 ? (
                            comments.map((comment: Comment, i: number) => (
                              <motion.div 
                                key={comment.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-xl hover:bg-gray-900/50 transition-colors border border-gray-800/30"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm">
                                  {comment.author_wallet.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-gray-200 text-sm">
                                      {comment.author_wallet.slice(0,6)}...{comment.author_wallet.slice(-4)}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(comment.timestamp).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm leading-relaxed break-words">{comment.message}</p>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-16 text-gray-500">
                              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                              <h4 className="text-lg font-medium mb-2">No comments yet</h4>
                              <p className="text-sm">Be the first to share your thoughts about {kol.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
};
