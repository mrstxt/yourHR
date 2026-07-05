import { useState, useEffect } from "react";
import { Bell, Menu, Search, LogOut, User as UserIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarBubble } from "@/components/AvatarBubble";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";
import { useNavigate } from "react-router-dom";

interface TopHeaderProps {
  title: string;
  description?: string;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  sidebarCollapsed: boolean;
}

export function TopHeader({ title, description, onToggleSidebar, onOpenMobile, sidebarCollapsed }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const { employees, reports, tickets, tasks, chats } = useHR();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const chatNotifications = Object.entries(chats)
    .map(([employeeId, messages]) => {
      const lastIncoming = [...messages].reverse().find((message) => !message.fromMe);
      const employee = employees.find((item) => item.id === employeeId);
      if (!lastIncoming || !employee) return null;
      return {
        id: `chat-${lastIncoming.id}`,
        title: "Yangi chat xabari",
        text: `${employee.fullName}: ${lastIncoming.text}`,
        time: lastIncoming.time,
        path: "/chat",
      };
    })
    .filter(Boolean);

  const reportNotifications = reports
    .filter((report) => report.status === "Kutilmoqda")
    .map((report) => ({
      id: `report-${report.id}`,
      title: "Kunlik hisobot",
      text: `${report.employeeName} yangi hisobot yubordi`,
      time: report.date,
      path: "/reports",
    }));

  const supportNotifications = tickets
    .filter((ticket) => ticket.status !== "Hal qilindi")
    .map((ticket) => ({
      id: `support-${ticket.id}`,
      title: "Support so'rovi",
      text: `${ticket.title}${ticket.employeeName ? ` · ${ticket.employeeName}` : ""}`,
      time: ticket.createdAt,
      path: "/support",
    }));

  const taskNotifications = tasks
    .filter((task) => task.status === "Kutilmoqda" || task.status === "Tasdiqlangan" || task.status === "Bajarilmoqda")
    .map((task) => ({
      id: `task-${task.id}`,
      title: "Vazifa",
      text: `${task.employeeName}: ${task.title} · ${task.status}`,
      time: task.deadline,
      path: "/tasks",
    }));

  const notifications = [
    ...chatNotifications,
    ...reportNotifications,
    ...supportNotifications,
    ...taskNotifications,
  ].slice(0, 12);

  const notificationCount = chatNotifications.length + reportNotifications.length + supportNotifications.length + taskNotifications.length;

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
          {now.toLocaleDateString("uz-UZ", { weekday: "short", day: "2-digit", month: "short" })} · {now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-background flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border">
              <div className="font-semibold text-sm">Bildirishnomalar</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Chat: {chatNotifications.length} · Hisobot: {reportNotifications.length} · Support: {supportNotifications.length} · Vazifa: {taskNotifications.length}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">Yangi bildirishnoma yo'q</div>
              ) : notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(n.path)}
                  className="w-full px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 text-sm text-left"
                >
                  <div className="text-[11px] font-semibold uppercase text-primary">{n.title}</div>
                  <div className="font-medium line-clamp-2">{n.text}</div>
                  <div className="text-[11px] text-muted-foreground">{n.time}</div>
                </button>
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
