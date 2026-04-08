"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { QrCode, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type QrCartScannerProps = {
  onDetected: (decodedText: string) => void;
  onError?: (message: string) => void;
};

type ScannerStatus = "idle" | "starting" | "ready" | "error";

async function stopScannerInstance(
  scanner: { clear: () => void; isScanning: boolean; stop: () => Promise<void> } | null,
) {
  if (!scanner) {
    return;
  }

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // Ignora falhas de cleanup do scanner.
  }

  try {
    scanner.clear();
  } catch {
    // Ignora falhas ao limpar a UI interna do scanner.
  }
}

export function QrCartScanner({
  onDetected,
  onError,
}: QrCartScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState(
    "Aponte a câmera para o QR Code do produto.",
  );
  const scannerRef = useRef<{
    clear: () => void;
    isScanning: boolean;
    stop: () => Promise<void>;
  } | null>(null);
  const hasHandledScanRef = useRef(false);
  const scannerId = useId().replace(/:/g, "");

  const handleDetected = useEffectEvent((decodedText: string) => {
    if (hasHandledScanRef.current) {
      return;
    }

    hasHandledScanRef.current = true;
    setMessage("Código lido. Processando o produto...");
    onDetected(decodedText);
    setIsOpen(false);
  });

  useEffect(() => {
    if (!isOpen) {
      hasHandledScanRef.current = false;
      setStatus("idle");
      setMessage("Aponte a câmera para o QR Code do produto.");
      return;
    }

    let isCancelled = false;

    async function startScanner() {
      setStatus("starting");
      setMessage("Iniciando a câmera...");

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (isCancelled) {
          return;
        }

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            aspectRatio: 1,
            fps: 10,
            qrbox: { height: 220, width: 220 },
          },
          (decodedText) => handleDetected(decodedText),
          () => {
            // Ignora erros de frames sem código durante a leitura contínua.
          },
        );

        if (isCancelled) {
          await stopScannerInstance(scanner);
          return;
        }

        setStatus("ready");
        setMessage("Aponte para o QR Code até o produto ser reconhecido.");
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? `Não foi possível abrir a câmera: ${error.message}`
            : "Não foi possível abrir a câmera para leitura.";

        setStatus("error");
        setMessage(nextMessage);
        onError?.(nextMessage);
      }
    }

    void startScanner();

    return () => {
      isCancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      void stopScannerInstance(scanner);
    };
  }, [isOpen, onError, scannerId]);

  return (
    <>
      <div className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">Leitura</span>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-2xl border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-emerald-100/30 text-emerald-900 shadow-[0_4px_12px_rgba(16,185,129,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:from-emerald-100/90 hover:to-emerald-100/55"
          onClick={() => setIsOpen(true)}
        >
          <QrCode className="size-4" />
          Ler código QR
        </Button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[rgba(28,18,22,0.94)] p-4 text-white shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Leitor de código QR</h3>
                <p className="text-sm text-white/70">{message}</p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/60">
              <div
                id={scannerId}
                className="min-h-[320px] w-full [&>div]:overflow-hidden [&_video]:h-[320px] [&_video]:w-full [&_video]:object-cover"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                {status === "starting"
                  ? "Abrindo câmera"
                  : status === "ready"
                    ? "Leitura ativa"
                    : status === "error"
                      ? "Falha na leitura"
                      : "Aguardando"}
              </p>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setIsOpen(false)}
              >
                Fechar leitor
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
