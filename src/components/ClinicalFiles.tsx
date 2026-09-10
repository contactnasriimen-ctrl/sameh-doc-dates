import { useEffect, useRef, useState } from "react";
import { FileUp, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type FileRow = { id: string; file_name: string; file_path: string };

export function ClinicalFiles({
  appointmentId,
  fieldKey,
}: {
  appointmentId: string;
  fieldKey: string;
}) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("appointment_files")
      .select("id, file_name, file_path")
      .eq("appointment_id", appointmentId)
      .eq("field_key", fieldKey)
      .order("created_at", { ascending: false });
    setFiles((data as FileRow[] | null) ?? []);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, fieldKey]);

  const upload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }
    setBusy(true);
    try {
      const path = `${appointmentId}/${fieldKey}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await supabase.storage.from("clinical-files").upload(path, file, {
        contentType: "application/pdf",
      });
      if (up.error) throw up.error;
      const ins = await supabase.from("appointment_files").insert({
        appointment_id: appointmentId,
        field_key: fieldKey,
        file_name: file.name,
        file_path: path,
      });
      if (ins.error) throw ins.error;
      toast.success("PDF ajouté 📄");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'envoi");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const open = async (row: FileRow) => {
    const { data, error } = await supabase.storage
      .from("clinical-files")
      .createSignedUrl(row.file_path, 60 * 10);
    if (error || !data) {
      toast.error("Impossible d'ouvrir le PDF");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (row: FileRow) => {
    if (!window.confirm(`Supprimer « ${row.file_name} » ?`)) return;
    setBusy(true);
    await supabase.storage.from("clinical-files").remove([row.file_path]);
    await supabase.from("appointment_files").delete().eq("id", row.id);
    setBusy(false);
    toast.success("PDF supprimé");
    await load();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
          PDF
        </button>
        {files.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {files.length} document{files.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void open(f)}
            className="flex-1 min-w-0 text-left text-[11px] inline-flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 hover:text-primary"
          >
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{f.file_name}</span>
          </button>
          <button
            type="button"
            onClick={() => void remove(f)}
            className="w-6 h-6 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
            aria-label="Supprimer le PDF"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
