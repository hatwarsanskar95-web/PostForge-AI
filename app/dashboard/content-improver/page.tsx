"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2, Star, Copy, Sparkles, Zap, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { GenerationLoader } from "@/components/ui/generation-loader";

export default function ContentImproverPage() {
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const { verifyCredits } = useCreditCheck();
  const { deductCredit } = useUsage();

  const handleGenerate = async () => {
    if (!draft.trim()) return;
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;

    setIsGenerating(true);
    setSaved(false);

    try {
      const response = await fetch('/api/content-improver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draft, 
          mode: 'Professional LinkedIn' // Future-ready: can pass other modes here later
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.post) {
        throw new Error(data.error || "Failed to generate content");
      }

      setGeneratedPost(data.post);
      setIsGenerating(false);
      
      // Run database operations asynchronously without blocking the UI
      Promise.all([
        saveToHistory("content_improver", data.post).catch(console.error),
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
    const { error } = await savePost("content_improver", generatedPost);
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
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col md:flex-row gap-8 items-stretch justify-center pb-20">
        
        {/* Left Card */}
        <div className="w-full md:w-1/2 bg-[#222225] rounded-[2rem] p-8 flex flex-col border border-white/[0.03] shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
              <Wand2 className="text-gray-300" size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-100">Content Improver</h2>
              <p className="text-sm text-gray-500 mt-0.5">Refine and polish your rough ideas</p>
            </div>
          </div>

          <div className="flex flex-col flex-1 mt-2">
            <label className="text-[11px] font-bold text-gray-400 tracking-widest mb-3 uppercase">
              SOURCE CONTENT
            </label>
            <div className="flex-1 bg-[#18181b] rounded-3xl overflow-hidden border border-transparent focus-within:border-white/5 transition-colors">
              <textarea 
                className="w-full h-full min-h-[320px] bg-transparent border-none rounded-3xl p-6 text-gray-200 placeholder:text-gray-600 focus:ring-0 focus:outline-none resize-none leading-relaxed"
                placeholder="Paste your rough draft or bullet points here..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!draft.trim() || isGenerating}
            className="mt-8 w-full py-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-[#3b0764] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] disabled:shadow-none"
          >
            {isGenerating ? "Improving..." : "Improve Draft"} <Zap size={18} />
          </button>
        </div>

        {/* Right Card */}
        <div className="w-full md:w-1/2 bg-[#222225] rounded-[2rem] p-8 flex flex-col border border-white/[0.03] shadow-2xl relative">
           <div className="flex items-center justify-between mb-8 z-10 relative">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                  <div className="w-6 h-6 rounded-full border-[2px] border-gray-400 flex items-center justify-center">
                    <Star className="text-gray-400 fill-gray-400 w-2.5 h-2.5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-100">Optimized Post</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Ready to publish</p>
                </div>
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

           {/* Empty State / Result area */}
           <div className="flex-1 bg-[#18181b] rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
             
             {isGenerating ? (
               <GenerationLoader />
             ) : generatedPost ? (
               <div className="w-full h-full text-gray-200 whitespace-pre-wrap overflow-y-auto leading-relaxed z-10 custom-scrollbar">
                 {generatedPost}
               </div>
             ) : (
               <>
                 {/* Background faint stars */}
                 <svg viewBox="0 0 24 24" className="absolute top-[15%] right-[15%] w-40 h-40 text-white/[0.02] fill-current -rotate-12 transition-transform duration-1000 group-hover:rotate-12">
                    <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
                 </svg>
                 <svg viewBox="0 0 24 24" className="absolute bottom-[20%] left-[20%] w-28 h-28 text-white/[0.02] fill-current rotate-12 transition-transform duration-1000 group-hover:-rotate-12">
                    <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
                 </svg>
                 <svg viewBox="0 0 24 24" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white/[0.03] fill-current transition-transform duration-1000 group-hover:scale-110">
                    <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
                 </svg>

                 <div className="w-16 h-16 bg-[#222225] rounded-2xl flex items-center justify-center mb-6 relative z-10 border border-white/5 shadow-xl">
                   <Sparkles size={28} className="text-gray-300" />
                 </div>
                 
                 <h3 className="text-[15px] text-gray-200 font-medium mb-3 relative z-10">Magic Awaits</h3>
                 <p className="text-[13px] text-gray-500 text-center max-w-[260px] relative z-10 leading-relaxed">
                   Your improved draft will appear here as soon as you click the button on the left.
                 </p>
               </>
             )}
            </div>
        </div>
      </main>
    </div>
  );
}
