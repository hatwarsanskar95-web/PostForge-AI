"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, FileText, Wand2, Eye, Sparkles, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { GenerationLoader } from "@/components/ui/generation-loader";

export default function PostGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [role, setRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const { verifyCredits } = useCreditCheck();
  const { deductCredit } = useUsage();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;
    
    setIsGenerating(true);
    setSaved(false);
    
    try {
      const response = await fetch('/api/post-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience, role }),
      });

      const data = await response.json();

      if (!response.ok || !data.post) {
        throw new Error(data.error || "Failed to generate post");
      }

      setGeneratedPost(data.post);
      setIsGenerating(false);
      
      // Run database operations asynchronously without blocking the UI
      Promise.all([
        saveToHistory("post_generator", data.post).catch(console.error),
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
    const { error } = await savePost("post_generator", generatedPost);
    setIsSaving(false);
    
    if (error) {
      setSaved(false); // Revert on failure
      console.error("Save error:", error);
      const errMsg = typeof error === 'string' ? error : (error as any).message || JSON.stringify(error);
      alert("Failed to save post: " + errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#161618] text-white flex flex-col font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 relative">
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
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col items-center justify-start pb-20">
        
        {/* Page Title Section */}
        <div className="flex flex-col items-center text-center mb-12 max-w-2xl mt-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Post Generator</h1>
          <p className="text-[15px] text-gray-400 leading-relaxed">
            Describe your topic and let AI craft the perfect post for you. Fill in the details below to generate a high-performing post.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full flex flex-col md:flex-row gap-8 items-stretch justify-center">
          
          {/* Left Card */}
          <div className="w-full md:w-1/2 bg-[#222225] rounded-[2rem] p-8 flex flex-col border border-white/[0.03] shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#2d1b4e] flex items-center justify-center border border-[#3b0764]">
                <Wand2 className="text-[#a855f7]" size={18} />
              </div>
              <h2 className="text-lg font-bold text-white">Topic Generator</h2>
            </div>

            <div className="flex flex-col gap-5 flex-1">
              <div>
                <label className="text-[12px] font-bold text-gray-400 mb-2 block">What is your post about?</label>
                <textarea 
                  className="w-full bg-[#18181b] border border-transparent focus:border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-none min-h-[140px]"
                  placeholder="e.g. I just completed a 30-day coding challenge and learned 3 key lessons about consistency..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-400 mb-2 block">Target Audience</label>
                <input 
                  type="text"
                  className="w-full bg-[#18181b] border border-transparent focus:border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. Software engineers, startup founders"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-400 mb-2 block">Your Role / Context</label>
                <input 
                  type="text"
                  className="w-full bg-[#18181b] border border-transparent focus:border-white/5 rounded-xl px-4 py-3.5 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. Full-stack developer, 3 years exp"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="mt-8 w-full py-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[15px] shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] disabled:shadow-none"
            >
              {isGenerating ? "Generating..." : "Generate Post"} <Sparkles size={18} className="text-white fill-white" />
            </button>
          </div>

          {/* Right Card */}
          <div className="w-full md:w-1/2 bg-[#222225] rounded-[2rem] p-8 flex flex-col border border-white/[0.03] shadow-2xl relative">
             <div className="flex items-center justify-between mb-6 z-10 relative">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/5">
                    <Eye className="text-gray-400" size={14} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Your Generated Post</h2>
               </div>
               <div className="flex items-center gap-2 relative">
                <button 
                  onClick={handleCopy}
                  className="w-9 h-9 rounded-lg bg-[#1a1a1c] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all" 
                  title="Copy"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || saved}
                  className="w-9 h-9 rounded-lg bg-[#1a1a1c] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-50" 
                  title="Save Post"
                >
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
             <div className="flex-1 bg-[#18181b] rounded-3xl border border-white/5 flex flex-col relative overflow-hidden mb-6">
               {isGenerating ? (
                 <GenerationLoader />
               ) : generatedPost ? (
                 <div className="p-8 w-full h-full text-gray-200 whitespace-pre-wrap overflow-y-auto leading-relaxed z-10 custom-scrollbar text-[14px]">
                   {generatedPost}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center p-8 w-full h-full">
                   <div className="w-16 h-16 bg-[#222225] rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-xl">
                     <FileText size={28} className="text-gray-400" />
                   </div>
                   
                   <h3 className="text-[16px] text-white font-bold mb-3">Ready to create</h3>
                   <p className="text-[14px] text-gray-500 text-center max-w-[280px] leading-relaxed mb-8">
                     Enter your topic details on the left and click 'Generate' to see the magic happen.
                   </p>

                   {/* Skeleton lines */}
                   <div className="flex flex-col gap-3 w-[200px] items-center">
                     <div className="h-2 w-full bg-white/5 rounded-full"></div>
                     <div className="h-2 w-[80%] bg-white/5 rounded-full"></div>
                     <div className="h-2 w-[60%] bg-white/5 rounded-full"></div>
                   </div>
                 </div>
               )}
             </div>

             {/* Footer Status */}
             <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 tracking-widest uppercase border-t border-white/5 pt-6 mt-auto">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                 AI ENGINE STANDBY
               </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
