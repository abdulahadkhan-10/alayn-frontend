"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useGetOutletsQuery, Outlet } from "@/redux/slices/outletApiSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { baseApi } from "@/redux/store/baseApi";

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
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Enterprise Redux RTK Query Store Cache Hook
  const { 
    data: fetchedOutlets, 
    isLoading: isQueryLoading, 
    refetch 
  } = useGetOutletsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);

  const rawOutlets = (fetchedOutlets as Branch[]) || [];
  const isDemo = !isAuthenticated;
  const loading = isAuthenticated ? (isQueryLoading && rawOutlets.length === 0) : false;

  const branches: Branch[] = isDemo
    ? DEMO_BRANCHES
    : rawOutlets.length > 1
    ? [ALL_OUTLETS_BRANCH, ...rawOutlets]
    : rawOutlets;

  const activeBranches: Branch[] = isDemo
    ? DEMO_BRANCHES
    : rawOutlets.filter(isBranchSubscribed);

  const hasAnyActiveBranch: boolean = isDemo ? true : activeBranches.length > 0;

  const hasActiveSubscription: boolean = isDemo
    ? true
    : activeBranch?.id === "all"
    ? hasAnyActiveBranch
    : isBranchSubscribed(activeBranch);

  useEffect(() => {
    if (isDemo) {
      setActiveBranchState(DEMO_BRANCHES[0]);
    } else if (branches.length > 0) {
      const savedId = typeof window !== "undefined" ? localStorage.getItem("alayn_active_branch_id") : null;
      const matched = branches.find((b) => b.id === savedId);
      const nextBranch = matched || activeBranches[0] || branches[0];
      setActiveBranchState(nextBranch);
      if (nextBranch && typeof window !== "undefined") {
        localStorage.setItem("alayn_active_branch_id", nextBranch.id);
      }
    } else {
      setActiveBranchState(null);
    }
  }, [branches.length, isDemo, activeBranches.length]);

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
