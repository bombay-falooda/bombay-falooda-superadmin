"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";
import { DeliverySlabsEditor } from "@/components/delivery-slabs-editor";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";

type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  openingTime: string | null;
  closingTime: string | null;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  deliveryKmPricing: Array<{ km: number; price: number }> | null;
  status: string;
  franchiseId: string | null;
  zomatoResId: string | null;
  swiggyResId: string | null;
  ezcaterStoreId: string | null;
  urbanpiperStoreId: string | null;
};

export default function EditOutletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Gujarat",
    pincode: "",
    openingTime: "10:00",
    closingTime: "23:00",
    dineIn: true,
    takeaway: true,
    delivery: true,
    onlineOrderingEnabled: true,
    deliveryKmPricing: [
      { km: 2, price: 30 },
      { km: 3, price: 45 },
      { km: 5, price: 70 },
    ] as Array<{ km: number | string; price: number | string }>,
    status: "ACTIVE",
    franchiseId: "",
    zomatoResId: "",
    swiggyResId: "",
    ezcaterStoreId: "",
    urbanpiperStoreId: "",
  });

  useEffect(() => {
    loadOutlet();
  }, [id]);

  async function loadOutlet() {
    setLoading(true);
    try {
      const res = await apiRequest<Outlet>(`/outlets/${id}`);
      setForm({
        name: res.name || "",
        code: res.code || "",
        phone: res.phone || "",
        email: res.email || "",
        address: res.address || "",
        city: res.city || "",
        state: res.state || "Gujarat",
        pincode: res.pincode || "",
        openingTime: res.openingTime || "10:00",
        closingTime: res.closingTime || "23:00",
        dineIn: res.dineIn ?? true,
        takeaway: res.takeaway ?? true,
        delivery: res.delivery ?? true,
        onlineOrderingEnabled: res.onlineOrderingEnabled ?? true,
        deliveryKmPricing: (res.deliveryKmPricing && res.deliveryKmPricing.length > 0)
          ? res.deliveryKmPricing
          : [
              { km: 2, price: 30 },
              { km: 3, price: 45 },
              { km: 5, price: 70 },
            ],
        status: res.status || "ACTIVE",
        franchiseId: res.franchiseId || "",
        zomatoResId: res.zomatoResId || "",
        swiggyResId: res.swiggyResId || "",
        ezcaterStoreId: res.ezcaterStoreId || "",
        urbanpiperStoreId: res.urbanpiperStoreId || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlet details");
    } finally {
      setLoading(false);
    }
  }

  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  const cityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === form.state);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: form.city || "Custom", value: form.city }];
  }, [form.state, form.city]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest(`/outlets/${id}`, {
        method: "PATCH",
        body: {
          ...form,
          deliveryKmPricing: form.deliveryKmPricing
            ? form.deliveryKmPricing.map((item) => ({
                km: Number(item.km),
                price: Number(item.price),
              }))
            : null,
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update outlet");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#766b64]">
        Loading outlet details...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Edit Outlet: ${form.name}`}
        description="Update outlet contact, location, business hours and service permissions."
        action={
          form.franchiseId
            ? { href: `/franchises/${form.franchiseId}`, label: "Back to Franchise" }
            : { href: "/outlets", label: "Back to Outlets" }
        }
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormSection title="Outlet Information">
          <div>
            <label className="form-label flex items-center gap-1">
              <span>Outlet Name</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>Outlet Code</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input font-mono"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>Phone Number</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2.5">
              <CountryCodePicker value="+91" />
              <input
                className="form-input min-w-0 flex-1"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="99999 99999"
              />
            </div>
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>Email Address</span>
            </label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="form-label flex items-center gap-1">
              <span>Address</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>State</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
            >
              {stateOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>City</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            >
              {cityOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>Pincode</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Opening Time</label>
            <input
              type="time"
              className="form-input"
              value={form.openingTime}
              onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Closing Time</label>
            <input
              type="time"
              className="form-input"
              value={form.closingTime}
              onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </FormSection>

        <FormSection title="Service Controls">
          <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
            <span className="text-sm font-medium text-[#3b302d]">Dine-in Service</span>
            <input
              type="checkbox"
              checked={form.dineIn}
              onChange={(e) => setForm({ ...form, dineIn: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
            <span className="text-sm font-medium text-[#3b302d]">Takeaway Service</span>
            <input
              type="checkbox"
              checked={form.takeaway}
              onChange={(e) => setForm({ ...form, takeaway: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
            <span className="text-sm font-medium text-[#3b302d]">Delivery Service</span>
            <input
              type="checkbox"
              checked={form.delivery}
              onChange={(e) => setForm({ ...form, delivery: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-xs">
            <span className="text-sm font-medium text-[#3b302d]">Online Ordering</span>
            <input
              type="checkbox"
              checked={form.onlineOrderingEnabled}
              onChange={(e) => setForm({ ...form, onlineOrderingEnabled: e.target.checked })}
            />
          </label>

          <div className="md:col-span-2">
            <DeliverySlabsEditor
              slabs={form.deliveryKmPricing || []}
              onChange={(slabs) => setForm({ ...form, deliveryKmPricing: slabs })}
            />
          </div>
        </FormSection>

        <FormSection title="Online Delivery Integrations (Aggregator Store IDs)">
          <div>
            <label className="form-label flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
              <span>Zomato Restaurant ID</span>
            </label>
            <input
              className="form-input font-mono"
              value={form.zomatoResId}
              onChange={(e) => setForm({ ...form, zomatoResId: e.target.value })}
              placeholder="e.g. 19823412"
            />
            <p className="mt-1 text-[11px] text-[#766b64]">
              Direct Zomato restaurant identifier for webhook order ingestion.
            </p>
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
              <span>Swiggy Restaurant ID</span>
            </label>
            <input
              className="form-input font-mono"
              value={form.swiggyResId}
              onChange={(e) => setForm({ ...form, swiggyResId: e.target.value })}
              placeholder="e.g. 849301"
            />
            <p className="mt-1 text-[11px] text-[#766b64]">
              Direct Swiggy partner outlet identifier.
            </p>
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>ezCater Store Number</span>
            </label>
            <input
              className="form-input font-mono"
              value={form.ezcaterStoreId}
              onChange={(e) => setForm({ ...form, ezcaterStoreId: e.target.value })}
              placeholder="e.g. EZ-MUM-01"
            />
            <p className="mt-1 text-[11px] text-[#766b64]">
              Corporate catering ezCater store number.
            </p>
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              <span>UrbanPiper Ref ID (Middleware)</span>
            </label>
            <input
              className="form-input font-mono"
              value={form.urbanpiperStoreId}
              onChange={(e) => setForm({ ...form, urbanpiperStoreId: e.target.value })}
              placeholder="e.g. BF_STORE_001"
            />
            <p className="mt-1 text-[11px] text-[#766b64]">
              Optional 3rd-party aggregator middleware store ID.
            </p>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link
            className="btn-secondary"
            href={form.franchiseId ? `/franchises/${form.franchiseId}` : "/outlets"}
          >
            Cancel
          </Link>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Outlet Changes"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={!!error}
        title="Update Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />

      <ResultDialog
        open={success}
        title="Outlet Updated"
        message="The outlet details have been successfully updated."
        tone="success"
        onPrimary={() => {
          setSuccess(false);
          if (form.franchiseId) {
            router.push(`/franchises/${form.franchiseId}`);
          } else {
            router.push("/outlets");
          }
        }}
      />
    </>
  );
}
