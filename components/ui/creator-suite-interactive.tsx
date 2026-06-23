"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, X, Lightbulb } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";

type FeatureNode = {
  id: string;
  title: string;
  description: string;
  route: string;
  baseAngle: number;
  top: string;
  left: string;
  lineEnd: { x: number; y: number };
  status: "Available" | "Coming Soon" | "In Development";
  icon: React.ReactNode;
};

const FEATURES: FeatureNode[] = [
  {
    id: "achievement-gen",
    title: "Achievement Gen",
    description: "Turn certifications, awards, milestones, and accomplishments into professional LinkedIn posts.",
    route: "/dashboard/achievement-generator",
    baseAngle: 0,
    top: "10%",
    left: "50%",
    lineEnd: { x: 250.1, y: 50 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 21h8m-4-4v4M5 3H3a2 2 0 000 4c0 3.314 2.686 6 6 6h6c3.314 0 6-2.686 6-6a2 2 0 000-4h-2M5 3h14M5 3v6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 7l.5 1.5H14l-1.25.9.5 1.6L12 10.1l-1.25.9.5-1.6L10 8.5h1.5L12 7z" />
      </svg>
    )
  },
  {
    id: "image-to-post",
    title: "Image To Post",
    description: "Analyze images, certificates, screenshots, and achievements and generate LinkedIn-ready posts.",
    route: "/dashboard/image-to-post",
    baseAngle: 60,
    top: "30%",
    left: "84.64%",
    lineEnd: { x: 423, y: 150 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z" />
      </svg>
    )
  },
  {
    id: "resume-to-posts",
    title: "Resume To Posts",
    description: "Extract achievements, projects, skills, and experience from resumes and convert them into content.",
    route: "/dashboard/resume-to-posts",
    baseAngle: 120,
    top: "70%",
    left: "84.64%",
    lineEnd: { x: 423, y: 350 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 4a2 2 0 114 0v1H9V4z" />
        <circle cx="12" cy="9" r="1.5" strokeWidth="1.6" />
      </svg>
    )
  },
  {
    id: "content-improver",
    title: "Content Improver",
    description: "Enhance existing LinkedIn content with stronger hooks, structure, readability, and engagement.",
    route: "/dashboard/content-improver",
    baseAngle: 180,
    top: "90%",
    left: "50%",
    lineEnd: { x: 250.1, y: 450 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 9l1.5-1.5M18 6l.5-.5" />
      </svg>
    )
  },
  {
    id: "post-generator",
    title: "Post Generator",
    description: "Generate engaging LinkedIn posts from ideas, projects, experiences, and achievements using AI.",
    route: "/dashboard/post-generator",
    baseAngle: 240,
    top: "70%",
    left: "15.36%",
    lineEnd: { x: 77, y: 350 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.586 3.586a2 2 0 112.828 2.828L12 14.828l-4 1 1-4 8.586-8.242z" />
      </svg>
    )
  },
  {
    id: "case-study-forge",
    title: "Case Study Forge",
    description: "Transform real-world challenges, solutions, and outcomes into compelling case studies.",
    route: "/dashboard/project-generator",
    baseAngle: 300,
    top: "30%",
    left: "15.36%",
    lineEnd: { x: 77, y: 150 },
    status: "Available",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
];

function CenterHub() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 center-glow rounded-full" />
      <div
        className="w-28 h-28 rounded-full p-[3px] flex items-center justify-center relative z-10"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          boxShadow: '0 0 50px rgba(139,92,246,0.8), inset 0 0 20px rgba(139,92,246,0.5)',
        }}
      >
        <div
          className="w-full h-full bg-black rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle at 40% 35%, #1a0a3a, #050010)' }}
        >
          {/* Lightbulb center logo */}
          <Lightbulb size={54} className="text-violet-400" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.8))' }} />
        </div>
      </div>
    </div>
  );
}

