"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
  ownerName: string | null;
};

type Outlet = {
  id: string;
  franchiseId: string | null;
  name: string;
  code: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  serviceRadiusKm: string | null;
  openingTime: string | null;
  closingTime: string | null;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
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
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  serviceRadiusKm: "",
  openingTime: "",
  closingTime: "",
  dineIn: true,
  takeaway: true,
  delivery: false,
  onlineOrderingEnabled: true,
};

export default function EditOutletManagementPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  useEffect(() => {
    Promise.all([
      apiRequest<Franchise[]>("/franchises"),
      apiRequest<Outlet>(`/outlets/${params.id}`),
    ])
      .then(([franchiseRows, outlet]) => {
        setFranchises(franchiseRows);
        setForm({
          franchiseId: outlet.franchiseId || "",
          name: outlet.name || "",
          code: outlet.code || "",
          address: outlet.address || "",
          city: outlet.city || "",
          state: outlet.state || "",
          pincode: outlet.pincode || "",
          phone: outlet.phone || "",
          email: outlet.email || "",
          serviceRadiusKm: outlet.serviceRadiusKm || "",
          openingTime: outlet.openingTime || "",
          closingTime: outlet.closingTime || "",
          dineIn: outlet.dineIn,
          takeaway: outlet.takeaway,
          delivery: outlet.delivery,
          onlineOrderingEnabled: outlet.onlineOrderingEnabled,
        });
      })
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load outlet",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      });
  }, [params.id]);

  const selectedFranchise = useMemo(
    () => franchises.find((franchise) => franchise.id === form.franchiseId),
    [form.franchiseId, franchises],
  );

  function setValue(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest(`/outlets/${params.id}`, {
        method: "PATCH",
        body: {
          franchiseId: form.franchiseId || null,
          name: form.name,
          code: form.code,
          address: form.address,
          city: form.city || undefined,
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          serviceRadiusKm: form.serviceRadiusKm || null,
          openingTime: form.openingTime || null,
          closingTime: form.closingTime || null,
          dineIn: form.dineIn,
          takeaway: form.takeaway,
          delivery: form.delivery,
          onlineOrderingEnabled: form.onlineOrderingEnabled,
        },
      });
      setDialog({
        open: true,
        title: "Outlet updated",
        message: "The outlet has been updated successfully.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not update outlet",
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
            Edit Outlet
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Update outlet assignment, contact details, timings and services.
          </p>
        </div>
        <Link className="btn-secondary" href="/outlet-management">
          Back
        </Link>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Franchise Selection">
          <label>
            <span className="form-label">Franchise / Owner</span>
            <select
              className="form-input"
              value={form.franchiseId}
              onChange={(event) => setValue("franchiseId", event.target.value)}
            >
              <option value="">Unassigned</option>
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
              {selectedFranchise?.name || "Unassigned outlet"}
            </div>
            <div className="mt-1 text-sm text-[#766b64]">
              {selectedFranchise?.ownerName || "No owner selected"}
            </div>
          </div>
        </FormSection>

        <FormSection title="Outlet Details">
          {(["name", "code", "address", "city", "state", "pincode", "phone", "email", "serviceRadiusKm", "openingTime", "closingTime"] as const).map((field) => (
            <label key={field}>
              <span className="form-label">{labelForField(field)}</span>
              <input
                className="form-input"
                required={["name", "code", "address"].includes(field)}
                type={field === "openingTime" || field === "closingTime" ? "time" : "text"}
                value={form[field] as string}
                onChange={(event) => setValue(field, event.target.value)}
              />
            </label>
          ))}
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
            {saving ? "Saving..." : "Save Changes"}
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

function labelForField(field: string) {
  const labels: Record<string, string> = {
    name: "Outlet Name",
    code: "Outlet Code",
    address: "Address",
    city: "City",
    state: "State",
    pincode: "Pincode",
    phone: "Phone",
    email: "Email",
    serviceRadiusKm: "Service Radius Km",
    openingTime: "Opening Time",
    closingTime: "Closing Time",
  };

  return labels[field] || field;
}
