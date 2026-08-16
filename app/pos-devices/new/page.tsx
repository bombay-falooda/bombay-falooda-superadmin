"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  status: string;
  franchise?: { name: string } | null;
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
      <PageHeader title="Add POS Device" description="Select an outlet and add permanent or temporary POS access.">
        <Link className="btn-secondary" href="/pos-devices">
          Back
        </Link>
      </PageHeader>

      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Outlet Selection">
          <label>
            <span className="form-label">Outlet</span>
            <select
              className="form-input"
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
          </label>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="text-sm font-semibold text-slate-950">
              {selectedOutlet?.name || "No outlet selected"}
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-500">
              {selectedOutlet
                ? `${selectedOutlet.address || "Location not added"} | ${selectedOutlet.status}`
                : "Choose an outlet before creating a POS device."}
            </div>
          </div>
        </FormSection>

        <FormSection title="POS Details">
          <label>
            <span className="form-label">POS Name</span>
            <input
              className="form-input"
              required
              value={form.name}
              onChange={(event) => setValue("name", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Device Code</span>
            <input
              className="form-input"
              value={form.deviceCode}
              onChange={(event) => setValue("deviceCode", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">PIN</span>
            <input
              className="form-input"
              maxLength={12}
              minLength={4}
              value={form.pin}
              onChange={(event) => setValue("pin", event.target.value)}
            />
          </label>
          <label>
            <span className="form-label">Type</span>
            <select
              className="form-input"
              value={form.type}
              onChange={(event) => setValue("type", event.target.value)}
            >
              <option value="PERMANENT">Permanent POS</option>
              <option value="TEMPORARY">Temporary POS</option>
            </select>
          </label>
          <label>
            <span className="form-label">Status</span>
            <select
              className="form-input"
              value={form.status}
              onChange={(event) => setValue("status", event.target.value)}
            >
              <option value="ACTIVE">Active / Working</option>
              <option value="INACTIVE">Inactive / Closed</option>
              <option value="PENDING">Pending</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </label>
        </FormSection>

        {form.type === "TEMPORARY" ? (
          <FormSection title="Temporary POS Details">
            <label>
              <span className="form-label">Event Name</span>
              <input className="form-input" value={form.eventName} onChange={(event) => setValue("eventName", event.target.value)} />
            </label>
            <label>
              <span className="form-label">Event Location</span>
              <input className="form-input" value={form.eventLocation} onChange={(event) => setValue("eventLocation", event.target.value)} />
            </label>
            <label>
              <span className="form-label">Handler Name</span>
              <input className="form-input" value={form.handlerName} onChange={(event) => setValue("handlerName", event.target.value)} />
            </label>
            <label>
              <span className="form-label">Handler Phone</span>
              <input className="form-input" value={form.handlerPhone} onChange={(event) => setValue("handlerPhone", event.target.value)} />
            </label>
            <label>
              <span className="form-label">Valid From</span>
              <input className="form-input" type="datetime-local" value={form.validFrom} onChange={(event) => setValue("validFrom", event.target.value)} />
            </label>
            <label>
              <span className="form-label">Valid Until</span>
              <input className="form-input" type="datetime-local" value={form.validUntil} onChange={(event) => setValue("validUntil", event.target.value)} />
            </label>
          </FormSection>
        ) : null}

        <div className="flex justify-end gap-3">
          <button className="btn-secondary" type="button" onClick={() => setForm(defaultForm)}>
            Clear
          </button>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save POS"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        primaryLabel={dialog.error ? "Try Again" : "Back to POS Devices"}
        onPrimary={() =>
          dialog.error ? setDialog({ ...dialog, open: false }) : router.push("/pos-devices")
        }
      />
    </>
  );
}
