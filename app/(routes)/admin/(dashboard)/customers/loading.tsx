export default function CustomersLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
      <div
        className="w-10 h-10 rounded-full border-2 border-stone-600 border-t-brand-red animate-spin"
        aria-hidden
      />
      <p className="text-stone-400 text-sm font-medium">Loading customers…</p>
    </div>
  );
}
