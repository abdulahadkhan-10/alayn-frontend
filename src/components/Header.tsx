"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, Menu, MapPin, Plus, User, Settings, ChevronDown, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/redux/store/hooks";
import { useBranch } from "@/lib/BranchContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface HeaderProps {
  onMenuClick: () => void;
  onOpenCreateOutlet?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const { activeBranch, setActiveBranch, branches, loading: branchesLoading } = useBranch();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = user?.role === "BUSINESS_OWNER" || user?.role === "SUPER_ADMIN";

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__CREATE__") {
      if (isOwner) {
        window.location.href = "/outlets/create";
      }
      return;
    }
    const selected = branches.find((b) => b.id === val) || null;
    setActiveBranch(selected);
  };

  const initial = mounted && user?.name ? user.name.charAt(0).toUpperCase() : "O";
  const isLoadingOutlets = !mounted || (isAuthenticated && branchesLoading && branches.length === 0);

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Menu */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Left: Logo + Outlet Selector */}
        <div className="flex flex-1 items-center gap-x-6">
          <div className="w-56 h-16 flex items-center justify-start hidden sm:block">
            <Image
              src="/image1.png"
              alt="ALAYN Logo"
              width={224}
              height={64}
              style={{ width: "auto", height: "auto" }}
              className="max-h-16 w-auto object-contain"
              priority
            />
          </div>

          {user?.role !== "SUPPLIER" && (
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#D3232A]" />
                {isLoadingOutlets ? (
                  <Skeleton width={140} height={28} borderRadius={8} />
                ) : branches.length > 0 ? (
                  <select
                    value={activeBranch?.id || ""}
                    onChange={handleOutletChange}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm focus:border-[#D3232A] focus:outline-none focus:ring-1 focus:ring-[#D3232A] cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                    {isOwner && <option value="__CREATE__">+ Add New Outlet</option>}
                  </select>
                ) : isOwner ? (
                  <Link
                    href="/outlets/create"
                    className="text-xs font-bold text-[#D3232A] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create First Outlet
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Right: Search, Bell, Profile */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="relative hidden sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Search operations..."
              className="block w-full sm:w-64 rounded-full border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6 bg-gray-50"
            />
          </div>

          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            {!mounted ? (
              <Skeleton circle width={32} height={32} />
            ) : (
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="-m-1.5 flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                id="user-menu-button"
              >
                <div
                  className="h-8 w-8 rounded-full bg-[#D3232A] flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  suppressHydrationWarning
                >
                  {initial}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-900 truncate" suppressHydrationWarning>
                    {mounted ? (user?.name || "Owner") : "Owner"}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium truncate" suppressHydrationWarning>
                    {mounted ? (user?.email || "") : ""}
                  </p>
                  <span className="inline-block mt-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#D3232A]">
                    {user?.role || "BUSINESS_OWNER"}
                  </span>
                </div>

                <Link
                  href="/"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Home className="h-4 w-4 text-gray-400" />
                  Homepage
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
