"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";

import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { cn } from "@/lib/utils";

const modalViewportPaddingStyle = {
  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
  paddingTop: "max(0.75rem, env(safe-area-inset-top))",
};

type ImageLightboxProps = {
  alt: string;
  children: ReactNode;
  imageUrl: string | null;
  triggerClassName?: string;
};

export function ImageLightbox({
  alt,
  children,
  imageUrl,
  triggerClassName,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modalContent =
    isOpen && imageUrl ? (
      <div
        className="fixed inset-0 z-[110] overflow-y-auto bg-zinc-950/82 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="flex min-h-dvh items-center justify-center px-3 py-3 sm:p-4"
          style={modalViewportPaddingStyle}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Fechar imagem"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950/72 text-white shadow-lg transition hover:bg-zinc-950/88"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </button>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950/92 shadow-2xl">
              <img
                src={imageUrl}
                alt={alt}
                className="mx-auto h-auto max-h-[85dvh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    ) : null;

  if (!imageUrl) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Visualizar imagem de ${alt}`}
        className={cn(
          "block cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left",
          triggerClassName,
        )}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </button>

      {modalContent && typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
