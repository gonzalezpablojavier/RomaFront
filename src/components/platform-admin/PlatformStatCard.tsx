import { LucideIcon } from 'lucide-react';

type PlatformStatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass: string;
};

export function PlatformStatCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: PlatformStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
