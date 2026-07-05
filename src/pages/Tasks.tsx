import { useState } from "react";
import { useHR } from "@/context/HRContext";
import { Task, TaskPriority, TaskStatus } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PriorityBadge, TaskStatusBadge } from "@/components/StatusBadges";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Plus, LayoutGrid, List, CheckCircle2, XCircle, Play, AlertOctagon } from "lucide-react";
import { formatDate, formatUZS, isOverdue } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { localDate } from "@/lib/datetime";

const statuses: TaskStatus[] = ["Kutilmoqda", "Tasdiqlangan", "Bajarilmoqda", "Bajarildi", "Rad etildi"];

export default function Tasks() {
  const { tasks, employees, addTask, updateTaskStatus } = useHR();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [form, setForm] = useState({ title: "", description: "", employeeId: "", status: "Kutilmoqda" as TaskStatus, priority: "O'rta" as TaskPriority, deadline: localDate(), bonusAmount: 300000 });

  const save = () => {
    if (!form.title || !form.employeeId) return toast.error("Sarlavha va xodimni tanlang");
    addTask(form);
    toast.success("Yangi vazifa qo'shildi");
    setDrawerOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

  const changeStatus = (t: Task, s: TaskStatus) => {
    updateTaskStatus(t.id, s);
    toast.success(`"${t.title}" — ${s}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="table"><List className="h-4 w-4 mr-2" /> Jadval</TabsTrigger>
            <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4 mr-2" /> Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setDrawerOpen(true)} className="sm:ml-auto bg-gradient-primary text-white shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Vazifa qo'shish
        </Button>
      </div>

      {view === "table" ? (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium py-3 px-5">Vazifa</th>
                  <th className="text-left font-medium py-3 px-3">Xodim</th>
                  <th className="text-left font-medium py-3 px-3">Muddat</th>
                  <th className="text-left font-medium py-3 px-3">Bonus</th>
                  <th className="text-left font-medium py-3 px-3">Muhimlik</th>
                  <th className="text-left font-medium py-3 px-3">Holat</th>
                  <th className="text-right font-medium py-3 px-5">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => {
                  const overdue = isOverdue(t.deadline) && t.status !== "Bajarildi";
                  return (
                    <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                      <td className="py-3 px-5">
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <AvatarBubble initials={t.employeeName.split(" ").map(n=>n[0]).join("").slice(0,2)} size="sm" />
                          <span className="text-xs">{t.employeeName}</span>
                        </div>
                      </td>
                      <td className={cn("py-3 px-3 text-xs", overdue && "text-danger font-semibold")}>
                        {formatDate(t.deadline)} {overdue && <AlertOctagon className="inline h-3 w-3 ml-1" />}
                      </td>
                      <td className="py-3 px-3 text-xs">{formatUZS(t.bonusAmount)}</td>
                      <td className="py-3 px-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="py-3 px-3"><TaskStatusBadge status={t.status} /></td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" title="Tasdiqlash" onClick={() => changeStatus(t, "Tasdiqlangan")}><CheckCircle2 className="h-4 w-4 text-info" /></Button>
                          <Button size="icon" variant="ghost" title="Boshlash" onClick={() => changeStatus(t, "Bajarilmoqda")}><Play className="h-4 w-4 text-warning" /></Button>
                          <Button size="icon" variant="ghost" title="Bajarildi" onClick={() => changeStatus(t, "Bajarildi")}><CheckCircle2 className="h-4 w-4 text-success" /></Button>
                          <Button size="icon" variant="ghost" title="Rad etish" onClick={() => changeStatus(t, "Rad etildi")}><XCircle className="h-4 w-4 text-danger" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {statuses.map(s => {
            const col = tasks.filter(t => t.status === s);
            return (
              <div key={s} className="rounded-2xl bg-muted/40 p-3 min-h-[300px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="font-semibold text-sm">{s}</div>
                  <span className="text-xs bg-card border border-border rounded-full px-2">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map(t => (
                    <div key={t.id} className="rounded-xl bg-card border border-border p-3 shadow-soft hover:shadow-elevated transition">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-sm">{t.title}</div>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AvatarBubble initials={t.employeeName.split(" ").map(n=>n[0]).join("").slice(0,2)} size="sm" />
                          <span className="text-xs">{t.employeeName.split(" ")[0]}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{formatDate(t.deadline)}</span>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">Bo'sh</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Yangi vazifa</SheetTitle>
            <SheetDescription>Vazifa ma'lumotlarini kiriting</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5"><Label>Sarlavha</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="space-y-1.5"><Label>Tavsif</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
            <div className="space-y-1.5">
              <Label>Xodim</Label>
              <Select value={form.employeeId} onValueChange={v => setForm({...form, employeeId: v})}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Muhimlik</Label>
                <Select value={form.priority} onValueChange={(v: TaskPriority) => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Past","O'rta","Yuqori","Shoshilinch"] as TaskPriority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Holat</Label>
                <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Muddat</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Bonus</Label><Input type="number" value={form.bonusAmount} onChange={e => setForm({...form, bonusAmount: +e.target.value})} /></div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Bekor qilish</Button>
            <Button onClick={save} className="bg-gradient-primary text-white">Saqlash</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
