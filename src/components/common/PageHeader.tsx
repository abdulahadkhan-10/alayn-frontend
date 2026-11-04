import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small status pill shown beside the title */
  badge?: ReactNode;
  /** Buttons, filters or tabs shown on the right; they wrap below the title on narrow screens */
  actions?: ReactNode;
  className?: string;
};

/** Shared page header used across the management pages, matching Overview and Reports. */
export default function PageHeader({ title, subtitle, badge, actions, className = "" }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ${className}`}
    >
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
