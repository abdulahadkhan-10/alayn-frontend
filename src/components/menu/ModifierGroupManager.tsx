"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  SlidersHorizontal,
  X,
  Check,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { TModal } from "@/components/ui/TModal";
import {
  useGetModifierGroupsQuery,
  useCreateModifierGroupMutation,
  useUpdateModifierGroupMutation,
  useDeleteModifierGroupMutation,
  ModifierGroup,
  ModifierItem,
} from "@/redux/slices/menuApiSlice";
import { useBranch } from "@/lib/BranchContext";

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

interface ModifierOptionDraft {
  id?: string;
  name: string;
  price: string;
  isVeg: boolean;
  dietaryType: "VEG" | "NON_VEG" | "VEGAN";
}

export default function ModifierGroupManager() {
  const { activeBranch } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : undefined;

  const { data: modifierGroups = [], isLoading } = useGetModifierGroupsQuery({ outletId: currentOutletId });
  const [createModifierGroup, { isLoading: isCreating }] = useCreateModifierGroupMutation();
  const [updateModifierGroup, { isLoading: isUpdating }] = useUpdateModifierGroupMutation();
  const [deleteModifierGroup, { isLoading: isDeleting }] = useDeleteModifierGroupMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectionType, setSelectionType] = useState<"OPTIONAL_MULTI" | "MANDATORY_SINGLE" | "CUSTOM">("OPTIONAL_MULTI");
  const [minSelection, setMinSelection] = useState(0);
  const [maxSelection, setMaxSelection] = useState<number | null>(null);
  const [options, setOptions] = useState<ModifierOptionDraft[]>([
    { name: "", price: "0", isVeg: true, dietaryType: "VEG" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupDesc("");
    setSelectionType("OPTIONAL_MULTI");
    setMinSelection(0);
    setMaxSelection(null);
    setOptions([{ name: "", price: "0", isVeg: true, dietaryType: "VEG" }]);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: ModifierGroup) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupDesc(group.description || "");

    if (group.minSelection === 1 && group.maxSelection === 1) {
      setSelectionType("MANDATORY_SINGLE");
    } else if (group.minSelection === 0 && !group.maxSelection) {
      setSelectionType("OPTIONAL_MULTI");
    } else {
      setSelectionType("CUSTOM");
    }
    setMinSelection(group.minSelection);
    setMaxSelection(group.maxSelection ?? null);

    setOptions(
      (group.modifiers || []).map((m) => ({
        id: m.id,
        name: m.name,
        price: String(m.price ?? (m.pricePaise ? m.pricePaise / 100 : 0)),
        isVeg: m.isVeg ?? true,
        dietaryType: m.dietaryType || "VEG",
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { name: "", price: "0", isVeg: true, dietaryType: "VEG" }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: keyof ModifierOptionDraft, val: any) => {
    setOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx !== index) return opt;
        if (field === "isVeg") {
          return {
            ...opt,
            isVeg: val,
            dietaryType: val ? "VEG" : "NON_VEG",
          };
        }
        return { ...opt, [field]: val };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!groupName.trim()) {
      setFormError("Please enter a group name (e.g. Extras / Add-ons, Size).");
      return;
    }

    const validOptions = options.filter((o) => o.name.trim().length > 0);
    if (validOptions.length === 0) {
      setFormError("Please add at least one customization option.");
      return;
    }

    let finalMin = minSelection;
    let finalMax = maxSelection;

    if (selectionType === "OPTIONAL_MULTI") {
      finalMin = 0;
      finalMax = null;
    } else if (selectionType === "MANDATORY_SINGLE") {
      finalMin = 1;
      finalMax = 1;
    }

    if (finalMax !== null && finalMin > finalMax) {
      setFormError("Minimum selection cannot be more than maximum selection.");
      return;
    }
    if (finalMin > validOptions.length) {
      setFormError(`This group needs at least ${finalMin} option(s) for customers to choose from.`);
      return;
    }

    const payload = {
      name: groupName.trim(),
      // An empty string (not undefined) so clearing the description on edit actually clears it
      description: groupDesc.trim(),
      minSelection: finalMin,
      maxSelection: finalMax,
      outletId: currentOutletId,
      modifiers: validOptions.map((o, idx) => ({
        id: o.id,
        name: o.name.trim(),
        price: Number(o.price) || 0,
        pricePaise: Math.round((Number(o.price) || 0) * 100),
        isVeg: o.isVeg,
        dietaryType: o.dietaryType,
        sortOrder: idx,
      })),
    };

    try {
      if (editingGroupId) {
        await updateModifierGroup({
          id: editingGroupId,
          data: payload,
          outletId: currentOutletId,
        }).unwrap();
      } else {
        await createModifierGroup({
          ...payload,
          outletId: currentOutletId,
        }).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || "Failed to save modifier group");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    try {
      await deleteModifierGroup({ id: groupToDelete.id, outletId: currentOutletId }).unwrap();
      setGroupToDelete(null);
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete modifier group");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Reusable Modifier Groups</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Add-ons & Variations Manager</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Create reusable customization groups (like <span className="text-amber-300 font-semibold">&ldquo;Extra Butter&rdquo; (+₹20)</span>, <span className="text-amber-300 font-semibold">&ldquo;Cheese Slice&rdquo; (+₹35)</span>, or <span className="text-amber-300 font-semibold">&ldquo;Half / Full&rdquo;</span> sizes). Attach them to any menu item to empower your POS cashiers and QR diners.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Add-on Group</span>
        </button>
      </div>

      {/* Grid of Modifier Groups */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading Add-on Groups...
        </div>
      ) : modifierGroups.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Add-on Groups Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Add-on groups let you configure extras like Extra Butter, Toppings, or Portion Sizes once and link them across dishes.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modifierGroups.map((group) => {
            const isSingleChoice = group.minSelection === 1 && group.maxSelection === 1;
            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Group"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isSingleChoice
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {isSingleChoice ? "Mandatory (Pick 1)" : "Optional (Multi-select)"}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {group.modifiers?.length || 0} options
                    </span>
                    {group.itemCount !== undefined && group.itemCount > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Linked to {group.itemCount} dish{group.itemCount > 1 ? "es" : ""}
                      </span>
                    )}
                  </div>

                  {/* Options List Preview */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {(group.modifiers || []).slice(0, 5).map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-1.5">
                          {m.isVeg ? <FssaiVegIcon /> : <FssaiNonVegIcon />}
                          <span className="font-medium text-slate-800">{m.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {group.minSelection === 1 && group.maxSelection === 1
                            ? `₹${Number(m.price).toFixed(2)}`
                            : m.price > 0
                            ? `+₹${Number(m.price).toFixed(2)}`
                            : "Free"}
                        </span>
                      </div>
                    ))}
                    {(group.modifiers || []).length > 5 && (
                      <p className="text-[10px] text-slate-400 text-center pt-0.5">
                        +{group.modifiers.length - 5} more options
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scope: {group.outletId ? "This Outlet" : "All Outlets"}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(group)}
                    className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    Edit Options →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Add / Edit Modifier Group ── */}
      <TModal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingGroupId ? "Edit Add-on Group" : "Create Add-on Group"}
                </h3>
                <p className="text-[11px] text-slate-500">Configure customizable extras & variations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Group Name & Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Extra Butter & Cheese, Portion Sizes, Beverage Add-ons"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Description (Optional)</label>
              <input
                type="text"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Short customer prompt e.g. Choose your extras"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            {/* Selection Rule */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Customization Type</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectionType("MANDATORY_SINGLE")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectionType === "MANDATORY_SINGLE"
                      ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-500/20 shadow-2xs"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-black text-xs text-indigo-950">Portion Sizes / Variants</span>
                  <span className="text-[11px] text-indigo-800/80 block font-normal mt-1 leading-tight">
                    Must pick 1 (e.g. Half / Full). Enter the <strong>exact selling price</strong> for each size (e.g. Half: ₹250, Full: ₹500).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectionType("OPTIONAL_MULTI")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectionType === "OPTIONAL_MULTI"
                      ? "border-amber-500 bg-amber-50/80 text-amber-950 font-bold ring-1 ring-amber-500/20 shadow-2xs"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-black text-xs text-amber-950">Add-ons & Extras</span>
                  <span className="text-[11px] text-amber-800/80 block font-normal mt-1 leading-tight">
                    Optional multi-choice. Enter the <strong>extra amount (+)</strong> added on top (e.g. Extra Butter: +₹20, Cheese: +₹35).
                  </span>
                </button>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    {selectionType === "MANDATORY_SINGLE" ? "Size Options & Selling Prices" : "Add-on Options & Extra Prices"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {selectionType === "MANDATORY_SINGLE"
                      ? "Enter the full selling price for each size"
                      : "Enter the extra price added to the dish"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl"
                  >
                    {/* Veg / Non-Veg toggle button */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(idx, "isVeg", !opt.isVeg)}
                      className="p-1 rounded bg-white border border-slate-200 shrink-0 hover:bg-slate-100 transition cursor-pointer"
                      title={opt.isVeg ? "Vegetarian (click to switch)" : "Non-Vegetarian (click to switch)"}
                    >
                      {opt.isVeg ? <FssaiVegIcon /> : <FssaiNonVegIcon />}
                    </button>

                    {/* Option Name */}
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => handleOptionChange(idx, "name", e.target.value)}
                      placeholder={selectionType === "MANDATORY_SINGLE" ? (idx === 0 ? "Half" : "Full") : "e.g. Extra Butter"}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 font-medium"
                      required
                    />

                    {/* Extra / Selling Price */}
                    <div className="flex items-center gap-1 w-28 shrink-0 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        {selectionType === "MANDATORY_SINGLE" ? "₹" : "+₹"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={opt.price}
                        onChange={(e) => handleOptionChange(idx, "price", e.target.value)}
                        placeholder={selectionType === "MANDATORY_SINGLE" ? (idx === 0 ? "250" : "500") : "20"}
                        className="w-full text-xs font-black text-slate-900 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Delete option */}
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer shrink-0"
                        title="Remove Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingGroupId ? "Update Group" : "Create Group"}</span>
              </button>
            </div>
          </form>
        </div>
      </TModal>

      {/* ── Modal: Delete Confirmation ── */}
      <TModal open={!!groupToDelete} onClose={() => setGroupToDelete(null)}>
        {groupToDelete && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Add-on Group?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{groupToDelete.name}&rdquo;</span>? It will be unlinked from existing dishes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        )}
      </TModal>
    </div>
  );
}
