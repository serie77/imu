'use client';

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer 
      className="relative flex items-center justify-center px-6 py-4 bg-gray-900/90 backdrop-blur-sm text-gray-400 shadow-lg font-mono border-t border-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2">
        <span>Designed By</span>
        <motion.span 
          className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500 font-bold"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          Imu
        </motion.span>
      </div>
      
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
    </motion.footer>
  );
}