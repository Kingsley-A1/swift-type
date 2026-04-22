interface AdminStatCardProps {
  label: string;
  value: string;
  hint: string;
}

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className="mt-2.5 text-2xl font-black tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-gray-400">{hint}</p>
    </div>
  );
}
