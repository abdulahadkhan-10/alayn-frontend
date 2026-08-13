"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  useGetMenuItemsQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useToggleMenuItemStatusMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useDeleteMenuItemMutation,
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
  Leaf,
  Trash2,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  Check,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { getImageUrl } from "@/lib/utils";
import { useBranch } from "@/lib/BranchContext";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type DietaryFilter = "ALL" | "VEG" | "NON_VEG" | "VEGAN";
type SortOption = "NAME_ASC" | "PRICE_ASC" | "PRICE_DESC";

// FSSAI Pack Food Icons
const FssaiVegIcon = () => (
  <span className="w-3.5 h-3.5 border border-emerald-600 rounded-[2px] p-[1.5px] inline-flex items-center justify-center shrink-0 bg-white" title="Vegetarian">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
  </span>
);

const FssaiNonVegIcon = () => (
  <span className="w-3.5 h-3.5 border border-rose-600 rounded-[2px] p-[1.5px] inline-flex items-center justify-center shrink-0 bg-white" title="Non-Vegetarian">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
  </span>
);

const FssaiVeganIcon = () => (
  <span className="w-3.5 h-3.5 border border-teal-600 rounded-[2px] p-[1.5px] inline-flex items-center justify-center shrink-0 bg-white" title="Vegan">
    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
  </span>
);

// Status Color Indicators
const ActiveDot = () => (
  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs animate-pulse" />
);

