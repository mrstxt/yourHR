import { useState } from "react";
import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { ReportStatusBadge } from "@/components/StatusBadges";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CheckCircle2, XCircle, Download, Image as ImageIcon } from "lucide-react";
import { ReportStatus, DailyReport } from "@/types/hr";
import { toast } from "sonner";

const filters: { key: string; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "Kutilmoqda", label: "Kutilmoqda" },
  { key: "Tasdiqlangan", label: "Tasdiqlangan" },
  { key: "Rad etilgan", label: "Rad etilgan" },
];

export default function Reports() {
  const { reports, updateReportStatus } = useHR();
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState<DailyReport | null>(null);

  const list = filter === "all" ? reports : reports.filter(r => r.status === filter);

  const setStatus = (id: string, s: ReportStatus) => {
    updateReportStatus(id, s);
    toast.success(`Hisobot: ${s}`);
    setPreview(null);
  };

  const exportCSV = () => {
    const header = "id,employeeName,date,status,content\n";
    const rows = list.map(r => `${r.id},"${r.employeeName}",${r.date},${r.status},"${r.content.replace(/"/g,'""')}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "reports.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Hisobotlar eksport qilindi");
  };

  return (
    <div className="space-y-5">
      <div className="card-elevated p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {filters.map(f => <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Button variant="outline" className="sm:ml-auto" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> CSV eksport</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.length === 0 && <div className="col-span-full text-center py-16 text-muted-foreground">Hisobot topilmadi</div>}
        {list.map(r => (
          <button key={r.id} onClick={() => setPreview(r)} className="card-elevated p-4 text-left hover:shadow-floating transition">
            <div className="flex items-center gap-3 mb-3">
              <AvatarBubble initials={r.employeeName.split(" ").map(n=>n[0]).join("").slice(0,2)} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.employeeName}</div>
                <div className="text-xs text-muted-foreground">{r.date}</div>
              </div>
              <ReportStatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{r.content}</p>
            {!!r.attachments?.length && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> {r.attachments.length} ta rasm
              </div>
            )}
          </button>
        ))}
      </div>

      <Sheet open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {preview && (
            <>
              <SheetHeader>
                <SheetTitle>Hisobot</SheetTitle>
                <SheetDescription>{preview.employeeName} · {preview.date}</SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <ReportStatusBadge status={preview.status} />
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{preview.content}</p>
                {!!preview.attachments?.length && (
                  <div className="grid grid-cols-1 gap-3">
                    {preview.attachments.map((attachment) => (
                      <figure key={attachment.fileId} className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                        <img
                          src={`/api/telegram/photo/${encodeURIComponent(attachment.fileId)}`}
                          alt={attachment.caption || "Hisobot rasmi"}
                          className="w-full max-h-80 object-contain bg-background"
                        />
                        {attachment.caption && (
                          <figcaption className="px-3 py-2 text-xs text-muted-foreground">{attachment.caption}</figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStatus(preview.id, "Tasdiqlangan")} className="bg-success text-success-foreground hover:bg-success/90 flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Tasdiqlash
                </Button>
                <Button onClick={() => setStatus(preview.id, "Rad etilgan")} variant="outline" className="flex-1 text-danger border-danger/40">
                  <XCircle className="h-4 w-4 mr-2" /> Rad etish
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
