"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

export default function NewFranchisePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", ownerName: "", phone: "", email: "" });
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchises", { method: "POST", body: form });
      setDialog({ open: true, title: "Franchise created", message: "The franchise has been created successfully.", error: false });
    } catch (err) {
      setDialog({ open: true, title: "Could not create franchise", message: err instanceof Error ? err.message : "Request failed", error: true });
    }
  }

  return (
    <>
      <PageHeader title="Create Franchise" description="Add a franchise record."><Link className="btn-secondary" href="/franchises">Back</Link></PageHeader>
      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="Franchise Details">
          {(["name", "ownerName", "phone", "email"] as const).map((field) => (
            <label key={field}>
              <span className="form-label">{field === "ownerName" ? "Owner Name" : field[0].toUpperCase() + field.slice(1)}</span>
              <input className="form-input" value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} />
            </label>
          ))}
        </FormSection>
        <div className="flex justify-end gap-3"><Link className="btn-secondary" href="/franchises">Cancel</Link><button className="btn-primary" type="submit">Save Franchise</button></div>
      </form>
      <ResultDialog open={dialog.open} title={dialog.title} message={dialog.message} tone={dialog.error ? "error" : "success"} primaryLabel={dialog.error ? "Try Again" : "Back to Franchises"} onPrimary={() => dialog.error ? setDialog({ ...dialog, open: false }) : router.push("/franchises")} />
    </>
  );
}
