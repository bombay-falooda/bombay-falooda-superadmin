"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Addon = {
  id?: string;
  name: string;
  price: number | string;
  isActive?: boolean;
};

type AddonGroup = {
  id?: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  addons: Addon[];
};

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number | string;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  addonGroups?: AddonGroup[];
};

type OutletMenuItem = {
  id: string;
  price: number | string;
  isActive: boolean;
  dineIn?: boolean;
  takeaway?: boolean;
  delivery?: boolean;
  item: MenuItem;
};

type PosDevice = {
  id: string;
  name: string;
  deviceCode?: string | null;
  accessKey: string;
  status: string;
  lastLoginAt?: string | null;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  status: string;
};

type OutletDetail = {
  id: string;
  franchiseId?: string | null;
  name: string;
  code: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  deliveryKmPricing?: Array<{ km: number; price: number }> | null;
  openingTime?: string | null;
  closingTime?: string | null;
  zomatoResId?: string | null;
  swiggyResId?: string | null;
  ezcaterStoreId?: string | null;
  urbanpiperStoreId?: string | null;
  franchise?: { id: string; name: string } | null;
  posDevices: PosDevice[];
  users: User[];
  outletMenuItems?: OutletMenuItem[];
};

type MenuCategory = {
  id: string;
  name: string;
};

