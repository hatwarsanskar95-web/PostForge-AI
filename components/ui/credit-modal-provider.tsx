"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { X, Zap, TriangleAlert, Folder } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreditModalContextType {
  showModal: (resetDate: string | null) => void;
  hideModal: () => void;
}

const CreditModalContext = createContext<CreditModalContextType | undefined>(undefined);

export function CreditModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [resetDateStr, setResetDateStr] = useState<string | null>(null);
  const router = useRouter();

  const showModal = (resetDate: string | null) => {
    setResetDateStr(resetDate);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  const handleProceed = () => {
    hideModal();
    router.push("/dashboard/plans");
  };

  return (
    <CreditModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={hideModal}
          ></div>
          <div className="relative w-full max-w-sm bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={hideModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon Graphic */}
            <div className="relative mt-4 mb-6">
              <div className="w-24 h-24 bg-[#1e1b4b] rounded-2xl flex items-center justify-center border border-[#3b0764] shadow-inner relative">
                <Folder size={48} className="text-[#4c1d95] absolute" strokeWidth={1} />
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center z-10 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  <Zap size={24} className="text-white fill-white" />
                </div>
              </div>
              <div className="absolute -top-3 -left-3 rotate-[-15deg] w-10 h-10 flex items-center justify-center">
                <TriangleAlert size={28} className="text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]" fill="rgba(88,28,135,0.8)" />
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 text-indigo-400">⚡</div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
              Credits Exhausted
            </h2>
            
            <div className="flex items-center justify-center gap-2 w-full max-w-[200px] mb-4 opacity-30">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-500"></div>
              <Zap size={10} className="text-purple-400 fill-purple-400" />
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-500"></div>
            </div>

            <p className="text-sm text-gray-300 mb-4">
              You have used all available credits for your current plan.
            </p>
            
            <p className="text-sm text-gray-400 mb-8 px-2">
              Please upgrade your plan or wait until your credits reset{resetDateStr ? ` on ${resetDateStr}` : ""} to continue generating content.
            </p>

            <button
              onClick={handleProceed}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            >
              Proceed
            </button>
            
          </div>
        </div>
      )}
    </CreditModalContext.Provider>
  );
}

export function useCreditModal() {
  const context = useContext(CreditModalContext);
  if (context === undefined) {
    throw new Error("useCreditModal must be used within a CreditModalProvider");
  }
  return context;
}
