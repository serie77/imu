'use client';

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center w-full max-w-6xl mx-auto px-4 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <motion.h2
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500 drop-shadow-lg font-mono"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            IMU
          </motion.h2>

          <motion.p
            className="text-base text-gray-400 max-w-2xl mx-auto font-mono tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            The AI Agent designed for trenchers. Get the latest real-time market data and see what the KOLs are up to.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href="/stats">
              <motion.button
                className="relative group px-5 py-2.5 bg-gray-800/30 backdrop-blur-xl rounded-xl
                  border-2 border-gray-700/50 hover:border-red-500/50 transition-all duration-500
                  text-white font-semibold text-base shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]
                  hover:shadow-[inset_0_0_20px_rgba(255,0,0,0.1)] overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-2">
                  <span>Get Started</span>
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </div>
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="w-full max-w-2xl mx-auto relative aspect-[16/9]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden 
            border-2 border-gray-700/50 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]
            group hover:border-red-500/50 transition-all duration-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image
              src="/imu.png"
              alt="IMU Interface"
              layout="fill"
              objectFit="cover"
              className="rounded-2xl"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}