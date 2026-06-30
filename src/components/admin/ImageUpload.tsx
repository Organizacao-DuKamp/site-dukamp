import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function uploadOne(file: File, folder?: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const base = `${crypto.randomUUID()}.${ext}`;
  const path = folder ? `${folder.replace(/^\/+|\/+$/g, "")}/${base}` : base;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from("media")
    .createSignedUrl(path, TEN_YEARS);
  if (sErr || !data) throw sErr ?? new Error("Falha ao gerar URL");
  return data.signedUrl;
}

export function ImageUpload({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (v: string) => void;
  folder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true);
    try {
      const url = await uploadOne(files[0], folder);
      onChange(url);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar imagem");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-24 object-cover rounded border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          {value ? "Trocar imagem" : "Enviar imagem"}
        </Button>
      </div>
    </div>
  );
}

export function ImageListUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadOne(f));
      onChange([...(value ?? []), ...urls]);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar imagem");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  function removeAt(i: number) {
    const next = [...(value ?? [])];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {value?.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="h-20 w-20 object-cover rounded border" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Adicionar imagens
        </Button>
      </div>
    </div>
  );
}
