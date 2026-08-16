"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

type PosDevice = {
  id: string;
  outletId: string;
  name: string;
  type: string;
  status: string;
  deviceCode: string | null;
  eventName: string | null;
  eventLocation: string | null;
  handlerName: string | null;
  handlerPhone: string | null;
  validFrom: string | null;
  validUntil: string | null;
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

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function EditPosDevicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  useEffect(() => {
    Promise.all([
      apiRequest<Outlet[]>("/outlets"),
      apiRequest<PosDevice>(`/pos-devices/${params.id}`),
    ])
      .then(([outletRows, device]) => {
        setOutlets(outletRows);
        setForm({
          outletId: device.outletId || "",
          name: device.name || "",
          type: device.type || "PERMANENT",
          status: device.status || "ACTIVE",
          pin: "",
          deviceCode: device.deviceCode || "",
          eventName: device.eventName || "",
          eventLocation: device.eventLocation || "",
          handlerName: device.handlerName || "",
          handlerPhone: device.handlerPhone || "",
          validFrom: toDateTimeLocal(device.validFrom),
          validUntil: toDateTimeLocal(device.validUntil),
        });
      })
      .catch((err) => {
        setDialog({
          open: true,
          title: "Could not load POS device",
          message: err instanceof Error ? err.message : "Request failed",
          error: true,
        });
      });
  }, [params.id]);

  const selectedOutlet = useMemo(
    () => outlets.find((outlet) => outlet.id === form.outletId),
    [form.outletId, outlets],
  );

  function setValue(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest(`/pos-devices/${params.id}`, {
        method: "PATCH",
        body: {
          outletId: form.outletId,
          name: form.name,
          type: form.type,
          status: form.status,
          pin: form.pin || undefined,
          deviceCode: form.deviceCode || null,
          eventName: form.eventName || null,
          eventLocation: form.eventLocation || null,
          handlerName: form.handlerName || null,
          handlerPhone: form.handlerPhone || null,
          validFrom: toIsoDate(form.validFrom),
          validUntil: toIsoDate(form.validUntil),
        },
      });
      setDialog({
        open: true,
        title: "POS updated",
        message: "The POS device has been updated successfully.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not update POS",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Edit POS Device" description="Update outlet assignment, code, handler and temporary access window.">
        <Link className="btn-secondary" href="/pos-devices">
          Back
        </Link>
      </PageHeader>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Type</div>
          <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">{form.type}</div>
          <div className="mt-3 text-xs text-[#766b64]">Permanent or temporary access</div>
        </div>
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Status</div>
          <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">{form.status}</div>
          <div className="mt-3 text-xs text-[#766b64]">Current device working state</div>
        </div>
        <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">Outlet</div>
          <div className="font-display mt-2 text-3xl font-semibold leading-none text-[#070b21]">{selectedOutlet?.code || "None"}</div>
          <div className="mt-3 text-xs text-[#766b64]">{selectedOutlet?.name || "Choose outlet"}</div>
        </div>
      </section>

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
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name} ({outlet.code})
                  {outlet.franchise?.name ? ` - ${outlet.franchise.name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4 shadow-[0_10px_24px_rgba(76,54,35,0.04)]">
            <div className="font-display text-xl font-semibold text-[#070b21]">
              {selectedOutlet?.name || "No outlet selected"}
            </div>
            <div className="mt-1 text-sm text-[#766b64]">
              {selectedOutlet
                ? `${selectedOutlet.address || "Location not added"} | ${selectedOutlet.status}`
                : "Choose an outlet before saving."}
            </div>
          </div>
        </FormSection>

        <FormSection title="POS Details">
          <label>
            <span className="form-label">POS Name</span>
            <input className="form-input" required value={form.name} onChange={(event) => setValue("name", event.target.value)} />
          </label>
          <label>
            <span className="form-label">Device Code</span>
            <input className="form-input" value={form.deviceCode} onChange={(event) => setValue("deviceCode", event.target.value)} />
          </label>
          <label>
            <span className="form-label">New PIN</span>
            <input className="form-input" maxLength={12} minLength={4} value={form.pin} onChange={(event) => setValue("pin", event.target.value)} />
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
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </label>
        </FormSection>

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

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" href="/pos-devices">
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
        primaryLabel={dialog.error ? "Try Again" : "Back to POS Devices"}
        onPrimary={() =>
          dialog.error
            ? setDialog((current) => ({ ...current, open: false }))
            : router.push("/pos-devices")
        }
      />
    </>
  );
}
