"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type Franchise = {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  agreementStartDate: string | null;
  agreementEndDate: string | null;
  gstNumber: string | null;
  securityDeposit: string | null;
  royaltyPercent: string | null;
  notes: string | null;
  canManageMenu: boolean;
  canManageOutletStaff: boolean;
  canViewReports: boolean;
  canRouteOrders: boolean;
  canRequestExtraPos: boolean;
};

const defaultForm = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  agreementStartDate: "",
  agreementEndDate: "",
  gstNumber: "",
  securityDeposit: "",
  royaltyPercent: "",
  notes: "",
  canManageMenu: true,
  canManageOutletStaff: true,
  canViewReports: true,
  canRouteOrders: true,
  canRequestExtraPos: true,
};

function TextField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="form-label">{label}</span>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PermissionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[14px] border border-[#eadfd5] bg-white/68 px-4 py-3 shadow-[0_10px_24px_rgba(76,54,35,0.04)] transition hover:bg-white">
      <span className="text-sm font-medium text-[#3b302d]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export default function EditFranchisePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  useEffect(() => {
    apiRequest<Franchise>(`/franchises/${params.id}`)
      .then((franchise) => {
        setForm({
          name: franchise.name || "",
          ownerName: franchise.ownerName || "",
          email: franchise.email || "",
          phone: franchise.phone || "",
          address: franchise.address || "",
          city: franchise.city || "",
          state: franchise.state || "",
          pincode: franchise.pincode || "",
          agreementStartDate: franchise.agreementStartDate || "",
          agreementEndDate: franchise.agreementEndDate || "",
          gstNumber: franchise.gstNumber || "",
          securityDeposit: franchise.securityDeposit || "",
          royaltyPercent: franchise.royaltyPercent || "",
          notes: franchise.notes || "",
          canManageMenu: franchise.canManageMenu,
          canManageOutletStaff: franchise.canManageOutletStaff,
          canViewReports: franchise.canViewReports,
          canRouteOrders: franchise.canRouteOrders,
          canRequestExtraPos: franchise.canRequestExtraPos,
        });
      })
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load franchise",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      });
  }, [params.id]);

  function setValue(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function optional(value: string) {
    return value.trim() || undefined;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest(`/franchises/${params.id}`, {
        method: "PATCH",
        body: {
          ...form,
          ownerName: optional(form.ownerName),
          phone: optional(form.phone),
          email: optional(form.email),
          address: optional(form.address),
          city: optional(form.city),
          state: optional(form.state),
          pincode: optional(form.pincode),
          agreementStartDate: optional(form.agreementStartDate),
          agreementEndDate: optional(form.agreementEndDate),
          gstNumber: optional(form.gstNumber),
          securityDeposit: optional(form.securityDeposit),
          royaltyPercent: optional(form.royaltyPercent),
          notes: optional(form.notes),
        },
      });
      setDialog({
        open: true,
        title: "Franchise updated",
        message: "The franchise setup details and permissions were updated successfully.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not update franchise",
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
            Edit Franchise
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Update ownership, agreement details and franchise permissions.
          </p>
        </div>
        <Link className="btn-secondary" href="/franchises">
          Back
        </Link>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Franchise Details">
          <div className="md:col-span-2">
            <p className="text-sm text-[#766b64]">
              Same fields used in Setup Franchise, connected to the franchise record.
            </p>
          </div>
          <TextField label="Franchise Name" value={form.name} onChange={(value) => setValue("name", value)} />
          <TextField label="Contact Person Name" value={form.ownerName} onChange={(value) => setValue("ownerName", value)} />
          <TextField label="Email" value={form.email} onChange={(value) => setValue("email", value)} />
          <TextField label="Phone Number" value={form.phone} onChange={(value) => setValue("phone", value)} />
          <TextField label="Address" value={form.address} onChange={(value) => setValue("address", value)} />
          <TextField label="City" value={form.city} onChange={(value) => setValue("city", value)} />
          <TextField label="State" value={form.state} onChange={(value) => setValue("state", value)} />
          <TextField label="Pincode" value={form.pincode} onChange={(value) => setValue("pincode", value)} />
          <TextField label="Agreement Start Date" type="date" value={form.agreementStartDate} onChange={(value) => setValue("agreementStartDate", value)} />
          <TextField label="Agreement End Date" type="date" value={form.agreementEndDate} onChange={(value) => setValue("agreementEndDate", value)} />
          <TextField label="GST Number" value={form.gstNumber} onChange={(value) => setValue("gstNumber", value)} />
          <TextField label="Security Deposit" value={form.securityDeposit} onChange={(value) => setValue("securityDeposit", value)} />
          <TextField label="Royalty Percent" value={form.royaltyPercent} onChange={(value) => setValue("royaltyPercent", value)} />
          <TextField label="Notes" value={form.notes} onChange={(value) => setValue("notes", value)} />
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-semibold text-[#070b21]">Permissions</h3>
          </div>
          <PermissionToggle label="Can manage menu" checked={form.canManageMenu} onChange={(value) => setValue("canManageMenu", value)} />
          <PermissionToggle label="Can manage outlet staff" checked={form.canManageOutletStaff} onChange={(value) => setValue("canManageOutletStaff", value)} />
          <PermissionToggle label="Can view reports" checked={form.canViewReports} onChange={(value) => setValue("canViewReports", value)} />
          <PermissionToggle label="Can route orders" checked={form.canRouteOrders} onChange={(value) => setValue("canRouteOrders", value)} />
          <PermissionToggle label="Can request extra POS" checked={form.canRequestExtraPos} onChange={(value) => setValue("canRequestExtraPos", value)} />
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" href="/franchises">
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
        primaryLabel={dialog.error ? "Try Again" : "Back to Franchises"}
        onPrimary={() =>
          dialog.error
            ? setDialog((current) => ({ ...current, open: false }))
            : router.push("/franchises")
        }
      />
    </>
  );
}