export function CreatorSuiteInteractive() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureNode | null>(null);
  
  // High-performance motion values
  const rotation = useMotionValue(0);
  const counterRotation = useTransform(rotation, r => -r);

  // Animation controller
  useEffect(() => {
    let activeAnimation: any;

    if (!selectedFeature) {
      // Continuous idle rotation
      const current = rotation.get();
      activeAnimation = animate(rotation, current + 360, {
        duration: 40,
        ease: "linear",
        repeat: Infinity
      });
    } else {
      // Snap to specific node
      const targetAngle = -selectedFeature.baseAngle;
      const current = rotation.get();
      const currentMod = ((current % 360) + 360) % 360;
      const targetMod = ((targetAngle % 360) + 360) % 360;
      
      let delta = targetMod - currentMod;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      activeAnimation = animate(rotation, current + delta, {
        type: "spring",
        damping: 25,
        stiffness: 120
      });
    }

    return () => {
      if (activeAnimation) activeAnimation.stop();
    };
  }, [selectedFeature, rotation]);

  const handleNodeClick = (feature: FeatureNode, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dismiss
    setSelectedFeature(feature);
  };

  const handleDismiss = () => {
    setSelectedFeature(null);
  };

  return (
    <section
      className="max-w-7xl mx-auto h-[740px] glass-morphism rounded-3xl overflow-hidden relative flex flex-col cursor-default"
      data-purpose="creator-suite-interactive"
      onClick={handleDismiss}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .center-glow {
          background: radial-gradient(circle at center, #7c3aed, #4f46e5, transparent);
          filter: blur(20px);
          opacity: 0.6;
        }
      `}} />

      {/* Section Header */}
      <div className="p-6 sm:p-10 z-10 pointer-events-none relative">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #6d28d9, #3b0764)',
              border: '1.5px solid rgba(168,85,247,0.7)',
              boxShadow: '0 0 18px rgba(124,58,237,0.55)',
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
              <circle cx="12" cy="7.8" r="1.2" fill="white" stroke="none" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 7.8V9.2" />
            </svg>
          </div>
          <h2 className="flex items-center gap-0.5 leading-none">
            <span className="text-2xl font-black text-white tracking-tight uppercase">POST</span>
            <span className="text-2xl font-black text-violet-400 tracking-tight uppercase">FORGE</span>
            <span className="ml-1 text-[11px] font-extrabold text-violet-300 border border-violet-500/60 rounded px-1.5 py-0.5 leading-none tracking-widest">AI</span>
          </h2>
        </div>
        <p className="text-gray-400 text-sm">Select a node to explore the module</p>
      </div>

      {/* Node Network Container */}
      <div className="absolute inset-0 flex items-center justify-center scale-75 sm:scale-100 mt-8 sm:mt-0">
        <CenterHub />

        <motion.div 
          className="relative w-[500px] h-[500px]"
          style={{ rotate: rotation }}
        >
          {/* Background Orbit Circle */}
          <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />

          {/* Connecting Lines */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 500 500">
              <defs>
                <filter id="lineGlow" filterUnits="userSpaceOnUse" x="-100" y="-100" width="700" height="700">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              {FEATURES.map(feature => {
                const isActive = selectedFeature?.id === feature.id;
                return (
                  <g key={`line-${feature.id}`}>
                    <line 
                      filter="url(#lineGlow)" 
                      stroke="url(#lineGrad)" 
                      strokeWidth={isActive ? "3" : "2"} 
                      x1="250" 
                      y1="250" 
                      x2={feature.lineEnd.x} 
                      y2={feature.lineEnd.y} 
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    <circle 
                      cx={feature.lineEnd.x} 
                      cy={feature.lineEnd.y} 
                      r={isActive ? "6" : "5"} 
                      fill="#a855f7" 
                      filter="url(#lineGlow)" 
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Nodes */}
          {FEATURES.map((feature) => {
            const isActive = selectedFeature?.id === feature.id;
            return (
              <div
                key={feature.id}
                className="absolute z-20 pointer-events-none"
                style={{ top: feature.top, left: feature.left, transform: 'translate(-50%, -50%)' }}
              >
                <motion.button
                  className="text-center outline-none group flex flex-col items-center pointer-events-auto"
                  style={{ rotate: counterRotation }}
                  onClick={(e) => handleNodeClick(feature, e)}
                >
                  <div 
                    className={`w-[72px] h-[72px] rounded-full border-[2px] flex items-center justify-center mb-2 transition-all duration-300 ${
                      isActive 
                        ? 'border-violet-300 bg-violet-900/60 scale-125 shadow-[0_0_40px_rgba(168,85,247,1),inset_0_0_20px_rgba(168,85,247,0.8)] text-violet-100' 
                        : 'border-violet-500 bg-violet-950/40 hover:border-violet-400 hover:scale-110 shadow-[0_0_25px_rgba(139,92,246,0.8),inset_0_0_15px_rgba(139,92,246,0.5)] text-violet-300'
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <span 
                    className={`text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${
                      isActive ? 'text-white drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {feature.title}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </motion.div>

        {/* ── Details Panel: directly below active node (which is at top) ── */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              key={selectedFeature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute z-40 top-[220px] w-[340px] bg-black/80 backdrop-blur-2xl border border-violet-500/40 rounded-2xl p-6 flex flex-col shadow-[0_0_50px_rgba(124,58,237,0.3)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-violet-300 flex-shrink-0 shadow-[inset_0_0_10px_rgba(139,92,246,0.2)]">
                  {selectedFeature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-1">{selectedFeature.title}</h3>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    selectedFeature.status === 'Available' ? 'bg-green-500/10 border-green-500/40 text-green-400' :
                    selectedFeature.status === 'Coming Soon' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                    'bg-blue-500/10 border-blue-500/40 text-blue-400'
                  }`}>
                    {selectedFeature.status}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-white/70 leading-relaxed mb-6 h-16">
                {selectedFeature.description}
              </p>
              
              <Link
                href={selectedFeature.status === 'Available' ? selectedFeature.route : '#'}
                className={`w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  selectedFeature.status === 'Available' 
                    ? 'hover:opacity-90 active:scale-95' 
                    : 'opacity-50 cursor-not-allowed grayscale'
                }`}
                style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
                onClick={(e) => {
                  if (selectedFeature.status !== 'Available') e.preventDefault();
                }}
              >
                🚀 {selectedFeature.status === 'Available' ? 'Launch Generator' : 'Coming Soon'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Badge */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full border text-[11px] sm:text-xs font-bold tracking-widest uppercase text-white whitespace-nowrap"
          style={{
            background: 'rgba(10,6,24,0.9)',
            border: '1px solid rgba(139,92,246,0.5)',
            boxShadow: '0 0 15px rgba(124,58,237,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(124,58,237,0.5)]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Zap size={12} className="text-white" />
          </span>
          ALL-IN-ONE AI PLATFORM FOR LINKEDIN GROWTH
        </div>
      </div>
    </section>
  );
}
