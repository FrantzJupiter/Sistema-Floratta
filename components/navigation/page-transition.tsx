"use client";

import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div className="route-transition-shell">
      <div key={pathname} className="route-transition-content flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
