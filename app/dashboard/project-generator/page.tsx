"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, FileText, PenSquare, Eye, Sparkles, Check, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { GenerationLoader } from "@/components/ui/generation-loader";

export default function ProjectGeneratorPage() {
  const [projectName, setProjectName] = useState("");
  const [techStack, setTechStack] = useState("");
  const [features, setFeatures] = useState("");
  const [challenges, setChallenges] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const { verifyCredits } = useCreditCheck();
  const { deductCredit } = useUsage();

  const handleGenerate = async () => {
    if (!projectName.trim() || !techStack.trim()) return;
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;

    setIsGenerating(true);
    setSaved(false);
    setGeneratedPost("");
    
    try {
      const response = await fetch('/api/case-study-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, techStack, features, challenges, projectLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate post');
      }

      setGeneratedPost(data.post);
      setIsGenerating(false);
      
      // Run database operations asynchronously without blocking the UI
      Promise.all([
        saveToHistory("case_study_forge", data.post).catch(console.error),
        consumeGenerationCredit().then(() => deductCredit()).catch(console.error)
      ]);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong.");
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!generatedPost || isSaving || saved) return;
    
    // Optimistic UI update
    setSaved(true);
    setShowSavedPopup(true);
    setTimeout(() => setShowSavedPopup(false), 2000);

    setIsSaving(true);
    const { error } = await savePost("case_study_forge", generatedPost);
    setIsSaving(false);
    
    if (error) {
      setSaved(false); // Revert on failure
      console.error("Save error:", error);
      const errMsg = typeof error === 'string' ? error : (error as any).message || JSON.stringify(error);
      alert("Failed to save post: " + errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col font-sans selection:bg-violet-500/30">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.05] bg-[#111111] relative">
        <div className="flex-1">
          <Link href="/dashboard" className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 w-fit">
            <span className="text-gray-500">&larr;</span> Back to Dashboard
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <span className="font-bold text-xl tracking-tight text-[#a855f7]">PostForge AI</span>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="hidden lg:block z-50">
            <SubscriptionCard />
          </div>
          <div className="lg:hidden">
            <CreditIndicator />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10 flex flex-col items-center justify-start pb-20">
        
        {/* Page Title Section */}
        <div className="flex flex-col items-center text-center mb-12 mt-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-16 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight relative z-10" style={{ textShadow: "0 4px 20px rgba(255,255,255,0.15)" }}>Case Study Forge</h1>
          <p className="text-[14px] text-gray-400 leading-relaxed max-w-xl">
            Transform your technical projects into engaging social media content. Fill in the details below to generate a high-performing post.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full flex flex-col md:flex-row gap-6 items-stretch justify-center">
          
          {/* Left Card */}
          <div className="w-full md:w-1/2 bg-[#171717] rounded-xl p-8 flex flex-col border border-white/[0.03]">
            <div className="flex items-center gap-3 mb-8">
              <PenSquare className="text-[#a855f7]" size={20} />
              <h2 className="text-lg font-medium text-white">Project Post</h2>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              <div>
                <label className="text-[13px] text-gray-300 mb-2.5 block">Project Name</label>
                <input 
                  type="text"
                  className="w-full bg-[#111111] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. Obsidian Flux"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[13px] text-gray-300 mb-2.5 block">Tech Stack</label>
                <input 
                  type="text"
                  className="w-full bg-[#111111] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. React, Tailwind, Node.js"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[13px] text-gray-300 mb-2.5 block flex items-center justify-between">
                  Project Link <span className="text-[11px] text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded uppercase tracking-wider">AI Vision</span>
                </label>
                <input 
                  type="url"
                  className="w-full bg-[#111111] border border-[#a855f7]/20 focus:border-[#a855f7]/50 rounded-lg px-4 py-3 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. https://github.com/... or https://demo.com"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[13px] text-gray-300 mb-2.5 block">Core Features</label>
                <textarea 
                  className="w-full bg-[#111111] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-none min-h-[120px]"
                  placeholder="List the primary capabilities..."
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[13px] text-gray-300 mb-2.5 block">Major Challenge & Solution</label>
                <textarea 
                  className="w-full bg-[#111111] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-none min-h-[120px]"
                  placeholder="What was the hardest part and how did you fix it?"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!projectName.trim() || !techStack.trim() || isGenerating}
              className="mt-8 w-full py-3.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[14px] shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:shadow-none"
            >
              {isGenerating ? "Generating..." : "Generate Post"} <Sparkles size={16} />
            </button>
          </div>

          {/* Right Card */}
          <div className="w-full md:w-1/2 bg-[#171717] rounded-xl p-8 flex flex-col border border-white/[0.03]">
             <div className="flex items-center justify-between mb-8 z-10 relative">
               <div className="flex items-center gap-3">
                  <Eye className="text-[#a855f7]" size={20} />
                  <h2 className="text-lg font-medium text-white">Your Generated Post</h2>
               </div>
               <div className="flex items-center gap-2 relative">
                 <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white" title="Copy">
                   {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                 </button>
                 <button onClick={handleSave} disabled={isSaving || saved} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50" title="Save Post">
                   {saved ? <BookmarkCheck size={16} className="text-[#a855f7]" /> : <Bookmark size={16} />}
                 </button>
                 
                 {/* Success Popup */}
                 {showSavedPopup && (
                   <div className="absolute top-full right-0 mt-2 bg-[#1a1a1c] border border-white/10 px-3 py-1.5 rounded-lg text-[12px] text-emerald-400 flex items-center gap-1.5 shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
                     <Check size={14} /> Saved successfully!
                   </div>
                 )}
               </div>
             </div>

             {/* Result area */}
             <div className="flex-1 rounded-xl border border-dashed border-white/10 flex flex-col relative overflow-hidden bg-transparent">
               {isGenerating ? (
                 <GenerationLoader hideDescription={true} />
               ) : generatedPost ? (
                 <div className="p-8 w-full h-full text-gray-300 whitespace-pre-wrap overflow-y-auto leading-relaxed z-10 custom-scrollbar text-[14px]">
                   {generatedPost}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center p-8 w-full h-full mt-4">
                   <div className="w-14 h-14 bg-white/[0.03] rounded-xl flex items-center justify-center mb-5 border border-white/[0.05]">
                     <FileText size={24} className="text-[#a855f7]" />
                   </div>
                   
                   <h3 className="text-[14px] text-gray-200 font-medium mb-3">Ready to create</h3>
                   <p className="text-[13px] text-gray-500 text-center max-w-[260px] leading-relaxed mb-10">
                     Enter your project details on the left and click 'Generate' to see the magic happen.
                   </p>

                   {/* Skeleton lines matching the image */}
                   <div className="flex flex-col gap-2 w-full max-w-[200px] opacity-20">
                     <div className="h-2 w-full bg-white rounded-full"></div>
                     <div className="h-2 w-full bg-white rounded-full"></div>
                     <div className="h-2 w-[80%] bg-white rounded-full"></div>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
