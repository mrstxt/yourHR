import { useState, useEffect } from "react";
import { Bell, Menu, Search, LogOut, User as UserIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarBubble } from "@/components/AvatarBubble";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";

interface TopHeaderProps {
  title: string;
  description?: string;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  sidebarCollapsed: boolean;
}

export function TopHeader({ title, description, onToggleSidebar, onOpenMobile, sidebarCollapsed }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const { reports, tickets, tasks } = useHR();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const notifications = [
    ...reports.filter(r => r.status === "Kutilmoqda").slice(0, 3).map(r => ({ id: r.id, text: `${r.employeeName} yangi hisobot yubordi`, time: r.date })),
    ...tickets.filter(t => t.status === "Ochiq").slice(0, 2).map(t => ({ id: t.id, text: `Yangi ticket: ${t.title}`, time: t.createdAt })),
    ...tasks.filter(t => t.status === "Kutilmoqda").slice(0, 2).map(t => ({ id: t.id, text: `Vazifa kutmoqda: ${t.title}`, time: t.deadline })),
  ];

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile}><Menu className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleSidebar}>
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-lg sm:text-xl truncate leading-tight">{title}</h1>
          {description && <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>}
        </div>

        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." className="pl-9 bg-muted/50 border-transparent focus-visible:bg-card" />
        </div>

        <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground font-medium">
          {now.toLocaleDateString("uz-UZ", { weekday: "short", day: "2-digit", month: "short" })} · {now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-background" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border font-semibold text-sm">Bildirishnomalar</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">Yangi bildirishnoma yo'q</div>
              ) : notifications.map(n => (
                <div key={n.id} className="px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 text-sm">
                  <div className="font-medium">{n.text}</div>
                  <div className="text-[11px] text-muted-foreground">{n.time}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 hover:bg-muted transition">
              <AvatarBubble initials={user?.initials ?? "U"} size="sm" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold leading-tight">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground">{user?.role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><UserIcon className="h-4 w-4 mr-2" /> Profil</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-danger focus:text-danger"><LogOut className="h-4 w-4 mr-2" /> Chiqish</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
