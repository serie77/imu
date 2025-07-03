"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { X, ChevronRight, ArrowRight, TrendingUp, HelpCircle, Zap, Info } from 'lucide-react';

const AiAssistant = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [hasShownInitialBubble, setHasShownInitialBubble] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [selectedInfo, setSelectedInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [fullText, setFullText] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(30); // milliseconds per character
  const characterRef = useRef(null);
  
  // Single load effect - only loads once after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Show initial bubble only once after assistant appears
      if (!hasShownInitialBubble) {
        setTimeout(() => {
          setShowBubble(true);
          setHasShownInitialBubble(true);
          // Auto-hide bubble after 5 seconds
          setTimeout(() => {
            setShowBubble(false);
          }, 5000);
        }, 2000);
      }
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this only runs once
  
  // Show bubble on stats page
  useEffect(() => {
    if (isVisible && pathname === '/stats' && !isChatOpen) {
      setShowBubble(true);
      // Auto-hide after 3 seconds on stats page
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pathname, isVisible, isChatOpen]);
  
  // Handle mouse enter/leave for hover bubble
  const handleMouseEnter = () => {
    if (!isChatOpen && isVisible) {
      setShowBubble(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isChatOpen) {
      setShowBubble(false);
    }
  };

  // Hide bubble when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setShowBubble(false);
    }
  }, [isChatOpen]);
  
  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000); // Random blink between 2-5 seconds
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  // Track mouse position for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!characterRef.current) return;
      
      // Calculate normalized position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      
      // Limit movement range
      const limitedX = Math.max(-1, Math.min(1, x)) * 2;
      const limitedY = Math.max(-1, Math.min(1, y)) * 2;
      
      setEyePosition({ x: limitedX, y: limitedY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Typing animation effect
  useEffect(() => {
    if (isTyping && typingText.length < fullText.length) {
      const timer = setTimeout(() => {
        setTypingText(fullText.substring(0, typingText.length + 1));
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else if (typingText.length === fullText.length) {
      setIsTyping(false);
    }
  }, [isTyping, typingText, fullText, typingSpeed]);
  
  // Start typing animation with given text
  const startTypingAnimation = (text: string) => {
    setFullText(text);
    setTypingText("");
    setIsTyping(true);
  };
  
  // Custom prompts
  const customPrompts = [
    { 
      text: "What are KOLs and how do I track them?", 
      action: "showInfo", 
      info: "KOLs (Key Opinion Leaders) are influential traders and content creators in the Solana ecosystem. Our platform tracks the top performing KOLs, their trade history, win rates, and community engagement. You can follow their moves, see their recent trades, and analyze their performance patterns. Navigate to the KOL section to explore over 50+ verified influential traders.",
      icon: <Info size={16} className="mr-2" />
    },
    { 
      text: "Check out top KOLs", 
      action: "navigate", 
      path: "/kol",
      icon: <TrendingUp size={16} className="mr-2" />
    },
    { 
      text: "What's my IMU wallet ranking?", 
      action: "navigate", 
      path: "/imurank",
      icon: <HelpCircle size={16} className="mr-2" />
    },
    { 
      text: "How's the Solana market doing?", 
      action: "navigate", 
      path: "/marketstats",
      icon: <TrendingUp size={16} className="mr-2" />
    },
    { 
      text: "How does the sentiment score work?", 
      action: "showInfo", 
      info: "Our sentiment score analyzes social media mentions, trading volume patterns, and community engagement to give each token a score from 0-100. Higher scores indicate positive market sentiment and growing community interest. The score updates in real-time and helps identify trending tokens before they pump.",
      icon: <HelpCircle size={16} className="mr-2" />
    },
    { 
      text: "How does IMU help traders improve?", 
      action: "showInfo",
      info: "IMU provides comprehensive trading intelligence through KOL tracking, real-time sentiment analysis, and wallet ranking systems. We help traders identify profitable patterns, follow successful traders, and make data-driven decisions. Our platform reduces research time and increases win rates by giving you the same tools and insights that top traders use.",
      icon: <Zap size={16} className="mr-2" />
    }
  ];
  
  // Trading fun facts
  const tradingFacts = [
    "The average Solana block time is just 400 milliseconds, making it one of the fastest blockchains for trading.",
    "Over 80% of day traders lose money in their first year of trading.",
    "The term 'HODL' originated from a typo in a Bitcoin forum post in 2013.",
    "Solana can process over 65,000 transactions per second, compared to Ethereum's ~15 TPS.",
    "The most expensive NFT ever sold on Solana was 'Degen Poet #7557' for 15,000 SOL.",
    "The average trading volume on Solana DEXs exceeds $250 million daily.",
    "Market makers provide over 90% of the liquidity on major Solana exchanges."
  ];
  
  // Handle prompt selection
  const handlePromptSelection = (prompt: any) => {
    setSelectedInfo(null); // Clear previous info
    
    switch(prompt.action) {
      case "navigate":
        // Add smooth transition before navigation
        startTypingAnimation(`Taking you to ${prompt.path.replace('/', '')} page...`);
        setSelectedInfo(""); // Set empty to show typing animation
        setTimeout(() => {
          router.push(prompt.path);
          setIsChatOpen(false);
        }, 2000);
        break;
      case "showInfo":
        setSelectedInfo(""); // Set empty to show typing animation
        startTypingAnimation(prompt.info);
        break;
      case "showFacts":
        // Show a random fact with typing animation
        const randomFact = tradingFacts[Math.floor(Math.random() * tradingFacts.length)];
        setSelectedInfo(""); // Set empty to show typing animation
        startTypingAnimation(randomFact);
        break;
      default:
        break;
    }
  };
  
  // Handle back button
  const handleBack = () => {
    setSelectedInfo(null);
    setFullText("");
    setTypingText("");
    setIsTyping(false);
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsChatOpen(false);
  };
  
  // Render nothing if not visible
  if (!isVisible) return null;
  
  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50" 
      ref={characterRef}
      initial={{ opacity: 0, scale: 0, y: 100, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
      transition={{ 
        duration: 1.2, 
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Speech Bubble with entrance animation */}
      <AnimatePresence>
        {showBubble && !isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 10, scale: 0.9, x: 20 }}
            transition={{ 
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="absolute bottom-full right-0 mb-4 p-4 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-2xl rounded-br-none text-white max-w-xs shadow-lg"
            style={{ transformOrigin: 'bottom right' }}
          >
            <div className="text-sm font-medium">
              {pathname === '/stats' ? "Check out the stats!" : "Hi, I'm your IMU agent! Open me!"}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-red-500 via-red-600 to-red-800 transform translate-y-1/2 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* AI Character */}
      <motion.div 
        className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95, rotate: -5 }}
        animate={{
          y: [0, -10, 0],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        onClick={() => {
          setIsChatOpen(!isChatOpen);
          setShowBubble(false);
        }}
      >
        {/* Face */}
        <div className="relative w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
          {/* Eyes */}
          <div className="absolute w-10 h-3 top-5 flex justify-between">
            {/* Left Eye */}
            <div className="w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
              <motion.div 
                className="w-1.5 h-1.5 bg-red-400 rounded-full"
                animate={{ 
                  x: eyePosition.x, 
                  y: eyePosition.y,
                  scale: isBlinking ? 0.1 : 1,
                  opacity: isBlinking ? 0 : 1
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  scale: { duration: 0.1 },
                  opacity: { duration: 0.1 }
                }}
              />
            </div>
            
            {/* Right Eye */}
            <div className="w-3 h-3 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
              <motion.div 
                className="w-1.5 h-1.5 bg-red-400 rounded-full"
                animate={{ 
                  x: eyePosition.x, 
                  y: eyePosition.y,
                  scale: isBlinking ? 0.1 : 1,
                  opacity: isBlinking ? 0 : 1
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  scale: { duration: 0.1 },
                  opacity: { duration: 0.1 }
                }}
              />
            </div>
          </div>
          
          {/* Mouth */}
          <motion.div 
            className="absolute bg-red-400 rounded-full top-10"
            animate={{ 
              width: isChatOpen || isTyping ? 8 : 6,
              height: isChatOpen || isTyping ? 3 : 1
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          />
        </div>
      </motion.div>
      
      {/* Enhanced Chat Interface */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-80 bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl z-40 flex flex-col border border-red-500/20"
            style={{ maxHeight: '450px' }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-4 border-b border-red-500/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">IMU AI Assistant</h3>
                    <p className="text-red-300 text-xs">Neural Network Active</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body - Make it scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                {selectedInfo === null ? (
                  <div className="space-y-3">
                    <div className="text-white text-sm mb-4 font-medium">
                      <span className="text-red-400">▶</span> Select a query to process:
                    </div>
                    {customPrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        className="w-full text-left p-3 bg-gray-800/50 hover:bg-red-500/10 rounded-xl transition-all duration-300 
                                  border border-gray-700/50 hover:border-red-500/30 group"
                        onClick={() => handlePromptSelection(prompt)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center text-sm text-gray-300 group-hover:text-white">
                          <span className="text-red-400 mr-2">◦</span>
                          {prompt.text}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* AI Response */}
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        <span className="text-red-400 text-xs font-medium">AI RESPONSE</span>
                      </div>
                      
                      <div className="text-gray-300 text-sm leading-relaxed">
                        {isTyping ? (
                          <span>
                            {typingText}
                            <span className="animate-pulse text-red-400">|</span>
                          </span>
                        ) : (
                          fullText
                        )}
                      </div>
                    </div>

                    {/* Back Button */}
                    <motion.button
                      className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 
                                border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium"
                      onClick={handleBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ← Process New Query
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AiAssistant; 