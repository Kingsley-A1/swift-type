interface AdminStatCardProps {
  label: string;
  value: string;
  hint: string;
}

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded-xl bg-white border border-[#ff6b35]/15 p-4">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          {label}
        </p>
      </div>
      <p className="mt-2.5 text-2xl font-black tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-gray-500">{hint}</p>
    </div>
  );
}
