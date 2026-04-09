"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionToggleButtonProps = {
  ariaLabel: string;
  className?: string;
  isOpen: boolean;
  onClick: () => void;
};

export function SectionToggleButton({
  ariaLabel,
  className,
  isOpen,
  onClick,
}: SectionToggleButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 px-3 text-xs font-medium text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all hover:from-rose-100/90 hover:to-rose-100/50 sm:h-10 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm",
        className,
      )}
      onClick={onClick}
    >
      <span>Abrir</span>
      <ChevronDown
        className={cn("size-3.5 transition-transform duration-200 sm:size-4", isOpen && "rotate-180")}
      />
    </button>
  );
}
