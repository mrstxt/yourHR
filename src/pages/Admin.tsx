import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Building2, Copy, Headset, Power, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CompanyAccount, TicketStatus } from "@/types/hr";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
}

function previewCompanyUsername(form: { name: string; username: string }, companies: CompanyAccount[]) {
  const base = slugify(form.username.trim() || form.name.trim());
  if (!base) return "";

  let username = base;
  let index = 2;
  while (companies.some((company) => company.username === username)) {
    username = `${base}-${index}`;
    index += 1;
  }
  return username;
}

export default function Admin() {
  const {
    adminCredentials,
    companies,
    createCompany,
    updateAdminCredentials,
    updateCompanyStatus,
    resetDemoData,
    logout,
  } = useAuth();
  const { employees, tickets, updateTicket } = useHR();
  const [form, setForm] = useState({ name: "", contactName: "", contactInfo: "", username: "", password: "" });
  const [adminForm, setAdminForm] = useState({ username: adminCredentials.username, password: "", confirmPassword: "" });
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState("");
  const [supportStatus, setSupportStatus] = useState<TicketStatus>("Jarayonda");

  useEffect(() => {
    setAdminForm((prev) => ({ ...prev, username: adminCredentials.username }));
  }, [adminCredentials.username]);

  const stats = useMemo(() => ({
    companies: companies.length,
    active: companies.filter((company) => company.status === "active").length,
    employees: employees.length,
    openTickets: tickets.filter((ticket) => ticket.status !== "Hal qilindi").length,
  }), [companies, employees.length, tickets]);

  const previewUsername = useMemo(() => previewCompanyUsername(form, companies), [companies, form]);
  const lastCreatedCompany = companies.find((company) => company.id === lastCreatedId);
  const hrPanelLink = previewUsername
    ? `${window.location.origin}/hr/${previewUsername}/login`
    : lastCreatedCompany
      ? `${window.location.origin}/hr/${lastCreatedCompany.username}/login`
      : `${window.location.origin}/hr/login`;
  const hrPanelLinkLabel = previewUsername
    ? "Kompaniyaga mos HR panel linki"
    : lastCreatedCompany
      ? "Oxirgi yaratilgan HR panel linki"
      : "Umumiy HR panel linki";
  const companyPanelLink = (company: typeof companies[number]) => `${window.location.origin}/hr/${company.username}/login`;

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

  const saveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const username = adminForm.username.trim();

    if (!username || !adminForm.password || !adminForm.confirmPassword) {
      toast.error("Super admin login va yangi parolni kiriting");
      return;
    }

    if (adminForm.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error("Parol tasdiqlash maydoni mos kelmadi");
      return;
    }

    updateAdminCredentials({ username, password: adminForm.password });
    setAdminForm({ username, password: "", confirmPassword: "" });
    toast.success("Super admin login-paroli yangilandi");
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const copyCredentials = (company: typeof companies[number]) => {
    copy(`Panel: ${companyPanelLink(company)}\nLogin: ${company.username}\nParol: ${company.password}`);
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
            <Button variant="outline" onClick={() => window.location.assign("/login")}>Admin login</Button>
            <Button variant="outline" onClick={logout}>Chiqish</Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
        {stats.openTickets > 0 && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-warning" />
              <div>
                <div className="font-semibold">Yangi support bildirishnomalari</div>
                <div className="text-sm text-muted-foreground">
                  {stats.openTickets} ta support so'rovi super admin javobini kutmoqda.
                </div>
              </div>
            </div>
            <Button className="sm:ml-auto bg-gradient-primary text-white" onClick={() => document.getElementById("admin-support")?.scrollIntoView({ behavior: "smooth" })}>
              Supportni ko'rish
            </Button>
          </div>
        )}

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
          <div className="space-y-5">
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
                {hrPanelLinkLabel}: <b className="text-foreground break-all">{hrPanelLink}</b>
              </div>
            </form>

            <form onSubmit={saveAdminCredentials} className="card-elevated p-5 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">Super admin kirish sozlamalari</h2>
                <p className="text-sm text-muted-foreground">Admin panelga kirish login va parolini shu yerdan yangilang.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Super admin login</Label>
                <Input
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Yangi parol</Label>
                  <Input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Parolni tasdiqlash</Label>
                  <Input
                    type="password"
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" className="w-full">Super adminni yangilash</Button>
            </form>
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Kompaniyalar</h2>
                <p className="text-sm text-muted-foreground">Bu yerda yaratilgan loginlar HR panelga kirish uchun ishlaydi.</p>
              </div>
              <Button variant="outline" onClick={resetDemoData}>Kompaniyalarni 0 qilish</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium p-4">Kompaniya</th>
                    <th className="text-left font-medium p-4">Login</th>
                    <th className="text-left font-medium p-4">HR link</th>
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
                      <td className="p-4 font-mono text-xs">{companyPanelLink(company)}</td>
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

        <div id="admin-support" className="card-elevated p-5">
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
