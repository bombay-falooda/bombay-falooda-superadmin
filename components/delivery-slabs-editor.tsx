"use client";

export type DeliverySlab = {
  km: number | string;
  price: number | string;
};

export function DeliverySlabsEditor({
  slabs = [],
  onChange,
}: {
  slabs: DeliverySlab[];
  onChange: (slabs: DeliverySlab[]) => void;
}) {
  function handleAddSlab() {
    const lastKm = slabs.length > 0 ? Number(slabs[slabs.length - 1].km) || 0 : 0;
    const nextKm = lastKm + 2;
    const nextPrice = (slabs.length + 1) * 20 + 10;
    onChange([...slabs, { km: nextKm, price: nextPrice }]);
  }

  function handleUpdateSlab(index: number, field: "km" | "price", value: string) {
    const updated = [...slabs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function handleRemoveSlab(index: number) {
    onChange(slabs.filter((_, idx) => idx !== index));
  }

  function handlePresetDefaultSlabs() {
    onChange([
      { km: 2, price: 30 },
      { km: 3, price: 45 },
      { km: 5, price: 70 },
    ]);
  }

  return (
    <div className="rounded-[18px] border border-[#eadfd5] bg-[#fffaf4] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eadfd5]/60 pb-2.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#3b302d]">
            Delivery Pricing Slabs
          </h4>
          <p className="text-xs text-[#766b64] mt-0.5">
            Configure delivery distance charges (e.g. 2 km = ₹30, 3 km = ₹45, 5 km = ₹70)
          </p>
        </div>

        {slabs.length === 0 && (
          <button
            type="button"
            onClick={handlePresetDefaultSlabs}
            className="text-xs font-bold text-[#7c3fe0] hover:underline"
          >
            + Load Default Slabs (2km/₹30, 3km/₹45, 5km/₹70)
          </button>
        )}
      </div>

      {slabs.length === 0 ? (
        <div className="py-4 text-center text-xs text-[#8d827a] italic">
          No delivery pricing slabs added yet. Click "+ Add KM Price" below to add distance charges.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-[11px] font-bold uppercase tracking-wider text-[#8d827a] px-1">
            <span>Up to Distance (KM)</span>
            <span>Delivery Price (INR)</span>
            <span className="w-16 text-right">Action</span>
          </div>

          {slabs.map((slab, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 2"
                  value={slab.km}
                  onChange={(e) => handleUpdateSlab(index, "km", e.target.value)}
                  className="w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-2 text-xs font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-[#8d827a]">KM</span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-[#8d827a]">INR</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 30"
                  value={slab.price}
                  onChange={(e) => handleUpdateSlab(index, "price", e.target.value)}
                  className="w-full rounded-xl border border-[#eadfd5] bg-white pl-10 pr-3 py-2 text-xs font-mono text-[#070b21] focus:border-[#7c3fe0] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveSlab(index)}
                className="w-16 rounded-xl border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-[#eadfd5]/60 flex justify-between items-center">
        <button
          type="button"
          onClick={handleAddSlab}
          className="btn-secondary h-8 px-3 text-xs font-bold text-[#7c3fe0] border-[#7c3fe0]/30 hover:bg-purple-50 inline-flex items-center gap-1.5"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Add KM Price</span>
        </button>
      </div>
    </div>
  );
}
