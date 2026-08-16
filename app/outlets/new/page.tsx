"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

export default function NewOutletPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    franchiseId: "",
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    serviceRadiusKm: "",
    openingTime: "",
    closingTime: "",
    dineIn: true,
    takeaway: true,
    delivery: false,
    onlineOrderingEnabled: true,
  });
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  function setValue(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/outlets", {
        method: "POST",
        body: { ...form, franchiseId: form.franchiseId || undefined },
      });
      setDialog({ open: true, title: "Outlet created", message: "The outlet has been created successfully.", error: false });
    } catch (err) {
      setDialog({ open: true, title: "Could not create outlet", message: err instanceof Error ? err.message : "Request failed", error: true });
    }
  }

  return (
    <>
      <PageHeader title="Create Outlet" description="Add location and service settings."><Link className="btn-secondary" href="/outlets">Back</Link></PageHeader>
      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Outlet Details">
          {(["franchiseId", "name", "code", "address", "phone", "email", "latitude", "longitude", "serviceRadiusKm", "openingTime", "closingTime"] as const).map((field) => (
            <label key={field}>
              <span className="form-label">{field}</span>
              <input className="form-input" value={form[field] as string} onChange={(e) => setValue(field, e.target.value)} />
            </label>
          ))}
        </FormSection>
        <FormSection title="Service Controls">
          {(["dineIn", "takeaway", "delivery", "onlineOrderingEnabled"] as const).map((field) => (
            <label key={field} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
              <input type="checkbox" checked={form[field]} onChange={(e) => setValue(field, e.target.checked)} />
              <span className="text-sm font-medium text-slate-600">{field}</span>
            </label>
          ))}
        </FormSection>
        <div className="flex justify-end gap-3"><Link className="btn-secondary" href="/outlets">Cancel</Link><button className="btn-primary" type="submit">Save Outlet</button></div>
      </form>
      <ResultDialog open={dialog.open} title={dialog.title} message={dialog.message} tone={dialog.error ? "error" : "success"} primaryLabel={dialog.error ? "Try Again" : "Back to Outlets"} onPrimary={() => dialog.error ? setDialog({ ...dialog, open: false }) : router.push("/outlets")} />
    </>
  );
}
