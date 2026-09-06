"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";
import { apiRequest } from "@/lib/api";

type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  status: string;
  franchiseId?: string | null;
  franchise?: { id?: string; name: string } | null;
};

const defaultForm = {
  outletId: "",
  name: "",
  type: "PERMANENT",
  status: "ACTIVE",
  pin: "",
  deviceCode: "",
  eventName: "",
  eventLocation: "",
  handlerName: "",
  handlerPhone: "",
  validFrom: "",
  validUntil: "",
};

export default function NewPosDevicePage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  useEffect(() => {
    apiRequest<Outlet[]>("/outlets")
      .then(setOutlets)
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load outlets",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      })
      .finally(() => setLoadingOutlets(false));
  }, []);

  const selectedOutlet = useMemo(
    () => outlets.find((outlet) => outlet.id === form.outletId),
    [form.outletId, outlets],
  );

  const backUrl = useMemo(() => {
    const fid = selectedOutlet?.franchiseId || selectedOutlet?.franchise?.id;
    return fid ? `/franchises/${fid}` : "/pos-devices";
  }, [selectedOutlet]);

  function setValue(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toIsoDate(value: string) {
    return value ? new Date(value).toISOString() : undefined;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest("/pos-devices", {
        method: "POST",
        body: {
          outletId: form.outletId,
          name: form.name,
          type: form.type,
          status: form.status,
          pin: form.pin || undefined,
          deviceCode: form.deviceCode || undefined,
          eventName: form.type === "TEMPORARY" ? form.eventName || undefined : undefined,
          eventLocation:
            form.type === "TEMPORARY" ? form.eventLocation || undefined : undefined,
          handlerName:
            form.type === "TEMPORARY" ? form.handlerName || undefined : undefined,
          handlerPhone:
            form.type === "TEMPORARY" ? form.handlerPhone || undefined : undefined,
          validFrom: form.type === "TEMPORARY" ? toIsoDate(form.validFrom) : undefined,
          validUntil:
            form.type === "TEMPORARY" ? toIsoDate(form.validUntil) : undefined,
        },
      });
      setDialog({
        open: true,
        title: "POS created",
        message: "The POS device has been created successfully.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not create POS",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Add POS Device"
        description="Select an outlet and add permanent or temporary POS access with required details."
      >
        <Link className="btn-secondary" href={backUrl}>
          Back
        </Link>
      </PageHeader>

      <form className="space-y-6" onSubmit={submit}>
        <FormSection title="Outlet Selection">
          <div>
            <label className="form-label flex items-center gap-1">
              <span>Outlet</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <select
              className="form-input cursor-pointer bg-white"
              required
              value={form.outletId}
              onChange={(event) => setValue("outletId", event.target.value)}
            >
              <option value="">Select outlet</option>
              {loadingOutlets ? <option value="">Loading outlets...</option> : null}
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name} ({outlet.code})
                  {outlet.franchise?.name ? ` - ${outlet.franchise.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[18px] border border-[#eadfd5] bg-white/68 p-4 shadow-xs">
            <div className="font-display text-lg font-semibold text-[#070b21]">
              {selectedOutlet?.name || "No outlet selected"}
            </div>
            <div className="mt-1 text-sm text-[#766b64]">
              {selectedOutlet
                ? `${selectedOutlet.address || "Location not added"} | ${selectedOutlet.status}`
                : "Choose an outlet before creating a POS device."}
            </div>
          </div>
        </FormSection>

        <FormSection title="POS Device Details">
          <div>
            <label className="form-label flex items-center gap-1">
              <span>POS Device Name</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input"
              required
              placeholder="e.g. Counter 1 POS"
              value={form.name}
              onChange={(event) => setValue("name", event.target.value)}
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-1">
              <span>Device Code</span>
              <span className="text-sm font-bold text-red-500">*</span>
            </label>
            <input
              className="form-input font-mono"
              required
              placeholder="e.g. POS-MAIN-01"
              value={form.deviceCode}
              onChange={(event) => setValue("deviceCode", event.target.value)}
            />
          </div>

          <div>
            <label className="form-label">PIN</label>
            <input
              className="form-input"
              maxLength={12}
              minLength={4}
              placeholder="4 to 12 digit security PIN"
              value={form.pin}
              onChange={(event) => setValue("pin", event.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Type</label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.type}
              onChange={(event) => setValue("type", event.target.value)}
            >
              <option value="PERMANENT">Permanent POS</option>
              <option value="TEMPORARY">Temporary POS</option>
            </select>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input cursor-pointer bg-white"
              value={form.status}
              onChange={(event) => setValue("status", event.target.value)}
            >
              <option value="ACTIVE">Active / Working</option>
              <option value="INACTIVE">Inactive / Closed</option>
              <option value="PENDING">Pending</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>
        </FormSection>

        {form.type === "TEMPORARY" ? (
          <FormSection title="Temporary POS Details">
            <div>
              <label className="form-label">Event Name</label>
              <input
                className="form-input"
                placeholder="e.g. Summer Food Fest"
                value={form.eventName}
                onChange={(event) => setValue("eventName", event.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Event Location</label>
              <input
                className="form-input"
                placeholder="e.g. Exhibition Ground Hall 2"
                value={form.eventLocation}
                onChange={(event) => setValue("eventLocation", event.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Handler Name</label>
              <input
                className="form-input"
                placeholder="Responsible person"
                value={form.handlerName}
                onChange={(event) => setValue("handlerName", event.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Handler Phone</label>
              <div className="flex items-center gap-2.5">
                <CountryCodePicker value="+91" />
                <input
                  className="form-input min-w-0 flex-1"
                  type="tel"
                  placeholder="99999 99999"
                  value={form.handlerPhone}
                  onChange={(event) => setValue("handlerPhone", event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Valid From</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.validFrom}
                onChange={(event) => setValue("validFrom", event.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Valid Until</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.validUntil}
                onChange={(event) => setValue("validUntil", event.target.value)}
              />
            </div>
          </FormSection>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" href={backUrl}>
            Cancel
          </Link>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save POS Device"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        primaryLabel={dialog.error ? "Try Again" : "Done"}
        onPrimary={() =>
          dialog.error
            ? setDialog((current) => ({ ...current, open: false }))
            : router.push(backUrl)
        }
      />
    </>
  );
}
