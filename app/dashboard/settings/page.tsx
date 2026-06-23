"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Clock, Bookmark, ShieldCheck, Info, FileText,
  ArrowLeft, Search, Check, Copy, LogOut, X, Repeat, Trash2, Filter, ArrowDownUp, Mail, CreditCard, ArrowRight, Zap, CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { softDeleteHistory, softDeleteSavedPost, softDeleteAllHistory, softDeleteAllSavedPosts } from "@/lib/history-utils";
import { AvatarImage } from "@/components/ui/avatar-image";

const NAV_ITEMS = [
  { id: "profile",         label: "Profile",           Icon: User },
  { id: "plans",           label: "Plans & Subscriptions", Icon: CreditCard },
  { id: "history",         label: "History",           Icon: Clock },
  { id: "saved-posts",     label: "Saved Posts",       Icon: Bookmark },
  { id: "change-password", label: "Change Password",   Icon: ShieldCheck },
  { id: "contact-us",      label: "Contact Us",        Icon: Mail },
  { id: "privacy-policy",  label: "Privacy Policy",    Icon: Info },
  { id: "terms",           label: "Terms & Conditions",Icon: FileText },
];

const GENERATOR_TYPES = [
  "All", "post_generator", "content_improver", "achievement_generator", 
  "case_study_forge", "resume_to_posts", "resume_master_post", "image_to_post", "resume_analysis"
];

function formatType(type: string) {
  if (type === "All") return "All";
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Styling Constants based on "Glacier Cyan"
const CYAN = "#00e5ff";
const DARK_BG = "#09090b";
const PANEL_BG = "#121214";

const INPUT_BASE = "w-full bg-[#0d0d0f] border border-white/10 rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00e5ff] transition-all placeholder:text-white/20";
const INPUT_READONLY = "w-full bg-[#0d0d0f] border border-white/10 rounded-none px-4 py-3 pr-10 text-sm text-white/50 cursor-default focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-widest text-white/40 uppercase">{label}</label>
      {children}
    </div>
  );
}

