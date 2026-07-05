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
const empty: FormData = { fullName: "", position: "", salary: 0, kpi: 80, status: "Faol", phone: "", email: "", telegramLogin: "", telegramPassword: "" };

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

  const save = () => {
    if (!form.fullName || !form.position) return toast.error("Ism va lavozimni to'ldiring");
    if (editing) { updateEmployee(editing.id, form); toast.success("Xodim yangilandi"); }
    else { addEmployee(form); toast.success("Yangi xodim qo'shildi"); }
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
                <th className="text-left font-medium py-3 px-3">Maosh</th>
                <th className="text-left font-medium py-3 px-3">KPI</th>
                <th className="text-left font-medium py-3 px-3">Holat</th>
                <th className="text-right font-medium py-3 px-5">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Xodim topilmadi</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={e.avatarInitials} />
                      <div>
                        <div className="font-semibold">{e.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.email} · TG: {e.telegramLogin || "-"} {e.telegramChatId ? "· ulangan" : "· ulanmagan"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">{e.position}</td>
                  <td className="py-3 px-3 font-medium">{formatUZS(e.salary)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary" style={{ width: `${e.kpi}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{e.kpi}%</span>
                    </div>
                  </td>
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
            <div className="space-y-1.5"><Label>Lavozim</Label><Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Maosh</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label>KPI (%)</Label><Input type="number" value={form.kpi} onChange={e => setForm({ ...form, kpi: +e.target.value })} /></div>
            </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="text-xs text-muted-foreground">KPI</div>
                    <div className="font-display text-2xl font-bold text-primary">{detail.kpi}%</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="text-xs text-muted-foreground">Maosh</div>
                    <div className="font-display text-lg font-bold">{formatUZS(detail.salary)}</div>
                  </div>
                </div>
                <div className="rounded-xl bg-accent/40 border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Telegram bot uchun login-parol</div>
                  <div className="font-mono text-sm font-semibold">/login {detail.telegramLogin} {detail.telegramPassword}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Holat: {detail.telegramChatId ? `ulangan (${detail.telegramChatId})` : "hali ulanmagan"}
                  </div>
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
