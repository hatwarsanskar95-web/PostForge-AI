"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Zap } from "lucide-react";

export function GenerationLoader({ hideDescription = false }: { hideDescription?: boolean }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTime((Date.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const messages = [
    "Analyzing context...",
    "Synthesizing thoughts...",
    "Drafting content...",
    "Applying professional polish...",
    "Finalizing formatting..."
  ];

  const currentMessage = messages[Math.min(Math.floor(time / 4), messages.length - 1)];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 relative overflow-hidden">
      {/* Background Pulse */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-64 h-64 rounded-full bg-[#a855f7]/10 blur-[60px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Core Icon Animation */}
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-[#a855f7]/40"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-[#a855f7]/20"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-12 bg-[#a855f7]/20 rounded-full flex items-center justify-center border border-[#a855f7]/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            <BrainCircuit size={24} className="text-[#a855f7]" />
          </motion.div>
        </div>

        {/* Live Timer */}
        <div className="flex items-center gap-2 mb-3 bg-[#222225] border border-white/5 px-4 py-1.5 rounded-full shadow-lg">
          <Zap size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="font-mono text-xl font-bold text-white tracking-wider">
            {time.toFixed(1)}s
          </span>
        </div>

        {/* Dynamic Message */}
        <h3 className="text-[16px] text-white font-bold mb-2 flex items-center gap-2">
          {currentMessage} <Sparkles size={16} className="text-[#a855f7]" />
        </h3>
        
        {!hideDescription && (
          <p className="text-[13px] text-gray-500 text-center max-w-[280px]">
            Our AI engine is currently processing your request. This usually takes around 15-20 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
