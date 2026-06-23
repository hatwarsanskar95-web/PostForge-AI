"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Zap, Award, Handshake, Briefcase, Code, Sparkles, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { GenerationLoader } from "@/components/ui/generation-loader";

export default function AchievementGeneratorPage() {
  const [achievementType, setAchievementType] = useState("certification");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [keyTakeaway, setKeyTakeaway] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const { verifyCredits } = useCreditCheck();
  const { deductCredit } = useUsage();

  const handleGenerate = async () => {
    if (!title.trim() || !keyTakeaway.trim()) return;
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;

    setIsGenerating(true);
    setSaved(false);
    setGeneratedPost("");

    try {
      const response = await fetch('/api/achievement-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementType, title, organization, projectLink, keyTakeaway }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate post');
      }

      setGeneratedPost(data.post);
      setIsGenerating(false);
      
      // Run database operations asynchronously without blocking the UI
      Promise.all([
        saveToHistory("achievement_generator", data.post).catch(console.error),
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
    const { error } = await savePost("achievement_generator", generatedPost);
    setIsSaving(false);
    
    if (error) {
      setSaved(false); // Revert on failure
      console.error("Save error:", error);
      const errMsg = typeof error === 'string' ? error : (error as any).message || JSON.stringify(error);
      alert("Failed to save post: " + errMsg);
    }
  };

  const categories = [
    { id: "certification", label: "Certification", icon: Award },
    { id: "placement", label: "Placement", icon: Handshake },
    { id: "internship", label: "Internship", icon: Briefcase },
    { id: "hackathon", label: "Hackathon", icon: Code },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-violet-500/30">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 bg-[#0a0a0a] relative">
        <div className="flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 text-[11px] font-medium tracking-widest uppercase text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={14} className="text-gray-500" />
            <span className="flex flex-col leading-tight text-left">
              <span>Back to</span>
              <span>Dashboard</span>
            </span>
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <span className="font-bold text-xl tracking-tight text-[#d8b4fe]">PostForge AI</span>
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
      <main className="flex-1 w-full max-w-[1000px] mx-auto p-6 flex flex-col items-center justify-start pb-20">
        
        {/* Page Title Section */}
        <div className="flex flex-col items-center text-center mb-10 mt-6">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Achievement Generator</h1>
          <p className="text-[13px] text-gray-400 leading-relaxed max-w-xl">
            Transform professional milestones into high-impact social posts with minimalist precision and AI-powered clarity.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full flex flex-col md:flex-row gap-6 items-stretch justify-center">
          
          {/* Left Card: Event Details */}
          <div className="w-full md:w-1/2 bg-[#121214] rounded-xl p-8 flex flex-col border border-white/[0.05]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-5 bg-[#a855f7] rounded-full"></div>
              <h2 className="text-[18px] font-medium text-white">Event Details</h2>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              {/* Category Selector */}
              <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4 block">SELECT CATEGORY</label>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = achievementType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setAchievementType(cat.id)}
                        className={`py-5 px-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all border ${
                          isSelected 
                            ? "bg-[#6b4c9a] border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(107,76,154,0.4)]" 
                            : "bg-[#0a0a0a] border-white/[0.05] text-gray-400 hover:border-white/[0.1] hover:text-gray-300"
                        }`}
                      >
                        <Icon size={20} strokeWidth={1.5} />
                        <span className="text-[12px] font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title or Role */}
              <div>
                <label className="text-[12px] text-gray-300 mb-2.5 block">Title or Role</label>
                <input 
                  type="text"
                  className="w-full bg-[#0a0a0a] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3.5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. Senior Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Organization or Host */}
              <div>
                <label className="text-[12px] text-gray-300 mb-2.5 block">Organization or Host</label>
                <input 
                  type="text"
                  className="w-full bg-[#0a0a0a] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3.5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. Google Cloud, Major League Hacking"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>

              {/* Project Link */}
              <div>
                <label className="text-[12px] text-gray-300 mb-2.5 block">Project Link <span className="text-gray-600">(Optional)</span></label>
                <input 
                  type="url"
                  className="w-full bg-[#0a0a0a] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3.5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors"
                  placeholder="e.g. https://github.com/..."
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                />
              </div>

              {/* Key Takeaway */}
              <div>
                <label className="text-[12px] text-gray-300 mb-2.5 block">Key Takeaway / Highlight</label>
                <textarea 
                  className="w-full bg-[#0a0a0a] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-3.5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-none min-h-[100px]"
                  placeholder="What was the most important thing you learned or achieved? Share the impact."
                  value={keyTakeaway}
                  onChange={(e) => setKeyTakeaway(e.target.value)}
                />
              </div>

            </div>

            <button 
              onClick={handleGenerate}
              disabled={!title.trim() || !organization.trim() || isGenerating}
              className="mt-8 w-full py-4 rounded-lg bg-[#d8b4fe] hover:bg-[#e9d5ff] text-[#3b0764] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[14px]"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Zap size={16} fill="currentColor" /> Generate Post</>
              )}
            </button>
          </div>

          {/* Right Card: Post Preview */}
          <div className="w-full md:w-1/2 bg-[#121214] rounded-xl p-8 flex flex-col border border-white/[0.05]">
             <div className="flex items-center justify-between mb-8 z-10 relative">
               <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-[#a855f7] rounded-full"></div>
                  <h2 className="text-[18px] font-medium text-white">Post Preview</h2>
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
             <div className="flex-1 flex flex-col relative overflow-hidden">
               {isGenerating ? (
                 <GenerationLoader />
               ) : generatedPost ? (
                 <div className="w-full h-full text-gray-300 whitespace-pre-wrap overflow-y-auto leading-relaxed z-10 custom-scrollbar text-[14px]">
                   {generatedPost}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center w-full h-full mt-4">
                   <div className="w-14 h-14 bg-[#1a1a1c] rounded-xl flex items-center justify-center mb-6 border border-white/[0.05]">
                     <Sparkles size={24} className="text-gray-500" />
                   </div>
                   <h3 className="text-[16px] text-gray-200 font-medium mb-3">Awaiting Your Input</h3>
                   <p className="text-[13px] text-gray-500 text-center max-w-[280px] leading-relaxed">
                     Enter your achievement details on the left to see your professional social post come to life here.
                   </p>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[9px] font-bold tracking-[0.2em] text-gray-600 uppercase">
          POSTFORGE AI ENGINE • V1.0.4 • OPTIMIZED WORKSPACE
        </div>
      </main>
    </div>
  );
}
