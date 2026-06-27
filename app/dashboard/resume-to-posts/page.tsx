"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, FileUser, Cloud, Check, Zap, Sparkles, Bookmark, BookmarkCheck, Copy, Brain, TrendingUp, Lightbulb, User, CheckCircle2, ChevronDown, ChevronUp, Layers, Rocket } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { createClient } from "@/lib/supabase/client";

const POST_STYLES = [
  "Professional",
  "Founder Style",
  "Storytelling",
  "Technical",
  "Achievement Focused"
];

function ResumeToPostsContent() {
  const searchParams = useSearchParams();
  const historyId = searchParams.get("history_id");
  const supabase = createClient();

  // Upload & Analysis State
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  
  // Generation State
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  
  // UI State
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { verifyCredits } = useCreditCheck();
  const { stats, deductCredit } = useUsage();

  useEffect(() => {
    if (historyId) {
      (async () => {
        setIsAnalyzing(true);
        try {
          const { data, error } = await supabase.from("generation_history").select("content").eq("id", historyId).single();
          if (data && data.content) {
            setAnalysisData(JSON.parse(data.content));
          }
        } catch (e) {
          console.error("Failed to load history", e);
        } finally {
          setIsAnalyzing(false);
        }
      })();
    }
  }, [historyId, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) setFile(uploadedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisData(null);
    setSelectedIdea(null);
    setGeneratedPost(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume-analyzer", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to process the uploaded file. Please try again.");

      setAnalysisData(data.data);
      // Save analysis to history silently
      saveToHistory("resume_analysis", JSON.stringify(data.data, null, 2)).catch(console.error);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to process the uploaded file. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePost = async (idea: string) => {
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;

    setSelectedIdea(idea);
    setIsGenerating(true);
    setGeneratedPost(null);
    setSaved(false);

    const t0 = performance.now();
    console.log(`[Profiler] Starting Single Post Generation Request for idea: ${idea}`);

    try {
      const res = await fetch("/api/resume-to-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          style: selectedStyle,
          resumeContext: analysisData
        }),
      });

      const t1 = performance.now();
      console.log(`[Profiler] fetch() network call completed in ${Math.round(t1 - t0)}ms`);

      const data = await res.json();
      const t2 = performance.now();
      console.log(`[Profiler] JSON parse took ${Math.round(t2 - t1)}ms`);

      if (!res.ok) throw new Error(data.error || "We couldn't process the AI response. Please regenerate.");

      setGeneratedPost(data.post);
      
      requestAnimationFrame(() => {
        const t3 = performance.now();
        console.log(`[Profiler] Frontend rendering completed in ${Math.round(t3 - t2)}ms. Total time: ${Math.round(t3 - t0)}ms`);
      });

      await saveToHistory("resume_to_posts", data.post);
      await consumeGenerationCredit();
      deductCredit();
    } catch (err: any) {
      setErrorMessage(err.message || "We couldn't process the AI response. Please regenerate.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMasterPost = async () => {
    // We check if we have at least 5 credits
    const remaining = stats?.remaining || 0;
    if (remaining < 5) {
      alert("You need 5 credits to generate a Master Post. Please upgrade your plan.");
      setShowMasterModal(false);
      return;
    }

    setShowMasterModal(false);
    setSelectedIdea("Master Personal Brand Post");
    setIsGenerating(true);
    setGeneratedPost(null);
    setSaved(false);

    const t0 = performance.now();
    console.log(`[Profiler] Starting Master Generation Request...`);

    try {
      const res = await fetch("/api/resume-master-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContext: analysisData
        }),
      });

      const t1 = performance.now();
      console.log(`[Profiler] fetch() network call completed in ${Math.round(t1 - t0)}ms`);

      const data = await res.json();
      const t2 = performance.now();
      console.log(`[Profiler] JSON parse took ${Math.round(t2 - t1)}ms`);

      if (!res.ok) throw new Error(data.error || "We couldn't generate the master post. Please try again.");

      setGeneratedPost(data.post);

      requestAnimationFrame(() => {
        const t3 = performance.now();
        console.log(`[Profiler] Frontend rendering completed in ${Math.round(t3 - t2)}ms. Total time: ${Math.round(t3 - t0)}ms`);
      });

      await saveToHistory("resume_master_post", data.post);
      await consumeGenerationCredit(5);
      // deductCredit only subtracts 1 from local context by default, so we call it 5 times to sync local state immediately
      for(let i=0; i<5; i++) deductCredit();
    } catch (err: any) {
      setErrorMessage(err.message || "We couldn't generate the master post. Please try again.");
    } finally {
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
    if (!generatedPost || saving || saved) return;
    setSaving(true);
    const { error } = await savePost("resume_to_posts", generatedPost);
    setSaving(false);
    if (!error) setSaved(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 bg-[#0a0a0a] relative z-50">
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
          <div className="hidden lg:block z-50"><SubscriptionCard /></div>
          <div className="lg:hidden"><CreditIndicator /></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 flex flex-col items-center justify-start pb-20">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12 mt-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-16 bg-violet-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight relative z-10" style={{ textShadow: "0 4px 20px rgba(255,255,255,0.1)" }}>
            Resume to Posts
          </h1>
          <p className="text-[14px] sm:text-[15px] text-gray-400 leading-relaxed max-w-2xl">
            Upload your resume. Let AI find the hidden stories, projects, and achievements. Generate months of LinkedIn content with zero effort.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Input & Insights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#121214] rounded-xl p-6 border border-white/[0.05]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileUser size={20} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-[16px] font-medium text-white">Upload Resume</h2>
                  <p className="text-[12px] text-gray-500">Extract 10+ high quality post ideas</p>
                </div>
              </div>

              <div className="relative border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-xl hover:bg-white/[0.02] transition-all p-8 flex flex-col items-center justify-center cursor-pointer min-h-[160px] mb-6">
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-2">
                      <FileUser size={24} className="text-violet-400" />
                    </div>
                    <span className="text-[14px] text-white font-medium text-center">{file.name}</span>
                    <span className="text-[12px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
                      <Cloud size={20} className="text-gray-300" />
                    </div>
                    <span className="text-[13px] text-white font-medium">Upload PDF, DOC, DOCX, or TXT</span>
                  </>
                )}
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start justify-between gap-3">
                  <p className="text-[13px] text-red-400 leading-relaxed">{errorMessage}</p>
                  <button onClick={() => setErrorMessage(null)} className="text-red-400/50 hover:text-red-400 transition-colors shrink-0 mt-0.5 text-lg leading-none">&times;</button>
                </div>
              )}
              <button 
                onClick={handleAnalyze} disabled={!file || isAnalyzing}
                className="w-full py-3.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[14px] shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              >
                {isAnalyzing ? "Analyzing Resume..." : "Analyze Resume"} <Brain size={16} />
              </button>
            </div>

            {analysisData?.insights && (
              <div className="bg-[#121214] rounded-xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-blue-400" />
                  </div>
                  <h2 className="text-[16px] font-medium text-white">AI Career Insights</h2>
                </div>
                
                <div className="space-y-6 text-[13px]">
                  {analysisData.insights.strengths?.length > 0 && (
                    <div>
                      <h3 className="text-emerald-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Resume Strengths</h3>
                      <ul className="space-y-1 text-gray-300">
                        {analysisData.insights.strengths.map((s: string, i: number) => <li key={i} className="flex gap-2"><Check size={14} className="text-emerald-500/50 shrink-0 mt-0.5" /> <span>{s}</span></li>)}
                      </ul>
                    </div>
                  )}
                  {analysisData.insights.personalBrandingSuggestions?.length > 0 && (
                    <div>
                      <h3 className="text-violet-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Branding Suggestions</h3>
                      <ul className="space-y-1 text-gray-300">
                        {analysisData.insights.personalBrandingSuggestions.map((s: string, i: number) => <li key={i} className="flex gap-2"><Sparkles size={14} className="text-violet-500/50 shrink-0 mt-0.5" /> <span>{s}</span></li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Ideas & Generation */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Master Post Premium Option */}
            {analysisData?.categories && !generatedPost && !isGenerating && (
              <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl p-6 border border-violet-500/20 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket size={16} className="text-fuchsia-400" />
                      <h3 className="font-semibold text-white">Master Personal Brand Post</h3>
                    </div>
                    <p className="text-[13px] text-gray-400 max-w-sm">
                      Combine all your projects, skills, and journey into ONE powerful, flagship career story. (600-1200 words)
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowMasterModal(true)}
                    className="shrink-0 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-violet-500/50"
                  >
                    Generate Flagship <span className="opacity-50">| 5 Credits</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ideas List */}
            {analysisData?.categories && !generatedPost && !isGenerating && (
              <div className="bg-[#121214] rounded-xl p-6 border border-white/[0.05]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Lightbulb size={16} className="text-orange-400" />
                    </div>
                    <h2 className="text-[16px] font-medium text-white">Content Opportunities</h2>
                  </div>
                  <select 
                    value={selectedStyle} 
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition-colors"
                  >
                    {POST_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  {analysisData.categories.map((cat: any, i: number) => (
                    <div key={i} className="border border-white/5 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === cat.categoryName ? null : cat.categoryName)}
                        className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="font-medium text-sm text-gray-200">{cat.categoryName} <span className="text-gray-500 ml-2">({cat.ideas.length})</span></span>
                        {expandedCategory === cat.categoryName ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </button>
                      
                      {expandedCategory === cat.categoryName && (
                        <div className="p-4 bg-[#0a0a0a] flex flex-col gap-3">
                          {cat.ideas.map((idea: string, j: number) => (
                            <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-white/5 bg-[#121214] hover:border-violet-500/30 transition-colors">
                              <span className="text-[13px] text-gray-300 leading-relaxed">{idea}</span>
                              <button 
                                onClick={() => handleGeneratePost(idea)}
                                className="shrink-0 whitespace-nowrap px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium flex items-center gap-2 transition-colors"
                              >
                                Generate <span className="opacity-50">| 1 Credit</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State for Post Generation */}
            {isGenerating && (
              <div className="bg-[#121214] rounded-xl p-12 border border-white/[0.05] flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin"></div>
                  <Brain size={24} className="text-violet-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Writing your LinkedIn post...</h3>
                <p className="text-sm text-gray-500">Applying the {selectedStyle} format and V2 writing engine rules.</p>
              </div>
            )}

            {/* Generated Post Result */}
            {generatedPost && !isGenerating && (
              <div className="bg-[#121214] rounded-xl p-6 sm:p-8 border border-white/[0.05] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-50"></div>
                
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </div>
                      <h2 className="text-[16px] font-medium text-white">Your Forged Post</h2>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => setGeneratedPost(null)} className="px-3 py-1.5 text-[12px] text-gray-400 hover:text-white transition-colors mr-2">
                       ← Back to Ideas
                     </button>
                     <button onClick={handleCopy} className="w-8 h-8 rounded-lg bg-[#1a1a1c] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all">
                       {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                     </button>
                     <button onClick={handleSave} disabled={saving || saved} className="w-8 h-8 rounded-lg bg-[#1a1a1c] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all disabled:opacity-50">
                       {saved ? <BookmarkCheck size={14} className="text-[#a855f7]" /> : <Bookmark size={14} />}
                     </button>
                   </div>
                </div>

                <div className="w-full text-gray-200 whitespace-pre-wrap leading-relaxed custom-scrollbar text-[14px] bg-[#0a0a0a] p-5 sm:p-6 rounded-xl border border-white/5 font-sans relative">
                  {generatedPost}
                </div>
              </div>
            )}

            {/* Loading State for Resume Analysis */}
            {isAnalyzing && (
              <div className="bg-[#121214] rounded-xl p-12 border border-white/[0.05] flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#a855f7] animate-spin"></div>
                  <Brain size={24} className="text-[#a855f7] animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Analyzing Resume...</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Extracting skills, projects, and hidden career highlights.
                </p>
                <div className="mt-8 flex flex-col gap-3 w-full max-w-[200px]">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#a855f7]/50 w-full animate-pulse"></div>
                  </div>
                  <div className="h-1.5 w-3/4 bg-white/5 rounded-full overflow-hidden mx-auto">
                     <div className="h-full bg-[#a855f7]/30 w-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="h-1.5 w-1/2 bg-white/5 rounded-full overflow-hidden mx-auto">
                     <div className="h-full bg-[#a855f7]/20 w-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Initial Empty State */}
            {!analysisData && !isAnalyzing && (
              <div className="bg-[#121214] rounded-xl p-12 border border-white/[0.05] flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.05]">
                  <Layers size={28} className="text-gray-500" />
                </div>
                <h3 className="text-[16px] text-gray-200 font-medium mb-3">No Resume Data</h3>
                <p className="text-[13px] text-gray-500 max-w-sm leading-relaxed">
                  Upload your resume and click Analyze to discover 10+ hidden LinkedIn content opportunities.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Master Post Confirmation Modal */}
      {showMasterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500"></div>
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
              <Rocket size={24} className="text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Generate Flagship Post</h3>
            <p className="text-gray-400 text-[14px] leading-relaxed mb-6">
              This will consume <strong className="text-white">5 credits</strong> and generate a highly detailed, 600-1200 word personal brand post using your complete resume data. 
              <br/><br/>
              <span className="text-orange-400/80">Note: Because this is a massive flagship post, generation may take 1-2 minutes.</span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowMasterModal(false)}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateMasterPost}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
              >
                Confirm (5 Credits) <Sparkles size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50">Loading Resume Forge...</div>}>
      <ResumeToPostsContent />
    </Suspense>
  );
}
