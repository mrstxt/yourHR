import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { AttendanceStatusBadge } from "@/components/StatusBadges";
import { Users, ClipboardCheck, Clock, FileClock, TrendingUp, ArrowUpRight, AlertTriangle, LifeBuoy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface KPI { label: string; value: string; delta: string; positive?: boolean; icon: React.ComponentType<{ className?: string }>; gradient: string; }

export default function Dashboard() {
  const { employees, tasks, attendance, reports, tickets } = useHR();

  const activeTasks = tasks.filter(t => t.status === "Bajarilmoqda" || t.status === "Tasdiqlangan").length;
  const presentToday = attendance.filter(a => a.status !== "Kelmagan").length;
  const pendingReports = reports.filter(r => r.status === "Kutilmoqda").length;

  const kpis: KPI[] = [
    { label: "Jami xodimlar", value: String(employees.length), delta: "+2 shu oy", positive: true, icon: Users, gradient: "from-indigo-500 to-blue-500" },
    { label: "Faol vazifalar", value: String(activeTasks), delta: `${tasks.length} umumiy`, positive: true, icon: ClipboardCheck, gradient: "from-emerald-500 to-teal-500" },
    { label: "Bugun kelganlar", value: String(presentToday), delta: `${attendance.length} dan`, positive: true, icon: Clock, gradient: "from-amber-500 to-orange-500" },
    { label: "Kutilayotgan hisobotlar", value: String(pendingReports), delta: "Tekshirish kerak", positive: false, icon: FileClock, gradient: "from-rose-500 to-pink-500" },
  ];

  const kpiChartData = employees.slice(0, 6).map(e => ({ name: e.fullName.split(" ")[0], KPI: e.kpi }));
  const attendanceTrend = [
    { day: "Du", vaqtida: 22, kechikdi: 3 },
    { day: "Se", vaqtida: 24, kechikdi: 2 },
    { day: "Ch", vaqtida: 21, kechikdi: 5 },
    { day: "Pa", vaqtida: 23, kechikdi: 3 },
    { day: "Ju", vaqtida: 25, kechikdi: 1 },
    { day: "Sh", vaqtida: 20, kechikdi: 2 },
    { day: "Ya", vaqtida: 18, kechikdi: 1 },
  ];

  const topEmployees = [...employees].sort((a, b) => b.kpi - a.kpi).slice(0, 5);
  const lateToday = attendance.filter(a => a.status === "Kechikdi" || a.status === "Kelmagan");
  const openTickets = tickets.filter(t => t.status === "Ochiq");

  const activity = [
    ...reports.slice(0, 3).map(r => ({ id: r.id, text: `${r.employeeName} hisobot yubordi`, time: r.date, type: "report" })),
    ...tasks.slice(0, 3).map(t => ({ id: t.id, text: `${t.employeeName} — ${t.title}`, time: t.createdAt, type: "task" })),
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="kpi-card">
              <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl", k.gradient)} />
              <div className="flex items-start justify-between relative">
                <div>
                  <div className="text-sm text-muted-foreground font-medium">{k.label}</div>
                  <div className="mt-2 font-display text-3xl font-bold">{k.value}</div>
                </div>
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md", k.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className={cn("mt-4 inline-flex items-center gap-1 text-xs font-medium", k.positive ? "text-success" : "text-warning")}>
                <ArrowUpRight className="h-3 w-3" /> {k.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* HR status + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-elevated p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Bugungi HR holati</h3>
              <p className="text-xs text-muted-foreground">Diqqat talab qilinadigan holatlar</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Kechikkanlar: {lateToday.length}</div>
                <div className="text-xs text-muted-foreground">{lateToday.slice(0, 2).map(l => l.employeeName).join(", ") || "Yo'q"}</div>
              </div>
            </div>
            <div className="rounded-xl bg-info/5 border border-info/20 p-3 flex items-start gap-3">
              <FileClock className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Kutilayotgan hisobotlar: {pendingReports}</div>
                <div className="text-xs text-muted-foreground">Tekshirish uchun</div>
              </div>
            </div>
            <div className="rounded-xl bg-danger/5 border border-danger/20 p-3 flex items-start gap-3">
              <LifeBuoy className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Ochiq ticketlar: {openTickets.length}</div>
                <div className="text-xs text-muted-foreground">{openTickets[0]?.title ?? "Yangi so'rov yo'q"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Xodimlar KPI</h3>
              <p className="text-xs text-muted-foreground">Top 6 xodim samaradorligi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kpiChartData}>
              <defs>
                <linearGradient id="kpiBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(231 74% 60%)" />
                  <stop offset="100%" stopColor="hsl(262 74% 65%)" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="KPI" fill="url(#kpiBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-elevated p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Davomat trendi</h3>
              <p className="text-xs text-muted-foreground">So'nggi 7 kun</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend />
              <Line type="monotone" dataKey="vaqtida" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="kechikdi" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Top 5 xodim</h3>
              <p className="text-xs text-muted-foreground">KPI bo'yicha</p>
            </div>
          </div>
          <div className="space-y-3">
            {topEmployees.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className={cn(
                  "h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center",
                  i === 0 && "bg-warning/20 text-warning",
                  i === 1 && "bg-muted text-muted-foreground",
                  i === 2 && "bg-danger/20 text-danger",
                  i > 2 && "bg-muted text-muted-foreground"
                )}>{i + 1}</div>
                <AvatarBubble initials={e.avatarInitials} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{e.position}</div>
                </div>
                <div className="text-sm font-bold text-primary">{e.kpi}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity + Today attendance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-elevated p-5 xl:col-span-1">
          <h3 className="font-display font-bold text-lg mb-4">So'nggi faoliyat</h3>
          <div className="space-y-4">
            {activity.map((a, i) => (
              <div key={a.id + i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  {i < activity.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="text-sm">{a.text}</div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 xl:col-span-2 overflow-hidden">
          <h3 className="font-display font-bold text-lg mb-4">Bugungi davomat</h3>
          <div className="overflow-x-auto scrollbar-thin -mx-5">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                <tr className="border-b border-border">
                  <th className="text-left font-medium py-2 px-5">Xodim</th>
                  <th className="text-left font-medium py-2 px-2">Kirdi</th>
                  <th className="text-left font-medium py-2 px-2">Chiqdi</th>
                  <th className="text-left font-medium py-2 px-5">Holat</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 5).map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-5">
                      <div className="flex items-center gap-2">
                        <AvatarBubble initials={a.employeeName.split(" ").map(n => n[0]).join("").slice(0,2)} size="sm" />
                        <span className="font-medium">{a.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-xs">{a.checkIn}</td>
                    <td className="py-2.5 px-2 font-mono text-xs">{a.checkOut}</td>
                    <td className="py-2.5 px-5"><AttendanceStatusBadge status={a.status} /></td>
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
