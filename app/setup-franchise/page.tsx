"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection } from "@/components/form-section";
import { ResultDialog } from "@/components/result-dialog";
import { CountryCodePicker } from "@/components/country-code-picker";
import { DeliverySlabsEditor } from "@/components/delivery-slabs-editor";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";

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
  deliveryKmPricing?: Array<{ km: number | string; price: number | string }>;
  onlineOrdering: boolean;
  copyMenuFromOutletId?: string;
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
  delivery: true,
  deliveryKmPricing: [
    { km: 2, price: 30 },
    { km: 3, price: 45 },
    { km: 5, price: 70 },
  ],
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
  id,
  label,
  value,
  type = "text",
  required,
  error,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label flex items-center gap-1">
        <span>{label}</span>
        {required ? <span className="text-sm font-bold text-red-500">*</span> : null}
      </label>
      <input
        id={id}
        className={`form-input transition ${
          error
            ? "!border-red-500 !bg-red-50/50 !text-red-900 focus:!border-red-600 focus:!ring-2 focus:!ring-red-500/20"
            : ""
        }`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  required,
  error,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label flex items-center gap-1">
        <span>{label}</span>
        {required ? <span className="text-sm font-bold text-red-500">*</span> : null}
      </label>
      <select
        id={id}
        className={`form-input cursor-pointer bg-white transition ${
          error
            ? "!border-red-500 !bg-red-50/50 !text-red-900 focus:!border-red-600 focus:!ring-2 focus:!ring-red-500/20"
            : ""
        }`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function PhoneField({
  id,
  label,
  value,
  countryCode = "+91",
  required,
  error,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  countryCode?: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="form-label flex items-center gap-1">
        <span>{label}</span>
        {required ? <span className="text-sm font-bold text-red-500">*</span> : null}
      </label>
      <div className="flex items-center gap-2.5">
        <CountryCodePicker value={countryCode} />
        <input
          id={id}
          className={`form-input transition min-w-0 flex-1 ${
            error
              ? "!border-red-500 !bg-red-50/50 !text-red-900 focus:!border-red-600 focus:!ring-2 focus:!ring-red-500/20"
              : ""
          }`}
          type="tel"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="99999 99999"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    title: "Setup document created",
    message: "The franchise setup document is ready.",
    error: false,
  });
  const [setupResponse, setSetupResponse] = useState<SetupResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);

  const [franchise, setFranchise] = useState({
    franchiseName: "",
    contactPersonName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Gujarat",
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
  const [outlets, setOutlets] = useState<OutletDraft[]>([
    { ...emptyOutlet, state: "Gujarat", city: "Surat" },
  ]);
  const [pos, setPos] = useState({
    defaultPermanentPos: 1,
    extraPermanentPos: 0,
    extraPosMonthlyPrice: 1000,
    billingCycle: "Monthly",
  });

  const totalPos = pos.defaultPermanentPos + pos.extraPermanentPos;
  const monthlyPosAmount = pos.extraPermanentPos * pos.extraPosMonthlyPrice;

  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  const franchiseCityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === franchise.state);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: franchise.city || "Custom", value: franchise.city }];
  }, [franchise.state, franchise.city]);

  function getOutletCityOptions(stateName: string, currentCity: string) {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === stateName);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: currentCity || "Custom", value: currentCity }];
  }

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
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function updateOutlet(index: number, key: keyof OutletDraft, value: any) {
    setOutlets((current) =>
      current.map((outlet, outletIndex) =>
        outletIndex === index ? { ...outlet, [key]: value } : outlet,
      ),
    );
    const fieldId = `outlet_${index}_${key}`;
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function addOutlet() {
    setOutlets((current) => [
      ...current,
      { ...emptyOutlet, state: franchise.state || "Gujarat", city: franchise.city || "Surat" },
    ]);
  }

  function removeOutlet(index: number) {
    setOutlets((current) => current.filter((_, outletIndex) => outletIndex !== index));
  }

  function validateCurrentStep(stepToValidate: number): boolean {
    const newErrors: Record<string, string> = {};
    let firstFailedFieldId = "";

    if (stepToValidate === 0) {
      if (!franchise.franchiseName.trim()) {
        newErrors["franchiseName"] = "Franchise Name is required";
        if (!firstFailedFieldId) firstFailedFieldId = "franchiseName";
      }
      if (!franchise.contactPersonName.trim()) {
        newErrors["contactPersonName"] = "Contact Person Name is required";
        if (!firstFailedFieldId) firstFailedFieldId = "contactPersonName";
      }
      if (!franchise.email.trim()) {
        newErrors["email"] = "Email address is required";
        if (!firstFailedFieldId) firstFailedFieldId = "email";
      } else if (!franchise.email.includes("@")) {
        newErrors["email"] = "Please enter a valid email address";
        if (!firstFailedFieldId) firstFailedFieldId = "email";
      }
      if (!franchise.phone.trim()) {
        newErrors["phone"] = "Phone number is required";
        if (!firstFailedFieldId) firstFailedFieldId = "phone";
      }
      if (!franchise.address.trim()) {
        newErrors["address"] = "Address is required";
        if (!firstFailedFieldId) firstFailedFieldId = "address";
      }
      if (!franchise.state.trim()) {
        newErrors["state"] = "State is required";
        if (!firstFailedFieldId) firstFailedFieldId = "state";
      }
      if (!franchise.city.trim()) {
        newErrors["city"] = "City is required";
        if (!firstFailedFieldId) firstFailedFieldId = "city";
      }
      if (!franchise.pincode.trim()) {
        newErrors["pincode"] = "Pincode is required";
        if (!firstFailedFieldId) firstFailedFieldId = "pincode";
      }
    }

    if (stepToValidate === 1) {
      if (outlets.length === 0) {
        setDialog({ title: "Validation Error", message: "At least one outlet is required.", error: true });
        setDialogOpen(true);
        return false;
      }
      for (let i = 0; i < outlets.length; i++) {
        if (!outlets[i].name.trim()) {
          const fieldId = `outlet_${i}_name`;
          newErrors[fieldId] = "Outlet Name is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].code.trim()) {
          const fieldId = `outlet_${i}_code`;
          newErrors[fieldId] = "Outlet Code is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].phone.trim()) {
          const fieldId = `outlet_${i}_phone`;
          newErrors[fieldId] = "Phone number is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].address.trim()) {
          const fieldId = `outlet_${i}_address`;
          newErrors[fieldId] = "Address is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].state.trim()) {
          const fieldId = `outlet_${i}_state`;
          newErrors[fieldId] = "State is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].city.trim()) {
          const fieldId = `outlet_${i}_city`;
          newErrors[fieldId] = "City is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
        if (!outlets[i].pincode.trim()) {
          const fieldId = `outlet_${i}_pincode`;
          newErrors[fieldId] = "Pincode is required";
          if (!firstFailedFieldId) firstFailedFieldId = fieldId;
        }
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));

    if (firstFailedFieldId) {
      setFocusedFieldId(firstFailedFieldId);
      const firstErrorMsg = newErrors[firstFailedFieldId];
      setDialog({ title: "Validation Error", message: firstErrorMsg, error: true });
      setDialogOpen(true);
      return false;
    }

    return true;
  }

  function goToStep(targetStep: number) {
    if (targetStep > step) {
      for (let s = step; s < targetStep; s++) {
        if (!validateCurrentStep(s)) return;
      }
    }
    setStep(targetStep);
  }

  function nextStep() {
    if (!validateCurrentStep(step)) return;
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
    if (!validateCurrentStep(0)) {
      setStep(0);
      return;
    }
    if (!validateCurrentStep(1)) {
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<SetupResponse>("/franchise-setups", {
        method: "POST",
        body: setupPayload(),
      });

      if (response.outlets && response.outlets.length > 0) {
        for (let i = 0; i < response.outlets.length; i++) {
          const createdOutlet = response.outlets[i];
          const draftOutlet = outlets[i];
          if (draftOutlet && draftOutlet.copyMenuFromOutletId) {
            try {
              await apiRequest(`/outlets/${createdOutlet.id}/copy-menu-from/${draftOutlet.copyMenuFromOutletId}`, {
                method: "POST",
              });
            } catch {
              // Copy menu fallback
            }
          }
        }
      }

      setSetupResponse(response);
      setDialog({
        title: "Franchise setup created",
        message:
          "Franchise, owner login, outlets and POS devices were created successfully.",
        error: false,
      });
      setDialogOpen(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Request failed";
      if (errMsg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
        setFocusedFieldId("email");
        setStep(0);
      } else if (errMsg.toLowerCase().includes("phone")) {
        setErrors((prev) => ({ ...prev, phone: errMsg }));
        setFocusedFieldId("phone");
        setStep(0);
      }
      setDialog({
        title: "Could not create setup",
        message: errMsg,
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
              onClick={() => goToStep(index)}
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
          <TextField id="franchiseName" label="Franchise Name" required error={errors.franchiseName} value={franchise.franchiseName} onChange={(value) => updateFranchise("franchiseName", value)} />
          <TextField id="contactPersonName" label="Contact Person Name" required error={errors.contactPersonName} value={franchise.contactPersonName} onChange={(value) => updateFranchise("contactPersonName", value)} />
          <TextField id="email" label="Email" type="email" required error={errors.email} value={franchise.email} onChange={(value) => updateFranchise("email", value)} />
          <PhoneField id="phone" label="Phone Number" required error={errors.phone} value={franchise.phone} onChange={(value) => updateFranchise("phone", value)} />
          <TextField id="address" label="Address" required error={errors.address} value={franchise.address} onChange={(value) => updateFranchise("address", value)} />
          <SelectField id="state" label="State" required error={errors.state} value={franchise.state} options={stateOptions} onChange={(value) => updateFranchise("state", value)} />
          <SelectField id="city" label="City" required error={errors.city} value={franchise.city} options={franchiseCityOptions} onChange={(value) => updateFranchise("city", value)} />
          <TextField id="pincode" label="Pincode" required error={errors.pincode} value={franchise.pincode} onChange={(value) => updateFranchise("pincode", value)} />
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
                <TextField id={`outlet_${index}_name`} label="Outlet Name" required error={errors[`outlet_${index}_name`]} value={outlet.name} onChange={(value) => updateOutlet(index, "name", value)} />
                <TextField id={`outlet_${index}_code`} label="Outlet Code" required error={errors[`outlet_${index}_code`]} value={outlet.code} onChange={(value) => updateOutlet(index, "code", value)} />
                <TextField id={`outlet_${index}_contactName`} label="Contact Person" value={outlet.contactName} onChange={(value) => updateOutlet(index, "contactName", value)} />
                <PhoneField id={`outlet_${index}_phone`} label="Phone" required error={errors[`outlet_${index}_phone`]} value={outlet.phone} onChange={(value) => updateOutlet(index, "phone", value)} />
                <TextField id={`outlet_${index}_email`} label="Email" value={outlet.email} onChange={(value) => updateOutlet(index, "email", value)} />
                <TextField id={`outlet_${index}_address`} label="Address" required error={errors[`outlet_${index}_address`]} value={outlet.address} onChange={(value) => updateOutlet(index, "address", value)} />
                <SelectField id={`outlet_${index}_state`} label="State" required error={errors[`outlet_${index}_state`]} value={outlet.state} options={stateOptions} onChange={(value) => updateOutlet(index, "state", value)} />
                <SelectField id={`outlet_${index}_city`} label="City" required error={errors[`outlet_${index}_city`]} value={outlet.city} options={getOutletCityOptions(outlet.state, outlet.city)} onChange={(value) => updateOutlet(index, "city", value)} />
                <TextField id={`outlet_${index}_pincode`} label="Pincode" required error={errors[`outlet_${index}_pincode`]} value={outlet.pincode} onChange={(value) => updateOutlet(index, "pincode", value)} />
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

              <div className="mt-4">
                <DeliverySlabsEditor
                  slabs={outlet.deliveryKmPricing || []}
                  onChange={(slabs) => updateOutlet(index, "deliveryKmPricing", slabs)}
                />
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
              One permanent POS is included by default. Extra POS monthly pricing can be customized for this setup.
            </p>
          </div>
          <TextField label="Default Permanent POS" type="number" value={String(pos.defaultPermanentPos)} onChange={(value) => setPos((current) => ({ ...current, defaultPermanentPos: Number(value) || 1 }))} />
          <TextField label="Extra Permanent POS" type="number" value={String(pos.extraPermanentPos)} onChange={(value) => setPos((current) => ({ ...current, extraPermanentPos: Math.max(0, Number(value) || 0) }))} />
          <TextField label="Extra POS Price (Rs/month)" type="number" value={String(pos.extraPosMonthlyPrice)} onChange={(value) => setPos((current) => ({ ...current, extraPosMonthlyPrice: Math.max(0, Number(value) || 0) }))} />
          <label>
            <span className="form-label">Billing Cycle</span>
            <select className="form-input cursor-pointer bg-white" value={pos.billingCycle} onChange={(event) => setPos((current) => ({ ...current, billingCycle: event.target.value }))}>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </label>
          <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
            <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4"><div className="text-sm text-[#766b64]">Total POS</div><div className="font-display mt-1 text-3xl font-semibold text-[#070b21]">{totalPos}</div></div>
            <div className="rounded-[18px] border border-[#eadfd5] bg-white/62 p-4"><div className="text-sm text-[#766b64]">Extra POS price</div><div className="font-display mt-1 text-3xl font-semibold text-[#070b21]">Rs {pos.extraPosMonthlyPrice}</div></div>
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
        onPrimary={() => {
          setDialogOpen(false);
          if (!dialog.error && setupResponse) {
            router.push("/franchises");
          } else if (focusedFieldId) {
            setTimeout(() => {
              const elem = window.document.getElementById(focusedFieldId);
              if (elem) {
                elem.focus();
                if ("select" in elem && typeof (elem as HTMLInputElement).select === "function") {
                  (elem as HTMLInputElement).select();
                }
                elem.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 150);
          }
        }}
      />
    </>
  );
}
