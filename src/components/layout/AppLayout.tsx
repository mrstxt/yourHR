import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarNav } from "./SidebarNav";
import { TopHeader } from "./TopHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "Boshqaruv paneli", description: "Umumiy HR ko'rsatkichlari va bugungi holat" },
  "/employees": { title: "Xodimlar", description: "Xodimlar ma'lumotlar bazasi va boshqaruvi" },
  "/attendance": { title: "Davomat", description: "Bugungi davomat va statistika" },
  "/tasks": { title: "Vazifalar", description: "Vazifalar taqsimoti va bajarilishi" },
  "/reports": { title: "Kunlik hisobotlar", description: "Xodimlar tomonidan yuborilgan hisobotlar" },
  "/finance": { title: "Moliyaviy holat", description: "Maosh, bonus va jarima hisob-kitobi" },
  "/crm": { title: "CRM voronka", description: "Lidlar, SLA, konversiya va g'olib bitimlar nazorati" },
  "/analytics": { title: "Analitika", description: "KPI va samaradorlik tahlili" },
  "/chat": { title: "Chat", description: "Jamoa bilan bevosita muloqot" },
  "/employee-portal": { title: "Xodim web-paneli", description: "Xodim uchun vazifa, hisobot va push bildirishnoma preview" },
  "/support": { title: "Support", description: "Xodimlar tomonidan yuborilgan so'rovlar" },
  "/notifications": { title: "Bildirishnomalar", description: "Yig'ilish va muhim xabarlarni yuborish" },
  "/automation": { title: "Avtomatizatsiya", description: "Integratsiyalar, marketing, xavfsizlik va premium roadmap" },
  "/rules": { title: "Qoidalar", description: "HR jarima va bonus sozlamalari" },
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? { title: "MIZAAM", description: "" };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-40 bg-sidebar transition-all duration-300",
        collapsed ? "w-[76px]" : "w-64"
      )}>
        <SidebarNav collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <TopHeader
          title={meta.title}
          description={meta.description}
          onToggleSidebar={() => setCollapsed(c => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />
        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
