"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Check,
  X,
  IndianRupee,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Tag,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { TModal } from "@/components/ui/TModal";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetMyCatalogQuery,
  useCreateSupplierItemMutation,
  useUpdateSupplierItemMutation,
  useDeleteSupplierItemMutation,
  SupplierItemApi,
} from "@/redux/slices/supplierApiSlice";

const COMMON_CATEGORIES = [
  "Dairy",
  "Vegetables & Produce",
  "Meat & Poultry",
  "Dry Goods & Grains",
  "Oils & Condiments",
  "Spices & Seasonings",
  "Packaging & Disposables",
  "Bakery & Bread",
  "Beverages",
  "Cleaning & Hygiene",
];

const COMMON_UNITS = ["kg", "litre", "gram", "box", "pack", "bag", "carton", "can", "pcs"];

const QUALITY_GRADES = ["Grade A", "Organic", "Premium", "Standard"];

export default function SupplierCatalogSection() {
  const user = useAppSelector((state) => state.auth.user);
  const isSupplier = user?.role === "SUPPLIER";
  const { data: catalog = [], isLoading, refetch } = useGetMyCatalogQuery(undefined, {
    skip: !isSupplier,
  });
  const [createItem, { isLoading: isCreating }] = useCreateSupplierItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateSupplierItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteSupplierItemMutation();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierItemApi | null>(null);

  // Quick price inline editing
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>("");

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<SupplierItemApi | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Dairy",
    customCategory: "",
    unit: "kg",
    priceRupees: "",
    minOrderQty: "1",
    inStock: true,
    qualityGrade: "Grade A",
    leadTimeHours: "24",
    description: "",
  });

  const [formError, setFormError] = useState("");

  const catalogList: SupplierItemApi[] = useMemo(() => {
    if (Array.isArray(catalog)) return catalog;
    if (catalog && typeof catalog === "object" && Array.isArray((catalog as any).data)) {
      return (catalog as any).data;
    }
    return [];
  }, [catalog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [catalogList]);

  const filteredItems = useMemo(() => {
    return catalogList.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      const matchesCat = categoryFilter === "All" || item.category === categoryFilter;

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") matchesStock = item.inStock;
      else if (stockFilter === "OUT_OF_STOCK") matchesStock = !item.inStock;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [catalogList, search, categoryFilter, stockFilter]);

  const inStockCount = catalogList.filter((i) => i.inStock).length;
  const outOfStockCount = catalogList.length - inStockCount;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      sku: "",
      category: "Dairy",
      customCategory: "",
      unit: "kg",
      priceRupees: "",
      minOrderQty: "1",
      inStock: true,
      qualityGrade: "Grade A",
      leadTimeHours: "24",
      description: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SupplierItemApi) => {
    setEditingItem(item);
    const isStandardCat = COMMON_CATEGORIES.includes(item.category);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      category: isStandardCat ? item.category : "Custom",
      customCategory: isStandardCat ? "" : item.category,
      unit: item.unit,
      priceRupees: (item.pricePaise / 100).toString(),
      minOrderQty: item.minOrderQty?.toString() || "1",
      inStock: item.inStock,
      qualityGrade: item.qualityGrade || "Standard",
      leadTimeHours: item.leadTimeHours?.toString() || "24",
      description: item.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      return setFormError("Product name is required.");
    }

    const priceNum = parseFloat(formData.priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      return setFormError("Please enter a valid price greater than ₹0.");
    }

    const finalCat =
      formData.category === "Custom"
        ? formData.customCategory.trim() || "General"
        : formData.category;

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || undefined,
      category: finalCat,
      unit: formData.unit.trim(),
      pricePaise: Math.round(priceNum * 100),
      minOrderQty: parseFloat(formData.minOrderQty) || 1,
      inStock: formData.inStock,
      qualityGrade: formData.qualityGrade,
      leadTimeHours: parseInt(formData.leadTimeHours, 10) || 24,
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, data: payload }).unwrap();
      } else {
        await createItem(payload).unwrap();
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message || "Failed to save product.");
    }
  };

  const handleQuickPriceSave = async (item: SupplierItemApi) => {
    const val = parseFloat(inlinePriceValue);
    if (isNaN(val) || val <= 0) {
      setInlinePriceId(null);
      return;
    }

    try {
      await updateItem({
        id: item.id,
        data: { pricePaise: Math.round(val * 100) },
      }).unwrap();
      setInlinePriceId(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update price");
    }
  };

  const handleToggleStock = async (item: SupplierItemApi) => {
    try {
      await updateItem({
        id: item.id,
        data: { inStock: !item.inStock },
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert("Failed to toggle availability");
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id).unwrap();
      setItemToDelete(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete item");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Products
            </span>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{catalogList.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 text-zinc-700">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Active / In-Stock
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{inStockCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{outOfStockCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 rounded-2xl text-white shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Live Visibility
            </span>
            <div className="text-xs font-semibold text-zinc-200 mt-1">
              Active on Restaurant Inventory Comparison
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="p-2.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white transition-all shadow-xs shrink-0 cursor-pointer"
            title="Add Product"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search, Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Stock Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStockFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === "ALL" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter("IN_STOCK")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === "IN_STOCK" ? "bg-white text-emerald-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockFilter === "OUT_OF_STOCK" ? "bg-white text-amber-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Out of Stock
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#D3232A]" />
            <p className="text-xs font-semibold text-zinc-500">Loading catalog items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Package className="h-12 w-12 text-zinc-300 mb-2" />
            <h3 className="text-sm font-bold text-zinc-800">No items found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Add the food ingredients, raw materials, or supplies you sell so restaurants can order from you.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-[#D3232A] transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Quality Grade</th>
                  <th className="px-4 py-3.5 text-center">Unit Price (₹)</th>
                  <th className="px-4 py-3.5 text-center">MOQ</th>
                  <th className="px-4 py-3.5 text-center">Delivery SLA</th>
                  <th className="px-4 py-3.5 text-center">Stock Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((item) => {
                  const priceRupees = (item.pricePaise / 100).toFixed(2);
                  const isEditingInline = inlinePriceId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Name & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 text-sm">{item.name}</div>
                        {item.sku && (
                          <div className="text-[11px] text-zinc-400 font-medium">SKU: {item.sku}</div>
                        )}
                        {item.description && (
                          <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs">{item.description}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Quality Grade */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[11px] font-black uppercase">
                          {item.qualityGrade || "Standard"}
                        </span>
                      </td>

                      {/* Unit Price (with Quick Edit) */}
                      <td className="px-4 py-3.5 text-center">
                        {isEditingInline ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-bold text-zinc-400">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={inlinePriceValue}
                              onChange={(e) => setInlinePriceValue(e.target.value)}
                              className="w-20 px-2 py-1 border border-[#D3232A] rounded-lg text-xs font-bold text-zinc-900 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickPriceSave(item)}
                              className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setInlinePriceId(null)}
                              className="p-1 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setInlinePriceId(item.id);
                              setInlinePriceValue(priceRupees);
                            }}
                            className="inline-flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors group"
                            title="Click to quick-edit price"
                          >
                            <span className="text-sm font-black text-zinc-900 tabular-nums">
                              ₹{priceRupees}
                            </span>
                            <span className="text-xs font-normal text-zinc-400">/ {item.unit}</span>
                            <Pencil className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* MOQ */}
                      <td className="px-4 py-3.5 text-center text-xs font-semibold text-zinc-600">
                        {item.minOrderQty} {item.unit}
                      </td>

                      {/* Lead Time */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          {item.leadTimeHours}h
                        </span>
                      </td>

                      {/* Stock Switch */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStock(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            item.inStock
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              item.inStock ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
                            title="Edit Product"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      <TModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-base font-bold text-zinc-900">
              {editingItem ? "Edit Catalog Product" : "Add Product to Your Catalog"}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSaveItem} className="p-4 sm:p-6 space-y-4 text-zinc-900 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Product / Ingredient Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Full Cream Fresh Milk 1L, Red Onions, Refined Flour"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white"
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Custom">+ Other (Custom)</option>
              </select>
            </div>

            {/* Custom Category if selected */}
            {formData.category === "Custom" && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Specify Category</label>
                <input
                  type="text"
                  placeholder="e.g. Seafood, Artisan Cheese"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
                />
              </div>
            )}

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Unit of Measure *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Price (Rupees) */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Wholesale Price (₹) per {formData.unit} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="48.50"
                  value={formData.priceRupees}
                  onChange={(e) => setFormData({ ...formData, priceRupees: e.target.value })}
                  required
                  className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm font-bold focus:border-[#D3232A] focus:outline-none"
                />
              </div>
            </div>

            {/* Minimum Order Quantity */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                step="1"
                placeholder="1"
                value={formData.minOrderQty}
                onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
              />
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Quality Grade</label>
              <select
                value={formData.qualityGrade}
                onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white"
              >
                {QUALITY_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Lead Time Hours */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Delivery Lead Time</label>
              <select
                value={formData.leadTimeHours}
                onChange={(e) => setFormData({ ...formData, leadTimeHours: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white"
              >
                <option value="12">Same Day / 12 Hours</option>
                <option value="24">Next Day / 24 Hours</option>
                <option value="48">2 Days / 48 Hours</option>
                <option value="72">3 Days / 72 Hours</option>
              </select>
            </div>

            {/* SKU / Code */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">SKU / Item Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. MLK-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
              />
            </div>

            {/* Stock Switch */}
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-zinc-800">Available In Stock</span>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Description / Specifications
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Farm fresh pasteurized whole milk, fat content 4.5%. Cold chain delivery."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-5 py-2 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Product" : "Add to Catalog"}
            </button>
          </div>
        </form>
        </div>
      </TModal>

      {/* DELETE CONFIRMATION MODAL */}
      <TModal
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
      >
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden mx-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-base font-bold text-zinc-900">Confirm Removal</h3>
            <button
              onClick={() => setItemToDelete(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 text-zinc-900">
            <p className="text-xs sm:text-sm text-zinc-600">
              Are you sure you want to remove <span className="font-bold text-zinc-900">{itemToDelete?.name}</span> from your product catalog? Restaurants will no longer see this in their supplier comparison.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isDeleting ? "Removing..." : "Remove Product"}
              </button>
            </div>
          </div>
        </div>
      </TModal>
    </div>
  );
}
