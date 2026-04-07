import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-[0_30px_80px_-48px_rgba(90,24,57,0.6)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {badge ? (
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-700">
              {badge}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            {description}
          </p>
        </div>

        {actions ? <div className="w-full lg:max-w-md">{actions}</div> : null}
      </div>
    </section>
  );
}
