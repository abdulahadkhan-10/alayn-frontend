"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { baseApi } from "@/redux/store/baseApi";
import { loadOfflinePack } from "@/lib/offline/offlinePack";

export interface BranchSubscription {
  id: string;
  status: "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "CANCELED";
  planCode?: string;
  planName?: string;
  monthlyFeePaise?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  businessId?: string;
  city?: string;
  state?: string;
  country?: string;
  kitchenMode?: "KOT" | "KDS" | "HYBRID";
  subscription?: BranchSubscription | null;
}

export const isBranchSubscribed = (branch: Branch | null | undefined): boolean => {
  if (!branch) return false;
  const sub = branch.subscription;
  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) <= new Date()) return false;
  return true;
};

interface BranchContextType {
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch | null) => void;
  branches: Branch[];
  activeBranches: Branch[];
  hasActiveSubscription: boolean;
  hasAnyActiveBranch: boolean;
  loading: boolean;
  isDemo: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const ALL_OUTLETS_BRANCH: Branch = {
  id: "all",
  name: "All Outlets",
  address: "All Locations Overview",
  businessId: "all",
};

const DEMO_BRANCHES: Branch[] = [
  { id: "demo-soho", name: "London Soho", address: "12 Wardour St, London", businessId: "demo-business" },
  { id: "demo-deansgate", name: "Manchester Deansgate", address: "123 Deansgate, Manchester", businessId: "demo-business" },
  { id: "demo-bullring", name: "Birmingham Bullring", address: "Bullring Shopping Centre, Birmingham", businessId: "demo-business" },
  { id: "demo-victoria", name: "Leeds Victoria", address: "Victoria Gate, Leeds", businessId: "demo-business" }
];

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAuthenticated = authStatus === "authenticated";
  // Placeholder branches are for visitors who are known to be signed out. While the server is still
  // confirming the session ("unknown") there are simply no branches yet, never demo ones.
  const isSessionPending = authStatus === "unknown";

  // Enterprise Redux RTK Query Store Cache Hook
  const { 
    data: fetchedOutlets, 
    isLoading: isQueryLoading, 
    isUninitialized: isQueryUninitialized,
    isError: isQueryError,
    refetch 
  } = useGetOutletsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Outlets saved for offline billing: used only when the server can't be reached on this page load,
  // so a POS reopened with no internet still knows its outlet (and isn't shown the paywall)
  const [offlineOutlets, setOfflineOutlets] = useState<Branch[]>([]);
  useEffect(() => {
    void loadOfflinePack().then((pack) => pack && setOfflineOutlets(pack.outlets as Branch[]));
  }, []);

  const [activeBranchState, setActiveBranchState] = useState<Branch | null>(null);
  const lastKnownOutletsRef = useRef<Branch[]>([]);

  if (!isAuthenticated) {
    lastKnownOutletsRef.current = [];
  } else if (fetchedOutlets !== undefined) {
    lastKnownOutletsRef.current = fetchedOutlets as Branch[];
  }

  const rawOutlets =
    (fetchedOutlets as Branch[]) ??
    (lastKnownOutletsRef.current.length > 0 || !isQueryError ? lastKnownOutletsRef.current : offlineOutlets);
  const isDemo = authStatus === "unauthenticated";
  const loading = isAuthenticated
    ? ((isQueryLoading || isQueryUninitialized) && rawOutlets.length === 0)
    : isSessionPending;

  const branches: Branch[] = isDemo
    ? DEMO_BRANCHES
    : rawOutlets.length > 1
    ? [ALL_OUTLETS_BRANCH, ...rawOutlets]
    : rawOutlets;

  const activeBranches: Branch[] = isDemo
    ? DEMO_BRANCHES
    : rawOutlets.filter(isBranchSubscribed);

  const hasAnyActiveBranch: boolean = isDemo ? true : activeBranches.length > 0;

  // Derive activeBranch synchronously so there is never a 1-frame null gap after outlets load
  const activeBranch: Branch | null = useMemo(() => {
    if (isDemo) return activeBranchState || DEMO_BRANCHES[0];
    if (branches.length === 0) return loading ? activeBranchState : null;
    if (activeBranchState && branches.some((b) => b.id === activeBranchState.id)) {
      return branches.find((b) => b.id === activeBranchState.id) || activeBranchState;
    }
    const savedId = typeof window !== "undefined" ? localStorage.getItem("alayn_active_branch_id") : null;
    const matched = savedId ? branches.find((b) => b.id === savedId) : undefined;
    // Respect any specific outlet explicitly chosen by the user; for "all", require at least one active branch
    if (matched && (matched.id !== "all" || hasAnyActiveBranch)) {
      return matched;
    }
    return activeBranches[0] || matched || branches[0] || null;
  }, [isDemo, activeBranchState, branches, activeBranches, hasAnyActiveBranch, loading]);

  const hasActiveSubscription: boolean = isDemo
    ? true
    : loading
    ? true
    : activeBranch?.id === "all"
    ? hasAnyActiveBranch
    : isBranchSubscribed(activeBranch);

  useEffect(() => {
    if (isDemo) {
      setActiveBranchState(DEMO_BRANCHES[0]);
    } else if (activeBranch) {
      setActiveBranchState(activeBranch);
      if (typeof window !== "undefined") {
        localStorage.setItem("alayn_active_branch_id", activeBranch.id);
      }
    } else if (!loading) {
      setActiveBranchState(null);
    }
  }, [activeBranch, isDemo, loading]);

  const dispatch = useAppDispatch();

  const setActiveBranch = (branch: Branch | null) => {
    setActiveBranchState(branch);
    if (branch && typeof window !== "undefined") {
      localStorage.setItem("alayn_active_branch_id", branch.id);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("alayn_active_branch_id");
    }
    dispatch(baseApi.util.resetApiState());
  };

  const refreshBranches = async () => {
    await refetch();
  };

  return (
    <BranchContext.Provider value={{ 
      activeBranch, 
      setActiveBranch, 
      branches, 
      activeBranches,
      hasActiveSubscription,
      hasAnyActiveBranch,
      loading, 
      isDemo, 
      refreshBranches 
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