function ReadInput({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="relative group">
      <input readOnly value={value} className={INPUT_READONLY} />
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#00e5ff] transition-colors opacity-0 group-hover:opacity-100"
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, right }: {
  icon?: React.ReactNode; title: string; subtitle: string; right?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-8 mb-8 border-b border-white/5">
      <div>
        <h2 className="text-4xl font-serif text-white tracking-tight flex items-center gap-3">
          {title}
        </h2>
        <p className="text-sm text-white/50 mt-2 max-w-md leading-relaxed">{subtitle}</p>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ── Modal Component ── */
function PreviewModal({ 
  item, onClose, isHistory, onDelete, onReuse 
}: { 
  item: any, onClose: () => void, isHistory: boolean, onDelete: () => void, onReuse?: () => void 
}) {
  const [copied, setCopied] = useState(false);
  
  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-[#121214] border border-[#00e5ff]/30 rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black overflow-hidden"
      >
        <div className="flex items-start justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="pr-8">
            <h3 className="font-semibold text-white text-lg leading-tight">{item.title}</h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-[#00e5ff]/70">
              <span className="bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] px-2.5 py-1 font-medium">{formatType(item.generator_type)}</span>
              <span className="text-white/40">{new Date(item.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/40">{item.word_count} words</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-[#00e5ff] transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed select-all">{item.content}</pre>
        </div>
        
        <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <button onClick={onDelete} className="text-xs font-bold tracking-wider uppercase text-red-400 hover:text-red-300 transition-all flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
          
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-xs font-bold tracking-wider uppercase text-white/50 hover:text-white transition-all">Close</button>
            {isHistory && onReuse && (
              <button onClick={onReuse} className="text-xs font-bold tracking-wider uppercase text-[#00e5ff] hover:text-white border border-[#00e5ff]/50 px-4 py-2 transition-all flex items-center gap-2">
                <Repeat size={14} /> Reuse
              </button>
            )}
            <button onClick={handleCopy} className="text-xs font-bold tracking-wider uppercase text-black bg-[#00e5ff] hover:bg-[#00cce6] px-5 py-2 transition-all flex items-center gap-2">
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── History Panel ── */
function HistoryPanel() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { setLoading(false); return; }
      const user = userData.user;
      const { data } = await supabase.from("generation_history").select("*").eq("user_id", user.id).eq("deleted_by_user", false);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    await softDeleteHistory(id);
    setItems(prev => prev.filter(p => p.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleCopy = (content: string) => { navigator.clipboard.writeText(content); };

  const handleReuse = (item: any) => {
    if (item.generator_type === "resume_analysis") {
      router.push(`/dashboard/resume-to-posts?history_id=${item.id}`);
      return;
    }
    const routeMap: Record<string, string> = {
      "post_generator": "post-generator", "content_improver": "content-improver",
      "achievement_generator": "achievement-generator", "case_study_forge": "project-generator",
      "resume_to_posts": "resume-to-posts", "resume_master_post": "resume-to-posts", "image_to_post": "image-to-post"
    };
    if (routeMap[item.generator_type]) router.push(`/dashboard/${routeMap[item.generator_type]}`);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL your history? This cannot be undone.")) return;
    await softDeleteAllHistory();
    setItems([]);
    setSelectedItem(null);
  };

  const filteredItems = useMemo(() => {
    return items
      .filter(item => filterType === "All" || item.generator_type === filterType)
      .filter(item => item.title.toLowerCase().includes(q.toLowerCase()) || formatType(item.generator_type).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => sortOrder === "desc" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [items, q, filterType, sortOrder]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full">
      <SectionHeader title="Generation History" subtitle="Review and reuse content you've forged using PostForge AI tools." />
      
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-1">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" placeholder="Search history..." value={q} onChange={e => setQ(e.target.value)} className="w-full bg-[#0d0d0f] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#00e5ff] transition-all" />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Filter size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="appearance-none w-full sm:w-auto bg-[#0d0d0f] border border-white/10 pl-10 pr-10 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#00e5ff] transition-all cursor-pointer">
              {GENERATOR_TYPES.map(t => <option key={t} value={t} className="bg-[#09090b]">{formatType(t)}</option>)}
            </select>
          </div>
          <button onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")} className="flex items-center gap-2 bg-[#0d0d0f] border border-white/10 px-4 py-2.5 text-sm text-white/80 hover:border-[#00e5ff] transition-all whitespace-nowrap">
            <ArrowDownUp size={14} className="text-[#00e5ff]" />
            <span className="hidden sm:inline">{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
          </button>
          {items.length > 0 && (
            <button onClick={handleDeleteAll} className="flex items-center gap-2 bg-[#1a0f12] border border-red-500/20 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all whitespace-nowrap">
              <Trash2 size={14} />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#121214] border border-white/5" />)}</div>
      ) : filteredItems.length > 0 ? (
        <div className="flex-1 overflow-auto border border-white/10 bg-[#121214]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#00e5ff]">
                <th className="px-6 py-4">Type</th><th className="px-6 py-4">Content Title</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-white/80 font-medium">{formatType(item.generator_type)}</td>
                  <td className="px-6 py-4 text-white/60 max-w-[250px] truncate">{item.title}</td>
                  <td className="px-6 py-4 text-white/40 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4 text-right space-x-4 whitespace-nowrap transition-opacity">
                    <button onClick={() => setSelectedItem(item)} className="text-[#00e5ff] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Preview</button>
                    <button onClick={() => { handleCopy(item.content); alert("Copied to clipboard."); }} className="text-[#00e5ff] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Copy</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
          <div className="w-14 h-14 bg-[#0d0d0f] border border-[#00e5ff]/20 flex items-center justify-center mb-4"><Clock size={20} className="text-[#00e5ff]" /></div>
          <h3 className="text-white font-medium text-base mb-1.5">No history found</h3>
          <p className="text-sm text-white/40 max-w-sm">When you generate posts using our AI tools, they will automatically appear here.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <PreviewModal item={selectedItem} onClose={() => setSelectedItem(null)} isHistory={true} onDelete={() => handleDelete(selectedItem.id)} onReuse={() => handleReuse(selectedItem)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Saved Posts ── */
function SavedPostsPanel() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { setLoading(false); return; }
      const user = userData.user;
      const { data } = await supabase.from("saved_posts").select("*").eq("user_id", user.id).eq("deleted_by_user", false);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const handleDelete = async (id: string) => { await softDeleteSavedPost(id); setItems(prev => prev.filter(p => p.id !== id)); if (selectedItem?.id === id) setSelectedItem(null); };
  const handleCopy = (content: string) => { navigator.clipboard.writeText(content); };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL your saved posts? This cannot be undone.")) return;
    await softDeleteAllSavedPosts();
    setItems([]);
    setSelectedItem(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full">
      <SectionHeader 
        title="Saved Posts" 
        subtitle="Your curated collection of top-performing AI posts." 
        right={
          items.length > 0 && (
            <button onClick={handleDeleteAll} className="flex items-center gap-2 bg-[#1a0f12] border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all whitespace-nowrap">
              <Trash2 size={14} />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )
        }
      />
      
      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#121214] border border-white/5" />)}</div>
      ) : items.length > 0 ? (
        <div className="flex-1 overflow-auto border border-white/10 bg-[#121214]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#00e5ff]">
                <th className="px-6 py-4">Type</th><th className="px-6 py-4">Title</th><th className="px-6 py-4">Saved Date</th><th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-white/80 font-medium">{formatType(item.generator_type)}</td>
                  <td className="px-6 py-4 text-white/60 max-w-[250px] truncate">{item.title}</td>
                  <td className="px-6 py-4 text-white/40 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4 text-right space-x-4 whitespace-nowrap transition-opacity">
                    <button onClick={() => setSelectedItem(item)} className="text-[#00e5ff] hover:text-white text-xs font-bold uppercase tracking-widest">Preview</button>
                    <button onClick={() => { handleCopy(item.content); alert("Copied!"); }} className="text-[#00e5ff] hover:text-white text-xs font-bold uppercase tracking-widest">Copy</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-widest">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
          <div className="w-14 h-14 bg-[#0d0d0f] border border-[#00e5ff]/20 flex items-center justify-center mb-4"><Bookmark size={20} className="text-[#00e5ff]" /></div>
          <h3 className="text-white font-medium text-base mb-1.5">No saved posts</h3>
          <p className="text-sm text-white/40 max-w-sm mb-6">You haven't bookmarked any generated content yet.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && <PreviewModal item={selectedItem} onClose={() => setSelectedItem(null)} isHistory={false} onDelete={() => handleDelete(selectedItem.id)} />}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Profile ── */
function ProfilePanel() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [editName, setEditName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { setLoading(false); return; }
      const user = userData.user;

      setEmail(user.email ?? "");
      setUserId(user.id);
      setJoinedDate(user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "");

      // Fetch user profile
      const { data: p } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (p) {
        setFullName(p.full_name ?? "");
        setEditName(p.full_name ?? "");
        setUsername(p.username ?? "");
        setMobile(p.mobile_number ?? "");
        setLinkedinUrl(p.linkedin_url ?? "");
        const aid = p.avatar_id || "boy-1";
        setAvatarSrc(`/avatars/${aid}.${aid.endsWith("-4") ? "svg" : "png"}`);
      }

      // Fetch subscription
      const { data: sub } = await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).single();
      if (sub) {
        setSubscription(sub);
        const { data: planData } = await supabase.from("subscription_plans").select("*").eq("plan_slug", sub.current_plan).single();
        if (planData) setPlan(planData);
      }

      setLoading(false);
    })();
  }, [supabase]);

  const handleSaveName = async () => {
    setSavingName(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData.user) {
      await supabase.from("users").update({ full_name: editName }).eq("id", userData.user.id);
      setFullName(editName);
    }
    setSavingName(false);
    setIsEditingName(false);
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const planStatus = subscription?.status ?? "active";
  const planName = plan?.plan_name ?? "Free Plan";
  const isFree = !subscription || planName === "Free Plan" || planName === "Free";
  const generationLimit = plan?.generation_limit ?? (isFree ? 3 : 10);
  const billingCycle = subscription?.billing_cycle ?? "month";
  const limitLabel = billingCycle === "yearly" ? "Year" : billingCycle === "weekly" ? "Week" : "Month";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <SectionHeader title="Profile Settings" subtitle="Manage your account details and subscription information." />

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-[#121214] border border-white/5" />
          <div className="h-48 bg-[#121214] border border-white/5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Main Info */}
          <div className="md:col-span-2 space-y-6">

            {/* Personal Information */}
            <div className="bg-[#121214] border border-white/5 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[#00e5ff] text-xl font-serif">Personal Information</h3>
                {!isEditingName && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-4 py-2 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-[#00e5ff] hover:border-[#00e5ff]/30 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Full Name — editable */}
              <Field label="Full Name">
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className={INPUT_BASE + " flex-1"}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="px-4 py-2 bg-[#00e5ff] text-black text-xs font-bold uppercase tracking-widest hover:bg-[#00cce6] disabled:opacity-50 transition-colors"
                    >
                      {savingName ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditName(fullName); setIsEditingName(false); }}
                      className="px-4 py-2 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className={INPUT_READONLY}>{fullName || "—"}</div>
                )}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Username">
                  <ReadInput value={username || "—"} onCopy={() => navigator.clipboard.writeText(username || "—")} />
                </Field>
                <Field label="Email Address">
                  <ReadInput value={email || "—"} onCopy={() => navigator.clipboard.writeText(email || "—")} />
                </Field>
                <Field label="Mobile Number">
                  <ReadInput value={mobile || "Not provided"} onCopy={() => navigator.clipboard.writeText(mobile || "Not provided")} />
                </Field>
                <Field label="LinkedIn URL">
                  <ReadInput value={linkedinUrl || "Not provided"} onCopy={() => navigator.clipboard.writeText(linkedinUrl || "Not provided")} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/5">
                <Field label="User ID">
                  <ReadInput value={userId} onCopy={() => navigator.clipboard.writeText(userId)} />
                </Field>
                <Field label="Joined Date">
                  <ReadInput value={joinedDate || "—"} onCopy={() => navigator.clipboard.writeText(joinedDate || "—")} />
                </Field>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-[#121214] border border-white/5 p-8 space-y-6">
              <h3 className="text-[#00e5ff] text-xl font-serif">Subscription</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Current Plan">
                  <div className={INPUT_READONLY + " flex items-center gap-2"}>
                    <span>⭐</span>
                    <span>{planName}</span>
                  </div>
                </Field>
                <Field label="Plan Status">
                  <div className={INPUT_READONLY + " capitalize"}>
                    <span className={planStatus === "active" ? "text-green-400" : "text-yellow-400"}>
                      ● {planStatus}
                    </span>
                  </div>
                </Field>
                <Field label="Plan Expiry Date">
                  <div className={INPUT_READONLY}>
                    {subscription?.end_date ? formatExpiry(subscription.end_date) : isFree ? "No expiry" : "—"}
                  </div>
                </Field>
                <Field label="Generation Limit">
                  <div className={INPUT_READONLY}>{generationLimit} AI Generations / {limitLabel}</div>
                </Field>
              </div>
            </div>

          </div>

          {/* Right: Avatar card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#121214] border border-white/5 p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt="Avatar" className="w-32 h-32 object-cover border border-white/10" />
                ) : (
                  <div className="w-32 h-32 bg-[#0d0d0f] border border-white/10 flex items-center justify-center">
                    <User size={40} className="text-[#00e5ff]" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-[#00e5ff] text-black p-1.5"><Check size={14} /></div>
              </div>
              <h3 className="text-xl font-bold text-white">{fullName || "User"}</h3>
              <p className="text-xs text-white/40 mt-1">@{username || "—"}</p>
              <p className="text-xs text-[#00e5ff] mt-1 mb-6">{planName}</p>
              <div className="w-full py-2.5 border border-white/10 text-white/30 text-xs font-bold tracking-widest uppercase text-center">
                Avatar Locked
              </div>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/10 hover:border-red-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={14} />
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}




function ChangePasswordPanel() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  // Rate limit state
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [windowStart, setWindowStart] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const LIMIT = 3;
  const WINDOW_HOURS = 48;

  // Fetch current rate limit status on mount
  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) { setCheckingLimit(false); return; }
      const user = userData.user;
      setEmail(user.email ?? "");
      const { data: p } = await supabase
        .from("users")
        .select("password_reset_count, password_reset_window_start")
        .eq("id", user.id)
        .single();
      if (p) {
        const ws = p.password_reset_window_start ? new Date(p.password_reset_window_start) : null;
        const now = new Date();
        const windowExpired = ws ? (now.getTime() - ws.getTime()) >= WINDOW_HOURS * 60 * 60 * 1000 : true;
        if (windowExpired) {
          setAttemptsUsed(0);
          setWindowStart(null);
        } else {
          setAttemptsUsed(p.password_reset_count ?? 0);
          setWindowStart(ws);
        }
      }
      setCheckingLimit(false);
    })();
  }, [supabase]);

  // Live countdown timer when limit is hit
  useEffect(() => {
    if (!windowStart || attemptsUsed < LIMIT) { setTimeRemaining(""); return; }
    const tick = () => {
      const expiry = new Date(windowStart.getTime() + WINDOW_HOURS * 60 * 60 * 1000);
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) { setAttemptsUsed(0); setWindowStart(null); setTimeRemaining(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowStart, attemptsUsed]);

  const isLimitReached = attemptsUsed >= LIMIT && !!windowStart;

  const handleSendReset = async () => {
    if (!email || isLimitReached) return;
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;
      const user = userData.user;

      // Recalculate fresh from DB to avoid stale state
      const { data: p } = await supabase
        .from("users")
        .select("password_reset_count, password_reset_window_start")
        .eq("id", user.id)
        .single();

      const now = new Date();
      const ws = p?.password_reset_window_start ? new Date(p.password_reset_window_start) : null;
      const windowActive = ws ? (now.getTime() - ws.getTime()) < WINDOW_HOURS * 60 * 60 * 1000 : false;
      const currentCount = windowActive ? (p?.password_reset_count ?? 0) : 0;

      if (currentCount >= LIMIT) {
        setAttemptsUsed(currentCount);
        setWindowStart(ws);
        return;
      }

      // Send the reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          setErrorMsg("Supabase email rate limit exceeded. Please wait an hour or set up custom SMTP.");
        } else {
          setErrorMsg(error.message);
        }
        return;
      }
      
      setErrorMsg(null);

      // Update counter in DB
      const newCount = currentCount + 1;
      const newWindowStart = windowActive ? p?.password_reset_window_start : now.toISOString();
      await supabase.from("users").update({
        password_reset_count: newCount,
        password_reset_window_start: newWindowStart,
      }).eq("id", user.id);

      setAttemptsUsed(newCount);
      setWindowStart(windowActive ? ws : now);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <SectionHeader title="Password Recovery" subtitle="Securely reset your account password." />

      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          {checkingLimit ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-[#121214] border border-white/5 p-10 flex items-center justify-center">
              <svg className="animate-spin text-[#00e5ff]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.div>
          ) : isLimitReached ? (
            /* ── RATE LIMIT BLOCKED ── */
            <motion.div
              key="blocked"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-[#121214] border border-red-500/30 p-10 flex flex-col items-center text-center space-y-5"
              style={{ boxShadow: "0 0 40px rgba(239,68,68,0.06)" }}
            >
              {/* Warning icon */}
              <div className="w-16 h-16 rounded-full border border-red-500/40 bg-red-500/5 flex items-center justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Reset Limit Reached</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                  You&apos;ve used all <span className="text-red-400 font-bold">{LIMIT}</span> password reset attempts for this 48-hour window.
                  Please wait before requesting another reset link.
                </p>
              </div>

              {/* Countdown */}
              <div className="px-6 py-3 bg-red-500/5 border border-red-500/20 space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Try again in</p>
                <p className="text-2xl font-mono font-bold text-red-400">{timeRemaining}</p>
              </div>

              {/* Attempt dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-red-500/70" />
                ))}
              </div>
            </motion.div>
          ) : sent ? (
            /* ── SUCCESS ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-[#121214] border border-[#00e5ff]/30 p-10 flex flex-col items-center text-center space-y-5"
              style={{ boxShadow: "0 0 40px rgba(0,229,255,0.06)" }}
            >
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full border border-[#00e5ff]/40 bg-[#00e5ff]/5 flex items-center justify-center mb-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Reset Link Sent</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                  A password reset link has been sent to your registered email address.
                  Please check your inbox and follow the instructions to create a new password.
                </p>
              </div>

              <div className="pt-2 px-4 py-2 bg-[#00e5ff]/5 border border-[#00e5ff]/10 text-[#00e5ff] text-xs font-mono tracking-widest">
                {email}
              </div>

              {/* Remaining attempts dots */}
              <div className="space-y-1 text-center">
                <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Attempts used this 48h window</p>
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: LIMIT }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < attemptsUsed ? "bg-[#00e5ff]" : "bg-white/10"}`} />
                  ))}
                </div>
                <p className="text-xs text-white/30">{attemptsUsed} of {LIMIT} used</p>
              </div>
            </motion.div>
          ) : (
            /* ── FORM ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-[#121214] border border-white/5 p-10 space-y-8"
            >
              {/* Lock icon */}
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 border border-white/10 bg-white/5 flex items-center justify-center shrink-0 mt-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Forgot your password?</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Click the button below and we&apos;ll send a secure password reset link to your registered email address.
                  </p>
                </div>
              </div>

              {/* Email display */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Registered Email</p>
                <div className="px-4 py-3 bg-[#0d0d0f] border border-white/5 text-sm text-white/60 font-mono">
                  {email || "Loading..."}
                </div>
              </div>

              {/* Attempt dots */}
              {attemptsUsed > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Attempts used this 48h window</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: LIMIT }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < attemptsUsed ? "bg-[#00e5ff]" : "bg-white/10"}`} />
                    ))}
                    <span className="text-xs text-white/30 ml-1">{attemptsUsed} of {LIMIT} used</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSendReset}
                disabled={loading || !email}
                className="w-full py-3.5 bg-[#00e5ff] text-black text-xs font-bold tracking-widest uppercase transition-all hover:bg-[#00cce6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  `Send Password Reset Link ${attemptsUsed > 0 ? `(${LIMIT - attemptsUsed} left)` : ""}`
                )}
              </button>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
                  {errorMsg}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[11px] text-white/25 text-center leading-relaxed">
                ⚠️ You can request a password reset link up to <span className="text-white/40 font-semibold">3 times</span> every <span className="text-white/40 font-semibold">48 hours</span>. If the limit is reached, you&apos;ll need to wait before requesting again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


function SubscriptionPanel() {
  const router = useRouter();

  const UPGRADE_BENEFITS = [
    { icon: "⚡", text: "Up to 500+ AI generations per month" },
    { icon: "🚀", text: "Priority processing — faster results" },
    { icon: "📂", text: "Unlimited saved posts & history" },
    { icon: "🎯", text: "Advanced tone & style controls" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <SectionHeader title="Plans & Subscriptions" subtitle="Manage your workspace usage and active subscriptions." />

      <div className="bg-[#121214] border border-white/5 p-8 max-w-2xl space-y-7">

        {/* Upgrade benefits */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-4">Why upgrade?</p>
          {UPGRADE_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/60">
              <span className="text-base">{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-7 flex items-center justify-between gap-4">
          <p className="text-sm text-white/40">View all available plans and choose what fits you best.</p>
          <button
            onClick={() => router.push("/dashboard/plans")}
            className="w-full sm:w-auto px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center gap-2"
          >
            View Plans
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    </motion.div>
  );
}

function ContactUsPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <SectionHeader title="Contact Support" subtitle="Get in touch with the PostForge engineering and support team." />
      <div className="bg-[#121214] border border-white/5 p-8 max-w-3xl space-y-6">
        <div>
          <h4 className="text-[#00e5ff] font-bold mb-1">Email Support</h4>
          <a href="mailto:hatwarsanskar95@gmail.com" className="text-white text-lg hover:text-[#00e5ff] transition-colors">hatwarsanskar95@gmail.com</a>
        </div>
        <div>
          <h4 className="text-[#00e5ff] font-bold mb-1">Direct Phone</h4>
          <a href="tel:+919970899101" className="text-white text-lg hover:text-[#00e5ff] transition-colors">+91 9970899101</a>
        </div>
      </div>
    </motion.div>
  );
}

function PrivacyPolicyPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-12">
      <SectionHeader title="Privacy Policy" subtitle="Information collection and usage." />
      <div className="bg-[#121214] border border-white/5 p-8 max-w-3xl space-y-8 text-sm text-white/60">
        
        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">1. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Full Name</li>
            <li>Username</li>
            <li>Email Address</li>
            <li>Mobile Number</li>
            <li>LinkedIn Profile URL</li>
            <li>Profile Avatar</li>
            <li>Subscription Details</li>
            <li>Payment Information (processed securely through third-party providers)</li>
            <li>Generated Content History</li>
            <li>Saved Posts</li>
            <li>Device and Browser Information</li>
            <li>Login Activity and Authentication Data</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">2. How We Use Your Information</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create and manage user accounts.</li>
            <li>Provide AI-powered LinkedIn content generation services.</li>
            <li>Process subscription purchases and renewals.</li>
            <li>Maintain generation history and saved posts.</li>
            <li>Improve platform performance and user experience.</li>
            <li>Provide customer support and technical assistance.</li>
            <li>Send account notifications, verification emails, and security alerts.</li>
            <li>Prevent fraud, abuse, and unauthorized access.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">3. AI Generated Content</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>PostForge AI uses artificial intelligence to generate content based on user inputs.</li>
            <li>Generated content may not always be accurate, complete, or error-free.</li>
            <li>Users are responsible for reviewing, editing, and verifying content before publishing.</li>
            <li>PostForge AI is not responsible for any consequences arising from the use of generated content.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">4. Data Security</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>All user information is stored using secure industry-standard practices.</li>
            <li>We use encryption, authentication, access controls, and secure cloud infrastructure.</li>
            <li>While we take reasonable precautions, no online platform can guarantee absolute security.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">5. Subscription & Payments</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Subscription payments are processed through trusted third-party payment gateways.</li>
            <li>PostForge AI does not store complete debit card, credit card, or banking information.</li>
            <li>Payment records may be retained for billing, legal, and support purposes.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">6. Cookies & Analytics</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>We may use cookies and analytics technologies to improve functionality.</li>
            <li>Cookies help maintain sessions, preferences, and user experience.</li>
            <li>Analytics help us understand feature usage and platform performance.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">7. Third-Party Services</h3>
          <p className="mb-2">PostForge AI may integrate with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Supabase</li>
            <li>Razorpay</li>
            <li>Google Authentication</li>
            <li>LinkedIn Services</li>
            <li>AI Providers</li>
            <li>Email Service Providers</li>
          </ul>
          <p className="mt-4">These third parties maintain their own privacy policies.</p>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">8. User Responsibilities</h3>
          <p className="mb-2">Users agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Generate unlawful or harmful content.</li>
            <li>Engage in fraudulent activities.</li>
            <li>Violate intellectual property rights.</li>
            <li>Attempt unauthorized system access.</li>
            <li>Misuse subscription plans or generation limits.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">9. Data Retention</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>User information may be retained while accounts remain active.</li>
            <li>Generated content history and saved posts may be stored for user convenience.</li>
            <li>Certain records may be retained to comply with legal obligations.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">10. Changes to Privacy Policy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>PostForge AI reserves the right to modify this Privacy Policy at any time.</li>
            <li>Continued use of the platform indicates acceptance of updated policies.</li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
}

function TermsPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-12">
      <SectionHeader title="Terms & Conditions" subtitle="Legal guidelines for using the platform." />
      <div className="bg-[#121214] border border-white/5 p-8 max-w-3xl space-y-8 text-sm text-white/60">

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">1. Acceptance of Terms</h3>
          <p>By accessing or using PostForge AI, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please discontinue use of the platform.</p>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">2. Platform Services</h3>
          <p className="mb-2">PostForge AI provides AI-powered LinkedIn content creation tools including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Post Generator</li>
            <li>Content Improver</li>
            <li>Achievement Generator</li>
            <li>Case Study Forge</li>
            <li>Resume To Posts</li>
            <li>Image To Post</li>
            <li>Saved Posts</li>
            <li>Content History</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">3. User Accounts</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users must provide accurate and complete information.</li>
            <li>Users are responsible for maintaining account security.</li>
            <li>Account sharing is prohibited.</li>
            <li>Users are responsible for all activities performed through their accounts.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">4. Subscription Plans</h3>
          <p className="mb-2">PostForge AI currently offers:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Free Plan</li>
            <li>Starter Pack</li>
            <li>Growth Pack</li>
            <li>Pro Pack</li>
            <li>Annual Growth Plan</li>
          </ul>
          <p className="mt-4">Each plan contains different generation limits and pricing.</p>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">5. Payments & Billing</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Subscription charges apply according to the selected plan.</li>
            <li>Payments are processed through secure third-party providers.</li>
            <li>Failure to complete payment may result in restricted access.</li>
            <li>Pricing may change in the future with prior notice.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">6. Refund Policy</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Subscription payments are generally non-refundable.</li>
            <li>Refund requests may be evaluated individually.</li>
            <li>Abuse, fraud, or policy violations may result in refund rejection.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">7. Acceptable Use</h3>
          <p className="mb-2">Users agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Generate illegal content.</li>
            <li>Generate harmful or abusive content.</li>
            <li>Violate copyrights or intellectual property.</li>
            <li>Engage in spam or fraudulent activity.</li>
            <li>Circumvent usage limits.</li>
            <li>Attempt unauthorized access to systems.</li>
            <li>Disrupt platform operations.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">8. AI Content Disclaimer</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>AI-generated content is provided "as is."</li>
            <li>Users must independently verify generated content.</li>
            <li>PostForge AI makes no guarantees regarding accuracy, reliability, or suitability.</li>
            <li>Users remain solely responsible for published content.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">9. Intellectual Property</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The PostForge AI platform, branding, logos, designs, and software remain the property of PostForge AI.</li>
            <li>Users retain ownership of content they create using the platform.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">10. Service Availability</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>We strive to provide uninterrupted access.</li>
            <li>Maintenance, upgrades, or technical issues may occasionally affect availability.</li>
            <li>PostForge AI does not guarantee continuous uptime.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">11. Limitation of Liability</h3>
          <p className="mb-2">PostForge AI shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Business losses</li>
            <li>Revenue losses</li>
            <li>Reputation losses</li>
            <li>Data loss</li>
            <li>Service interruptions</li>
            <li>AI-generated content outcomes</li>
            <li>Third-party service failures</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">12. Account Suspension & Termination</h3>
          <p className="mb-2">We reserve the right to suspend or terminate accounts that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Violate these Terms.</li>
            <li>Abuse platform resources.</li>
            <li>Engage in fraudulent activities.</li>
            <li>Attempt unauthorized system access.</li>
            <li>Harm other users or the platform.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">13. Modifications to Services</h3>
          <p className="mb-2">PostForge AI reserves the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Add features</li>
            <li>Remove features</li>
            <li>Modify subscription plans</li>
            <li>Update pricing</li>
            <li>Change platform functionality</li>
          </ul>
          <p className="mt-4">at any time.</p>
        </div>

        <div>
          <h3 className="text-[#00e5ff] font-bold mb-3 text-base">14. Governing Law</h3>
          <p>These Terms & Conditions shall be governed by applicable laws and regulations.</p>
        </div>

        <div className="pt-6 border-t border-white/10 mt-8">
          <h3 className="text-white font-bold mb-3 text-base">Final Acknowledgement</h3>
          <p>By creating an account, purchasing a subscription, or using PostForge AI, you confirm that you have read, understood, and agreed to these Privacy Policy and Terms & Conditions.</p>
        </div>

      </div>
    </motion.div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(searchParams.get("tab") || "profile");

  const go = (id: string) => {
    setActive(id);
    router.replace(`/dashboard/settings?tab=${id}`, { scroll: false });
  };

  const panels: Record<string, React.ReactNode> = {
    "profile":         <ProfilePanel />,
    "plans":           <SubscriptionPanel />,
    "history":         <HistoryPanel />,
    "saved-posts":     <SavedPostsPanel />,
    "change-password": <ChangePasswordPanel />,
    "contact-us":      <ContactUsPanel />,
    "privacy-policy":  <PrivacyPolicyPanel />,
    "terms":           <TermsPanel />,
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-[#00e5ff]/30 selection:text-white pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.5); }
      `}} />

      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-[#00e5ff]">Settings Page</h1>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xs font-bold tracking-widest uppercase text-[#00e5ff] hover:text-white transition-colors">
            Back to Dashboard
          </Link>
          <div className="w-8 h-8 rounded-none border border-[#00e5ff] flex items-center justify-center">
            <User size={14} className="text-[#00e5ff]" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full pt-12 px-8 flex flex-col md:flex-row gap-12">
        
        <aside className="w-full md:w-56 shrink-0 space-y-1">
          <div className="mb-6"><p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Settings</p></div>
          <div className="space-y-1">
            {NAV_ITEMS.slice(0, 5).map(({ id, label, Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id} onClick={() => go(id)}
                  className={"w-full flex items-center gap-4 px-4 py-3 text-xs font-bold tracking-wide transition-all text-left " + (isActive ? "bg-[#00e5ff] text-black" : "text-white/50 hover:text-white")}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-8 mb-4 pt-8 border-t border-white/5"><p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Legal & Support</p></div>
          <div className="space-y-1">
            {NAV_ITEMS.slice(5).map(({ id, label, Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id} onClick={() => go(id)}
                  className={"w-full flex items-center gap-4 px-4 py-3 text-xs font-bold tracking-wide transition-all text-left " + (isActive ? "bg-[#00e5ff] text-black" : "text-white/50 hover:text-white")}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={active}>{panels[active]}</motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <SettingsContent />
    </Suspense>
  );
}
