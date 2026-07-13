import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, ListChecks, FileText, Wallet, LineChart, MessagesSquare, LifeBuoy, Settings, Sparkles, Bell, BriefcaseBusiness, Bot, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const nav: NavGroup[] = [
  { label: "Umumiy", items: [{ to: "/", label: "Boshqaruv paneli", icon: LayoutDashboard }] },
  { label: "Xodimlar", items: [
    { to: "/employees", label: "Xodimlar", icon: Users },
    { to: "/attendance", label: "Davomat", icon: CalendarCheck },
  ]},
  { label: "Ish", items: [
    { to: "/tasks", label: "Vazifalar", icon: ListChecks },
    { to: "/reports", label: "Kunlik hisobotlar", icon: FileText },
  ]},
  { label: "Sotuv", items: [
    { to: "/crm", label: "CRM voronka", icon: BriefcaseBusiness },
    { to: "/automation", label: "Avtomatizatsiya", icon: Workflow },
  ]},
  { label: "Moliya", items: [{ to: "/finance", label: "Moliyaviy holat", icon: Wallet }] },
  { label: "Tahlil", items: [{ to: "/analytics", label: "Analitika", icon: LineChart }] },
  { label: "Aloqa", items: [
    { to: "/chat", label: "Chat", icon: MessagesSquare },
    { to: "/employee-portal", label: "Xodim web-paneli", icon: Bot },
    { to: "/support", label: "Support", icon: LifeBuoy },
    { to: "/notifications", label: "Bildirishnomalar", icon: Bell },
  ]},
  { label: "Sozlamalar", items: [{ to: "/rules", label: "Qoidalar", icon: Settings }] },
];

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className={cn("flex items-center gap-3 px-5 py-5 border-b border-sidebar-border", collapsed && "px-3 justify-center")}>
        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display font-bold text-white text-lg leading-none">MIZAAM</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-1">HR, CRM & Finance Suite</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        {nav.map(group => (
          <div key={group.label}>
            {!collapsed && <div className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-sidebar-foreground/40">{group.label}</div>}
            <ul className="space-y-1">
              {group.items.map(item => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "" : "text-sidebar-foreground/60 group-hover:text-white")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-xl bg-sidebar-accent p-4 border border-sidebar-border">
          <div className="text-xs font-semibold text-white mb-1">MIZAAM maslahat</div>
          <div className="text-[11px] text-sidebar-foreground/70 leading-relaxed">KPI ko'rsatkichlari va davomatni har kuni tekshirib turing.</div>
        </div>
      )}
    </div>
  );
}
