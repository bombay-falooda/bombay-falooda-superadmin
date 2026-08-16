"use client";

import { useMemo, useState } from "react";

import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";

type OutletDraft = {
  name: string;
  code: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingTime: string;
  closingTime: string;
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrdering: boolean;
  menuEdit: boolean;
  billEdit: boolean;
  reports: boolean;
  orderRouting: boolean;
};

const emptyOutlet: OutletDraft = {
  name: "",
  code: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  openingTime: "10:00",
  closingTime: "23:00",
  dineIn: true,
  takeaway: true,
  delivery: false,
  onlineOrdering: true,
  menuEdit: true,
  billEdit: false,
  reports: true,
  orderRouting: true,
};

const steps = ["Franchise", "Outlets", "POS", "Document"];
const posMonthlyPrice = 1000;

type SetupResponse = {
  franchise: { id: string; name: string };
  owner: { id: string; name: string; email: string | null; phone: string | null };
  outlets: Array<{ id: string; name: string; code: string }>;
  posDevices: Array<{
    id: string;
    outletId: string;
    name: string;
    deviceCode: string | null;
    accessKey: string;
  }>;
  document: {
    ownerLogin: {
      email: string;
      password: string;
    };
    posLogin: {
      pin: string;
      keys: Array<{
        outletId: string;
        name: string;
        deviceCode: string | null;
        accessKey: string;
      }>;
    };
    billing: {
      defaultPermanentPos: number;
      extraPermanentPos: number;
      extraPosMonthlyPrice: number;
      extraPosMonthlyAmount: number;
      billingCycle: string;
    };
  };
};

function makePassword(name: string) {
  const clean = name.replace(/[^a-z0-9]/gi, "").slice(0, 6) || "BF";
  return `${clean}@${new Date().getFullYear()}#01`;
}

function makeKey(prefix: string, index: number) {
  const suffix = String(index + 1).padStart(3, "0");
  return `${prefix || "BF"}-POS-${suffix}-KEY`;
}

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

