"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{errors[0]}</p>;
}

type ProductImageFieldsProps = {
  defaultImageUrl?: string | null;
  imageUrlErrors?: string[];
  imageFileErrors?: string[];
  imageCameraErrors?: string[];
};

export function ProductImageFields({
  defaultImageUrl = "",
  imageUrlErrors,
  imageFileErrors,
  imageCameraErrors,
}: ProductImageFieldsProps) {
  const [imageUrl, setImageUrl] = useState(defaultImageUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<"arquivo" | "camera" | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
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

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    source: "arquivo" | "camera",
  ) {
    const nextFile = event.target.files?.[0] ?? null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(nextFile);
    setSelectedSource(nextFile ? source : null);

    if (nextFile) {
      previewUrlRef.current = URL.createObjectURL(nextFile);
      setFilePreviewUrl(previewUrlRef.current);
    } else {
      setFilePreviewUrl(null);
    }

    if (source === "arquivo" && cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (source === "camera" && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setSelectedSource(null);
    setFilePreviewUrl(null);

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
        <div className="overflow-hidden rounded-[1.35rem] border border-white/60 bg-white/80 shadow-card-down">
          {activePreviewUrl ? (
            <img
              src={activePreviewUrl}
              alt="Pre-visualizacao do produto"
              className="h-36 w-full object-cover"
            />
          ) : (
            <div className="flex h-36 items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-4 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Sem imagem
            </div>
          )}
        </div>

        <div className="grid gap-4">
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
              <span className="font-medium">Usar camera</span>
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
              {selectedFile
                ? `Imagem vinda de ${selectedSource === "camera" ? "camera" : "arquivo"} selecionada. Ela sera usada no lugar da URL.`
                : "Voce pode usar uma URL, escolher um arquivo do dispositivo ou tirar uma foto no celular."}
            </p>

            {selectedFile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2 text-xs text-rose-900 hover:bg-rose-100"
                onClick={clearSelectedFile}
              >
                Limpar selecao
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
