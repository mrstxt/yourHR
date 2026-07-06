import { useState, useMemo } from "react";
import { useHR } from "@/context/HRContext";
import { Employee, EmployeeStatus } from "@/types/hr";
import { AvatarBubble } from "@/components/AvatarBubble";
import { EmployeeStatusBadge } from "@/components/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Download } from "lucide-react";
import { formatUZS } from "@/lib/format";
import { toast } from "sonner";

type FormData = Omit<Employee, "id" | "avatarInitials">;
const empty: FormData = {
  fullName: "",
  position: "",
  salary: 0,
  kpi: 0,
  compensationType: "bonus",
  salesKpiPercent: 0,
  monthlySalesAmount: 0,
  monthlyBonus: 0,
  status: "Faol",
  phone: "",
  email: "",
  address: "",
  education: "",
  cardNumber: "",
  telegramLogin: "",
  telegramPassword: "",
};

function isSalesPosition(position: string) {
  const normalized = position.toLowerCase();
  return normalized.includes("sotuv") || normalized.includes("sales");
}

export default function Employees() {
  const { employees, tasks, reports, attendance, addEmployee, updateEmployee, deleteEmployee } = useHR();
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const positions = useMemo(() => Array.from(new Set(employees.map(e => e.position))), [employees]);

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) &&
    (positionFilter === "all" || e.position === positionFilter) &&
    (statusFilter === "all" || e.status === statusFilter)
  );

  const openAdd = () => { setEditing(null); setForm(empty); setDrawerOpen(true); };
  const openEdit = (e: Employee) => { setEditing(e); const { id, avatarInitials, ...rest } = e; setForm(rest); setDrawerOpen(true); };
  const salesEmployee = form.compensationType === "sales" || isSalesPosition(form.position);
  const effectiveCompensationType = salesEmployee ? "sales" : "bonus";

  const save = () => {
    if (!form.fullName || !form.position) return toast.error("Ism va lavozimni to'ldiring");
    const payload = {
      ...form,
      compensationType: effectiveCompensationType,
      kpi: effectiveCompensationType === "sales" ? Number(form.salesKpiPercent || 0) : 0,
      salesKpiPercent: effectiveCompensationType === "sales" ? Number(form.salesKpiPercent || 0) : 0,
      monthlySalesAmount: effectiveCompensationType === "sales" ? Number(form.monthlySalesAmount || 0) : 0,
      monthlyBonus: effectiveCompensationType === "bonus" ? Number(form.monthlyBonus || 0) : 0,
    } satisfies FormData;
    if (editing) { updateEmployee(editing.id, payload); toast.success("Xodim yangilandi"); }
    else { addEmployee(payload); toast.success("Yangi xodim qo'shildi"); }
    setDrawerOpen(false);
  };

  const remove = () => {
    if (!deleteId) return;
    deleteEmployee(deleteId);
    toast.success("Xodim o'chirildi");
    setDeleteId(null);
  };

  const detail = employees.find(e => e.id === detailId);
  const detailTasks = detail ? tasks.filter(t => t.employeeId === detail.id) : [];
  const detailReports = detail ? reports.filter(r => r.employeeId === detail.id) : [];
  const detailAttendance = detail ? attendance.filter(a => a.employeeId === detail.id) : [];

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "employees.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Xodimlar eksport qilindi");
  };

  return (
    <div className="space-y-5">
      <div className="card-elevated p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Xodim ismi bo'yicha qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Lavozim" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha lavozimlar</SelectItem>
            {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Holat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="Faol">Faol</SelectItem>
            <SelectItem value="Ta'tilda">Ta'tilda</SelectItem>
            <SelectItem value="Ishdan bo'shatilgan">Ishdan bo'shatilgan</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 md:ml-auto">
          <Button variant="outline" onClick={exportJSON}><Download className="h-4 w-4 mr-2" /> Eksport</Button>
          <Button onClick={openAdd} className="bg-gradient-primary text-white shadow-glow"><Plus className="h-4 w-4 mr-2" /> Xodim qo'shish</Button>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-3 px-5">Xodim</th>
                <th className="text-left font-medium py-3 px-3">Lavozim</th>
                <th className="text-left font-medium py-3 px-3">Holat</th>
                <th className="text-right font-medium py-3 px-5">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Xodim topilmadi</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={e.avatarInitials} />
                      <div>
                        <div className="font-semibold">{e.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.phone || "-"} · {e.email || "-"} · TG: {e.telegramLogin || "-"} {e.telegramChatId ? "· ulangan" : "· ulanmagan"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">{e.position}</td>
                  <td className="py-3 px-3"><EmployeeStatusBadge status={e.status} /></td>
                  <td className="py-3 px-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailId(e.id)}><Eye className="h-4 w-4 mr-2" /> Ko'rish</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(e)}><Pencil className="h-4 w-4 mr-2" /> Tahrirlash</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(e.id)} className="text-danger focus:text-danger"><Trash2 className="h-4 w-4 mr-2" /> O'chirish</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Xodimni tahrirlash" : "Yangi xodim"}</SheetTitle>
            <SheetDescription>Xodim ma'lumotlarini kiriting</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5"><Label>To'liq ism</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Lavozim</Label>
              <Input
                value={form.position}
                onChange={e => {
                  const position = e.target.value;
                  setForm({ ...form, position, compensationType: isSalesPosition(position) ? "sales" : "bonus" });
                }}
                placeholder="Masalan: Sotuv menejeri"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hisob turi</Label>
              <Select value={effectiveCompensationType} onValueChange={(v: "sales" | "bonus") => setForm({ ...form, compensationType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus">Oy oxiri bonus</SelectItem>
                  <SelectItem value="sales">Sotuv KPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Maosh</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: +e.target.value })} /></div>
              {effectiveCompensationType === "sales" ? (
                <div className="space-y-1.5"><Label>Sotuvdan KPI (%)</Label><Input type="number" value={form.salesKpiPercent ?? 0} onChange={e => setForm({ ...form, salesKpiPercent: +e.target.value })} /></div>
              ) : (
                <div className="space-y-1.5"><Label>Oy oxiri bonus</Label><Input type="number" value={form.monthlyBonus ?? 0} onChange={e => setForm({ ...form, monthlyBonus: +e.target.value })} /></div>
              )}
            </div>
            {effectiveCompensationType === "sales" && (
              <div className="space-y-1.5">
                <Label>Bu oy sotuv summasi</Label>
                <Input type="number" value={form.monthlySalesAmount ?? 0} onChange={e => setForm({ ...form, monthlySalesAmount: +e.target.value })} />
                <p className="text-xs text-muted-foreground">KPI summasi sotuv summasi × foiz asosida hisoblanadi.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select value={form.status} onValueChange={(v: EmployeeStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Faol">Faol</SelectItem>
                  <SelectItem value="Ta'tilda">Ta'tilda</SelectItem>
                  <SelectItem value="Ishdan bo'shatilgan">Ishdan bo'shatilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Manzil</Label><Input value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Qayerda o'qigan</Label><Input value={form.education ?? ""} onChange={e => setForm({ ...form, education: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Karta raqami</Label><Input value={form.cardNumber ?? ""} onChange={e => setForm({ ...form, cardNumber: e.target.value })} placeholder="8600 0000 0000 0000" /></div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold">Telegram bot login</div>
                <p className="text-xs text-muted-foreground">Xodim botda /login login parol orqali kiradi.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Login</Label>
                  <Input value={form.telegramLogin ?? ""} onChange={e => setForm({ ...form, telegramLogin: e.target.value })} placeholder="auto" />
                </div>
                <div className="space-y-1.5">
                  <Label>Parol</Label>
                  <Input value={form.telegramPassword ?? ""} onChange={e => setForm({ ...form, telegramPassword: e.target.value })} placeholder="auto" />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Bekor qilish</Button>
            <Button onClick={save} className="bg-gradient-primary text-white">Saqlash</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detail drawer */}
      <Sheet open={!!detailId} onOpenChange={o => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4 mb-2">
                  <AvatarBubble initials={detail.avatarInitials} size="lg" />
                  <div>
                    <SheetTitle className="text-xl">{detail.fullName}</SheetTitle>
                    <SheetDescription>{detail.position} · {detail.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-5 py-6">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="font-semibold mb-3 text-sm">Xodim ma'lumotlari</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">To'liq ism familya</div>
                      <div className="font-medium">{detail.fullName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Lavozim</div>
                      <div className="font-medium">{detail.position}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Telefon</div>
                      <div className="font-medium">{detail.phone || "Kiritilmagan"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{detail.email || "Kiritilmagan"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Manzil</div>
                      <div className="font-medium">{detail.address || "Kiritilmagan"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Qayerda o'qigan</div>
                      <div className="font-medium">{detail.education || "Kiritilmagan"}</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
                    <div className="text-xs text-muted-foreground mb-1">CV / Resume</div>
                    {detail.cvFileId ? (
                      <a
                        href={`/api/telegram/file/${encodeURIComponent(detail.cvFileId)}?name=${encodeURIComponent(detail.cvFileName || "resume")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                      >
                        <Download className="h-4 w-4 mr-2" /> {detail.cvFileName || "CV/resume"}
                      </a>
                    ) : (
                      <div className="text-sm text-muted-foreground">Bot orqali hali CV yuklanmagan</div>
                    )}
                    {detail.cvUploadedAt && <div className="text-[11px] text-muted-foreground mt-1">Yuklangan: {detail.cvUploadedAt}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="text-xs text-muted-foreground">Rag'bat turi</div>
                    <div className="font-display text-lg font-bold text-primary">
                      {(detail.compensationType === "sales" || isSalesPosition(detail.position)) ? "Sotuv KPI" : "Oy oxiri bonus"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="text-xs text-muted-foreground">Maosh</div>
                    <div className="font-display text-lg font-bold">{formatUZS(detail.salary)}</div>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  {(detail.compensationType === "sales" || isSalesPosition(detail.position)) ? (
                    <>
                      <div className="text-xs text-muted-foreground">Sotuv hisob-kitobi</div>
                      <div className="font-semibold">{formatUZS(detail.monthlySalesAmount ?? 0)} × {detail.salesKpiPercent ?? detail.kpi ?? 0}%</div>
                      <div className="text-sm text-success mt-1">
                        KPI: {formatUZS(Math.round((detail.monthlySalesAmount ?? 0) * ((detail.salesKpiPercent ?? detail.kpi ?? 0) / 100)))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-muted-foreground">Oy oxiri rag'batlantirish</div>
                      <div className="font-semibold">{formatUZS(detail.monthlyBonus ?? 0)}</div>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-accent/40 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Telegram bot uchun login-parol</div>
                  <div className="font-mono text-sm font-semibold">/login {detail.telegramLogin} {detail.telegramPassword}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Holat: {detail.telegramChatId ? `ulangan (${detail.telegramChatId})` : "hali ulanmagan"}
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="text-xs text-muted-foreground">Oylik kartasi</div>
                  <div className="font-mono text-sm font-semibold">{detail.cardNumber || "Kiritilmagan"}</div>
                </div>
                <div>
                  <div className="font-semibold mb-2 text-sm">Vazifalar ({detailTasks.length})</div>
                  <div className="space-y-2">
                    {detailTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.status}</div>
                      </div>
                    ))}
                    {detailTasks.length === 0 && <div className="text-xs text-muted-foreground">Vazifa yo'q</div>}
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-2 text-sm">Hisobotlar ({detailReports.length})</div>
                  {detailReports.slice(0, 2).map(r => (
                    <div key={r.id} className="rounded-lg border border-border p-3 text-sm mb-2">
                      <div className="text-xs text-muted-foreground mb-1">{r.date}</div>
                      <div>{r.content}</div>
                    </div>
                  ))}
                  {detailReports.length === 0 && <div className="text-xs text-muted-foreground">Hisobot yo'q</div>}
                </div>
                <div>
                  <div className="font-semibold mb-2 text-sm">Davomat ({detailAttendance.length})</div>
                  {detailAttendance.slice(0, 3).map(a => (
                    <div key={a.id} className="flex justify-between text-sm py-1">
                      <span>{a.date}</span>
                      <span className="font-mono text-xs">{a.checkIn} — {a.checkOut}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xodimni o'chirmoqchimisiz?</AlertDialogTitle>
            <AlertDialogDescription>Bu amalni bekor qilib bo'lmaydi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-danger text-white hover:bg-danger/90">O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
