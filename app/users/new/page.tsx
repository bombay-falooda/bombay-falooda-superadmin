"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { PageHeader } from "@/components/page-header";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

const roleOptions = [
  { value: "FRANCHISE_OWNER", label: "Franchise Owner" },
  { value: "STAFF", label: "Staff" },
  { value: "POS_USER", label: "POS User" },
];

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "FRANCHISE_OWNER",
  });
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", error: false });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateRole(role: string) {
    setForm((current) => ({
      ...current,
      role,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      await apiRequest("/users", {
        method: "POST",
        body: {
          name: form.name,
          role: form.role,
          password: form.password,
          email: form.email || undefined,
          phone: form.phone || undefined,
        },
      });
      setDialog({
        open: true,
        title: "User created",
        message: "The user has been created successfully.",
        error: false,
      });
    } catch (err) {
      setDialog({
        open: true,
        title: "Could not create user",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
    }
  }

  return (
    <>
      <PageHeader title="Create User" description="Add franchise, staff or POS access.">
        <Link className="btn-secondary" href="/users">
          Back
        </Link>
      </PageHeader>
      <form className="space-y-5" onSubmit={submit}>
        <FormSection title="User Details">
          <label>
            <span className="form-label">Name</span>
            <input className="form-input" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            <span className="form-label">Role</span>
            <select className="form-input" value={form.role} onChange={(e) => updateRole(e.target.value)}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Email</span>
            <input className="form-input" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label>
            <span className="form-label">Phone</span>
            <input className="form-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
          <label>
            <span className="form-label">Password</span>
            <input className="form-input" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
          </label>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" href="/users">
            Cancel
          </Link>
          <button className="btn-primary" type="submit">
            Save User
          </button>
        </div>
      </form>
      <ResultDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        primaryLabel={dialog.error ? "Try Again" : "Back to Users"}
        onPrimary={() => (dialog.error ? setDialog({ ...dialog, open: false }) : router.push("/users"))}
      />
    </>
  );
}
