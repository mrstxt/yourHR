import { useState } from "react";
import { useHR } from "@/context/HRContext";
import { TicketStatusBadge } from "@/components/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export default function Support() {
  const { tickets, addTicket } = useHR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "IT", employeeName: "" });

  const save = () => {
    if (!form.title || !form.description) return toast.error("Sarlavha va tavsif kerak");
    addTicket(form);
    toast.success("Ticket yaratildi");
    setDrawerOpen(false);
    setForm({ title: "", description: "", category: "IT", employeeName: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Jami: <b className="text-foreground">{tickets.length}</b> ticket</div>
        <Button onClick={() => setDrawerOpen(true)} className="bg-gradient-primary text-white shadow-glow"><Plus className="h-4 w-4 mr-2" /> Supportga yozish</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.length === 0 && <div className="col-span-full text-center py-16 text-muted-foreground">Ticket yo'q</div>}
        {tickets.map(t => (
          <div key={t.id} className="card-elevated p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-display font-bold">{t.title}</div>
              <TicketStatusBadge status={t.status} />
            </div>
            <div className="text-xs text-muted-foreground">{t.employeeName} · {t.category} · {formatDate(t.createdAt)}</div>
            <p className="text-sm">{t.description}</p>
            {t.reply ? (
              <div className="rounded-lg bg-accent/50 border border-border p-3 text-sm">
                <div className="text-xs font-semibold mb-1">yourHR support javobi:</div>{t.reply}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
                Support jamoasi javobi kutilmoqda.
              </div>
            )}
          </div>
        ))}
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Yangi ticket</SheetTitle>
            <SheetDescription>Yordam so'rovini yarating</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5"><Label>Sarlavha</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Tavsif</Label><Textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Toifa</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Xodim</Label><Input value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})} /></div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Bekor</Button>
            <Button onClick={save} className="bg-gradient-primary text-white">Yaratish</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
