import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, Copy, Headset, Power, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CompanyAccount, TicketStatus } from "@/types/hr";

const emptyCompanyForm = {
  name: "",
  contactName: "",
  contactInfo: "",
  username: "",
  password: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
}

function makePreviewUsername(form: typeof emptyCompanyForm, companies: CompanyAccount[]) {
  const base = slugify(form.username || form.name);
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

  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [adminForm, setAdminForm] = useState({
    username: adminCredentials.username,
    password: "",
    confirmPassword: "",
  });
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("Jarayonda");

  useEffect(() => {
    setAdminForm((form) => ({ ...form, username: adminCredentials.username }));
  }, [adminCredentials.username]);

  const stats = useMemo(() => {
    const openTickets = tickets.filter((ticket) => ticket.status !== "Hal qilindi").length;
    const activeCompanies = companies.filter((company) => company.status === "active").length;

    return [
      { label: "Kompaniyalar", value: companies.length, icon: Building2 },
      { label: "Faol kompaniyalar", value: activeCompanies, icon: ShieldCheck },
      { label: "HR xodimlari", value: employees.length, icon: Users },
      { label: "Ochiq support", value: openTickets, icon: Headset },
    ];
  }, [companies, employees.length, tickets]);

  const openTicketCount = stats[3].value;
  const previewUsername = useMemo(() => makePreviewUsername(companyForm, companies), [companyForm, companies]);
  const lastCreatedCompany = companies.find((company) => company.id === lastCreatedId);
  const panelUsername = previewUsername || lastCreatedCompany?.username || "";
  const panelLink = panelUsername ? `${window.location.origin}/hr/${panelUsername}/login` : `${window.location.origin}/hr/login`;

  const companyLink = (company: CompanyAccount) => `${window.location.origin}/hr/${company.username}/login`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Nusxalandi");
  };

  const saveCompany = (event: React.FormEvent) => {
    event.preventDefault();

    if (!companyForm.name || !companyForm.contactName || !companyForm.contactInfo) {
      toast.error("Kompaniya nomi, HR va kontakt majburiy");
      return;
    }

    const company = createCompany(companyForm);
    setLastCreatedId(company.id);
    setCompanyForm(emptyCompanyForm);
    toast.success(`${company.name} uchun login-parol yaratildi`);
  };

  const saveAdmin = (event: React.FormEvent) => {
    event.preventDefault();

    if (!adminForm.username || !adminForm.password || !adminForm.confirmPassword) {
      toast.error("Login va parolni to'ldiring");
      return;
    }

    if (adminForm.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error("Parollar mos kelmadi");
      return;
    }

    updateAdminCredentials({ username: adminForm.username.trim(), password: adminForm.password });
    setAdminForm({ username: adminForm.username.trim(), password: "", confirmPassword: "" });
    toast.success("Super admin login-paroli yangilandi");
  };

  const copyCompanyLogin = (company: CompanyAccount) => {
    copy(`Panel: ${companyLink(company)}\nLogin: ${company.username}\nParol: ${company.password}`);
  };

  const openTicket = (ticketId: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;

    setActiveTicketId(ticket.id);
    setReply(ticket.reply || "");
    setTicketStatus(ticket.status === "Ochiq" ? "Jarayonda" : ticket.status);
  };

  const sendReply = () => {
    if (!activeTicketId || !reply.trim()) {
      toast.error("Javob matnini yozing");
      return;
    }

    updateTicket(activeTicketId, { reply: reply.trim(), status: ticketStatus });
    setActiveTicketId(null);
    setReply("");
    toast.success("Support javobi yuborildi");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold leading-tight">MIZAAM Super Admin</div>
              <div className="truncate text-xs text-muted-foreground">Kompaniyalar va HR loginlarini boshqarish</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.assign("/login")}>Admin login</Button>
            <Button variant="outline" onClick={logout}>Chiqish</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
        {openTicketCount > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
            <Bell className="h-5 w-5 text-warning" />
            <div>
              <div className="font-semibold">Yangi support bildirishnomalari</div>
              <div className="text-sm text-muted-foreground">{openTicketCount} ta support so'rovi javob kutmoqda.</div>
            </div>
            <Button className="bg-gradient-primary text-white sm:ml-auto" onClick={() => document.getElementById("support")?.scrollIntoView({ behavior: "smooth" })}>
              Supportni ko'rish
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="kpi-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                    <div className="mt-2 font-display text-3xl font-bold">{stat.value}</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-md">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <div className="space-y-5">
            <form onSubmit={saveCompany} className="card-elevated space-y-4 p-5">
              <div>
                <h2 className="font-display text-xl font-bold">Kompaniya qo'shish</h2>
                <p className="text-sm text-muted-foreground">Saqlangandan keyin HR uchun login-parol chiqadi.</p>
              </div>

              <Field label="Kompaniya nomi">
                <Input value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} placeholder="Masalan: Najot Ta'lim" />
              </Field>
              <Field label="Mas'ul HR">
                <Input value={companyForm.contactName} onChange={(event) => setCompanyForm({ ...companyForm, contactName: event.target.value })} placeholder="F.I.O" />
              </Field>
              <Field label="Telefon yoki email">
                <Input value={companyForm.contactInfo} onChange={(event) => setCompanyForm({ ...companyForm, contactInfo: event.target.value })} placeholder="+998..." />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Login">
                  <Input value={companyForm.username} onChange={(event) => setCompanyForm({ ...companyForm, username: event.target.value })} placeholder="auto" />
                </Field>
                <Field label="Parol">
                  <Input value={companyForm.password} onChange={(event) => setCompanyForm({ ...companyForm, password: event.target.value })} placeholder="auto" />
                </Field>
              </div>

              <Button className="w-full bg-gradient-primary text-white shadow-glow">Login-parol yaratish</Button>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                HR panel linki: <b className="break-all text-foreground">{panelLink}</b>
              </div>
            </form>

            <form onSubmit={saveAdmin} className="card-elevated space-y-4 p-5">
              <div>
                <h2 className="font-display text-xl font-bold">Super admin sozlamalari</h2>
                <p className="text-sm text-muted-foreground">Admin panel login-parolini yangilang.</p>
              </div>

              <Field label="Login">
                <Input value={adminForm.username} onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })} autoComplete="username" />
              </Field>
              <Field label="Yangi parol">
                <Input type="password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} autoComplete="new-password" />
              </Field>
              <Field label="Parolni tasdiqlash">
                <Input type="password" value={adminForm.confirmPassword} onChange={(event) => setAdminForm({ ...adminForm, confirmPassword: event.target.value })} autoComplete="new-password" />
              </Field>

              <Button type="submit" variant="outline" className="w-full">Super adminni yangilash</Button>
            </form>
          </div>

          <section className="card-elevated overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="font-display text-xl font-bold">Kompaniyalar</h2>
                <p className="text-sm text-muted-foreground">HR panelga kirish loginlari.</p>
              </div>
              <Button variant="outline" onClick={resetDemoData}>Kompaniyalarni 0 qilish</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-4 text-left font-medium">Kompaniya</th>
                    <th className="p-4 text-left font-medium">Login</th>
                    <th className="p-4 text-left font-medium">Parol</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className={`border-b border-border last:border-0 ${lastCreatedId === company.id ? "bg-accent/40" : ""}`}>
                      <td className="p-4">
                        <div className="font-semibold">{company.name}</div>
                        <div className="text-xs text-muted-foreground">{company.contactName} · {company.contactInfo}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{companyLink(company)}</div>
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
                          <Button size="icon" variant="outline" title="Nusxalash" onClick={() => copyCompanyLogin(company)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Status" onClick={() => updateCompanyStatus(company.id, company.status === "active" ? "suspended" : "active")}>
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section id="support" className="card-elevated p-5">
          <h2 className="mb-3 font-display text-xl font-bold">Support nazorati</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{ticket.title}</div>
                  <Badge variant="outline">{ticket.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ticket.description}</p>
                {ticket.reply && <div className="mt-3 rounded-lg border border-border bg-accent/50 p-2 text-xs">{ticket.reply}</div>}
                <Button size="sm" variant="outline" className="mt-3" onClick={() => openTicket(ticket.id)}>
                  Javob berish
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {activeTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="card-elevated w-full max-w-lg space-y-4 p-5">
            <div>
              <h2 className="font-display text-xl font-bold">Supportga javob</h2>
              <p className="text-sm text-muted-foreground">Javob HR panelida ko'rinadi.</p>
            </div>

            <Field label="Status">
              <select
                value={ticketStatus}
                onChange={(event) => setTicketStatus(event.target.value as TicketStatus)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Jarayonda">Jarayonda</option>
                <option value="Hal qilindi">Hal qilindi</option>
                <option value="Ochiq">Ochiq</option>
              </select>
            </Field>

            <Field label="Javob">
              <Textarea rows={5} value={reply} onChange={(event) => setReply(event.target.value)} />
            </Field>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveTicketId(null)}>Bekor</Button>
              <Button className="bg-gradient-primary text-white" onClick={sendReply}>Yuborish</Button>
            </div>
          </div>
        </div>
      )}
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
