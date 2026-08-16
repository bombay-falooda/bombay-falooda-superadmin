"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
};

const serviceFields = [
  { key: "dineIn", label: "Dine In" },
  { key: "takeaway", label: "Takeaway" },
  { key: "delivery", label: "Delivery" },
  { key: "onlineOrderingEnabled", label: "Online Ordering" },
] as const;

const defaultForm = {
  franchiseId: "",
  name: "",
  code: "",
  contactPerson: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  serviceRadiusKm: "",
  openingTime: "10:00",
  closingTime: "23:00",
  dineIn: true,
  takeaway: true,
  delivery: false,
  onlineOrderingEnabled: true,
};

function OutletDraftMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
        {label}
      </div>
      <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">
        {value}
      </div>
      <div className="mt-3 text-xs text-[#766b64]">{helper}</div>
    </div>
  );
}

export default function NewOutletManagementPage() {
  const router = useRouter();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    error: false,
  });

  useEffect(() => {
    apiRequest<Franchise[]>("/franchises")
      .then(setFranchises)
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load franchises",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      });
  }, []);

  const selectedFranchise = useMemo(
    () => franchises.find((franchise) => franchise.id === form.franchiseId),
    [form.franchiseId, franchises],
  );

  const enabledServices = serviceFields.filter((field) => form[field.key]).length;

  function setValue(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest("/outlets", {
        method: "POST",
        body: {
          franchiseId: form.franchiseId,
          name: form.name,
          code: form.code,
          address: form.address,
          city: form.city || undefined,
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          serviceRadiusKm: form.serviceRadiusKm || undefined,
          openingTime: form.openingTime || undefined,
          closingTime: form.closingTime || undefined,
          dineIn: form.dineIn,
          takeaway: form.takeaway,
          delivery: form.delivery,
          onlineOrderingEnabled: form.onlineOrderingEnabled,
        },
      });

      setDialog({
        open: true,
        title: "Outlet added",
        message: "The outlet has been added under the selected franchise.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not add outlet",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-[#070b21]">
            Add Outlet
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Create a new outlet under a franchise owner with service controls.
          </p>
        </div>
        <Link className="btn-secondary" href="/outlet-management">
          Back
        </Link>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <OutletDraftMetric
          label="Selected Franchise"
          value={selectedFranchise?.name || "None"}
          helper={selectedFranchise?.ownerName || "Choose a franchise owner"}
        />
        <OutletDraftMetric
          label="Outlet Code"
          value={form.code || "Draft"}
          helper="Unique code used by operations"
        />
        <OutletDraftMetric
          label="Services"
          value={String(enabledServices)}
          helper="Enabled service channels"
        />
      </section>

      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Franchise Selection">
          <label>
            <span className="form-label">Franchise / Owner</span>
            <select
              className="form-input"
              required
              value={form.franchiseId}
              onChange={(event) => setValue("franchiseId", event.target.value)}
            >
              <option value="">Select franchise or owner</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                  {franchise.ownerName ? ` - ${franchise.ownerName}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4 shadow-[0_10px_24px_rgba(76,54,35,0.04)]">
            <div className="font-display text-xl font-semibold text-[#070b21]">
              {selectedFranchise?.name || "No franchise selected"}
            </div>
            <div className="mt-1 text-sm text-[#766b64]">
              {selectedFranchise
                ? selectedFranchise.ownerName ||
                  selectedFranchise.email ||
                  selectedFranchise.phone ||
                  "Owner details not added"
                : "Choose a franchise before creating the outlet."}
            </div>
          </div>
        </FormSection>

        <FormSection title="Outlet Details">
          <label>
            <span className="form-label">Outlet Name</span>
            <input
              className="form-input"
              required
              value={form.name}
              onChange={(event) => setValue("name", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Outlet Code</span>
            <input
              className="form-input"
              required
              value={form.code}
              onChange={(event) => setValue("code", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Contact Person</span>
            <input
              className="form-input"
              value={form.contactPerson}
              onChange={(event) => setValue("contactPerson", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Phone</span>
            <input
              className="form-input"
              value={form.phone}
              onChange={(event) => setValue("phone", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Email</span>
            <input
              className="form-input"
              value={form.email}
              onChange={(event) => setValue("email", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Address</span>
            <input
              className="form-input"
              required
              value={form.address}
              onChange={(event) => setValue("address", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">City</span>
            <input
              className="form-input"
              value={form.city}
              onChange={(event) => setValue("city", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">State</span>
            <input
              className="form-input"
              value={form.state}
              onChange={(event) => setValue("state", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Pincode</span>
            <input
              className="form-input"
              value={form.pincode}
              onChange={(event) => setValue("pincode", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Service Radius Km</span>
            <input
              className="form-input"
              value={form.serviceRadiusKm}
              onChange={(event) => setValue("serviceRadiusKm", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Opening Time</span>
            <input
              className="form-input"
              type="time"
              value={form.openingTime}
              onChange={(event) => setValue("openingTime", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Closing Time</span>
            <input
              className="form-input"
              type="time"
              value={form.closingTime}
              onChange={(event) => setValue("closingTime", event.target.value)}
            />
          </label>
        </FormSection>

        <FormSection title="Outlet Permissions">
          {serviceFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-[0_10px_24px_rgba(76,54,35,0.04)] transition hover:bg-white"
            >
              <span className="text-sm font-medium text-[#3b302d]">{field.label}</span>
              <input
                type="checkbox"
                checked={form[field.key]}
                onChange={(event) => setValue(field.key, event.target.checked)}
              />
            </label>
          ))}
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" href="/outlet-management">
            Cancel
          </Link>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Outlet"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        primaryLabel={dialog.error ? "Try Again" : "Back to Outlet Management"}
        onPrimary={() =>
          dialog.error
            ? setDialog((current) => ({ ...current, open: false }))
            : router.push("/outlet-management")
        }
      />
    </>
  );
}
