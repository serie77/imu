'use client';

import Link from "next/link";
import { motion } from "framer-motion";

export default function StatsPage() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Content */}
      <motion.div
        className="relative z-10 text-white px-6 md:px-8 w-full max-w-7xl mx-auto"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-7xl font-bold mb-4 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500 drop-shadow-lg">
            GET ALL THE STATS
          </span>
        </h2>
        <p className="text-gray-400 text-xl mb-16 max-w-2xl mx-auto">
          Comprehensive analytics and insights for informed decision-making
        </p>

        {/* Stats Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Market Stats Button */}
          <Link
            href="/marketstats"
            className="group relative overflow-hidden bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl 
              border border-gray-700/50 hover:border-red-500/50 transition-all duration-500 
              shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,0,0,0.1)]
              flex flex-col items-center justify-center"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent" />
              <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/10 to-transparent rotate-45 group-hover:via-red-500/20" style={{ width: '800%', height: '800%' }} />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-br from-white via-red-100 to-white bg-clip-text text-transparent relative z-10 mb-3">
              Market Stats
            </h3>
            <p className="text-sm text-gray-400 relative z-10">Track market activity and trading volume across different mediums</p>
          </Link>

          {/* KOL Activity Button */}
          <Link
            href="/kol"
            className="group relative overflow-hidden bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl 
              border border-gray-700/50 hover:border-pink-500/50 transition-all duration-500 
              shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,192,203,0.1)]
              flex flex-col items-center justify-center"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-transparent" />
              <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-pink-500/10 to-transparent rotate-45 group-hover:via-pink-500/20" style={{ width: '800%', height: '800%' }} />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-br from-white via-pink-100 to-white bg-clip-text text-transparent relative z-10 mb-3">
              KOL Stats
            </h3>
            <p className="text-sm text-gray-400 relative z-10">Monitor influencer activities</p>
          </Link>

          {/* IMU Rank Button */}
          <Link
            href="/imurank"
            className="group relative overflow-hidden bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl 
              border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 
              shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(128,0,128,0.1)]
              flex flex-col items-center justify-center"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent" />
              <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent rotate-45 group-hover:via-purple-500/20" style={{ width: '800%', height: '800%' }} />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-br from-white via-purple-100 to-white bg-clip-text text-transparent relative z-10 mb-3">
              IMU Rank
            </h3>
            <p className="text-sm text-gray-400 relative z-10">See how strong you are on-chain</p>
          </Link>

          {/* Gitbook Button */}
          <a
            href="https://imu-1.gitbook.io/imu-docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl 
              border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-500 
              shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,193,7,0.1)]
              flex flex-col items-center justify-center"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 duration-700 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent" />
              <div className="absolute -inset-[400%] animate-[spin_8s_linear_infinite] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent rotate-45 group-hover:via-yellow-500/20" style={{ width: '800%', height: '800%' }} />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-br from-white via-yellow-100 to-white bg-clip-text text-transparent relative z-10 mb-3">
              Gitbook
            </h3>
            <p className="text-sm text-gray-400 relative z-10">Find out how IMU works</p>
          </a>
        </div>
      </motion.div>
    </section>
  );
}