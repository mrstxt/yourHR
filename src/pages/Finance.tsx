import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { formatUZS } from "@/lib/format";
import { Wallet, Gift, AlertOctagon, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Finance() {
  const { employees } = useHR();

  const rows = employees.map(e => {
    const isSales = e.compensationType === "sales" || e.position.toLowerCase().includes("sotuv") || e.position.toLowerCase().includes("sales");
    const incentive = isSales
      ? Math.round((e.monthlySalesAmount ?? 0) * ((e.salesKpiPercent ?? e.kpi ?? 0) / 100))
      : Number(e.monthlyBonus ?? 0);
    const fine = 0;
    return { ...e, isSales, incentive, fine, total: e.salary + incentive - fine };
  });

  const totals = rows.reduce((acc, r) => ({
    salary: acc.salary + r.salary,
    bonus: acc.bonus + r.incentive,
    fine: acc.fine + r.fine,
    total: acc.total + r.total,
  }), { salary: 0, bonus: 0, fine: 0, total: 0 });

  const cards = [
    { label: "Jami maosh", value: totals.salary, icon: Wallet, gradient: "from-indigo-500 to-blue-500" },
    { label: "Umumiy bonus", value: totals.bonus, icon: Gift, gradient: "from-emerald-500 to-teal-500" },
    { label: "Umumiy jarima", value: totals.fine, icon: AlertOctagon, gradient: "from-rose-500 to-pink-500" },
    { label: "Umumiy xarajat", value: totals.total, icon: Coins, gradient: "from-amber-500 to-orange-500" },
  ];

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
                  <div className="font-display text-xl xl:text-2xl font-bold mt-2">{formatUZS(c.value)}</div>
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
          <h3 className="font-display font-bold">Maosh hisob-kitobi</h3>
          <p className="text-xs text-muted-foreground">Sotuv xodimlari uchun sotuvdan KPI, boshqa xodimlar uchun oy oxiri bonus</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-3 px-5">Xodim</th>
                <th className="text-left font-medium py-3 px-3">Maosh</th>
                <th className="text-left font-medium py-3 px-3">Hisob turi</th>
                <th className="text-left font-medium py-3 px-3">Rag'bat</th>
                <th className="text-left font-medium py-3 px-3">Jarima</th>
                <th className="text-right font-medium py-3 px-5">Jami</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <AvatarBubble initials={r.avatarInitials} size="sm" />
                      <div>
                        <div className="font-semibold">{r.fullName}</div>
                        <div className="text-xs text-muted-foreground">{r.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">{formatUZS(r.salary)}</td>
                  <td className="py-3 px-3 font-semibold">
                    {r.isSales ? `Sotuvdan ${r.salesKpiPercent ?? r.kpi ?? 0}%` : "Oy oxiri bonus"}
                  </td>
                  <td className="py-3 px-3 text-success">{r.incentive ? "+" + formatUZS(r.incentive) : "—"}</td>
                  <td className="py-3 px-3 text-danger">{r.fine ? "−" + formatUZS(r.fine) : "—"}</td>
                  <td className="py-3 px-5 text-right font-bold">{formatUZS(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
