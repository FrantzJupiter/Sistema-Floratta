"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";

const MAX_CLIENT_IMAGE_BYTES = 900 * 1024;
const INITIAL_MAX_IMAGE_DIMENSION = 1280;
const MIN_IMAGE_DIMENSION = 480;
const IMAGE_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{errors[0]}</p>;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.round(size / 1024)} KB`;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem selecionada."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível otimizar a imagem."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function optimizeImageForUpload(file: File) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return {
      file: null,
      error: "Não foi possível preparar a imagem para upload.",
    } as const;
  }

  const cropSize = Math.min(image.width, image.height);
  const sourceX = Math.max(0, Math.floor((image.width - cropSize) / 2));
  const sourceY = Math.max(0, Math.floor((image.height - cropSize) / 2));
  const startingDimension = Math.min(cropSize, INITIAL_MAX_IMAGE_DIMENSION);
  const minDimension = Math.min(MIN_IMAGE_DIMENSION, startingDimension);
  let maxDimension = startingDimension;
  let bestBlob: Blob | null = null;

  while (maxDimension >= minDimension) {
    const targetDimension = Math.max(1, Math.round(maxDimension));

    canvas.width = targetDimension;
    canvas.height = targetDimension;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetDimension, targetDimension);
    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      targetDimension,
      targetDimension,
    );

    for (const quality of IMAGE_QUALITY_STEPS) {
      const candidateBlob = await canvasToBlob(canvas, quality);

      if (!bestBlob || candidateBlob.size < bestBlob.size) {
        bestBlob = candidateBlob;
      }

      if (candidateBlob.size <= MAX_CLIENT_IMAGE_BYTES) {
        const optimizedFile = new File(
          [candidateBlob],
          `${file.name.replace(/\.[^.]+$/, "")}.jpg`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          },
        );

        return {
          file: optimizedFile,
          error: null,
        } as const;
      }
    }

    if (maxDimension === minDimension) {
      break;
    }

    maxDimension = Math.round(maxDimension * 0.82);

    if (maxDimension < minDimension) {
      maxDimension = minDimension;
    }
  }

  if (!bestBlob) {
    return {
      file: null,
      error: "Não foi possível otimizar a imagem para upload.",
    } as const;
  }

  return {
    file: null,
    error: `Não foi possível reduzir a imagem para menos de ${formatFileSize(MAX_CLIENT_IMAGE_BYTES)}.`,
  } as const;
}

type ProductImageFieldsProps = {
  defaultImageUrl?: string | null;
  imageUrlErrors?: string[];
  imageFileErrors?: string[];
  imageCameraErrors?: string[];
  onProcessingChange?: (processing: boolean) => void;
  showImageUrlField?: boolean;
};

export function ProductImageFields({
  defaultImageUrl = "",
  imageUrlErrors,
  imageFileErrors,
  imageCameraErrors,
  onProcessingChange,
  showImageUrlField = true,
}: ProductImageFieldsProps) {
  const [imageUrl, setImageUrl] = useState(defaultImageUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<"arquivo" | "camera" | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [clientImageMessage, setClientImageMessage] = useState("");
  const [clientImageError, setClientImageError] = useState("");
  const fileInputId = useId();
  const cameraInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onProcessingChange?.(isOptimizing);
  }, [isOptimizing, onProcessingChange]);

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    source: "arquivo" | "camera",
  ) {
    const originalFile = event.target.files?.[0] ?? null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (source === "arquivo" && cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (source === "camera" && fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (!originalFile) {
      setSelectedFile(null);
      setSelectedSource(null);
      setFilePreviewUrl(null);
      setClientImageError("");
      setClientImageMessage("");
      return;
    }

    setIsOptimizing(true);
    setClientImageError("");
    setClientImageMessage(
      "Recortando no centro e reduzindo a imagem para ficar abaixo de 1 MB...",
    );

    try {
      const optimizedResult = await optimizeImageForUpload(originalFile);

      if (optimizedResult.error || !optimizedResult.file) {
        setSelectedFile(null);
        setSelectedSource(null);
        setFilePreviewUrl(null);
        setClientImageMessage("");
        setClientImageError(
          optimizedResult.error ?? "Não foi possível otimizar a imagem selecionada.",
        );

        if (event.target) {
          event.target.value = "";
        }

        return;
      }

      const targetInput =
        source === "arquivo" ? fileInputRef.current : cameraInputRef.current;

      if (targetInput) {
        const transfer = new DataTransfer();
        transfer.items.add(optimizedResult.file);
        targetInput.files = transfer.files;
      }

      setSelectedFile(optimizedResult.file);
      setSelectedSource(source);
      previewUrlRef.current = URL.createObjectURL(optimizedResult.file);
      setFilePreviewUrl(previewUrlRef.current);
      setClientImageMessage(
        `Imagem quadrada pronta para upload em ${formatFileSize(optimizedResult.file.size)}.`,
      );
      setClientImageError("");
    } catch {
      setSelectedFile(null);
      setSelectedSource(null);
      setFilePreviewUrl(null);
      setClientImageMessage("");
      setClientImageError("Não foi possível otimizar a imagem selecionada.");

      if (event.target) {
        event.target.value = "";
      }
    } finally {
      setIsOptimizing(false);
    }
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setSelectedSource(null);
    setFilePreviewUrl(null);
    setClientImageMessage("");
    setClientImageError("");

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  const activePreviewUrl = filePreviewUrl ?? imageUrl.trim();

  return (
    <section className="grid gap-4 rounded-[1.5rem] border border-white/50 bg-white/50 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-900">Imagem do produto</h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-[148px_minmax(0,1fr)]">
        <div className="mx-auto aspect-square w-full max-w-36 overflow-hidden rounded-[1.35rem] border border-white/60 bg-white/80 shadow-card-down">
          {activePreviewUrl ? (
            <img
              src={activePreviewUrl}
              alt="Pré-visualização do produto"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-4 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Sem imagem
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {showImageUrlField ? (
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">URL da imagem</span>
              <input
                name="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
              <FieldError errors={imageUrlErrors} />
            </label>
          ) : (
            <input name="imageUrl" type="hidden" value="" />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Selecionar arquivo</span>
              <input
                ref={fileInputRef}
                id={fileInputId}
                name="imageFile"
                type="file"
                accept="image/*"
                onChange={(event) => handleFileSelection(event, "arquivo")}
                className="block h-11 w-full rounded-2xl border border-white/45 bg-white/75 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose-900"
              />
              <FieldError errors={imageFileErrors} />
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Usar câmera</span>
              <input
                ref={cameraInputRef}
                id={cameraInputId}
                name="imageCamera"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => handleFileSelection(event, "camera")}
                className="block h-11 w-full rounded-2xl border border-white/45 bg-white/75 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose-900"
              />
              <FieldError errors={imageCameraErrors} />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-zinc-500">
              {isOptimizing
                ? "A imagem está sendo recortada no centro e reduzida para manter o upload abaixo de 1 MB."
                : selectedFile
                  ? `Imagem vinda de ${selectedSource === "camera" ? "câmera" : "arquivo"} selecionada. Ela será usada no lugar da URL.`
                  : showImageUrlField
                    ? "Você pode usar uma URL, escolher um arquivo do dispositivo ou tirar uma foto no celular."
                    : "Escolha um arquivo do dispositivo ou tire uma foto no celular."}
            </p>

            {selectedFile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2 text-xs text-rose-900 hover:bg-rose-100"
                onClick={clearSelectedFile}
              >
                Limpar seleção
              </Button>
            ) : null}
          </div>

          <div aria-live="polite" className="min-h-5 text-xs">
            {clientImageError ? (
              <p className="text-rose-600">{clientImageError}</p>
            ) : clientImageMessage ? (
              <p className="text-zinc-600">{clientImageMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
