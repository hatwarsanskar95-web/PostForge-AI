"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserUsageStats } from "@/app/actions/usage";

type UsageStatsType = any; // You can refine this later if needed

interface UsageContextType {
  stats: UsageStatsType | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
  deductCredit: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getUserUsageStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const deductCredit = () => {
    setStats((prev: any) => {
      if (!prev || typeof prev.remaining !== 'number') return prev;
      
      const newRemaining = Math.max(0, prev.remaining - 1);
      
      return {
        ...prev,
        remaining: newRemaining,
        usage: {
          ...prev.usage,
          generations_used: (prev.usage?.generations_used || 0) + 1
        }
      };
    });
  };

  return (
    <UsageContext.Provider value={{ stats, loading, refreshStats: fetchStats, deductCredit }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}