const DEFAULT_IMAGES = [
  { label: "Royal Falooda", url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80" },
  { label: "Mango Falooda", url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80" },
  { label: "Chocolate Fudge", url: "https://images.unsplash.com/photo-1579954115545-aad505958169?auto=format&fit=crop&w=600&q=80" },
  { label: "Kesar Pista", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80" },
];

export default function UnifiedOutletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<"details" | "menu" | "pos" | "staff">("details");
  const [data, setData] = useState<OutletDetail | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline Add Menu Item State & Ref
  const addItemSectionRef = useRef<HTMLDivElement>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Signature Faloodas");
  const [newItemSubCategory, setNewItemSubCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemDineIn, setNewItemDineIn] = useState(true);
  const [newItemTakeaway, setNewItemTakeaway] = useState(true);
  const [newItemDelivery, setNewItemDelivery] = useState(true);
  
  // Addon groups state for inline section
  const [newItemAddonGroups, setNewItemAddonGroups] = useState<
    Array<{ name: string; addons: Array<{ name: string; price: string }> }>
  >([]);

  // Multi-outlet & Copy Menu state
  const [allOutlets, setAllOutlets] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedTargetOutletIds, setSelectedTargetOutletIds] = useState<string[]>([]);
  const [applyToAllOutlets, setApplyToAllOutlets] = useState(false);
  const [sourceCopyOutletId, setSourceCopyOutletId] = useState("");
  const [isCopyingMenu, setIsCopyingMenu] = useState(false);

  // Item deletion state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadOutlet();
    loadCategories();
    apiRequest<Array<{ id: string; name: string; code: string }>>("/outlets")
      .then((data) => setAllOutlets(data))
      .catch(() => {});
  }, [id]);

  async function loadOutlet() {
    setLoading(true);
    try {
      const res = await apiRequest<OutletDetail>(`/outlets/${id}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlet details");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const cats = await apiRequest<MenuCategory[]>(`/outlets/categories`);
      setCategories(cats);
    } catch {
      // Ignore category load error fallback
    }
  }

  function handleOpenAddSection() {
    setIsAddSectionOpen(true);
    setTimeout(() => {
      addItemSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function toggleOutletStatus() {
    if (!data) return;
    const nextStatus = data.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(`/outlets/${id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setSuccessMessage(`Outlet has been marked as ${nextStatus.toLowerCase()}.`);
      await loadOutlet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update outlet status");
    }
  }

  async function handleToggleItemChannel(
    itemOutletId: string,
    field: "dineIn" | "takeaway" | "delivery" | "isActive",
    currentVal?: boolean
  ) {
    setActionLoadingId(itemOutletId);
    try {
      await apiRequest(`/outlets/${id}/items/${itemOutletId}`, {
        method: "PATCH",
        body: { [field]: !currentVal },
      });
      await loadOutlet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update item availability");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteItem() {
    if (!itemToDelete) return;
    setActionLoadingId(itemToDelete.id);
    try {
      await apiRequest(`/outlets/${id}/items/${itemToDelete.id}`, {
        method: "DELETE",
      });
      setSuccessMessage(`Item "${itemToDelete.name}" removed from menu.`);
      setItemToDelete(null);
      await loadOutlet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCreateMenuItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) <= 0) {
      setError("Please fill out item name and a valid price.");
      return;
    }

    try {
      const body = {
        name: newItemName.trim(),
        categoryName: newItemCategory || "Signature Faloodas",
        subCategory: newItemSubCategory.trim() || undefined,
        price: Number(newItemPrice),
        imageUrl: newItemImageUrl.trim() || DEFAULT_IMAGES[0].url,
        description: newItemDescription.trim(),
        dineIn: newItemDineIn,
        takeaway: newItemTakeaway,
        delivery: newItemDelivery,
        isActive: true,
        targetOutletIds: applyToAllOutlets
          ? allOutlets.map((o) => o.id)
          : selectedTargetOutletIds.length > 0
          ? selectedTargetOutletIds
          : [id],
        addonGroups: newItemAddonGroups
          .filter((g) => g.name.trim())
          .map((g) => ({
            name: g.name.trim(),
            minSelect: 0,
            maxSelect: 3,
            isRequired: false,
            addons: g.addons
              .filter((a) => a.name.trim())
              .map((a) => ({
                name: a.name.trim(),
                price: Number(a.price) || 0,
              })),
          })),
      };

      await apiRequest(`/outlets/${id}/items`, {
        method: "POST",
        body,
      });

      setSuccessMessage(
        `Menu item "${newItemName}" added successfully to ${
          body.targetOutletIds.length > 1
            ? `${body.targetOutletIds.length} outlets`
            : "this outlet"
        }!`
      );
      setIsAddSectionOpen(false);
      resetNewItemForm();
      await loadOutlet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create menu item");
    }
  }

  async function handleCopyMenu() {
    if (!sourceCopyOutletId) {
      setError("Please select an outlet to copy menu from.");
      return;
    }
    setIsCopyingMenu(true);
    try {
      const res = await apiRequest<{ success: boolean; copiedCount: number }>(
        `/outlets/${id}/copy-menu-from/${sourceCopyOutletId}`,
        { method: "POST" }
      );
      setSuccessMessage(`Successfully copied ${res.copiedCount || 0} menu items into this outlet!`);
      await loadOutlet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy menu");
    } finally {
      setIsCopyingMenu(false);
    }
  }

  function resetNewItemForm() {
    setNewItemName("");
    setNewItemCategory("");
    setNewItemSubCategory("");
    setNewItemPrice("");
    setNewItemImageUrl("");
    setNewItemDescription("");
    setNewItemDineIn(true);
    setNewItemTakeaway(true);
    setNewItemDelivery(true);
    setNewItemAddonGroups([]);
  }

  function uploadImage(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Image is too large. Please choose an image below 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          setError("Could not prepare image.");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setNewItemImageUrl(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = () => setError("Could not read image file.");
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  function addAddonGroupRow() {
    setNewItemAddonGroups([
      ...newItemAddonGroups,
      { name: "Extra Toppings", addons: [{ name: "Extra Rabdi", price: "30" }] },
    ]);
  }

  function removeAddonGroupRow(gIdx: number) {
    setNewItemAddonGroups(newItemAddonGroups.filter((_, idx) => idx !== gIdx));
  }

  function addAddonOptionRow(gIdx: number) {
    const updated = [...newItemAddonGroups];
    updated[gIdx].addons.push({ name: "", price: "0" });
    setNewItemAddonGroups(updated);
  }

  function removeAddonOptionRow(gIdx: number, aIdx: number) {
    const updated = [...newItemAddonGroups];
    updated[gIdx].addons = updated[gIdx].addons.filter((_, idx) => idx !== aIdx);
    setNewItemAddonGroups(updated);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading unified outlet details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h2 className="text-lg font-semibold">Outlet not found</h2>
        <Link className="btn-secondary mt-4 inline-block" href="/outlets">
          Back to Outlets List
        </Link>
      </div>
    );
  }

  const outletMenuItems = data.outletMenuItems || [];
  const deliverySlabs = data.deliveryKmPricing && data.deliveryKmPricing.length > 0
    ? data.deliveryKmPricing
    : [
        { km: 2, price: 30 },
        { km: 3, price: 45 },
        { km: 5, price: 70 },
      ];

  return (
    <>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              className="btn-secondary text-xs"
              href={data.franchiseId ? `/franchises/${data.franchiseId}` : "/outlets"}
            >
              ← {data.franchise ? `Back to ${data.franchise.name}` : "Back to Outlets"}
            </Link>
            <StatusBadge value={data.status === "ACTIVE"} />
            {data.franchise ? (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
                {data.franchise.name}
              </span>
            ) : null}
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold text-[#070b21]">
            {data.name} <span className="font-mono text-xl text-[#7c3fe0]">({data.code})</span>
          </h1>
          <p className="mt-1 text-sm text-[#766b64]">
            {data.address}, {data.city}, {data.state} {data.pincode} | Contact: {data.phone || data.email || "N/A"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="btn-secondary text-xs flex items-center gap-1.5"
            href={`/team-management/add?franchiseId=${data.franchiseId || ""}&outletId=${data.id}`}
          >
            <span>+ Add Team Member</span>
          </Link>
          <Link
            className="btn-primary text-xs flex items-center gap-1.5"
            href={`/outlets/${data.id}/edit`}
          >
            <span>Edit Outlet</span>
          </Link>
          <button
            type="button"
            onClick={toggleOutletStatus}
            className={`h-9 px-3.5 rounded-[14px] text-xs font-semibold border transition ${
              data.status === "ACTIVE"
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {data.status === "ACTIVE" ? "Disable Outlet" : "Enable Outlet"}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs with Vector Icons Only (No Emojis) */}
      <div className="mb-6 flex border-b border-[#eadfd5] gap-6">
        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "details"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("details")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Overview & Services</span>
        </button>

        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "menu"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("menu")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Menu, Pricing & Add-ons ({outletMenuItems.length})</span>
        </button>

        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "pos"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("pos")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Linked POS Devices ({data.posDevices.length})</span>
        </button>

        <button
          type="button"
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === "staff"
              ? "text-[#7c3fe0] border-b-2 border-[#7c3fe0]"
              : "text-[#766b64] hover:text-[#070b21]"
          }`}
          onClick={() => setActiveTab("staff")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Staff & Team ({data.users.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SERVICES */}
      {activeTab === "details" && (
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                Location & Contact Details
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">Outlet Name</span>
                  <span className="font-semibold text-[#070b21]">{data.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">Outlet Code</span>
                  <span className="font-mono font-semibold text-[#7c3fe0]">{data.code}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">Phone Number</span>
                  <span className="font-medium text-[#070b21]">{data.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">Email Address</span>
                  <span className="font-medium text-[#070b21]">{data.email || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">Address</span>
                  <span className="font-medium text-[#070b21] text-right">{data.address}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2">
                  <span className="text-[#766b64]">City / State</span>
                  <span className="font-medium text-[#070b21]">{data.city}, {data.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#766b64]">Pincode</span>
                  <span className="font-mono font-semibold text-[#070b21]">{data.pincode || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                Operating Hours & Service Modes
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2 text-sm">
                  <span className="text-[#766b64]">Opening Time</span>
                  <span className="font-semibold text-[#070b21]">{data.openingTime || "10:00 AM"}</span>
                </div>
                <div className="flex justify-between border-b border-[#eadfd5]/60 pb-2 text-sm">
                  <span className="text-[#766b64]">Closing Time</span>
                  <span className="font-semibold text-[#070b21]">{data.closingTime || "11:00 PM"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#8d827a] uppercase">Active Service Types</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.dineIn && (
                      <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200">
                        Dine-in Service
                      </span>
                    )}
                    {data.takeaway && (
                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 border border-blue-200">
                        Takeaway Service
                      </span>
                    )}
                    {data.delivery && (
                      <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                        Delivery Service
                      </span>
                    )}
                    {data.onlineOrderingEnabled && (
                      <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 border border-purple-200">
                        Online Ordering Enabled
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Pricing Slabs Display */}
                {data.delivery && (
                  <div className="mt-4 border-t border-[#eadfd5] pt-3">
                    <span className="text-xs font-semibold text-[#8d827a] uppercase block mb-2">
                      Delivery Pricing Slabs (Distance vs Charge)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {deliverySlabs.map((slab, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-200 shadow-xs"
                        >
                          Up to {slab.km} km = <span className="text-[#7c3fe0]">INR {slab.price}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Aggregator Integrations Card */}
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-xs backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#eadfd5]/60">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
                  Online Aggregator Integrations & Store IDs
                </h3>
                <p className="mt-0.5 text-xs text-[#766b64]">
                  Unique platform identifiers used to route inbound webhooks and sync inventory dynamically.
                </p>
              </div>
              <Link
                href={`/outlets/${data.id}/edit`}
                className="text-xs font-semibold text-[#7c3fe0] hover:underline"
              >
                Edit IDs →
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-950">Zomato</span>
                </div>
                <div className="mt-2 font-mono text-sm font-semibold text-red-900">
                  {data.zomatoResId ? data.zomatoResId : <span className="text-xs font-normal text-[#8d827a]">Not configured</span>}
                </div>
                <div className="mt-1 text-[11px] text-[#8d827a]">Direct Webhook / API</div>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <span className="text-xs font-bold text-orange-950">Swiggy</span>
                </div>
                <div className="mt-2 font-mono text-sm font-semibold text-orange-900">
                  {data.swiggyResId ? data.swiggyResId : <span className="text-xs font-normal text-[#8d827a]">Not configured</span>}
                </div>
                <div className="mt-1 text-[11px] text-[#8d827a]">Partner API v2</div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-950">ezCater</span>
                </div>
                <div className="mt-2 font-mono text-sm font-semibold text-emerald-900">
                  {data.ezcaterStoreId ? data.ezcaterStoreId : <span className="text-xs font-normal text-[#8d827a]">Not configured</span>}
                </div>
                <div className="mt-1 text-[11px] text-[#8d827a]">GraphQL Catering API</div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-blue-950">UrbanPiper</span>
                </div>
                <div className="mt-2 font-mono text-sm font-semibold text-blue-900">
                  {data.urbanpiperStoreId ? data.urbanpiperStoreId : <span className="text-xs font-normal text-[#8d827a]">Not configured</span>}
                </div>
                <div className="mt-1 text-[11px] text-[#8d827a]">Middleware Fallback</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: MENU, PRICING & ADD-ONS (WITH INLINE ADD ITEM SECTION & LIST-WISE REAL DATA TABLE) */}
      {activeTab === "menu" && (
        <section className="space-y-6">
          {/* Menu Header Card */}
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#070b21]">
                  Outlet Menu & Pricing Catalogue ({outletMenuItems.length})
                </h2>
                <p className="mt-1 text-sm text-[#766b64]">
                  Manage real menu items, pricing, photos, add-ons, and channel availability (Takeaway, Delivery, Dine-in) for {data.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSection}
                className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Add Menu Item</span>
              </button>
            </div>

            {/* COPY WHOLE MENU FROM ANOTHER OUTLET BAR */}
            <div className="mt-4 pt-4 border-t border-[#eadfd5] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#faf6f0] p-3.5 rounded-xl border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#3b302d]">📋 Copy Whole Menu From Existing Outlet:</span>
              </div>
              <div className="flex items-center gap-2 flex-1 md:max-w-md">
                <select
                  value={sourceCopyOutletId}
                  onChange={(e) => setSourceCopyOutletId(e.target.value)}
                  className="w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-1.5 text-xs font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                >
                  <option value="">-- Select Source Outlet to Copy From --</option>
                  {allOutlets
                    .filter((o) => o.id !== id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleCopyMenu}
                  disabled={isCopyingMenu || !sourceCopyOutletId}
                  className="btn-secondary text-xs shrink-0 !bg-[#7c3fe0] !text-white hover:!bg-[#6832be] disabled:opacity-50"
                >
                  {isCopyingMenu ? "Copying..." : "Copy Menu Now"}
                </button>
              </div>
            </div>
          </div>

          {/* INLINE ADD MENU ITEM FORM SECTION (OPENED BELOW HEADER WITHOUT ANY MODAL) */}
          {isAddSectionOpen && (
            <div
              ref={addItemSectionRef}
              id="add-menu-item-section"
              className="rounded-[24px] border-2 border-[#7c3fe0]/40 bg-white p-6 shadow-xl transition-all duration-300 scroll-mt-6"
            >
              <div className="flex items-center justify-between border-b border-[#eadfd5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-purple-50 p-1.5 text-[#7c3fe0] border border-purple-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#070b21]">
                      Add New Menu Item to {data.name}
                    </h3>
                    <p className="text-xs text-[#766b64]">Fill in the details below with photo, pricing, channels and extra add-ons.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="rounded-lg p-1.5 text-[#766b64] hover:bg-slate-100 hover:text-[#070b21] transition"
                  title="Close Section"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateMenuItem} className="space-y-5">
                {/* Target Outlets Assignment */}
                <div className="rounded-[16px] border border-[#7c3fe0]/30 bg-[#f8f5ff] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7c3fe0]">
                      Apply To Outlets / Franchises *
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#7c3fe0]">
                      <input
                        type="checkbox"
                        checked={applyToAllOutlets}
                        onChange={(e) => setApplyToAllOutlets(e.target.checked)}
                        className="rounded text-[#7c3fe0]"
                      />
                      <span>Apply to All Outlets Across All Franchises ({allOutlets.length})</span>
                    </label>
                  </div>
                  {!applyToAllOutlets && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allOutlets.map((o) => {
                        const isChecked = selectedTargetOutletIds.includes(o.id) || o.id === id;
                        return (
                          <label
                            key={o.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                              isChecked
                                ? "border-[#7c3fe0] bg-purple-50 text-[#7c3fe0] font-bold"
                                : "border-[#eadfd5] bg-white text-[#766b64]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={o.id === id}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTargetOutletIds([...selectedTargetOutletIds, o.id]);
                                } else {
                                  setSelectedTargetOutletIds(selectedTargetOutletIds.filter((x) => x !== o.id));
                                }
                              }}
                            />
                            <span>{o.name} ({o.code})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Image Upload & Photo Selection */}
                <div className="rounded-[16px] border border-[#eadfd5] bg-[#fffaf4] p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d] mb-2">
                    Item Photo / Image Upload
                  </label>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="h-20 w-20 rounded-xl bg-slate-100 border border-[#eadfd5] overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                      {newItemImageUrl ? (
                        <img src={newItemImageUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-[#8d827a] font-semibold text-center p-1">No Image</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image URL (https://...)"
                          value={newItemImageUrl}
                          onChange={(e) => setNewItemImageUrl(e.target.value)}
                          className="w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2 text-xs text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                        />
                        <label className="cursor-pointer shrink-0 rounded-[14px] bg-[#7c3fe0] px-3 py-2 text-xs font-bold text-white hover:bg-[#6832be] transition flex items-center gap-1">
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => uploadImage(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#766b64] block mb-1">
                          Or select a sample photo preset:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_IMAGES.map((img) => (
                            <button
                              key={img.label}
                              type="button"
                              onClick={() => setNewItemImageUrl(img.url)}
                              className="rounded-lg border border-[#eadfd5] bg-white px-2.5 py-1 text-xs font-medium text-[#070b21] hover:border-[#7c3fe0] hover:bg-purple-50 transition"
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Bombay Falooda"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(!isCustomCategory);
                          if (!isCustomCategory) setNewItemCategory("");
                        }}
                        className="text-[11px] font-bold text-[#7c3fe0] hover:underline"
                      >
                        {isCustomCategory ? "Choose existing" : "+ New category"}
                      </button>
                    </div>

                    {isCustomCategory ? (
                      <input
                        type="text"
                        required
                        placeholder="Type custom category name..."
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                      />
                    ) : (
                      <select
                        value={newItemCategory}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setIsCustomCategory(true);
                            setNewItemCategory("");
                          } else {
                            setNewItemCategory(e.target.value);
                          }
                        }}
                        className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                        <option value="Faloodas">Faloodas</option>
                        <option value="Ice Creams">Ice Creams</option>
                        <option value="Beverages & Shakes">Beverages & Shakes</option>
                        <option value="Rabdi & Kulfi">Rabdi & Kulfi</option>
                        <option value="__NEW__">+ Create New Category...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                        Subcategory (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubCategory(!isCustomSubCategory);
                          if (!isCustomSubCategory) setNewItemSubCategory("");
                        }}
                        className="text-[11px] font-bold text-[#7c3fe0] hover:underline"
                      >
                        {isCustomSubCategory ? "Choose preset" : "+ Custom subcategory"}
                      </button>
                    </div>

                    {isCustomSubCategory ? (
                      <input
                        type="text"
                        placeholder="e.g. Classic Mawa Falooda..."
                        value={newItemSubCategory}
                        onChange={(e) => setNewItemSubCategory(e.target.value)}
                        className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                      />
                    ) : (
                      <select
                        value={newItemSubCategory}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setIsCustomSubCategory(true);
                            setNewItemSubCategory("");
                          } else {
                            setNewItemSubCategory(e.target.value);
                          }
                        }}
                        className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                      >
                        <option value="">-- No Subcategory --</option>
                        <option value="Classic Mawa Falooda">Classic Mawa Falooda</option>
                        <option value="Kulfi Falooda">Kulfi Falooda</option>
                        <option value="Rabdi Falooda">Rabdi Falooda</option>
                        <option value="Upvas (Fast) Falooda">Upvas (Fast) Falooda</option>
                        <option value="Bowl Dry Kulfi Rabdi">Bowl Dry Kulfi Rabdi</option>
                        <option value="Bombay Specials">Bombay Specials</option>
                        <option value="Classic Ice Cream">Classic Ice Cream</option>
                        <option value="Fresh Fruits Ice Cream">Fresh Fruits Ice Cream</option>
                        <option value="Premium Ice Cream">Premium Ice Cream</option>
                        <option value="Cold Coco">Cold Coco</option>
                        <option value="Badam Shake">Badam Shake</option>
                        <option value="Kulhad Rabdi">Kulhad Rabdi</option>
                        <option value="Kulfi Stick">Kulfi Stick</option>
                        <option value="Kulfi Roll Cut (Tukda)">Kulfi Roll Cut (Tukda)</option>
                        <option value="__NEW__">+ Enter Custom Subcategory...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="180"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2.5 text-sm font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Rich falooda with rabdi, rose syrup, and dry fruit toppings..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-[14px] border border-[#eadfd5] bg-white px-3.5 py-2 text-sm text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                  />
                </div>

                {/* Service Channels */}
                <div className="rounded-[14px] border border-[#eadfd5] bg-[#fffaf4] p-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d] mb-2">
                    Service Channel Availability
                  </label>
                  <div className="flex flex-wrap gap-4 text-xs font-medium">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItemDineIn}
                        onChange={(e) => setNewItemDineIn(e.target.checked)}
                        className="rounded text-[#7c3fe0]"
                      />
                      <span>Dine-In</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItemTakeaway}
                        onChange={(e) => setNewItemTakeaway(e.target.checked)}
                        className="rounded text-[#7c3fe0]"
                      />
                      <span>Takeaway</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newItemDelivery}
                        onChange={(e) => setNewItemDelivery(e.target.checked)}
                        className="rounded text-[#7c3fe0]"
                      />
                      <span>Delivery</span>
                    </label>
                  </div>
                </div>

                {/* Addons Builder */}
                <div className="rounded-[14px] border border-[#eadfd5] bg-[#faf6f0] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3b302d]">
                      Add-ons & Options Pricing
                    </label>
                    <button
                      type="button"
                      onClick={addAddonGroupRow}
                      className="text-xs font-bold text-[#7c3fe0] hover:underline"
                    >
                      + Add Add-on Group
                    </button>
                  </div>

                  {newItemAddonGroups.length === 0 ? (
                    <p className="text-xs text-[#8d827a] italic">
                      No add-ons added yet. Click "+ Add Add-on Group" to add extra toppings (e.g. Extra Rabdi, Scoops).
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {newItemAddonGroups.map((g, gIdx) => (
                        <div key={gIdx} className="rounded-xl border border-[#eadfd5] bg-white p-3 space-y-3 shadow-xs">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7c3fe0]">
                                Add-on Group Title *
                              </label>
                              <button
                                type="button"
                                onClick={() => removeAddonGroupRow(gIdx)}
                                className="text-xs font-semibold text-red-600 hover:underline shrink-0"
                              >
                                Remove Group
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Extra Toppings or Select Portion Size"
                              value={g.name}
                              onChange={(e) => {
                                const updated = [...newItemAddonGroups];
                                updated[gIdx].name = e.target.value;
                                setNewItemAddonGroups(updated);
                              }}
                              className="w-full rounded-lg border border-[#eadfd5] px-2.5 py-1.5 text-xs font-bold text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2 border-t border-[#eadfd5]/60 pt-2">
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-[#766b64]">
                              <div className="col-span-6">Option Name (e.g. Extra Rabdi)</div>
                              <div className="col-span-4">Extra Charge (INR)</div>
                              <div className="col-span-2 text-right">Action</div>
                            </div>

                            {g.addons.map((a, aIdx) => (
                              <div key={aIdx} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder="e.g. Extra Rabdi / 350ML"
                                  value={a.name}
                                  onChange={(e) => {
                                    const updated = [...newItemAddonGroups];
                                    updated[gIdx].addons[aIdx].name = e.target.value;
                                    setNewItemAddonGroups(updated);
                                  }}
                                  className="col-span-6 rounded-md border border-[#eadfd5] px-2.5 py-1.5 text-xs"
                                />
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={a.price}
                                  onChange={(e) => {
                                    const updated = [...newItemAddonGroups];
                                    updated[gIdx].addons[aIdx].price = e.target.value;
                                    setNewItemAddonGroups(updated);
                                  }}
                                  className="col-span-4 rounded-md border border-[#eadfd5] px-2.5 py-1.5 text-xs font-mono"
                                />
                                <div className="col-span-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeAddonOptionRow(gIdx, aIdx)}
                                    className="text-xs font-bold text-red-500 hover:underline"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addAddonOptionRow(gIdx)}
                              className="text-xs font-bold text-[#7c3fe0] hover:underline pt-1 block"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eadfd5]">
                  <button
                    type="button"
                    onClick={() => setIsAddSectionOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel / Close
                  </button>
                  <button type="submit" className="btn-primary text-xs">
                    Create Menu Item
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST-WISE MENU DATA TABLE */}
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-6 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            {outletMenuItems.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#eadfd5] bg-[#fffaf4] p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-[#7c3fe0]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="mt-3 text-base font-semibold text-[#070b21]">No Menu Items Added Yet</h3>
                <p className="mt-1 text-xs text-[#766b64]">Add your first menu item with photos, pricing, and add-on options.</p>
                <button
                  type="button"
                  onClick={handleOpenAddSection}
                  className="btn-primary mt-4 text-xs"
                >
                  + Add Menu Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[16px] border border-[#eadfd5] bg-white shadow-xs">
                <table className="w-full text-left text-sm text-[#070b21]">
                  <thead className="bg-[#faf6f0] text-xs font-semibold uppercase tracking-wider text-[#766b64] border-b border-[#eadfd5]">
                    <tr>
                      <th className="px-5 py-3.5">Menu Item</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Pricing</th>
                      <th className="px-5 py-3.5">Add-ons & Extras</th>
                      <th className="px-5 py-3.5">Channel Availability</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eadfd5]">
                    {outletMenuItems.map((omi) => {
                      const item = omi.item;
                      const isDineIn = omi.dineIn ?? true;
                      const isTakeaway = omi.takeaway ?? true;
                      const isDelivery = omi.delivery ?? true;

                      return (
                        <tr key={omi.id} className={`transition hover:bg-[#fffaf4]/50 ${!omi.isActive ? "bg-slate-50/70 opacity-75" : ""}`}>
                          {/* ITEM IMAGE & DETAILS */}
                          <td className="px-5 py-4 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageUrl || DEFAULT_IMAGES[0].url}
                                alt={item.name}
                                className="h-14 w-14 rounded-xl object-cover border border-[#eadfd5] shadow-xs shrink-0"
                              />
                              <div>
                                <span className="font-semibold text-[#070b21] block leading-tight">{item.name}</span>
                                {item.description ? (
                                  <span className="text-xs text-[#766b64] line-clamp-1 mt-0.5 block">
                                    {item.description}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* CATEGORY */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#7c3fe0] border border-purple-200">
                              {item.category?.name || "Falooda"}
                            </span>
                          </td>

                          {/* PRICING */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-mono text-sm font-bold text-[#070b21]">
                              INR {Number(omi.price).toFixed(2)}
                            </div>
                            {item.basePrice && Number(item.basePrice) !== Number(omi.price) && (
                              <span className="text-[10px] text-[#766b64] block">
                                Base: INR {Number(item.basePrice).toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* ADD-ONS & EXTRAS */}
                          <td className="px-5 py-4 max-w-[280px]">
                            {item.addonGroups && item.addonGroups.length > 0 ? (
                              <div className="space-y-1.5">
                                {item.addonGroups.map((group) => (
                                  <div key={group.id || group.name} className="text-xs">
                                    <span className="font-bold text-[#3b302d]">{group.name}:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {group.addons.map((a) => (
                                        <span key={a.id || a.name} className="rounded bg-[#faf6f0] px-1.5 py-0.5 text-[11px] font-medium text-[#3b302d] border border-[#eadfd5]">
                                          {a.name} <span className="font-bold text-[#7c3fe0]">(+₹{a.price})</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#8d827a] italic">No add-ons</span>
                            )}
                          </td>

                          {/* CHANNEL AVAILABILITY TOGGLES */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                disabled={actionLoadingId === omi.id}
                                onClick={() => handleToggleItemChannel(omi.id, "dineIn", isDineIn)}
                                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                                  isDineIn
                                    ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                <span>Dine-In</span>
                                <span className={`text-[10px] font-bold ${isDineIn ? "text-amber-700" : "text-slate-400"}`}>
                                  {isDineIn ? "ON" : "OFF"}
                                </span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === omi.id}
                                onClick={() => handleToggleItemChannel(omi.id, "takeaway", isTakeaway)}
                                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                                  isTakeaway
                                    ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                <span>Takeaway</span>
                                <span className={`text-[10px] font-bold ${isTakeaway ? "text-blue-700" : "text-slate-400"}`}>
                                  {isTakeaway ? "ON" : "OFF"}
                                </span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === omi.id}
                                onClick={() => handleToggleItemChannel(omi.id, "delivery", isDelivery)}
                                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                                  isDelivery
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                <span>Delivery</span>
                                <span className={`text-[10px] font-bold ${isDelivery ? "text-emerald-700" : "text-slate-400"}`}>
                                  {isDelivery ? "ON" : "OFF"}
                                </span>
                              </button>
                            </div>
                          </td>

                          {/* STATUS TOGGLE */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={actionLoadingId === omi.id}
                              onClick={() => handleToggleItemChannel(omi.id, "isActive", omi.isActive)}
                              className={`h-8 px-3 rounded-[12px] text-xs font-semibold border transition flex items-center gap-1.5 ${
                                omi.isActive
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
                              }`}
                            >
                              <span className={`h-2 w-2 rounded-full ${omi.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                              <span>{omi.isActive ? "Available" : "Disabled"}</span>
                            </button>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <button
                              type="button"
                              disabled={actionLoadingId === omi.id}
                              onClick={() => setItemToDelete({ id: omi.id, name: item.name })}
                              className="h-8 px-3 rounded-[12px] text-xs font-semibold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition inline-flex items-center gap-1"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: LINKED POS DEVICES */}
      {activeTab === "pos" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[#070b21]">
              Linked POS Terminals ({data.posDevices.length})
            </h2>
            <Link className="btn-primary text-xs" href="/pos-devices/new">
              + Add POS Terminal
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-[#eadfd5] bg-white shadow-xs">
            <table className="w-full text-left text-sm text-[#070b21]">
              <thead className="bg-[#faf6f0] text-xs font-semibold uppercase tracking-wider text-[#766b64] border-b border-[#eadfd5]">
                <tr>
                  <th className="px-5 py-3.5">Terminal Name</th>
                  <th className="px-5 py-3.5">Device Code</th>
                  <th className="px-5 py-3.5">Access Key</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadfd5]">
                {data.posDevices.map((pos) => (
                  <tr key={pos.id} className="hover:bg-white/60">
                    <td className="px-5 py-4 font-semibold text-[#070b21]">
                      <Link className="hover:text-[#7c3fe0] hover:underline" href={`/pos-devices/${pos.id}`}>
                        {pos.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[#7c3fe0]">
                      {pos.deviceCode || "N/A"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{pos.accessKey}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={pos.status === "ACTIVE"} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link className="btn-secondary h-8 px-3 text-xs inline-block" href={`/pos-devices/${pos.id}`}>
                        View POS
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: STAFF & TEAM */}
      {activeTab === "staff" && (
        <section className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-5 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#070b21]">
                Outlet Staff Members ({data.users.length})
              </h2>
            </div>
            <Link
              className="btn-primary text-xs flex items-center gap-1.5"
              href={`/team-management/add?franchiseId=${data.franchiseId || ""}&outletId=${data.id}`}
            >
              <span>+ Add Team Member</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-[#eadfd5] bg-white shadow-xs">
            <table className="w-full text-left text-sm text-[#070b21]">
              <thead className="bg-[#faf6f0] text-xs font-semibold uppercase tracking-wider text-[#766b64] border-b border-[#eadfd5]">
                <tr>
                  <th className="px-5 py-3.5">Staff Name</th>
                  <th className="px-5 py-3.5">Contact Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadfd5]">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/60">
                    <td className="px-5 py-4 font-semibold text-[#070b21]">{u.name}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{u.email || "No email"}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{u.phone || "No phone"}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-[#7c3fe0] border border-purple-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={u.status === "ACTIVE"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[24px] border border-red-200 bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-red-800">
              Remove Item from Menu?
            </h3>
            <p className="mt-2 text-sm text-[#766b64]">
              Are you sure you want to remove <strong>"{itemToDelete.name}"</strong> from this outlet's menu?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="h-9 px-4 rounded-[14px] bg-red-600 text-xs font-bold text-white hover:bg-red-700 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ResultDialog
        open={!!error}
        title="Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
      <ResultDialog
        open={!!successMessage}
        title="Success"
        message={successMessage}
        tone="success"
        onPrimary={() => setSuccessMessage("")}
      />
    </>
  );
}
