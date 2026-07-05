import { useMemo, useState } from "react";
import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUZS, isOverdue } from "@/lib/format";
import { Banknote, Bell, CheckCircle2, Coins, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FINANCE_KEY = "yourhr_finance_settings_v1";
const PAID_KEY = "yourhr_paid_payroll_v1";

interface FinanceSettings {
  companyIncome: number;
  utilities: number;
  officeRent: number;
  extraExpenses: number;
  marketingExpenses: number;
}

const defaultFinance: FinanceSettings = {
  companyIncome: 0,
  utilities: 0,
  officeRent: 0,
  extraExpenses: 0,
  marketingExpenses: 0,
};

function readFinance() {
  try {
    return { ...defaultFinance, ...JSON.parse(localStorage.getItem(FINANCE_KEY) || "{}") };
  } catch {
    return defaultFinance;
  }
}

function readPaid() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(currentPayrollKey()) || "[]"));
  } catch {
    return new Set<string>();
  }
}

function currentPayrollKey(date = new Date()) {
  return `${PAID_KEY}_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isSalesEmployee(position: string, type?: string) {
  const normalized = position.toLowerCase();
  return type === "sales" || normalized.includes("sotuv") || normalized.includes("sales");
}

function payrollWindowStatus(date = new Date()) {
  const day = date.getDate();
  const open = day === 1 || day === 2;
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const nextWindow = `${nextMonth.toLocaleDateString("uz-UZ", { month: "long", day: "numeric" })}-${new Date(date.getFullYear(), date.getMonth() + 1, 2).toLocaleDateString("uz-UZ", { day: "numeric" })}`;

  return {
    day,
    open,
    nextWindow,
  };
}

export default function Finance() {
  const { employees, attendance, tasks, reports, rules } = useHR();
  const [settings, setSettings] = useState<FinanceSettings>(readFinance);
  const [paidIds, setPaidIds] = useState<Set<string>>(readPaid);
  const payrollWindow = payrollWindowStatus();

  const saveSettings = (next: FinanceSettings) => {
    setSettings(next);
    localStorage.setItem(FINANCE_KEY, JSON.stringify(next));
  };

  const markPaid = (employeeId: string) => {
    if (!payrollWindow.open) {
      toast.warning(`Oylik tarqatish vaqti har oyning 1-2 sanasi. Bugun ${payrollWindow.day}-sana, keyingi muddat: ${payrollWindow.nextWindow}.`);
      return;
    }

    const next = new Set(paidIds);
    next.add(employeeId);
    setPaidIds(next);
    localStorage.setItem(currentPayrollKey(), JSON.stringify(Array.from(next)));
  };

  const markAllPaid = () => {
    if (!payrollWindow.open) {
      toast.warning(`Oylik berish vaqti hali kelmagan. Oyliklar faqat har oyning 1-2 sanasida tarqatiladi. Keyingi muddat: ${payrollWindow.nextWindow}.`);
      return;
    }

    const next = new Set(employees.map((employee) => employee.id));
    setPaidIds(next);
    localStorage.setItem(currentPayrollKey(), JSON.stringify(Array.from(next)));
    toast.success("Barcha xodimlar oyligi tarqatildi deb belgilandi");
  };

  const notifyPayroll = async () => {
    try {
      const response = await fetch("/api/payroll/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "💳 Oylik hisob-kitobi tayyorlanmoqda. Karta raqamingiz va davomat holatingiz HR panelda tekshirilmoqda.",
        }),
      });
      const data = await response.json();
      toast.success(`Bildirishnoma yuborildi: ${data.sent ?? 0} xodim`);
    } catch {
      toast.info("Oylik tarqatish bildirishnomasi tayyor");
    }
  };

  const rows = useMemo(() => employees.map((employee) => {
    const employeeAttendance = attendance.filter((item) => item.employeeId === employee.id);
    const lateCount = employeeAttendance.filter((item) => item.status === "Kechikdi").length;
    const absentCount = employeeAttendance.filter((item) => item.status === "Kelmagan").length;
    const fine = lateCount * rules.lateFine + absentCount * rules.lateFine * 2;

    const employeeTasks = tasks.filter((task) => task.employeeId === employee.id);
    const completedTasks = employeeTasks.filter((task) => task.status === "Bajarildi").length;
    const overdueTasks = employeeTasks.filter((task) => task.status !== "Bajarildi" && isOverdue(task.deadline)).length;
    const taskCompletion = employeeTasks.length ? completedTasks / employeeTasks.length : 1;

    const employeeReports = reports.filter((report) => report.employeeId === employee.id);
    const approvedReports = employeeReports.filter((report) => report.status === "Tasdiqlangan").length;
    const reportScore = employeeReports.length ? approvedReports / employeeReports.length : 1;

    const presentDays = employeeAttendance.filter((item) => item.status !== "Kelmagan").length;
    const attendanceScore = employeeAttendance.length ? presentDays / employeeAttendance.length : 1;

    const score = Math.round(Math.max(0, (attendanceScore * 0.35 + taskCompletion * 0.45 + reportScore * 0.2 - overdueTasks * 0.08)) * 100);
    const salesEmployee = isSalesEmployee(employee.position, employee.compensationType);
    const salesBonus = salesEmployee ? Math.round((employee.monthlySalesAmount ?? 0) * ((employee.salesKpiPercent ?? employee.kpi ?? 0) / 100)) : 0;
    const suggestedBonus = !salesEmployee && score >= 90 ? Math.round(employee.salary * 0.12) : !salesEmployee && score >= 75 ? Math.round(employee.salary * 0.07) : 0;
    const manualBonus = Number(employee.monthlyBonus ?? 0);
    const bonus = salesEmployee ? salesBonus : Math.max(manualBonus, suggestedBonus);
    const total = Math.max(0, employee.salary + bonus - fine);

    return {
      ...employee,
      salesEmployee,
      lateCount,
      absentCount,
      overdueTasks,
      score,
      suggestedBonus,
      bonus,
      fine,
      total,
      paid: paidIds.has(employee.id),
    };
  }), [employees, attendance, tasks, reports, rules, paidIds]);

  const payrollTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const salaryTotal = rows.reduce((sum, row) => sum + row.salary, 0);
  const bonusTotal = rows.reduce((sum, row) => sum + row.bonus, 0);
  const fineTotal = rows.reduce((sum, row) => sum + row.fine, 0);
  const companyExpenses = settings.utilities + settings.officeRent + settings.extraExpenses + settings.marketingExpenses;
  const totalExpenses = payrollTotal + companyExpenses;
  const profit = settings.companyIncome - totalExpenses;
  const unpaidCount = rows.filter((row) => !row.paid).length;
  const payoutReminder = unpaidCount > 0;

  const cards = [
    { label: "Kompaniya daromadi", value: settings.companyIncome, icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
    { label: "Oylik fondi", value: payrollTotal, icon: Wallet, gradient: "from-indigo-500 to-blue-500" },
    { label: "Umumiy xarajat", value: totalExpenses, icon: ReceiptText, gradient: "from-amber-500 to-orange-500" },
    { label: "Sof foyda", value: profit, icon: Coins, gradient: profit >= 0 ? "from-sky-500 to-blue-500" : "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="space-y-5">
      {payoutReminder && (
        <div className={cn(
          "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3",
          payrollWindow.open ? "border-success/30 bg-success/10" : "border-warning/30 bg-warning/10"
        )}>
          <div className="flex items-center gap-3">
            <Bell className={cn("h-5 w-5", payrollWindow.open ? "text-success" : "text-warning")} />
            <div>
              <div className="font-semibold">
                {payrollWindow.open ? "Oylik tarqatish vaqti ochiq" : "Oylik tarqatish vaqti hali kelmagan"}
              </div>
              <div className="text-sm text-muted-foreground">
                {payrollWindow.open
                  ? `${unpaidCount} ta xodim oyligi tarqatilmagan. Bugun ${payrollWindow.day}-sana.`
                  : `Oyliklar har oyning 1-2 sanasida tarqatiladi. Keyingi muddat: ${payrollWindow.nextWindow}.`}
              </div>
            </div>
          </div>
          <Button className="sm:ml-auto bg-gradient-primary text-white" onClick={notifyPayroll}>
            Bildirishnoma chiqarish
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="kpi-card">
              <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl", card.gradient)} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{card.label}</div>
                  <div className="font-display text-xl xl:text-2xl font-bold mt-2">{formatUZS(card.value)}</div>
                </div>
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center", card.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <div className="card-elevated p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg">Kompaniya moliyasi</h3>
            <p className="text-xs text-muted-foreground">Daromad va qo'shimcha xarajatlarni kiriting</p>
          </div>
          <div className="space-y-1.5">
            <Label>Kompaniya umumiy daromadi</Label>
            <Input type="number" value={settings.companyIncome} onChange={(e) => saveSettings({ ...settings, companyIncome: +e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kommunalka</Label>
              <Input type="number" value={settings.utilities} onChange={(e) => saveSettings({ ...settings, utilities: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ofis arendasi</Label>
              <Input type="number" value={settings.officeRent} onChange={(e) => saveSettings({ ...settings, officeRent: +e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marketing</Label>
              <Input type="number" value={settings.marketingExpenses} onChange={(e) => saveSettings({ ...settings, marketingExpenses: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Qo'shimcha rasxod</Label>
              <Input type="number" value={settings.extraExpenses} onChange={(e) => saveSettings({ ...settings, extraExpenses: +e.target.value })} />
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Maoshlar</span><b>{formatUZS(salaryTotal)}</b></div>
            <div className="flex justify-between"><span>Bonus/KPI</span><b className="text-success">{formatUZS(bonusTotal)}</b></div>
            <div className="flex justify-between"><span>Jarimalar</span><b className="text-danger">{formatUZS(fineTotal)}</b></div>
            <div className="flex justify-between"><span>Qo'shimcha xarajatlar</span><b>{formatUZS(companyExpenses)}</b></div>
          </div>
          <Button className="w-full bg-gradient-primary text-white" onClick={markAllPaid}>
            <Banknote className="h-4 w-4 mr-2" /> Barcha oyliklarni tarqatish
          </Button>
        </div>

        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-bold">Oylik tarqatish hisoboti</h3>
            <p className="text-xs text-muted-foreground">Karta raqami, kelib-ketish, jarima, sotuv KPI va bonus takliflari bilan</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium py-3 px-5">Xodim</th>
                  <th className="text-left font-medium py-3 px-3">Karta</th>
                  <th className="text-left font-medium py-3 px-3">Maosh</th>
                  <th className="text-left font-medium py-3 px-3">Bonus/KPI</th>
                  <th className="text-left font-medium py-3 px-3">Jarima</th>
                  <th className="text-left font-medium py-3 px-3">Analiz</th>
                  <th className="text-right font-medium py-3 px-5">To'lov</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Hali xodim qo'shilmagan</td></tr>}
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <AvatarBubble initials={row.avatarInitials} size="sm" />
                        <div>
                          <div className="font-semibold">{row.fullName}</div>
                          <div className="text-xs text-muted-foreground">{row.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">{row.cardNumber || "Kiritilmagan"}</td>
                    <td className="py-3 px-3">{formatUZS(row.salary)}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-success">{row.bonus ? "+" + formatUZS(row.bonus) : "—"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {row.salesEmployee
                          ? `Sotuv: ${formatUZS(row.monthlySalesAmount ?? 0)} × ${row.salesKpiPercent ?? row.kpi ?? 0}%`
                          : row.suggestedBonus ? `Taklif: ${formatUZS(row.suggestedBonus)}` : "Bonus taklif yo'q"}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-danger">{row.fine ? "−" + formatUZS(row.fine) : "—"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {row.lateCount} kechikish · {row.absentCount} kelmagan
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold">{row.score}%</div>
                      <div className="text-[11px] text-muted-foreground">{row.overdueTasks} kechikkan vazifa</div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="font-bold">{formatUZS(row.total)}</div>
                      {row.paid ? (
                        <div className="inline-flex items-center gap-1 text-xs text-success mt-1"><CheckCircle2 className="h-3 w-3" /> To'landi</div>
                      ) : (
                        <Button size="sm" variant="outline" className="mt-1" onClick={() => markPaid(row.id)}>Tarqatildi</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
