"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User, Map, ChevronRight } from 'lucide-react';
// Import icons individually to avoid undefined errors
import { BarChart2 } from 'lucide-react';
import { Bot } from 'lucide-react';
import { Coins } from 'lucide-react';

// Add proper interface for the component props
interface AiChatProps {
  isOpen: boolean;
  onClose: () => void;
  personality: string;
  userName: string;
  onSaveUserName: (name: string) => void;
  onSavePersonality: (personality: string) => void;
  personalities: Array<{
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
  }>;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AiChat = ({ 
  isOpen, 
  onClose, 
  personality, 
  userName, 
  onSaveUserName, 
  onSavePersonality,
  personalities,
  currentPath,
  onNavigate
}: AiChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [nameInput, setNameInput] = useState(userName || '');
  const [typingMessage, setTypingMessage] = useState<any>(null);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(30); // milliseconds per character
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedInfo, setSelectedInfo] = useState<any>(null);

  // Predefined questions
  const predefinedOptions = [
    { 
      text: "How is the Solana market doing today?", 
      action: "navigate", 
      path: "/market-status",
      icon: <BarChart2 size={16} className="mr-2" />
    },
    { 
      text: "What are the best trading bots right now?", 
      action: "showInfo", 
      info: "Based on trading volume, Axiom is currently the leading trading bot in the Solana ecosystem. It processes over 1 million transactions daily with advanced MEV protection and minimal slippage.",
      icon: <Bot />
    },
    { 
      text: "What are the top Solana tokens to watch?", 
      action: "navigate", 
      path: "/top-tokens",
      icon: <Coins size={16} className="mr-2" />
    }
  ];

  // Initialize chat with greeting and suggestions when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && !typingMessage) {
      const greeting = userName 
        ? `Hi ${userName}! How can I help you with Solana today?` 
        : "Hi there! How can I help you learn about Solana today?";
      