function SetupMetric({
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

export default function SetupFranchisePage() {
  const [step, setStep] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    title: "Setup document created",
    message: "The franchise setup document is ready.",
    error: false,
  });
  const [setupResponse, setSetupResponse] = useState<SetupResponse | null>(null);
  const [franchise, setFranchise] = useState({
    franchiseName: "",
    contactPersonName: "",
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
  });
  const [outlets, setOutlets] = useState<OutletDraft[]>([{ ...emptyOutlet }]);
  const [pos, setPos] = useState({
    defaultPermanentPos: 1,
    extraPermanentPos: 0,
    billingCycle: "Monthly",
  });

  const totalPos = pos.defaultPermanentPos + pos.extraPermanentPos;
  const monthlyPosAmount = pos.extraPermanentPos * posMonthlyPrice;

  const document = useMemo(() => {
    if (setupResponse) {
      return {
        ownerEmail: setupResponse.document.ownerLogin.email,
        ownerPassword: setupResponse.document.ownerLogin.password,
        posPin: setupResponse.document.posLogin.pin,
        posKeys: setupResponse.document.posLogin.keys.map((key) => key.accessKey),
      };
    }

    const ownerEmail = franchise.email || "owner@example.com";
    const ownerPassword = makePassword(franchise.franchiseName);
    const prefix = franchise.franchiseName
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase();
    const posKeys = Array.from({ length: totalPos }, (_, index) => makeKey(prefix, index));

    return {
      ownerEmail,
      ownerPassword,
      posPin: "Generated after setup",
      posKeys,
    };
  }, [franchise.email, franchise.franchiseName, setupResponse, totalPos]);

  function updateFranchise(key: keyof typeof franchise, value: string | boolean) {
    setFranchise((current) => ({ ...current, [key]: value }));
  }

  function updateOutlet(index: number, key: keyof OutletDraft, value: string | boolean) {
    setOutlets((current) =>
      current.map((outlet, outletIndex) =>
        outletIndex === index ? { ...outlet, [key]: value } : outlet,
      ),
    );
  }

  function addOutlet() {
    setOutlets((current) => [...current, { ...emptyOutlet }]);
  }

  function removeOutlet(index: number) {
    setOutlets((current) => current.filter((_, outletIndex) => outletIndex !== index));
  }

  function nextStep() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function optional(value: string) {
    return value.trim() || undefined;
  }

  function setupPayload() {
    return {
      franchise: {
        ...franchise,
        phone: optional(franchise.phone),
        city: optional(franchise.city),
        state: optional(franchise.state),
        pincode: optional(franchise.pincode),
        agreementStartDate: optional(franchise.agreementStartDate),
        agreementEndDate: optional(franchise.agreementEndDate),
        gstNumber: optional(franchise.gstNumber),
        securityDeposit: optional(franchise.securityDeposit),
        royaltyPercent: optional(franchise.royaltyPercent),
        notes: optional(franchise.notes),
      },
      outlets: outlets.map((outlet) => ({
        ...outlet,
        contactName: optional(outlet.contactName),
        phone: optional(outlet.phone),
        email: optional(outlet.email),
        city: optional(outlet.city),
        state: optional(outlet.state),
        pincode: optional(outlet.pincode),
        openingTime: optional(outlet.openingTime),
        closingTime: optional(outlet.closingTime),
      })),
      pos,
    };
  }

  async function createFranchiseSetup() {
    setLoading(true);

    try {
      const response = await apiRequest<SetupResponse>("/franchise-setups", {
        method: "POST",
        body: setupPayload(),
      });

      setSetupResponse(response);
      setDialog({
        title: "Franchise setup created",
        message:
          "Franchise, owner login, outlets and POS devices were created successfully.",
        error: false,
      });
      setDialogOpen(true);
    } catch (err) {
      setDialog({
        title: "Could not create setup",
        message: err instanceof Error ? err.message : "Request failed",
        error: true,
      });
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function downloadDocument() {
    const lines = [
      "Bombay Falooda Franchise Setup Document",
      "",
      `Franchise: ${franchise.franchiseName || "Not set"}`,
      `Contact Person: ${franchise.contactPersonName || "Not set"}`,
      `Email: ${franchise.email || "Not set"}`,
      `Phone: ${franchise.phone || "Not set"}`,
      `Address: ${franchise.address || "Not set"}, ${franchise.city || "Not set"}, ${franchise.state || "Not set"} ${franchise.pincode || ""}`,
      `Agreement: ${franchise.agreementStartDate || "Not set"} to ${franchise.agreementEndDate || "Not set"}`,
      "",
      "Owner Login",
      `Email: ${document.ownerEmail}`,
      `Password: ${document.ownerPassword}`,
      "",
      "POS PIN",
      `PIN: ${document.posPin}`,
      "",
      "POS Keys",
      ...document.posKeys.map((key, index) => `${index + 1}. ${key}`),
      "",
      "POS Billing",
      `Default permanent POS: ${pos.defaultPermanentPos}`,
      `Extra permanent POS: ${pos.extraPermanentPos}`,
      `Extra POS monthly amount: Rs ${monthlyPosAmount}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${franchise.franchiseName || "franchise"}-setup-document.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-[#070b21]">
            Setup Franchise
          </h1>
          <p className="mt-1.5 text-sm text-[#766b64]">
            Create franchise onboarding, outlets, POS billing and handover document.
          </p>
        </div>
        <div className="rounded-[16px] border border-[#eadfd5] bg-white/62 px-4 py-3 text-right shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8d827a]">
            Current Step
          </div>
          <div className="font-display text-xl font-semibold text-[#070b21]">
            {steps[step]}
          </div>
        </div>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <SetupMetric
          label="Franchise"
          value={franchise.franchiseName || "Draft"}
          helper={franchise.contactPersonName || "Owner details pending"}
        />
        <SetupMetric
          label="Outlets"
          value={String(outlets.length)}
          helper="Locations included in this setup"
        />
        <SetupMetric
          label="POS Billing"
          value={`Rs ${monthlyPosAmount}`}
          helper={`${totalPos} total POS, ${pos.extraPermanentPos} extra`}
        />
      </section>

      <div className="mb-5 rounded-[20px] border border-[#eadfd5] bg-white/72 p-3 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <button
              key={item}
              className={`rounded-[14px] border px-4 py-3 text-left text-sm font-semibold transition ${
                step === index
                  ? "border-[#9b6df0] bg-[#f6eafa] text-[#6f39d8] shadow-[0_12px_28px_rgba(124,63,224,0.12)]"
                  : index < step
                    ? "border-[#eadfd5] bg-[#fff7e8] text-[#a97835]"
                    : "border-[#eadfd5] bg-white/58 text-[#8a7667] hover:bg-white"
              }`}
              type="button"
              onClick={() => setStep(index)}
            >
              <span className="block text-xs opacity-70">Step {index + 1}</span>
              {item}
            </button>
          ))}
        </div>
      </div>

      {step === 0 ? (
        <FormSection title="Franchise Details">
          <div className="md:col-span-2">
            <p className="text-sm text-[#766b64]">
              Basic ownership, address, agreement and platform permissions.
            </p>
          </div>
          <TextField label="Franchise Name" value={franchise.franchiseName} onChange={(value) => updateFranchise("franchiseName", value)} />
          <TextField label="Contact Person Name" value={franchise.contactPersonName} onChange={(value) => updateFranchise("contactPersonName", value)} />
          <TextField label="Email" value={franchise.email} onChange={(value) => updateFranchise("email", value)} />
          <TextField label="Phone Number" value={franchise.phone} onChange={(value) => updateFranchise("phone", value)} />
          <TextField label="Address" value={franchise.address} onChange={(value) => updateFranchise("address", value)} />
          <TextField label="City" value={franchise.city} onChange={(value) => updateFranchise("city", value)} />
          <TextField label="State" value={franchise.state} onChange={(value) => updateFranchise("state", value)} />
          <TextField label="Pincode" value={franchise.pincode} onChange={(value) => updateFranchise("pincode", value)} />
          <TextField label="Agreement Start Date" type="date" value={franchise.agreementStartDate} onChange={(value) => updateFranchise("agreementStartDate", value)} />
          <TextField label="Agreement End Date" type="date" value={franchise.agreementEndDate} onChange={(value) => updateFranchise("agreementEndDate", value)} />
          <TextField label="GST Number" value={franchise.gstNumber} onChange={(value) => updateFranchise("gstNumber", value)} />
          <TextField label="Security Deposit" value={franchise.securityDeposit} onChange={(value) => updateFranchise("securityDeposit", value)} />
          <TextField label="Royalty Percent" value={franchise.royaltyPercent} onChange={(value) => updateFranchise("royaltyPercent", value)} />
          <TextField label="Notes" value={franchise.notes} onChange={(value) => updateFranchise("notes", value)} />
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-semibold text-[#070b21]">Permissions</h3>
          </div>
          <PermissionToggle label="Can manage menu" checked={franchise.canManageMenu} onChange={(value) => updateFranchise("canManageMenu", value)} />
          <PermissionToggle label="Can manage outlet staff" checked={franchise.canManageOutletStaff} onChange={(value) => updateFranchise("canManageOutletStaff", value)} />
          <PermissionToggle label="Can view reports" checked={franchise.canViewReports} onChange={(value) => updateFranchise("canViewReports", value)} />
          <PermissionToggle label="Can route orders" checked={franchise.canRouteOrders} onChange={(value) => updateFranchise("canRouteOrders", value)} />
          <PermissionToggle label="Can request extra POS" checked={franchise.canRequestExtraPos} onChange={(value) => updateFranchise("canRequestExtraPos", value)} />
        </FormSection>
      ) : null}

      {step === 1 ? (
        <section className="space-y-5">
          {outlets.map((outlet, index) => (
            <div key={index} className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#070b21]">Outlet {index + 1}</h2>
                  <p className="mt-1 text-sm text-[#766b64]">Location, service controls and outlet permissions.</p>
                </div>
                {outlets.length > 1 ? (
                  <button className="btn-secondary" type="button" onClick={() => removeOutlet(index)}>
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="Outlet Name" value={outlet.name} onChange={(value) => updateOutlet(index, "name", value)} />
                <TextField label="Outlet Code" value={outlet.code} onChange={(value) => updateOutlet(index, "code", value)} />
                <TextField label="Contact Person" value={outlet.contactName} onChange={(value) => updateOutlet(index, "contactName", value)} />
                <TextField label="Phone" value={outlet.phone} onChange={(value) => updateOutlet(index, "phone", value)} />
                <TextField label="Email" value={outlet.email} onChange={(value) => updateOutlet(index, "email", value)} />
                <TextField label="Address" value={outlet.address} onChange={(value) => updateOutlet(index, "address", value)} />
                <TextField label="City" value={outlet.city} onChange={(value) => updateOutlet(index, "city", value)} />
                <TextField label="State" value={outlet.state} onChange={(value) => updateOutlet(index, "state", value)} />
                <TextField label="Pincode" value={outlet.pincode} onChange={(value) => updateOutlet(index, "pincode", value)} />
                <TextField label="Opening Time" type="time" value={outlet.openingTime} onChange={(value) => updateOutlet(index, "openingTime", value)} />
                <TextField label="Closing Time" type="time" value={outlet.closingTime} onChange={(value) => updateOutlet(index, "closingTime", value)} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PermissionToggle label="Dine in" checked={outlet.dineIn} onChange={(value) => updateOutlet(index, "dineIn", value)} />
                <PermissionToggle label="Takeaway" checked={outlet.takeaway} onChange={(value) => updateOutlet(index, "takeaway", value)} />
                <PermissionToggle label="Delivery" checked={outlet.delivery} onChange={(value) => updateOutlet(index, "delivery", value)} />
                <PermissionToggle label="Online ordering" checked={outlet.onlineOrdering} onChange={(value) => updateOutlet(index, "onlineOrdering", value)} />
                <PermissionToggle label="Menu editing" checked={outlet.menuEdit} onChange={(value) => updateOutlet(index, "menuEdit", value)} />
                <PermissionToggle label="Bill editing" checked={outlet.billEdit} onChange={(value) => updateOutlet(index, "billEdit", value)} />
                <PermissionToggle label="Reports" checked={outlet.reports} onChange={(value) => updateOutlet(index, "reports", value)} />
                <PermissionToggle label="Order routing" checked={outlet.orderRouting} onChange={(value) => updateOutlet(index, "orderRouting", value)} />
              </div>
            </div>
          ))}
          <button className="btn-secondary" type="button" onClick={addOutlet}>
            Add Another Outlet
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <FormSection title="POS Setup">
          <div className="md:col-span-2">
            <p className="text-sm text-[#766b64]">
              One permanent POS is included by default. Extra POS is billed at Rs 1000 per month.
            </p>
          </div>
          <TextField label="Default Permanent POS" value={String(pos.defaultPermanentPos)} onChange={(value) => setPos((current) => ({ ...current, defaultPermanentPos: Number(value) || 1 }))} />
          <TextField label="Extra Permanent POS" value={String(pos.extraPermanentPos)} onChange={(value) => setPos((current) => ({ ...current, extraPermanentPos: Math.max(0, Number(value) || 0) }))} />
          <label>
            <span className="form-label">Billing Cycle</span>
            <select className="form-input" value={pos.billingCycle} onChange={(event) => setPos((current) => ({ ...current, billingCycle: event.target.value }))}>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </label>
          <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
            <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4"><div className="text-sm text-[#766b64]">Total POS</div><div className="font-display mt-1 text-3xl font-semibold text-[#070b21]">{totalPos}</div></div>
            <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4"><div className="text-sm text-[#766b64]">Extra POS pricing</div><div className="font-display mt-1 text-3xl font-semibold text-[#070b21]">Rs {posMonthlyPrice}</div></div>
            <div className="rounded-[18px] border border-[#eadfd5] bg-[#f6eafa] p-4"><div className="text-sm text-[#766b64]">Monthly add-on</div><div className="font-display mt-1 text-3xl font-semibold text-[#7c3fe0]">Rs {monthlyPosAmount}</div></div>
          </div>
        </FormSection>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            <h2 className="font-display text-xl font-semibold text-[#070b21]">Franchise Setup Document</h2>
            <div className="mt-5 rounded-[18px] border border-[#eadfd5] bg-white/68 p-5">
              <div className="font-display text-2xl font-semibold text-[#070b21]">
                {franchise.franchiseName || "Franchise Name"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[#766b64]">
                {franchise.address || "Address"}, {franchise.city || "City"}, {franchise.state || "State"} {franchise.pincode || "Pincode"}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-[#8d827a]">Owner login</div>
                  <div className="mt-2 text-sm text-[#3b302d]">Email: {document.ownerEmail}</div>
                  <div className="text-sm text-[#3b302d]">Password: {document.ownerPassword}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-[#8d827a]">Agreement</div>
                  <div className="mt-2 text-sm text-[#3b302d]">Start: {franchise.agreementStartDate || "Not set"}</div>
                  <div className="text-sm text-[#3b302d]">End: {franchise.agreementEndDate || "Not set"}</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="text-xs font-semibold uppercase text-[#8d827a]">POS login keys</div>
                <div className="mt-2 text-sm text-[#3b302d]">PIN: {document.posPin}</div>
                <div className="mt-2 grid gap-2">
                  {document.posKeys.map((key) => (
                    <div key={key} className="rounded-[12px] border border-[#eadfd5] bg-[#fffaf3] px-3 py-2 text-sm font-semibold text-[#5f554f]">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <div className="text-xs font-semibold uppercase text-[#8d827a]">Billing</div>
                <div className="mt-2 text-sm text-[#3b302d]">
                  Default POS: {pos.defaultPermanentPos}, Extra POS: {pos.extraPermanentPos}, Extra POS monthly amount: Rs {monthlyPosAmount}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[20px] border border-[#eadfd5] bg-white/72 p-4 shadow-[0_12px_34px_rgba(76,54,35,0.05)] backdrop-blur-xl">
            <h2 className="font-display text-xl font-semibold text-[#070b21]">Review</h2>
            <div className="mt-4 space-y-3 text-sm text-[#766b64]">
              <div className="flex justify-between gap-4"><span>Outlets</span><strong>{outlets.length}</strong></div>
              <div className="flex justify-between gap-4"><span>Total POS</span><strong>{totalPos}</strong></div>
              <div className="flex justify-between gap-4"><span>Extra POS billing</span><strong>Rs {monthlyPosAmount}/month</strong></div>
              <div className="flex justify-between gap-4"><span>Owner</span><strong>{franchise.contactPersonName || "Not set"}</strong></div>
            </div>
            <button className="btn-primary mt-6 w-full" type="button" disabled={loading} onClick={createFranchiseSetup}>
              {loading ? "Creating..." : "Create Franchise Setup"}
            </button>
            <button className="btn-secondary mt-3 w-full" type="button" onClick={downloadDocument}>
              Download Document
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex justify-between gap-3">
        <button className="btn-secondary" type="button" disabled={step === 0} onClick={previousStep}>
          Back
        </button>
        {step < steps.length - 1 ? (
          <button className="btn-primary" type="button" onClick={nextStep}>
            Continue
          </button>
        ) : null}
      </div>

      <ResultDialog
        open={dialogOpen}
        title={dialog.title}
        message={dialog.message}
        tone={dialog.error ? "error" : "success"}
        onPrimary={() => setDialogOpen(false)}
      />
    </>
  );
}
