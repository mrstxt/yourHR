import { useMemo, useState } from "react";
import { Bell, ClipboardCheck, FileText, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EmployeePortal() {
  const { employees, tasks, reports, addReport, updateTaskStatus } = useHR();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [report, setReport] = useState("");

  const employee = employees.find((item) => item.id === employeeId) || employees[0];
  const employeeTasks = tasks.filter((task) => task.employeeId === employee?.id);
  const employeeReports = reports.filter((item) => item.employeeId === employee?.id);

  const notifications = useMemo(() => {
    if (!employee) return [];
    return [
      ...employeeTasks.filter((task) => task.status !== "Bajarildi").slice(0, 3).map((task) => `Yangi vazifa: ${task.title}`),
      ...employeeReports.filter((item) => item.status === "Rad etilgan").slice(0, 2).map(() => "Hisobot rad etildi, qayta yuborish kerak"),
      "Bugungi davomat va hisobotni tekshiring",
    ];
  }, [employee, employeeReports, employeeTasks]);

  const sendReport = () => {
    if (!employee || !report.trim()) {
      toast.error("Hisobot matnini yozing");
      return;
    }

    addReport({
      employeeId: employee.id,
      employeeName: employee.fullName,
      content: report.trim(),
    });
    setReport("");
    toast.success("Hisobot HR panelga yuborildi");
  };

  if (!employee) {
    return (
      <div className="card-elevated p-5">
        <h2 className="font-display text-xl font-bold">Xodim web-paneli</h2>
        <p className="mt-2 text-sm text-muted-foreground">Avval xodim qo'shing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <AvatarBubble initials={employee.avatarInitials} size="lg" />
            <div>
              <h1 className="font-display text-2xl font-bold">Xodim web-paneli</h1>
              <p className="text-sm text-muted-foreground">Botdagi funksiyalar brauzerda: vazifalar, hisobot, bildirishnoma.</p>
            </div>
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={employee.id} onChange={(event) => setEmployeeId(event.target.value)}>
            {employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card-elevated p-5">
          <div className="flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-primary" />
            Shaxsiy ma'lumot
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div><span className="text-muted-foreground">Xodim:</span> {employee.fullName}</div>
            <div><span className="text-muted-foreground">Lavozim:</span> {employee.position}</div>
            <div><span className="text-muted-foreground">Telefon:</span> {employee.phone || "-"}</div>
            <div><span className="text-muted-foreground">Email:</span> {employee.email || "-"}</div>
            <div><span className="text-muted-foreground">Telegram login:</span> {employee.telegramLogin || "-"}</div>
          </div>
        </section>

        <section className="card-elevated p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4 text-warning" />
            Push bildirishnomalar
          </div>
          <div className="mt-4 space-y-2">
            {notifications.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">{item}</div>
            ))}
          </div>
        </section>

        <section className="card-elevated p-5">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-info" />
            Kunlik hisobot
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Bugun / qiyinchilik / ertaga reja</Label>
              <Textarea rows={5} value={report} onChange={(event) => setReport(event.target.value)} />
            </div>
            <Button className="w-full bg-gradient-primary text-white" onClick={sendReport}>
              <Send className="mr-2 h-4 w-4" />
              Hisobot yuborish
            </Button>
          </div>
        </section>
      </div>

      <section className="card-elevated p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <ClipboardCheck className="h-4 w-4 text-success" />
          Mening vazifalarim
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {employeeTasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{task.title}</div>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, "Bajarilmoqda")}>Boshlash</Button>
                <Button size="sm" className="bg-gradient-primary text-white" onClick={() => updateTaskStatus(task.id, "Bajarildi")}>Bajarildi</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