      // Start typing animation for greeting
      startTypingAnimation({ 
        role: 'assistant', 
        content: greeting,
        options: predefinedOptions
      });
    }
  }, [isOpen, userName, messages.length, typingMessage]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingIndex]);

  // Typing animation effect
  useEffect(() => {
    if (!typingMessage) return;
    
    if (typingIndex < typingMessage.content.length) {
      const timer = setTimeout(() => {
        setTypingIndex(prev => prev + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else {
      // Typing complete, add the full message to the messages array
      setMessages(prev => [...prev, typingMessage]);
      setTypingMessage(null);
      setTypingIndex(0);
      setIsLoading(false);
    }
  }, [typingMessage, typingIndex, typingSpeed]);

  const startTypingAnimation = (message: any) => {
    setTypingMessage(message);
    setTypingIndex(0);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || typingMessage) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Handle special commands
    if (input.startsWith('/')) {
      handleSpecialCommands(input);
      return;
    }
    
    try {
      // Simulate AI response
      setTimeout(() => {
        const responseOptions = getResponseOptions(input);
        startTypingAnimation({ 
          role: 'assistant', 
          content: getAIResponse(input),
          options: responseOptions
        });
      }, 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
      setIsLoading(false);
    }
  };
  
  const handleSpecialCommands = (command: string) => {
    const cmd = command.toLowerCase();
    
    if (cmd.startsWith('/name ')) {
      const newName = command.substring(6).trim();
      if (newName) {
        onSaveUserName(newName);
        setNameInput(newName);
        startTypingAnimation({ 
          role: 'assistant', 
          content: `Great! I'll call you ${newName} from now on.`
        });
      } else {
        startTypingAnimation({ 
          role: 'assistant', 
          content: "Please provide a name after the /name command."
        });
      }
    } else if (cmd === '/help') {
      startTypingAnimation({ 
        role: 'assistant', 
        content: "Available commands:\n/name [your name] - Set your name\n/help - Show this help message\n/clear - Clear chat history"
      });
    } else if (cmd === '/clear') {
      setMessages([]);
      startTypingAnimation({ 
        role: 'assistant', 
        content: "Chat history cleared.",
        options: predefinedOptions
      });
    } else {
      startTypingAnimation({ 
        role: 'assistant', 
        content: "Unknown command. Type /help to see available commands."
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return `Hello${userName ? ' ' + userName : ''}! How can I help you today?`;
    } else if (input.includes('solana') && (input.includes('what is') || input.includes("what's"))) {
      return "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale. It's known for its fast transactions and low fees.";
    } else if (input.includes('nft')) {
      return "NFTs (Non-Fungible Tokens) on Solana are digital assets that represent ownership of unique items. Solana's low fees make it popular for NFT projects.";
    } else if (input.includes('defi') || input.includes('decentralized finance')) {
      return "DeFi on Solana includes decentralized exchanges, lending platforms, and yield farming opportunities. Popular projects include Raydium, Marinade Finance, and Solend.";
    } else if (input.includes('wallet')) {
      return "Popular Solana wallets include Phantom, Solflare, and Backpack. They allow you to store, send, and receive SOL and other Solana tokens.";
    } else if (input.includes('thank')) {
      return "You're welcome! Is there anything else you'd like to know about Solana?";
    } else {
      return "That's an interesting question about Solana. While I'm just a simple assistant, you can find more detailed information in our documentation or community forums.";
    }
  };
  
  const getResponseOptions = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('nft')) {
      return [
        { text: "Explore NFT collections", action: "navigate", path: "/nfts" },
        { text: "Learn about NFT minting", action: "navigate", path: "/learn/nft-minting" }
      ];
    } else if (input.includes('defi') || input.includes('decentralized finance')) {
      return [
        { text: "View DeFi projects", action: "navigate", path: "/projects/defi" },
        { text: "Check current yields", action: "navigate", path: "/defi/yields" }
      ];
    } else if (input.includes('wallet')) {
      return [
        { text: "Set up a wallet", action: "navigate", path: "/learn/wallets" },
        { text: "Wallet security tips", action: "navigate", path: "/learn/security" }
      ];
    } else {
      return predefinedOptions;
    }
  };
  
  const handleOptionClick = (option: any) => {
    if (option.action === "navigate") {
      onNavigate(option.path);
      onClose();
    } else if (option.action === "showInfo") {
      setSelectedInfo(option.info);
    }
  };
  
  const renderChatTab = () => (
    <>
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedInfo ? (
          <div className="space-y-4">
            <div className="p-3 bg-gray-800 rounded-lg text-white text-sm">
              {selectedInfo}
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              Back to chat
            </button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-800 text-white rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
                
                {/* Options */}
                {message.role === 'assistant' && message.options && (
                  <div className="mt-2 space-y-1">
                    {message.options.map((option: any, optIndex: number) => (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionClick(option)}
                        className="block text-left w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                      >
                        <div className="flex items-center">
                          {option.icon && (
                            <span className="mr-2">
                              {option.icon}
                            </span>
                          )}
                          <span>{option.text}</span>
                          <ChevronRight size={14} className="ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing animation */}
            {typingMessage && (
              <div className="mb-4 text-left">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-800 text-white rounded-tl-none">
                  {typingMessage.content.substring(0, typingIndex)}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input Area */}
      {!selectedInfo && (
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              disabled={isLoading || typingMessage !== null}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || typingMessage !== null}
              className={`ml-2 p-2 rounded-full ${
                !input.trim() || isLoading || typingMessage !== null
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
  
  const renderProfileTab = () => (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Your Profile</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Assistant Personality</label>
          <div className="grid grid-cols-2 gap-2">
            {personalities.map((p) => (
              <button
                key={p.name}
                onClick={() => onSavePersonality(p.name)}
                className={`p-2 rounded-lg text-white text-sm ${
                  personality === p.id
                    ? `bg-blue-600 ring-2 ring-white`
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Typing Speed</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTypingSpeed(15)}
              className={`p-2 rounded-lg text-white text-sm ${
                typingSpeed === 15 ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Fast
            </button>
            <button
              onClick={() => setTypingSpeed(30)}
              className={`p-2 rounded-lg text-white text-sm ${
                typingSpeed === 30 ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setTypingSpeed(80)}
              className={`p-2 rounded-lg text-white text-sm ${
                typingSpeed === 80 ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Slow
            </button>
          </div>
        </div>
        
        <button
          onClick={() => {
            onSaveUserName(nameInput);
            setActiveTab('chat');
          }}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
  
  const renderNavigationTab = () => (
    <div className="flex-1 p-4 overflow-y-auto">
      <h3 className="text-lg font-medium text-white mb-4">Site Navigation</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => onNavigate('/')}
          className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
        >
          Home Page
        </button>
        <button
          onClick={() => onNavigate('/projects')}
          className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
        >
          Solana Projects
        </button>
        <button
          onClick={() => onNavigate('/learn')}
          className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
        >
          Learn Solana
        </button>
        <button
          onClick={() => onNavigate('/nfts')}
          className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
        >
          NFT Collections
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-6 w-80 bg-gray-900 rounded-2xl overflow-hidden shadow-xl z-40 flex flex-col"
          style={{ height: '500px' }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
        >
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 flex justify-between items-center">
            <h3 className="text-white font-medium">Solana Assistant</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'navigation' && renderNavigationTab()}
          
          {/* Tab Navigation */}
          {activeTab === 'chat' && (
            <div className="flex border-t border-gray-800">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex-1 py-2 text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center"
              >
                <User size={16} className="mr-1" />
                <span className="text-xs">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('navigation')}
                className="flex-1 py-2 text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center"
              >
                <Map size={16} className="mr-1" />
                <span className="text-xs">Navigate</span>
              </button>
            </div>
          )}
          
          {/* Back button for non-chat tabs */}
          {activeTab !== 'chat' && (
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={() => setActiveTab('chat')}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Back to Chat
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiChat; 