import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Award, TrendingUp, AlertOctagon, Star, Medal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const { employees, attendance, rules } = useHR();

  const avgKpi = Math.round(employees.reduce((s, e) => s + e.kpi, 0) / employees.length);
  const totalFine = employees.filter(e => e.kpi < rules.minKpi).length * rules.taskDelayFine;
  const attendanceQuality = Math.round((attendance.filter(a => a.status === "Vaqtida").length / attendance.length) * 100);
  const best = [...employees].sort((a, b) => b.kpi - a.kpi)[0];

  const cards = [
    { label: "O'rtacha KPI", value: avgKpi + "%", icon: TrendingUp, gradient: "from-indigo-500 to-blue-500" },
    { label: "Davomat sifati", value: attendanceQuality + "%", icon: Award, gradient: "from-emerald-500 to-teal-500" },
    { label: "Umumiy jarima", value: new Intl.NumberFormat("uz-UZ").format(totalFine), icon: AlertOctagon, gradient: "from-rose-500 to-pink-500" },
    { label: "Eng yaxshi xodim", value: best?.fullName.split(" ")[0] ?? "—", icon: Star, gradient: "from-amber-500 to-orange-500" },
  ];

  const kpiRanges = [
    { name: "90-100%", value: employees.filter(e => e.kpi >= 90).length, fill: "hsl(var(--success))" },
    { name: "80-89%", value: employees.filter(e => e.kpi >= 80 && e.kpi < 90).length, fill: "hsl(var(--info))" },
    { name: "70-79%", value: employees.filter(e => e.kpi >= 70 && e.kpi < 80).length, fill: "hsl(var(--warning))" },
    { name: "<70%", value: employees.filter(e => e.kpi < 70).length, fill: "hsl(var(--danger))" },
  ];

  const attQuality = [
    { name: "Vaqtida", count: attendance.filter(a => a.status === "Vaqtida").length },
    { name: "Kechikdi", count: attendance.filter(a => a.status === "Kechikdi").length },
    { name: "Erta ketdi", count: attendance.filter(a => a.status === "Erta ketdi").length },
    { name: "Kelmagan", count: attendance.filter(a => a.status === "Kelmagan").length },
  ];

  const ranking = [...employees].sort((a, b) => b.kpi - a.kpi);
  const medals = ["🥇", "🥈", "🥉"];

  const recommend = (kpi: number) => {
    if (kpi >= 90) return { text: "Bonus tavsiya etiladi", tone: "success" };
    if (kpi >= 80) return { text: "Yaxshi natija", tone: "info" };
    if (kpi >= 70) return { text: "Yaxshilash kerak", tone: "warning" };
    return { text: "Ogohlantirish", tone: "danger" };
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card">
              <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl", c.gradient)} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                  <div className="font-display text-2xl font-bold mt-2">{c.value}</div>
                </div>
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center", c.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-elevated p-5">
          <h3 className="font-display font-bold mb-4">KPI taqsimoti</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={kpiRanges} innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {kpiRanges.map((r, i) => <Cell key={i} fill={r.fill} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-5">
          <h3 className="font-display font-bold mb-4">Davomat sifati</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attQuality}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Medal className="h-5 w-5 text-warning" />
          <h3 className="font-display font-bold">Xodimlar reytingi</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-3 px-5">O'rin</th>
                <th className="text-left font-medium py-3 px-3">Xodim</th>
                <th className="text-left font-medium py-3 px-3">KPI</th>
                <th className="text-left font-medium py-3 px-5">Tavsiya</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((e, i) => {
                const rec = recommend(e.kpi);
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-5">
                      <div className="text-xl">{medals[i] ?? `#${i+1}`}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <AvatarBubble initials={e.avatarInitials} size="sm" />
                        <div>
                          <div className="font-semibold">{e.fullName}</div>
                          <div className="text-xs text-muted-foreground">{e.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary" style={{ width: `${e.kpi}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{e.kpi}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={cn(
                        "status-chip border",
                        rec.tone === "success" && "bg-success/10 text-success border-success/20",
                        rec.tone === "info" && "bg-info/10 text-info border-info/20",
                        rec.tone === "warning" && "bg-warning/10 text-warning border-warning/20",
                        rec.tone === "danger" && "bg-danger/10 text-danger border-danger/20",
                      )}>{rec.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
