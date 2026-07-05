import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Copy, Headset, Power, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TicketStatus } from "@/types/hr";

export default function Admin() {
  const { companies, createCompany, updateCompanyStatus, resetDemoData, logout } = useAuth();
  const { employees, tickets, updateTicket } = useHR();
  const [form, setForm] = useState({ name: "", contactName: "", contactInfo: "", username: "", password: "" });
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState("");
  const [supportStatus, setSupportStatus] = useState<TicketStatus>("Jarayonda");

  const stats = useMemo(() => ({
    companies: companies.length,
    active: companies.filter((company) => company.status === "active").length,
    employees: employees.length,
    openTickets: tickets.filter((ticket) => ticket.status !== "Hal qilindi").length,
  }), [companies, employees.length, tickets]);

  const panelLink = `${window.location.origin}/login`;

  const saveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contactName || !form.contactInfo) {
      toast.error("Kompaniya nomi, HR va kontakt majburiy");
      return;
    }

    const company = createCompany(form);
    setLastCreatedId(company.id);
    setForm({ name: "", contactName: "", contactInfo: "", username: "", password: "" });
    toast.success(`${company.name} uchun login-parol yaratildi`);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const copyCredentials = (company: typeof companies[number]) => {
    copy(`Panel: ${panelLink}\nLogin: ${company.username}\nParol: ${company.password}`);
  };

  const openTicket = (ticketId: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;
    setActiveTicketId(ticketId);
    setSupportReply(ticket.reply || "");
    setSupportStatus(ticket.status === "Ochiq" ? "Jarayonda" : ticket.status);
  };

  const sendSupportReply = () => {
    if (!activeTicketId || !supportReply.trim()) {
      toast.error("Javob matnini yozing");
      return;
    }

    updateTicket(activeTicketId, { reply: supportReply.trim(), status: supportStatus });
    setActiveTicketId(null);
    setSupportReply("");
    toast.success("Support javobi yuborildi");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold leading-tight">yourHR Super Admin</div>
              <div className="text-xs text-muted-foreground truncate">Kompaniyalar va HR loginlarini boshqarish</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.assign("/login")}>Login sahifasi</Button>
            <Button variant="outline" onClick={logout}>Chiqish</Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Kompaniyalar", value: stats.companies, icon: Building2, tone: "from-indigo-500 to-blue-500" },
            { label: "Faol kompaniyalar", value: stats.active, icon: ShieldCheck, tone: "from-emerald-500 to-teal-500" },
            { label: "HR panel xodimlari", value: stats.employees, icon: Users, tone: "from-amber-500 to-orange-500" },
            { label: "Ochiq support", value: stats.openTickets, icon: Headset, tone: "from-rose-500 to-pink-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="kpi-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">{item.label}</div>
                    <div className="mt-2 font-display text-3xl font-bold">{item.value}</div>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md", item.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
          <form onSubmit={saveCompany} className="card-elevated p-5 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">Kompaniya qo'shish</h2>
              <p className="text-sm text-muted-foreground">Saqlangandan keyin HR uchun login-parol chiqadi.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Kompaniya nomi</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Najot Ta'lim" />
            </div>
            <div className="space-y-1.5">
              <Label>Mas'ul HR</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="F.I.O" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon yoki email</Label>
              <Input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="+998..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Login</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="auto" />
              </div>
              <div className="space-y-1.5">
                <Label>Parol</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="auto" />
              </div>
            </div>
            <Button className="w-full bg-gradient-primary text-white shadow-glow">Login-parol yaratish</Button>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              HR panel linki: <b className="text-foreground">{panelLink}</b>
            </div>
          </form>

          <div className="card-elevated overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Kompaniyalar</h2>
                <p className="text-sm text-muted-foreground">Bu yerda yaratilgan loginlar HR panelga kirish uchun ishlaydi.</p>
              </div>
              <Button variant="outline" onClick={resetDemoData}>Demo reset</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium p-4">Kompaniya</th>
                    <th className="text-left font-medium p-4">Login</th>
                    <th className="text-left font-medium p-4">Parol</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-right font-medium p-4">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className={cn("border-b border-border last:border-0", lastCreatedId === company.id && "bg-accent/40")}>
                      <td className="p-4">
                        <div className="font-semibold">{company.name}</div>
                        <div className="text-xs text-muted-foreground">{company.contactName} · {company.contactInfo}</div>
                      </td>
                      <td className="p-4 font-mono text-xs">{company.username}</td>
                      <td className="p-4 font-mono text-xs">{company.password}</td>
                      <td className="p-4">
                        <Badge variant={company.status === "active" ? "default" : "secondary"}>
                          {company.status === "active" ? "Faol" : "Bloklangan"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => copyCredentials(company)} title="Login-parolni nusxalash">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateCompanyStatus(company.id, company.status === "active" ? "suspended" : "active")}
                            title="Statusni o'zgartirish"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-display text-xl font-bold mb-3">Support nazorati</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{ticket.title}</div>
                  <Badge variant="outline">{ticket.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
                {ticket.reply && <div className="mt-3 text-xs rounded-lg bg-accent/50 border border-border p-2">{ticket.reply}</div>}
                <Button size="sm" variant="outline" className="mt-3" onClick={() => openTicket(ticket.id)}>
                  Javob berish
                </Button>
              </div>
            ))}
          </div>
        </div>

        {activeTicketId && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card-elevated w-full max-w-lg p-5 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">Supportga javob</h2>
                <p className="text-sm text-muted-foreground">Javob HR panelida ko'rinadi.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={supportStatus}
                  onChange={(e) => setSupportStatus(e.target.value as TicketStatus)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Jarayonda">Jarayonda</option>
                  <option value="Hal qilindi">Hal qilindi</option>
                  <option value="Ochiq">Ochiq</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Javob</Label>
                <Textarea rows={5} value={supportReply} onChange={(e) => setSupportReply(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTicketId(null)}>Bekor</Button>
                <Button className="bg-gradient-primary text-white" onClick={sendSupportReply}>Yuborish</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
