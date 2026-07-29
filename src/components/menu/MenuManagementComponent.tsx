"use client";

import React, { useState, useMemo } from "react";
import {
  useGetMenuItemsQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useToggleMenuItemStatusMutation,
  MenuItem,
} from "@/redux/slices/menuApiSlice";
import {
  Plus,
  Search,
  Tag,
  UtensilsCrossed,
  Upload,
  Pencil,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Layers,
  ArrowUpDown,
  Store,
  X,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { getImageUrl } from "@/lib/utils";
import { useBranch } from "@/lib/BranchContext";

type StatusFilter = "ALL" | "ACTIVE";
type DietaryFilter = "ALL" | "VEG" | "NON_VEG";
type SortOption = "NAME_ASC" | "PRICE_ASC" | "PRICE_DESC";

export default function MenuManagementComponent() {
  const { activeBranch, branches } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;
  const isAllOutletsSelected = !activeBranch || activeBranch.id === "all";

  const specificBranches = useMemo(() => {
    return branches.filter((b) => b.id !== "all");
  }, [branches]);

  const [pendingConfirmAction, setPendingConfirmAction] = useState<"CATEGORY" | "ITEM" | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NAME_ASC");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    isVeg: true,
    outletIds: [] as string[],
  });

  const [editItem, setEditItem] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    isVeg: true,
    outletIds: [] as string[],
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });

  // RTK Query Hooks
  const { data: rawCategories = [], isLoading: isCatLoading } = useGetCategoriesQuery();
  const { data: rawMenuItems = [], isLoading: isItemsLoading } = useGetMenuItemsQuery({
    search: searchQuery.trim() || undefined,
    isAvailable: statusFilter === "ACTIVE" ? true : undefined,
    isVeg: dietaryFilter === "VEG" ? true : dietaryFilter === "NON_VEG" ? false : undefined,
  });

  // Deduplicate categories by lowercase trimmed name
  const categories = useMemo(() => {
    const list = Array.isArray(rawCategories) ? rawCategories : [];
    const map = new Map<string, (typeof list)[0]>();
    list.forEach((c) => {
      if (c && c.name) {
        const key = c.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, c);
        }
      }
    });
    return Array.from(map.values());
  }, [rawCategories]);

  const menuItems = useMemo(() => (Array.isArray(rawMenuItems) ? rawMenuItems : []), [rawMenuItems]);

  // Map category name -> array of category IDs sharing that name
  const categoryNameToIdsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    (Array.isArray(rawCategories) ? rawCategories : []).forEach((c) => {
      if (c && c.name && c.id) {
        const key = c.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(c.id);
      }
    });
    return map;
  }, [rawCategories]);

  // Active Category IDs for selected filter tab
  const activeCategoryIds = useMemo(() => {
    if (selectedCategory === "ALL") return null;
    const foundCat = (Array.isArray(rawCategories) ? rawCategories : []).find(
      (c) => c.id === selectedCategory || c.name.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
    if (!foundCat) return [selectedCategory];
    const key = foundCat.name.trim().toLowerCase();
    return categoryNameToIdsMap.get(key) || [foundCat.id];
  }, [selectedCategory, rawCategories, categoryNameToIdsMap]);

  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();
  const [createMenuItem, { isLoading: isCreatingItem }] = useCreateMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdatingItem }] = useUpdateMenuItemMutation();
  const [toggleStatus] = useToggleMenuItemStatusMutation();

  // File upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "ITEM" | "CATEGORY" | "EDIT_ITEM") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === "ITEM") {
          setNewItem((prev) => ({ ...prev, imageUrl: result }));
        } else if (target === "CATEGORY") {
          setNewCategory((prev) => ({ ...prev, imageUrl: result }));
        } else if (target === "EDIT_ITEM") {
          setEditItem((prev) => ({ ...prev, imageUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [pendingStatusToggle, setPendingStatusToggle] = useState<{
    item: MenuItem;
    targetStatus: boolean;
    relatedItems: MenuItem[];
  } | null>(null);

  // Metrics summary
  const metrics = useMemo(() => {
    if (isAllOutletsSelected) {
      const dishGroupMap = new Map<string, MenuItem[]>();
      menuItems.forEach((item) => {
        const key = item.name.trim().toLowerCase();
        if (!dishGroupMap.has(key)) {
          dishGroupMap.set(key, []);
        }
        dishGroupMap.get(key)!.push(item);
      });

      let activeCount = 0;
      dishGroupMap.forEach((items) => {
        if (items.every((i) => i.isAvailable === true)) {
          activeCount++;
        }
      });

      return {
        total: dishGroupMap.size,
        active: activeCount,
        catCount: categories.length,
      };
    }

    const total = menuItems.length;
    const active = menuItems.filter((i) => i.isAvailable).length;
    const catCount = categories.length;
    return { total, active, catCount };
  }, [isAllOutletsSelected, menuItems, categories]);

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    let items = menuItems;

    if (activeCategoryIds && activeCategoryIds.length > 0) {
      items = items.filter((i) => i.categoryId && activeCategoryIds.includes(i.categoryId));
    }

    return [...items].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "PRICE_ASC") return Number(a.price) - Number(b.price);
      if (sortBy === "PRICE_DESC") return Number(b.price) - Number(a.price);
      return 0;
    });
  }, [menuItems, activeCategoryIds, sortBy]);

  // Group processed items by dish name for clean non-redundant rows when viewing All Outlets
  const displayItems = useMemo(() => {
    if (!isAllOutletsSelected) {
      const start = (currentPage - 1) * pageSize;
      return processedItems.slice(start, start + pageSize).map((item) => ({
        primaryItem: item,
        outletIds: item.outletIds && item.outletIds.length > 0 ? item.outletIds : (item.outletId ? [item.outletId] : []),
        allRelatedItems: [item],
        isGroupActive: item.isAvailable,
      }));
    }

    const map = new Map<string, { primaryItem: MenuItem; outletIds: string[]; allRelatedItems: MenuItem[] }>();

    processedItems.forEach((item) => {
      const itemOutletIds = item.outletIds && item.outletIds.length > 0
        ? item.outletIds
        : (item.outletId ? [item.outletId] : []);

      map.set(item.id, {
        primaryItem: item,
        outletIds: itemOutletIds,
        allRelatedItems: [item],
      });
    });

    const grouped = Array.from(map.values()).map((group) => {
      return {
        ...group,
        isGroupActive: group.primaryItem.isAvailable,
      };
    });

    const start = (currentPage - 1) * pageSize;
    return grouped.slice(start, start + pageSize);
  }, [isAllOutletsSelected, processedItems, currentPage, pageSize]);

  // Pagination calculations
  const totalPages = Math.ceil(
    (isAllOutletsSelected
      ? new Set(processedItems.map((i) => i.name.trim().toLowerCase())).size
      : processedItems.length) / pageSize
  ) || 1;

  // Reset page when filters change
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDietaryFilterChange = (dietary: DietaryFilter) => {
    setDietaryFilter(dietary);
    setCurrentPage(1);
  };

  const outletMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    if (isAllOutletsSelected && !pendingConfirmAction) {
      setPendingConfirmAction("CATEGORY");
      return;
    }

    try {
      if (isAllOutletsSelected && specificBranches.length > 0) {
        for (const branch of specificBranches) {
          await createCategory({ ...newCategory, outletId: branch.id }).unwrap();
        }
      } else {
        await createCategory(newCategory).unwrap();
      }
      setNewCategory({ name: "", description: "", imageUrl: "" });
      setIsAddCategoryOpen(false);
      setPendingConfirmAction(null);
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  const handleOpenAddItemModal = () => {
    const defaultIds = currentOutletId
      ? [currentOutletId]
      : specificBranches.map((b) => b.id);
    setNewItem({
      name: "",
      description: "",
      price: "",
      categoryId: selectedCategory !== "ALL" ? selectedCategory : "",
      imageUrl: "",
      isVeg: true,
      outletIds: defaultIds,
    });
    setIsAddItemOpen(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.categoryId) return;
    const targetOutletIds = newItem.outletIds.length > 0
      ? newItem.outletIds
      : (currentOutletId ? [currentOutletId] : specificBranches.map((b) => b.id));

    try {
      await createMenuItem({
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        categoryId: newItem.categoryId,
        imageUrl: newItem.imageUrl,
        isVeg: newItem.isVeg,
        isAvailable: true,
        outletIds: targetOutletIds,
      }).unwrap();

      setNewItem({ name: "", description: "", price: "", categoryId: "", imageUrl: "", isVeg: true, outletIds: [] });
      setIsAddItemOpen(false);
      setPendingConfirmAction(null);
    } catch (err) {
      console.error("Failed to create menu item:", err);
    }
  };

  const handleToggleAvailabilityClick = (
    primaryItem: MenuItem,
    relatedItems: MenuItem[],
    isGroupActive: boolean
  ) => {
    const nextStatus = !isGroupActive;
    if (isAllOutletsSelected) {
      setPendingStatusToggle({
        item: primaryItem,
        targetStatus: nextStatus,
        relatedItems,
      });
    } else {
      handleExecuteToggle(primaryItem, nextStatus);
    }
  };

  const handleExecuteToggle = async (item: MenuItem, isAvailable: boolean) => {
    try {
      await toggleStatus({
        id: item.id,
        isAvailable,
        outletId: item.outletId || currentOutletId || undefined,
      }).unwrap();
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  const handleConfirmAllOutletsToggle = async () => {
    if (!pendingStatusToggle) return;
    const { targetStatus, relatedItems } = pendingStatusToggle;
    try {
      for (const relItem of relatedItems) {
        await toggleStatus({
          id: relItem.id,
          isAvailable: targetStatus,
          outletId: relItem.outletId || currentOutletId || undefined,
        }).unwrap();
      }
    } catch (err) {
      console.error("Failed to toggle status across outlets:", err);
    } finally {
      setPendingStatusToggle(null);
    }
  };

  const handleOpenEditModal = (item: MenuItem) => {
    const itemOutletIds = item.outletIds && item.outletIds.length > 0
      ? item.outletIds
      : (item.outletId ? [item.outletId] : specificBranches.map((b) => b.id));

    setEditItem({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price !== undefined ? item.price.toString() : "",
      categoryId: item.categoryId || "",
      imageUrl: item.imageUrl || "",
      isVeg: item.isVeg !== false,
      outletIds: itemOutletIds,
    });
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem.name || !editItem.price || !editItem.categoryId) return;
    try {
      await updateMenuItem({
        id: editItem.id,
        data: {
          name: editItem.name,
          description: editItem.description,
          price: parseFloat(editItem.price),
          categoryId: editItem.categoryId,
          imageUrl: editItem.imageUrl,
          isVeg: editItem.isVeg,
          outletIds: editItem.outletIds,
        },
      }).unwrap();
      setIsEditItemOpen(false);
    } catch (err) {
      console.error("Failed to update menu item:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-[#F4F5F8] min-h-screen text-[#1B2A4A]">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-[#D3232A]" />
              Menu Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Scalable product catalog dashboard for managing dishes, categories, pricing, and stock status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="btn-ghost flex justify-center items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              <Tag className="w-4 h-4 text-gray-500" />
              Add Category
            </button>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="bg-[#D3232A] hover:bg-[#b01e23] text-white shadow-xs font-semibold px-4 py-2.5 rounded-xl transition duration-200 flex justify-center items-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Scalable Stats Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
              <h3 className="text-2xl font-extrabold text-[#1B2A4A] mt-1">{metrics.total}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Items</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.active}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{metrics.catCount}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
          {/* Top Row: Search, Status Filter, Sort, View Toggle */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search dish name or description..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#D3232A] transition"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs font-medium">
                <button
                  onClick={() => handleStatusFilterChange("ALL")}
                  className={`px-3 py-1.5 rounded-md transition ${
                    statusFilter === "ALL"
                      ? "bg-white text-[#1B2A4A] font-bold shadow-xs border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => handleStatusFilterChange("ACTIVE")}
                  className={`px-3 py-1.5 rounded-md transition ${
                    statusFilter === "ACTIVE"
                      ? "bg-emerald-500 text-white font-bold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Active
                </button>
              </div>

              {/* Dietary Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs font-medium">
                <button
                  onClick={() => handleDietaryFilterChange("ALL")}
                  className={`px-3 py-1.5 rounded-md transition ${
                    dietaryFilter === "ALL"
                      ? "bg-white text-[#1B2A4A] font-bold shadow-xs border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => handleDietaryFilterChange("VEG")}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                    dietaryFilter === "VEG"
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Veg
                </button>
                <button
                  onClick={() => handleDietaryFilterChange("NON_VEG")}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                    dietaryFilter === "NON_VEG"
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Non-Veg
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 font-semibold">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-gray-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="NAME_ASC">Name (A-Z)</option>
                  <option value="PRICE_ASC">Price (Low → High)</option>
                  <option value="PRICE_DESC">Price (High → Low)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs Pill Row */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-gray-100">
            <button
              onClick={() => handleCategoryChange("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-2 ${
                selectedCategory === "ALL"
                  ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              All Items ({isAllOutletsSelected ? new Set(menuItems.map((i) => i.name.trim().toLowerCase())).size : menuItems.length})
            </button>
            {categories.map((cat) => {
              const key = cat.name.trim().toLowerCase();
              const sisterIds = categoryNameToIdsMap.get(key) || [cat.id];
              const catItems = menuItems.filter(
                (i) => i.categoryId && sisterIds.includes(i.categoryId)
              );
              const count = isAllOutletsSelected
                ? new Set(catItems.map((i) => i.name.trim().toLowerCase())).size
                : catItems.length;

              const isSelected =
                selectedCategory === cat.id ||
                (activeCategoryIds && activeCategoryIds.includes(cat.id));

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {cat.imageUrl && (
                    <img
                      src={getImageUrl(cat.imageUrl)}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  )}
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Table View */}
        {isItemsLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-3 shadow-xs">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : processedItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-xs">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No menu items found</h3>
            <p className="text-gray-500 text-sm mt-1">Try resetting filters, changing search terms, or adding a new menu item.</p>
          </div>
        ) : (
          /* HIGH-DENSITY COMPACT TABLE VIEW */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Item</th>
                    {isAllOutletsSelected && <th className="py-3 px-4">Outlet Location</th>}
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {displayItems.map(({ primaryItem: item, outletIds, allRelatedItems, isGroupActive }) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-xs border p-0.5 shrink-0 ${
                                  item.isVeg !== false ? "border-emerald-600" : "border-rose-600"
                                }`}
                                title={item.isVeg !== false ? "Vegetarian" : "Non-Vegetarian"}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.isVeg !== false ? "bg-emerald-600" : "bg-rose-600"
                                  }`}
                                />
                              </span>
                              <p className="font-bold text-[#1B2A4A]">{item.name}</p>
                            </div>
                            <p className="text-xs text-gray-400 max-w-xs truncate">
                              {item.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      {isAllOutletsSelected && (
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {outletIds.length >= specificBranches.length && specificBranches.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Store className="w-3.5 h-3.5 text-emerald-600" />
                                All {specificBranches.length} Outlets
                              </span>
                            ) : (
                              outletIds.map((outId) => (
                                <span
                                  key={outId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  <Store className="w-3 h-3 text-indigo-500" />
                                  {outletMap.get(outId) || "Outlet"}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {item.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#1B2A4A]">
                        ₹{Number(item.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailabilityClick(item, allRelatedItems, isGroupActive)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isGroupActive ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                            title={
                              isAllOutletsSelected
                                ? isGroupActive
                                  ? "Click to Deactivate across All Outlets"
                                  : "Click to Activate across All Outlets"
                                : item.isAvailable
                                ? "Click to Deactivate"
                                : "Click to Activate"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                                isGroupActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-bold ${
                              isGroupActive ? "text-emerald-700" : "text-gray-500"
                            }`}
                          >
                            {isGroupActive ? "Active" : "Deactivated"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-[#D3232A] hover:bg-gray-100 transition text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scalable Pagination Footer */}
        {processedItems.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Range info */}
            <div className="text-xs text-gray-500 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {Math.min((currentPage - 1) * pageSize + 1, processedItems.length)}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * pageSize, processedItems.length)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{processedItems.length}</span> items
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-bold text-[#1B2A4A]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {isAddItemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-[#1B2A4A] flex items-center gap-2 pb-3 border-b border-gray-100">
                <Plus className="w-5 h-5 text-[#D3232A]" /> Create Menu Item
              </h2>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Butter Chicken Special"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Dietary Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dietary Type *</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, isVeg: true })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        newItem.isVeg
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Veg (Vegetarian)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, isVeg: false })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        !newItem.isVeg
                          ? "bg-rose-50 text-rose-700 border-rose-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="350.00"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={newItem.categoryId}
                      onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                      className="input cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upload Item Photo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer hover:bg-gray-100 transition">
                      <Upload className="w-4 h-4 text-[#D3232A]" /> Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "ITEM")}
                        className="hidden"
                      />
                    </label>
                    {newItem.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={newItem.imageUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">Image Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">No image chosen</span>
                    )}
                  </div>
                </div>

                {/* Outlet Assignment Selection */}
                {specificBranches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">Assigned Outlets / Locations *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = specificBranches.map((b) => b.id);
                          const isAllSelected = newItem.outletIds.length === allIds.length;
                          setNewItem({ ...newItem, outletIds: isAllSelected ? [] : allIds });
                        }}
                        className="text-[11px] font-bold text-[#D3232A] hover:underline cursor-pointer"
                      >
                        {newItem.outletIds.length === specificBranches.length ? "Deselect All" : "Select All Outlets"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 border border-gray-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                      {specificBranches.map((b) => {
                        const isChecked = newItem.outletIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                              isChecked
                                ? "bg-white border-[#1B2A4A] text-[#1B2A4A] shadow-xs"
                                : "bg-gray-100/60 border-transparent text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...newItem.outletIds, b.id]
                                  : newItem.outletIds.filter((id) => id !== b.id);
                                setNewItem({ ...newItem, outletIds: newIds });
                              }}
                              className="rounded text-[#1B2A4A] focus:ring-[#1B2A4A]"
                            />
                            <Store className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short dish summary, ingredients..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingItem}
                    className="bg-[#D3232A] hover:bg-[#b01e23] text-white font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {isCreatingItem ? "Creating..." : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-[#1B2A4A] flex items-center gap-2 pb-3 border-b border-gray-100">
                <Tag className="w-5 h-5 text-[#D3232A]" /> New Menu Category
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starters, Beverages"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Upload Category Photo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Icon/Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer hover:bg-gray-100 transition">
                      <Upload className="w-4 h-4 text-[#D3232A]" /> Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "CATEGORY")}
                        className="hidden"
                      />
                    </label>
                    {newCategory.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={newCategory.imageUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">Image Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">No image chosen</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Optional category description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCat}
                    className="bg-[#D3232A] hover:bg-[#b01e23] text-white font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {isCreatingCat ? "Saving..." : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {isEditItemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-[#1B2A4A] flex items-center gap-2 pb-3 border-b border-gray-100">
                <Pencil className="w-5 h-5 text-[#D3232A]" /> Edit Menu Item
              </h2>
              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Butter Chicken Special"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Dietary Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dietary Type *</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...editItem, isVeg: true })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        editItem.isVeg
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Veg (Vegetarian)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...editItem, isVeg: false })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        !editItem.isVeg
                          ? "bg-rose-50 text-rose-700 border-rose-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="350.00"
                      value={editItem.price}
                      onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={editItem.categoryId}
                      onChange={(e) => setEditItem({ ...editItem, categoryId: e.target.value })}
                      className="input cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upload Item Photo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Item Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer hover:bg-gray-100 transition">
                      <Upload className="w-4 h-4 text-[#D3232A]" /> Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "EDIT_ITEM")}
                        className="hidden"
                      />
                    </label>
                    {editItem.imageUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={getImageUrl(editItem.imageUrl)} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">Image Set</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">No image chosen</span>
                    )}
                  </div>
                </div>

                {/* Outlet Assignment Selection */}
                {specificBranches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">Assigned Outlets / Locations *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = specificBranches.map((b) => b.id);
                          const isAllSelected = editItem.outletIds.length === allIds.length;
                          setEditItem({ ...editItem, outletIds: isAllSelected ? [] : allIds });
                        }}
                        className="text-[11px] font-bold text-[#D3232A] hover:underline cursor-pointer"
                      >
                        {editItem.outletIds.length === specificBranches.length ? "Deselect All" : "Select All Outlets"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 border border-gray-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                      {specificBranches.map((b) => {
                        const isChecked = editItem.outletIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                              isChecked
                                ? "bg-white border-[#1B2A4A] text-[#1B2A4A] shadow-xs"
                                : "bg-gray-100/60 border-transparent text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...editItem.outletIds, b.id]
                                  : editItem.outletIds.filter((id) => id !== b.id);
                                setEditItem({ ...editItem, outletIds: newIds });
                              }}
                              className="rounded text-[#1B2A4A] focus:ring-[#1B2A4A]"
                            />
                            <Store className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short dish summary, ingredients..."
                    value={editItem.description}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditItemOpen(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingItem}
                    className="bg-[#D3232A] hover:bg-[#b01e23] text-white font-semibold px-4 py-2 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {isUpdatingItem ? "Updating..." : "Update Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* All Outlets Creation Confirmation Modal */}
        {pendingConfirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1B2A4A]">
                      Add to All Outlets?
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      'All Outlets' filter is currently selected.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingConfirmAction(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 font-semibold space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-950 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Confirm Multi-Outlet Creation
                </p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Are you sure you want to add this{" "}
                  <strong>
                    {pendingConfirmAction === "CATEGORY" ? "Category" : "Menu Item"}
                  </strong>{" "}
                  across <strong>ALL {specificBranches.length} outlet locations</strong>?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingConfirmAction(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isCreatingCat || isCreatingItem}
                  onClick={(e) => {
                    if (pendingConfirmAction === "CATEGORY") {
                      handleCreateCategory(e as any);
                    } else {
                      handleCreateItem(e as any);
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#1B2A4A] hover:bg-[#2d4272] text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCat || isCreatingItem
                    ? "Creating across outlets..."
                    : "Yes, Add to All Outlets"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle Confirmation Modal */}
        {pendingStatusToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      pendingStatusToggle.targetStatus
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1B2A4A]">
                      {pendingStatusToggle.targetStatus ? "Activate" : "Deactivate"} across All Outlets?
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      'All Outlets' filter is currently selected.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingStatusToggle(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className={`p-3.5 rounded-xl text-xs font-semibold space-y-1.5 border ${
                  pendingStatusToggle.targetStatus
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 ${
                      pendingStatusToggle.targetStatus ? "text-emerald-600" : "text-rose-600"
                    }`}
                  />
                  Confirm Multi-Outlet Status Change
                </p>
                <p className="text-xs leading-relaxed">
                  Are you sure you want to{" "}
                  <strong>
                    {pendingStatusToggle.targetStatus ? "Activate" : "Deactivate"}
                  </strong>{" "}
                  dish <strong>"{pendingStatusToggle.item.name}"</strong> across{" "}
                  <strong>ALL {specificBranches.length} outlet locations</strong>?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingStatusToggle(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllOutletsToggle}
                  className={`flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer ${
                    pendingStatusToggle.targetStatus
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Yes, {pendingStatusToggle.targetStatus ? "Activate" : "Deactivate"} for All Outlets
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
