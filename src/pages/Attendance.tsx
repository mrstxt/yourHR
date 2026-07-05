import { useState } from "react";
import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { AttendanceStatusBadge } from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Clock, UserCheck, UserX, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Attendance() {
  const { attendance } = useHR();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const dayList = attendance.filter(a => a.date === date);
  const present = dayList.filter(a => a.status !== "Kelmagan").length;
  const late = dayList.filter(a => a.status === "Kechikdi").length;
  const absent = dayList.filter(a => a.status === "Kelmagan").length;
  const pct = dayList.length ? Math.round((present / dayList.length) * 100) : 0;

  const cards = [
    { label: "Kelganlar", value: present, icon: UserCheck, gradient: "from-emerald-500 to-teal-500" },
    { label: "Kechikkanlar", value: late, icon: Clock, gradient: "from-amber-500 to-orange-500" },
    { label: "Kelmaganlar", value: absent, icon: UserX, gradient: "from-rose-500 to-pink-500" },
    { label: "Davomat foizi", value: `${pct}%`, icon: Percent, gradient: "from-indigo-500 to-blue-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="card-elevated p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <div className="text-sm font-semibold">Sanani tanlang</div>
          <div className="text-xs text-muted-foreground">Kunlik davomat holati</div>
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="sm:ml-auto sm:w-52" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card">
              <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl", c.gradient)} />
              <div className="flex items-start justify-between relative">
                <div>
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                  <div className="font-display text-3xl font-bold mt-2">{c.value}</div>
                </div>
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center", c.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-bold">Davomat ro'yxati</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-3 px-5">Xodim</th>
                <th className="text-left font-medium py-3 px-3">Kirdi</th>
                <th className="text-left font-medium py-3 px-3">Chiqdi</th>
                <th className="text-left font-medium py-3 px-5">Holat</th>
              </tr>
            </thead>
            <tbody>
              {dayList.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Bu kun uchun ma'lumot yo'q</td></tr>}
              {dayList.map(a => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={a.employeeName.split(" ").map(n=>n[0]).join("").slice(0,2)} size="sm" />
                      <span className="font-medium">{a.employeeName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">{a.checkIn}</td>
                  <td className="py-3 px-3 font-mono text-xs">{a.checkOut}</td>
                  <td className="py-3 px-5"><AttendanceStatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
