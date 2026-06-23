"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, FileText, Copy, Wand2, Loader2, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { saveToHistory, savePost } from "@/lib/history-utils";
import { CreditIndicator } from "@/components/ui/credit-indicator";
import { SubscriptionCard } from "@/components/ui/subscription-card";
import { useUsage } from "@/contexts/usage-context";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { consumeGenerationCredit } from "@/app/actions/usage";
import { GenerationLoader } from "@/components/ui/generation-loader";

export default function ImageToPostPage() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const { verifyCredits } = useCreditCheck();
  const { deductCredit } = useUsage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    const hasCredits = await verifyCredits();
    if (!hasCredits) return;

    setIsGenerating(true);
    setSaved(false);
    setGeneratedPost("");

    try {
      const formData = new FormData();
      formData.append("image", image);
      if (context) {
        formData.append("context", context);
      }

      const response = await fetch('/api/image-to-post', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate post');
      }

      setGeneratedPost(data.post);
      setIsGenerating(false);

      // Run database operations asynchronously without blocking the UI
      Promise.all([
        saveToHistory("image_to_post", data.post).catch(console.error),
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
    const { error } = await savePost("image_to_post", generatedPost);
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
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-[#111111] border-b border-white/[0.05] relative">
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
      <main className="flex-1 w-full max-w-[1100px] mx-auto p-6 md:p-10 flex flex-col items-center justify-center pb-20">
        
        {/* Cards Grid */}
        <div className="w-full flex flex-col md:flex-row gap-6 items-stretch justify-center mt-4">
          
          {/* Left Card */}
          <div className="w-full md:w-1/2 bg-[#171717] rounded-xl p-8 flex flex-col border border-white/[0.03]">
            <h1 className="text-[22px] font-medium text-white mb-2 tracking-tight">Image to Post</h1>
            <p className="text-[14px] text-gray-400 mb-8">
              Upload an image and provide context to generate a viral social post.
            </p>

            <div className="flex flex-col gap-8 flex-1">
              
              {/* Dropzone */}
              <div className="relative w-full h-[220px] rounded-xl border border-dashed border-white/[0.1] bg-[#111111]/50 hover:bg-[#111111] hover:border-white/[0.15] transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white/[0.05] rounded-xl flex items-center justify-center mb-4 border border-white/[0.05] group-hover:scale-105 transition-transform duration-300">
                      <FileUp size={20} className="text-gray-300" />
                    </div>
                    <span className="text-[14px] font-medium text-white mb-1">Click or drag image to upload</span>
                    <span className="text-[13px] text-gray-500">PNG, JPG or WebP up to 10MB</span>
                  </div>
                )}
              </div>

              {/* Context Input */}
              <div className="flex flex-col">
                <label className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-3 block">CONTEXT</label>
                <textarea 
                  className="w-full bg-[#111111] border border-white/[0.05] focus:border-white/10 rounded-lg px-4 py-4 text-[14px] text-gray-200 placeholder:text-gray-600 focus:outline-none transition-colors resize-none min-h-[120px]"
                  placeholder="Describe the vibe, target audience, or specific message you want to convey..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

            </div>

            <button 
              onClick={handleGenerate}
              disabled={!image || isGenerating}
              className="mt-8 w-full py-3.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[14px] shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:shadow-none"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Forging...</>
              ) : (
                <><Wand2 size={16} /> Forge from Image</>
              )}
            </button>
          </div>

          {/* Right Card */}
          <div className="w-full md:w-1/2 bg-[#171717] rounded-xl p-8 flex flex-col border border-white/[0.03]">
             <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/[0.05] z-10 relative">
               <h2 className="text-[20px] font-medium text-white tracking-tight">Your Generated Post</h2>
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
             <div className="flex-1 flex flex-col relative overflow-hidden mb-8">
               {isGenerating ? (
                 <GenerationLoader hideDescription={true} />
               ) : generatedPost ? (
                 <div className="w-full h-full text-gray-300 whitespace-pre-wrap overflow-y-auto leading-relaxed z-10 custom-scrollbar text-[14px]">
                   {generatedPost}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center w-full h-full mt-4">
                   <div className="w-14 h-14 bg-white/[0.03] rounded-xl flex items-center justify-center mb-6 border border-white/[0.05]">
                     <FileText size={24} className="text-gray-500" />
                   </div>
                   <p className="text-[14px] text-gray-500 text-center max-w-[260px] leading-relaxed">
                     Fill in the details and click Forge to see the magic happen.
                   </p>
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
