import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useHR } from "@/context/HRContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUZS } from "@/lib/format";
import { LeadStage, LostReason, LeadSource } from "@/types/hr";
import { cn } from "@/lib/utils";

const stages: LeadStage[] = ["Yangi lid", "Bog'lanildi", "Qiziqish bildirdi", "Taklif yuborildi", "Muzokara", "G'olib", "Yo'qotilgan"];
const sources: LeadSource[] = ["Telegram", "Sayt forma", "Qo'lda", "WhatsApp", "Instagram", "Facebook"];
const lostReasons: LostReason[] = ["Narx", "Vaqt", "Ishonchsizlik", "Mahsulot mos kelmadi", "Raqobatchi"];

const emptyForm = {
  name: "",
  phone: "",
  source: "Telegram" as LeadSource,
  ownerId: "",
  stage: "Yangi lid" as LeadStage,
  value: 0,
  slaHours: 24,
  note: "",
};

function daysSince(date: string) {
  const start = new Date(date).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.floor((Date.now() - start) / 86400000);
}

function isSlaBroken(lastContactAt: string, slaHours: number) {
  const start = new Date(lastContactAt).getTime();
  if (Number.isNaN(start)) return false;
  return Date.now() - start > slaHours * 60 * 60 * 1000;
}

export default function CRM() {
  const { employees, leads, addLead, updateLeadStage, addLeadNote } = useHR();
  const [form, setForm] = useState(emptyForm);
  const [lostReasonByLead, setLostReasonByLead] = useState<Record<string, LostReason>>({});
  const [noteByLead, setNoteByLead] = useState<Record<string, string>>({});

  const salesEmployees = employees.filter((employee) => employee.status === "Faol");

  const stats = useMemo(() => {
    const openLeads = leads.filter((lead) => !["G'olib", "Yo'qotilgan"].includes(lead.stage));
    const wonLeads = leads.filter((lead) => lead.stage === "G'olib");
    const brokenSla = openLeads.filter((lead) => isSlaBroken(lead.lastContactAt, lead.slaHours));
    const conversion = leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0;

    return [
      { label: "Ochiq lidlar", value: openLeads.length, icon: BriefcaseBusiness, tone: "text-primary" },
      { label: "SLA buzilgan", value: brokenSla.length, icon: AlertTriangle, tone: "text-warning" },
      { label: "G'olib bitimlar", value: wonLeads.length, icon: CheckCircle2, tone: "text-success" },
      { label: "Konversiya", value: `${conversion}%`, icon: UserCheck, tone: "text-info" },
    ];
  }, [leads]);

  const wonTotal = leads.filter((lead) => lead.stage === "G'olib").reduce((sum, lead) => sum + lead.value, 0);

  const saveLead = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.ownerId) {
      toast.error("Lid nomi, telefon va mas'ul xodim majburiy");
      return;
    }

    const owner = employees.find((employee) => employee.id === form.ownerId);
    const result = addLead({ ...form, ownerName: owner?.fullName || "" });
    toast[result.ok ? "success" : "error"](result.message);
    if (result.ok) setForm(emptyForm);
  };

  const moveLead = (leadId: string, stage: LeadStage) => {
    const lostReason = stage === "Yo'qotilgan" ? lostReasonByLead[leadId] : undefined;
    const result = updateLeadStage(leadId, stage, { lostReason, note: `Bosqich: ${stage}` });
    toast[result.ok ? "success" : "error"](result.message);
  };

  const saveNote = (leadId: string) => {
    addLeadNote(leadId, noteByLead[leadId] || "");
    setNoteByLead((prev) => ({ ...prev, [leadId]: "" }));
    toast.success("Izoh qo'shildi");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="kpi-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  <div className={cn("mt-2 font-display text-3xl font-bold", stat.tone)}>{stat.value}</div>
                </div>
                <Icon className={cn("h-5 w-5", stat.tone)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={saveLead} className="card-elevated space-y-4 p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Yangi lid</h2>
            <p className="text-sm text-muted-foreground">Telefon bir xil bo'lsa, lid avtomatik birlashtiriladi.</p>
          </div>

          <Field label="Ism yoki kompaniya">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Masalan: Akfa Group" />
          </Field>
          <Field label="Telefon">
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+998..." />
          </Field>
          <Field label="Manba">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as LeadSource })}>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
          </Field>
          <Field label="Mas'ul xodim">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
              <option value="">Tanlang</option>
              {salesEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Summa">
              <Input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} />
            </Field>
            <Field label="SLA soat">
              <Input type="number" value={form.slaHours} onChange={(event) => setForm({ ...form, slaHours: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Izoh">
            <Textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={3} />
          </Field>
          <Button className="w-full bg-gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Lid qo'shish
          </Button>
        </form>

        <div className="space-y-4">
          <div className="card-elevated p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Sotuv voronkasi</h2>
                <p className="text-sm text-muted-foreground">Bu oy g'olib bitimlar summasi: {formatUZS(wonTotal)}</p>
              </div>
              <Badge variant="outline">Lid → g'olib nazorat</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {stages.map((stage) => (
              <section key={stage} className="card-elevated overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold">{stage}</h3>
                    <Badge variant="secondary">{leads.filter((lead) => lead.stage === stage).length}</Badge>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {leads.filter((lead) => lead.stage === stage).map((lead) => {
                    const slaBroken = !["G'olib", "Yo'qotilgan"].includes(lead.stage) && isSlaBroken(lead.lastContactAt, lead.slaHours);
                    return (
                      <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.phone} · {lead.source}</div>
                          </div>
                          {slaBroken && <Badge className="bg-warning text-white">SLA</Badge>}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Mas'ul: <b className="text-foreground">{lead.ownerName}</b></div>
                          <div>Summa: <b className="text-foreground">{formatUZS(lead.value)}</b></div>
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {daysSince(lead.lastContactAt)} kun oldin</div>
                          <div>SLA: {lead.slaHours} soat</div>
                        </div>
                        {lead.stage === "Yo'qotilgan" && lead.lostReason && (
                          <div className="mt-2 text-xs text-danger">Sabab: {lead.lostReason}</div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stages.map((nextStage) => (
                            <Button key={nextStage} size="sm" variant={nextStage === lead.stage ? "default" : "outline"} onClick={() => moveLead(lead.id, nextStage)}>
                              {nextStage}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px]">
                          <select
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                            value={lostReasonByLead[lead.id] || ""}
                            onChange={(event) => setLostReasonByLead((prev) => ({ ...prev, [lead.id]: event.target.value as LostReason }))}
                          >
                            <option value="">Yo'qotish sababi</option>
                            {lostReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                          </select>
                          <Input className="h-9 text-xs" value={noteByLead[lead.id] || ""} onChange={(event) => setNoteByLead((prev) => ({ ...prev, [lead.id]: event.target.value }))} placeholder="Izoh" />
                        </div>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => saveNote(lead.id)}>Izoh qo'shish</Button>
                        <div className="mt-3 space-y-1">
                          {lead.notes.slice(0, 3).map((note, index) => (
                            <div key={index} className="rounded-lg bg-muted/50 px-2 py-1 text-xs text-muted-foreground">{note}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
