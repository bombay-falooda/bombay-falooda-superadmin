"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";
import { DeliverySlabsEditor } from "@/components/delivery-slabs-editor";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";

type Franchise = {
  id: string;
  name: string;
};

export default function NewOutletPage() {
  const router = useRouter();

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    franchiseId: "",
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    state: "Gujarat",
    city: "Surat",
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
    zomatoResId: "",
    swiggyResId: "",
    ezcaterStoreId: "",
    urbanpiperStoreId: "",
  });

  const [existingOutlets, setExistingOutlets] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [copyFromOutletId, setCopyFromOutletId] = useState("");

  useEffect(() => {
    apiRequest<Franchise[]>("/franchises")
      .then((data) => {
        setFranchises(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, franchiseId: data[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFranchises(false));

    apiRequest<Array<{ id: string; name: string; code: string }>>("/outlets")
      .then((data) => setExistingOutlets(data))
      .catch(() => {});
  }, []);

  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  const cityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === form.state);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: form.city || "Custom", value: form.city }];
  }, [form.state, form.city]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const createdOutlet = await apiRequest<{ id: string }>("/outlets", {
        method: "POST",
        body: {
          ...form,
          franchiseId: form.franchiseId || undefined,
          deliveryKmPricing: form.deliveryKmPricing.map((item) => ({
            km: Number(item.km),
            price: Number(item.price),
          })),
        },
      });

      if (copyFromOutletId) {
        await apiRequest(`/outlets/${createdOutlet.id}/copy-menu-from/${copyFromOutletId}`, {
          method: "POST",
        });
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create outlet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Add New Outlet"
        description="Create a new outlet location with required address details, operating hours, and service settings."
        action={{ href: "/outlets", label: "Back to Outlets" }}
      />

      <form className="space-y-6" onSubmit={submit}>
        <FormSection title="Outlet Information">
          <div>
            <label className="form-label flex items-center gap-1">
              <span>Franchise Assignment</span>
            </label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.franchiseId}
              onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
            >
              <option value="">-- Standalone (No Franchise) --</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {loadingFranchises && (
              <p className="mt-1 text-xs text-[#766b64]">Loading franchises...</p>
            )}
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>📋 Copy Whole Menu From Outlet (Optional)</span>
            </label>
            <select
              className="form-input cursor-pointer bg-white font-semibold text-[#7c3fe0]"
              value={copyFromOutletId}
              onChange={(e) => setCopyFromOutletId(e.target.value)}
            >
              <option value="">-- Start with Blank Menu --</option>
              {existingOutlets.map((o) => (
                <option key={o.id} value={o.id}>
                  Copy Menu from: {o.name} ({o.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#766b64]">
              Copies all categories, items, prices, and add-on groups into this new outlet automatically.
            </p>
          </div>

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
              placeholder="e.g. Surat Main Branch"
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
              placeholder="e.g. OUT-SURAT-01"
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
              placeholder="outlet@example.com"
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
              placeholder="Full shop / building address"
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
              placeholder="395007"
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
              slabs={form.deliveryKmPricing}
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
          <Link className="btn-secondary" href="/outlets">
            Cancel
          </Link>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Save Outlet"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={!!error}
        title="Creation Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />

      <ResultDialog
        open={success}
        title="Outlet Created"
        message="The new outlet location has been created successfully."
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