const InactiveDot = () => (
  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-xs" />
);

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
  const [showCommonOnly, setShowCommonOnly] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [isDietaryPopoverOpen, setIsDietaryPopoverOpen] = useState(false);
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false);

  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const statusPopoverRef = useRef<HTMLDivElement>(null);
  const dietaryPopoverRef = useRef<HTMLDivElement>(null);
  const sortPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryPopoverRef.current && !categoryPopoverRef.current.contains(target)) {
        setIsCategoryPopoverOpen(false);
      }
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(target)) {
        setIsStatusPopoverOpen(false);
      }
      if (dietaryPopoverRef.current && !dietaryPopoverRef.current.contains(target)) {
        setIsDietaryPopoverOpen(false);
      }
      if (sortPopoverRef.current && !sortPopoverRef.current.contains(target)) {
        setIsSortPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    isVeg: true,
    dietaryType: "VEG" as "VEG" | "NON_VEG" | "VEGAN",
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
    dietaryType: "VEG" as "VEG" | "NON_VEG" | "VEGAN",
    outletIds: [] as string[],
    allRelatedItemIds: [] as string[],
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const [editCategory, setEditCategory] = useState({
    id: "",
    name: "",
  });

  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // RTK Query Hooks
  const { data: rawCategories = [], isLoading: isCatLoading } = useGetCategoriesQuery();
  const { data: rawMenuItems = [], isLoading: isItemsLoading } = useGetMenuItemsQuery({});

  // Dynamically detect which dietary types exist in current menu
  const { hasVegItems, hasNonVegItems, hasVeganItems } = useMemo(() => {
    const items = Array.isArray(rawMenuItems) ? rawMenuItems : [];
    let veg = false;
    let nonVeg = false;
    let vegan = false;

    items.forEach((item) => {
      const dType = item.dietaryType || (item.isVeg !== false ? "VEG" : "NON_VEG");
      if (dType === "VEGAN") vegan = true;
      else if (dType === "NON_VEG") nonVeg = true;
      else veg = true;
    });

    return { hasVegItems: veg, hasNonVegItems: nonVeg, hasVeganItems: vegan };
  }, [rawMenuItems]);

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

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categories;
    const q = categorySearchQuery.trim().toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, categorySearchQuery]);

  // Category Scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is fully painted before checking scroll
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scrollByAmount = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

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
  const [updateCategory, { isLoading: isUpdatingCat }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCat }] = useDeleteCategoryMutation();
  const [createMenuItem, { isLoading: isCreatingItem }] = useCreateMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdatingItem }] = useUpdateMenuItemMutation();
  const [toggleStatus] = useToggleMenuItemStatusMutation();
  const [deleteMenuItem, { isLoading: isDeletingItem }] = useDeleteMenuItemMutation();

  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMenuItem({ id: itemToDelete.id, outletId: currentOutletId || undefined }).unwrap();
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item.");
    }
  };

  // File upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "ITEM" | "CATEGORY" | "EDIT_ITEM") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === "ITEM") {
          setNewItem((prev) => ({ ...prev, imageUrl: result }));
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

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "ALL") {
      const wantActive = statusFilter === "ACTIVE";
      items = items.filter((i) => (i.isAvailable === true) === wantActive);
    }

    if (activeCategoryIds && activeCategoryIds.length > 0) {
      items = items.filter((i) => i.categoryId && activeCategoryIds.includes(i.categoryId));
    }

    if (dietaryFilter !== "ALL") {
      items = items.filter((i) => {
        const dType = i.dietaryType || (i.isVeg !== false ? "VEG" : "NON_VEG");
        return dType === dietaryFilter;
      });
    }

    return [...items].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "PRICE_ASC") return Number(a.price) - Number(b.price);
      if (sortBy === "PRICE_DESC") return Number(b.price) - Number(a.price);
      return 0;
    });
  }, [menuItems, searchQuery, statusFilter, activeCategoryIds, dietaryFilter, sortBy]);

  // Group processed items by dish name for clean non-redundant rows when viewing All Outlets
  const displayItemsGroupedList = useMemo(() => {
    if (!isAllOutletsSelected) return [];

    const map = new Map<string, { primaryItem: MenuItem; outletIds: string[]; allRelatedItems: MenuItem[] }>();

    processedItems.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const itemOutletIds = item.outletIds && item.outletIds.length > 0
        ? item.outletIds
        : (item.outletId ? [item.outletId] : []);

      if (!map.has(key)) {
        map.set(key, {
          primaryItem: item,
          outletIds: [...itemOutletIds],
          allRelatedItems: [item],
        });
      } else {
        const existing = map.get(key)!;
        existing.allRelatedItems.push(item);
        itemOutletIds.forEach((id) => {
          if (!existing.outletIds.includes(id)) {
            existing.outletIds.push(id);
          }
        });
      }
    });

    let grouped = Array.from(map.values()).map((group) => {
      return {
        ...group,
        isGroupActive: group.allRelatedItems.every((i) => i.isAvailable),
      };
    });

    if (showCommonOnly) {
      grouped = grouped.filter((group) => group.outletIds.length === specificBranches.length);
    }

    return grouped;
  }, [isAllOutletsSelected, processedItems, showCommonOnly, specificBranches.length]);

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

    const start = (currentPage - 1) * pageSize;
    return displayItemsGroupedList.slice(start, start + pageSize);
  }, [isAllOutletsSelected, processedItems, displayItemsGroupedList, currentPage, pageSize]);

  // Pagination calculations
  const totalDisplayedItems = isAllOutletsSelected
    ? displayItemsGroupedList.length
    : processedItems.length;

  const totalPages = Math.ceil(totalDisplayedItems / pageSize) || 1;

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

  const handleResetAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDietaryFilter("ALL");
    setSelectedCategory("ALL");
    setShowCommonOnly(false);
    setCategorySearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== "") count++;
    if (selectedCategory !== "ALL") count++;
    if (statusFilter !== "ALL") count++;
    if (dietaryFilter !== "ALL") count++;
    if (showCommonOnly) count++;
    return count;
  }, [searchQuery, selectedCategory, statusFilter, dietaryFilter, showCommonOnly]);

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === "ALL") return null;
    return categories.find(
      (c) => c.id === selectedCategory || c.name.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
  }, [selectedCategory, categories]);

  const activeBadges = useMemo(() => {
    const badges: { id: string; label: string; value: string; onRemove: () => void }[] = [];

    if (searchQuery.trim()) {
      badges.push({
        id: "search",
        label: "Search",
        value: `"${searchQuery.trim()}"`,
        onRemove: () => handleSearchChange(""),
      });
    }

    if (selectedCategory !== "ALL") {
      badges.push({
        id: "category",
        label: "Category",
        value: selectedCategoryObj ? selectedCategoryObj.name : "Selected Category",
        onRemove: () => handleCategoryChange("ALL"),
      });
    }

    if (statusFilter !== "ALL") {
      badges.push({
        id: "status",
        label: "Status",
        value: statusFilter === "ACTIVE" ? "Active" : "Deactive",
        onRemove: () => handleStatusFilterChange("ALL"),
      });
    }

    if (dietaryFilter !== "ALL") {
      badges.push({
        id: "dietary",
        label: "Type",
        value: dietaryFilter === "VEG" ? "Veg" : dietaryFilter === "NON_VEG" ? "Non-Veg" : "Vegan",
        onRemove: () => handleDietaryFilterChange("ALL"),
      });
    }

    if (showCommonOnly) {
      badges.push({
        id: "common",
        label: "Scope",
        value: "Common Items Only",
        onRemove: () => {
          setShowCommonOnly(false);
          setCurrentPage(1);
        },
      });
    }

    return badges;
  }, [searchQuery, selectedCategory, selectedCategoryObj, statusFilter, dietaryFilter, showCommonOnly]);

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
      setNewCategory({ name: "", description: "" });
      setIsAddCategoryOpen(false);
      setPendingConfirmAction(null);
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory.name) return;
    try {
      await updateCategory({
        id: editCategory.id,
        name: editCategory.name,
      }).unwrap();
      setIsEditCategoryOpen(false);
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory({ id: categoryToDelete.id }).unwrap();
      setCategoryToDelete(null);
      if (selectedCategory === categoryToDelete.id) {
        handleCategoryChange("ALL");
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
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
      dietaryType: "VEG",
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
      // Find the selected category name to locate corresponding category IDs for each target outlet
      const selectedCat = (Array.isArray(rawCategories) ? rawCategories : []).find(
        (c) => c.id === newItem.categoryId
      );
      const catNameKey = selectedCat ? selectedCat.name.trim().toLowerCase() : null;

      // Group target outlets by their category ID (if available)
      const outletToCatMap = new Map<string, string>();
      if (catNameKey) {
        (Array.isArray(rawCategories) ? rawCategories : []).forEach((c) => {
          if (c && c.name && c.name.trim().toLowerCase() === catNameKey && c.outletId) {
            outletToCatMap.set(c.outletId, c.id);
          }
        });
      }

      // Group targetOutletIds by categoryId
      const catToOutletsMap = new Map<string, string[]>();
      targetOutletIds.forEach((outId) => {
        const catId = outletToCatMap.get(outId) || newItem.categoryId;
        if (!catToOutletsMap.has(catId)) {
          catToOutletsMap.set(catId, []);
        }
        catToOutletsMap.get(catId)!.push(outId);
      });

      // Create a menuItem for each category & target outlet group
      for (const [catId, outIds] of catToOutletsMap.entries()) {
        await createMenuItem({
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          categoryId: catId,
          imageUrl: newItem.imageUrl,
          isVeg: newItem.dietaryType !== "NON_VEG",
          dietaryType: newItem.dietaryType,
          isAvailable: true,
          outletIds: outIds,
        }).unwrap();
      }

      setNewItem({ name: "", description: "", price: "", categoryId: "", imageUrl: "", isVeg: true, dietaryType: "VEG", outletIds: [] });
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
    if (isAllOutletsSelected && relatedItems.length > 1) {
      setPendingStatusToggle({
        item: primaryItem,
        targetStatus: nextStatus,
        relatedItems,
      });
    } else {
      const itemToToggle = relatedItems.length === 1 ? relatedItems[0] : primaryItem;
      handleExecuteToggle(itemToToggle, nextStatus);
    }
  };

  const handleExecuteToggle = async (item: MenuItem, isAvailable: boolean) => {
    try {
      await toggleStatus({
        id: item.id,
        isAvailable,
        outletId: currentOutletId || undefined,
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

  const handleOpenEditModal = (item: MenuItem, groupOutletIds?: string[], relatedItems?: MenuItem[]) => {
    let itemOutletIds: string[] = [];
    if (groupOutletIds && groupOutletIds.length > 0) {
      itemOutletIds = [...groupOutletIds];
    } else if (item.outletIds && item.outletIds.length > 0) {
      itemOutletIds = [...item.outletIds];
    } else if (item.outletId) {
      itemOutletIds = [item.outletId];
    }

    if (relatedItems && relatedItems.length > 0) {
      relatedItems.forEach((rel) => {
        if (rel.outletId && !itemOutletIds.includes(rel.outletId)) {
          itemOutletIds.push(rel.outletId);
        }
        if (Array.isArray(rel.outletIds)) {
          rel.outletIds.forEach((id) => {
            if (id && !itemOutletIds.includes(id)) {
              itemOutletIds.push(id);
            }
          });
        }
      });
    }

    if (itemOutletIds.length === 0) {
      itemOutletIds = specificBranches.map((b) => b.id);
    }

    const itemDietaryType = item.dietaryType || (item.isVeg !== false ? "VEG" : "NON_VEG");

    // Match category by name in deduplicated categories array for clean dropdown selection
    const targetCat = (Array.isArray(rawCategories) ? rawCategories : []).find((c) => c.id === item.categoryId);
    const catNameKey = targetCat
      ? targetCat.name.trim().toLowerCase()
      : (item.category?.name ? item.category.name.trim().toLowerCase() : null);
    const matchedCategory = catNameKey
      ? categories.find((c) => c.name.trim().toLowerCase() === catNameKey)
      : null;
    const finalCategoryId = matchedCategory ? matchedCategory.id : (item.categoryId || "");

    setEditItem({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price !== undefined ? item.price.toString() : "",
      categoryId: finalCategoryId,
      imageUrl: item.imageUrl || "",
      isVeg: itemDietaryType !== "NON_VEG",
      dietaryType: itemDietaryType,
      outletIds: itemOutletIds,
      allRelatedItemIds: relatedItems ? relatedItems.map((r) => r.id) : [item.id],
    });
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem.name || !editItem.price || !editItem.categoryId) return;
    try {
      // Find category name key from selected categoryId
      const selectedCat = (Array.isArray(rawCategories) ? rawCategories : []).find(
        (c) => c.id === editItem.categoryId
      );
      const catNameKey = selectedCat ? selectedCat.name.trim().toLowerCase() : null;

      // Map outletId -> categoryId for each target outlet
      const outletToCatMap = new Map<string, string>();
      if (catNameKey) {
        (Array.isArray(rawCategories) ? rawCategories : []).forEach((c) => {
          if (c && c.name && c.name.trim().toLowerCase() === catNameKey && c.outletId) {
            outletToCatMap.set(c.outletId, c.id);
          }
        });
      }

      const relatedIds = editItem.allRelatedItemIds && editItem.allRelatedItemIds.length > 0
        ? editItem.allRelatedItemIds
        : [editItem.id];

      // Partition target outlets across related items to prevent duplicates
      const remainingTargetOutlets = new Set(editItem.outletIds);
      const itemToOutlets = new Map<string, string[]>();

      for (const itemId of relatedIds) {
        const targetItem = (Array.isArray(rawMenuItems) ? rawMenuItems : []).find((i) => i.id === itemId);
        const originalOutlets = targetItem?.outletIds?.length
          ? targetItem.outletIds
          : (targetItem?.outletId ? [targetItem.outletId] : []);

        const assignedOutlets = originalOutlets.filter((id: string) => remainingTargetOutlets.has(id));
        assignedOutlets.forEach((id: string) => remainingTargetOutlets.delete(id));

        itemToOutlets.set(itemId, assignedOutlets);
      }

      if (remainingTargetOutlets.size > 0 && relatedIds.length > 0) {
        const firstItemId = relatedIds[0];
        const current = itemToOutlets.get(firstItemId) || [];
        itemToOutlets.set(firstItemId, [...current, ...Array.from(remainingTargetOutlets)]);
      }

      for (const itemId of relatedIds) {
        const targetItem = (Array.isArray(rawMenuItems) ? rawMenuItems : []).find((i) => i.id === itemId);
        const itemOutletId = targetItem?.outletId || currentOutletId || null;
        const targetCatId = itemOutletId && outletToCatMap.has(itemOutletId)
          ? outletToCatMap.get(itemOutletId)!
          : editItem.categoryId;

        await updateMenuItem({
          id: itemId,
          data: {
            name: editItem.name,
            description: editItem.description,
            price: parseFloat(editItem.price),
            categoryId: targetCatId,
            imageUrl: editItem.imageUrl,
            isVeg: editItem.dietaryType !== "NON_VEG",
            dietaryType: editItem.dietaryType,
            outletIds: itemToOutlets.get(itemId) || [],
          },
        }).unwrap();
      }
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
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 shrink-0">
            <button
              onClick={() => {
                if (isAllOutletsSelected) {
                  alert("Please select a specific outlet to manage categories.");
                  return;
                }
                setIsAddCategoryOpen(true);
              }}
              disabled={isAllOutletsSelected}
              className={`flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition duration-200 w-full sm:w-auto whitespace-nowrap ${isAllOutletsSelected
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                }`}
              title={isAllOutletsSelected ? "Select a specific outlet to add categories" : "Add Category"}
            >
              <Tag className={`w-4 h-4 ${isAllOutletsSelected ? "text-gray-400" : "text-gray-500"}`} />
              Add Category
            </button>
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="bg-[#D3232A] hover:bg-[#b01e23] text-white shadow-xs font-semibold px-4 py-2.5 rounded-xl transition duration-200 flex justify-center items-center gap-2 w-full sm:w-auto cursor-pointer whitespace-nowrap"
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

        {/* Modern Minimalist SaaS Filter Toolbar (Direct Access: Search | Category | Status | Type | Sort) */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-visible">
          {/* Primary Control Bar */}
          <div className="p-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
            {/* 1. Primary Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes or descriptions..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-gray-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direct Access Controls: Category | Status | Type | Sort */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* 2. Modern Searchable Category Combobox Popover */}
              <div className="relative" ref={categoryPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryPopoverOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition cursor-pointer ${selectedCategory !== "ALL"
                      ? "bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-2xs"
                      : "bg-slate-50/80 border-gray-200/80 text-slate-700 hover:bg-slate-100/80"
                    }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${selectedCategory !== "ALL" ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate max-w-[130px]">
                    {selectedCategoryObj ? selectedCategoryObj.name : "Category: All"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryPopoverOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Popover Menu for 100+ Categories */}
                {isCategoryPopoverOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-30 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter 100+ categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#1B2A4A]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          handleCategoryChange("ALL");
                          setIsCategoryPopoverOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-left transition cursor-pointer ${selectedCategory === "ALL"
                            ? "bg-[#1B2A4A] text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span>All Categories</span>
                        <span className="text-[11px] opacity-70">
                          {isAllOutletsSelected ? new Set(menuItems.map((i) => i.name.trim().toLowerCase())).size : menuItems.length}
                        </span>
                      </button>

                      {filteredCategories.map((cat) => {
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
                            type="button"
                            onClick={() => {
                              handleCategoryChange(cat.id);
                              setIsCategoryPopoverOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium text-left transition cursor-pointer ${isSelected
                                ? "bg-[#1B2A4A] text-white font-semibold"
                                : "text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            <span className="truncate pr-2">{cat.name}</span>
                            <span className="text-[11px] opacity-70 shrink-0">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Modern Status Combobox Popover */}
              <div className="relative" ref={statusPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusPopoverOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition cursor-pointer ${statusFilter !== "ALL"
                      ? "bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-2xs"
                      : "bg-slate-50/80 border-gray-200/80 text-slate-700 hover:bg-slate-100/80"
                    }`}
                >
                  {statusFilter === "ACTIVE" ? <ActiveDot /> : statusFilter === "INACTIVE" ? <InactiveDot /> : null}
                  <span className="truncate">
                    {statusFilter === "ALL" ? "Status: All" : statusFilter === "ACTIVE" ? "Active" : "Deactive"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isStatusPopoverOpen ? "rotate-90" : ""}`} />
                </button>

                {isStatusPopoverOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-30 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "ALL", label: "All Status", dot: null },
                      { id: "ACTIVE", label: "Active", dot: <ActiveDot /> },
                      { id: "INACTIVE", label: "Deactive", dot: <InactiveDot /> },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          handleStatusFilterChange(st.id as StatusFilter);
                          setIsStatusPopoverOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition cursor-pointer ${statusFilter === st.id
                            ? "bg-[#1B2A4A] text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {st.dot}
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Modern Dietary Type Combobox Popover */}
              <div className="relative" ref={dietaryPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsDietaryPopoverOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition cursor-pointer ${dietaryFilter !== "ALL"
                      ? "bg-[#1B2A4A] border-[#1B2A4A] text-white shadow-2xs"
                      : "bg-slate-50/80 border-gray-200/80 text-slate-700 hover:bg-slate-100/80"
                    }`}
                >
                  {dietaryFilter === "VEG" ? (
                    <FssaiVegIcon />
                  ) : dietaryFilter === "NON_VEG" ? (
                    <FssaiNonVegIcon />
                  ) : dietaryFilter === "VEGAN" ? (
                    <FssaiVeganIcon />
                  ) : null}
                  <span className="truncate">
                    {dietaryFilter === "ALL"
                      ? "Type: All"
                      : dietaryFilter === "VEG"
                        ? "Vegetarian"
                        : dietaryFilter === "NON_VEG"
                          ? "Non-Vegetarian"
                          : "Vegan"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isDietaryPopoverOpen ? "rotate-90" : ""}`} />
                </button>

                {isDietaryPopoverOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-30 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "ALL", label: "All Types", icon: null },
                      { id: "VEG", label: "Vegetarian", icon: <FssaiVegIcon /> },
                      { id: "NON_VEG", label: "Non-Vegetarian", icon: <FssaiNonVegIcon /> },
                      { id: "VEGAN", label: "Vegan", icon: <FssaiVeganIcon /> },
                    ].map((dt) => (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          handleDietaryFilterChange(dt.id as DietaryFilter);
                          setIsDietaryPopoverOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition cursor-pointer ${dietaryFilter === dt.id
                            ? "bg-[#1B2A4A] text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {dt.icon}
                        <span>{dt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Modern Sort Combobox Popover */}
              <div className="relative" ref={sortPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsSortPopoverOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200/80 bg-slate-50/80 hover:bg-slate-100/80 text-xs font-medium text-slate-700 transition cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {sortBy === "NAME_ASC"
                      ? "Sort: Name (A-Z)"
                      : sortBy === "PRICE_ASC"
                        ? "Sort: Price (Low → High)"
                        : "Sort: Price (High → Low)"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSortPopoverOpen ? "rotate-90" : ""}`} />
                </button>

                {isSortPopoverOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-30 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "NAME_ASC", label: "Name (A-Z)" },
                      { id: "PRICE_ASC", label: "Price (Low → High)" },
                      { id: "PRICE_DESC", label: "Price (High → Low)" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSortBy(s.id as SortOption);
                          setIsSortPopoverOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition cursor-pointer ${sortBy === s.id
                            ? "bg-[#1B2A4A] text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scope Toggle (Common Items in All Outlets View) */}
              {isAllOutletsSelected && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50/80 border border-gray-200/80 px-2.5 py-2 rounded-lg text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showCommonOnly}
                    onChange={(e) => {
                      setShowCommonOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-3.5 h-3.5 rounded text-[#1B2A4A] focus:ring-[#1B2A4A] border-gray-300 cursor-pointer"
                  />
                  <span>Common Only</span>
                </label>
              )}

              {/* Reset Link */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 underline px-1 cursor-pointer"
                  title="Reset All Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {activeBadges.length > 0 && (
            <div className="px-3 pb-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mr-1">
                Active:
              </span>
              {activeBadges.map((badge) => (
                <span
                  key={badge.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200/80 bg-slate-100/70 text-xs font-medium text-slate-700"
                >
                  <span className="text-slate-400">{badge.label}:</span>
                  <span>{badge.value}</span>
                  <button
                    type="button"
                    onClick={badge.onRemove}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 underline ml-auto cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content Body: Table View */}
        {isItemsLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-3 shadow-xs">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : totalDisplayedItems === 0 ? (
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
                              {(() => {
                                const dType = item.dietaryType || (item.isVeg !== false ? "VEG" : "NON_VEG");
                                if (dType === "VEGAN") return <FssaiVeganIcon />;
                                return dType === "VEG" ? <FssaiVegIcon /> : <FssaiNonVegIcon />;
                              })()}
                              <p className="font-bold text-[#1B2A4A]">{item.name}</p>
                              {(item.dietaryType === "VEGAN") && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                                  <Leaf className="w-2.5 h-2.5" /> Vegan
                                </span>
                              )}
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
                            {(() => {
                              const activeOutletIds: string[] = [];
                              allRelatedItems.forEach((relItem) => {
                                if (Array.isArray(relItem.outlets) && relItem.outlets.length > 0) {
                                  relItem.outlets.forEach((o: any) => {
                                    if (o.isActive !== false && !activeOutletIds.includes(o.outletId)) {
                                      activeOutletIds.push(o.outletId);
                                    }
                                  });
                                } else if (relItem.isAvailable) {
                                  const relOutletIds = relItem.outletIds && relItem.outletIds.length > 0
                                    ? relItem.outletIds
                                    : (relItem.outletId ? [relItem.outletId] : []);
                                  relOutletIds.forEach((id) => {
                                    if (!activeOutletIds.includes(id)) {
                                      activeOutletIds.push(id);
                                    }
                                  });
                                }
                              });

                              return activeOutletIds.length >= specificBranches.length && specificBranches.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                                  All {specificBranches.length} Outlets
                                </span>
                              ) : activeOutletIds.length > 1 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                  <Store className="w-3.5 h-3.5 text-indigo-500" />
                                  {activeOutletIds.length} Outlets
                                </span>
                              ) : (
                                activeOutletIds.map((outId: string) => (
                                  <span
                                    key={outId}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                                  >
                                    <Store className="w-3 h-3 text-indigo-500" />
                                    {outletMap.get(outId) || "Outlet"}
                                  </span>
                                ))
                              );
                            })()}
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
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isGroupActive ? "bg-emerald-500" : "bg-gray-300"
                              }`}
                            title={
                              isAllOutletsSelected
                                ? isGroupActive
                                  ? "Click to set Deactive across All Outlets"
                                  : "Click to Activate across All Outlets"
                                : item.isAvailable
                                  ? "Click to set Deactive"
                                  : "Click to Activate"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${isGroupActive ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-bold ${isGroupActive ? "text-emerald-700" : "text-rose-600"
                              }`}
                          >
                            {isGroupActive ? "Active" : "Deactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item, outletIds, allRelatedItems)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-[#1B2A4A] hover:bg-gray-100 transition text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition text-xs font-semibold inline-flex items-center"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scalable Pagination Footer */}
        {totalDisplayedItems > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Range info */}
            <div className="text-xs text-gray-500 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {Math.min((currentPage - 1) * pageSize + 1, totalDisplayedItems)}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * pageSize, totalDisplayedItems)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{totalDisplayedItems}</span> items
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, dietaryType: "VEG", isVeg: true })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${newItem.dietaryType === "VEG"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, dietaryType: "NON_VEG", isVeg: false })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${newItem.dietaryType === "NON_VEG"
                          ? "bg-rose-50 text-rose-700 border-rose-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, dietaryType: "VEGAN", isVeg: true })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${newItem.dietaryType === "VEGAN"
                          ? "bg-teal-50 text-teal-700 border-teal-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <Leaf className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      Vegan
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

                {/* Outlet Assignment Selection - Only shown when 'All Outlets' is selected */}
                {isAllOutletsSelected && specificBranches.length > 0 && (
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
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition ${isChecked
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
                            <span className="whitespace-normal break-words leading-tight" title={b.name}>{b.name}</span>
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...editItem, dietaryType: "VEG", isVeg: true })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${editItem.dietaryType === "VEG"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...editItem, dietaryType: "NON_VEG", isVeg: false })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${editItem.dietaryType === "NON_VEG"
                          ? "bg-rose-50 text-rose-700 border-rose-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...editItem, dietaryType: "VEGAN", isVeg: true })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${editItem.dietaryType === "VEGAN"
                          ? "bg-teal-50 text-teal-700 border-teal-500 shadow-2xs"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <Leaf className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      Vegan
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
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition ${isChecked
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
                            <span className="whitespace-normal break-words leading-tight" title={b.name}>{b.name}</span>
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
                    className={`p-2.5 rounded-xl ${pendingStatusToggle.targetStatus
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                      }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1B2A4A]">
                      {pendingStatusToggle.targetStatus ? "Activate" : "Deactivate"} across assigned outlets?
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
                className={`p-3.5 rounded-xl text-xs font-semibold space-y-1.5 border ${pendingStatusToggle.targetStatus
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
              >
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 ${pendingStatusToggle.targetStatus ? "text-emerald-600" : "text-rose-600"
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
                  <strong>all {pendingStatusToggle.relatedItems.length} assigned outlet location(s)</strong>?
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
                  className={`flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer ${pendingStatusToggle.targetStatus
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

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">Delete Menu Item</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeletingItem}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  disabled={isDeletingItem}
                  className="flex-1 py-2.5 text-white text-sm font-black rounded-xl shadow-md bg-rose-600 hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeletingItem ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Category Modal */}
        {isEditCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1B2A4A]">Edit Category</h3>
                </div>
                <button
                  onClick={() => setIsEditCategoryOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategory.name}
                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition"
                    placeholder="e.g., Starters, Beverages"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditCategoryOpen(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCat || !editCategory.name.trim()}
                    className="flex-1 py-2.5 bg-[#1B2A4A] hover:bg-[#2d4272] text-white text-sm font-black rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdatingCat ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Modal */}
        {categoryToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-5">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                  <Trash2 className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Delete Category?</h3>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg mb-2">
                    <p className="text-sm text-rose-800 font-medium">
                      All menu items inside <strong>"{categoryToDelete.name}"</strong> will also be removed!
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    This action is permanent and affects the selected outlets.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  disabled={isDeletingCat}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  disabled={isDeletingCat}
                  className="flex-1 py-2.5 text-white text-sm font-black rounded-xl shadow-md bg-rose-600 hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeletingCat ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
