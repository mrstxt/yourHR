import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHR } from "@/context/HRContext";
import { UserRole } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

interface LoginProps {
  mode: "admin" | "hr";
}

export default function Login({ mode }: LoginProps) {
  const { login, companies } = useAuth();
  const { employees, tasks, attendance } = useHR();
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const role: UserRole = mode === "admin" ? "Admin" : "HR Manager";
  const isAdminLogin = mode === "admin";

  const selectedCompany = useMemo(
    () => companies.find((company) => company.username === companySlug),
    [companies, companySlug]
  );

  useEffect(() => {
    if (mode === "hr" && companySlug) {
      setUsername(companySlug);
    }
  }, [companySlug, mode]);

  const presentCount = attendance.filter((item) => item.status !== "Kelmagan").length;
  const attendancePct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const liveStats = [
    { k: String(companies.length), v: "Kompaniya" },
    { k: String(employees.length), v: "Xodim" },
    { k: String(tasks.length), v: "Vazifa" },
    { k: `${attendancePct}%`, v: "Davomat" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error("Iltimos, barcha maydonlarni to'ldiring");

    const result = login(username, password, role);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate(role === "Admin" ? "/admin" : "/", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          background: "radial-gradient(circle at 20% 20%, hsl(231 74% 60%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(262 74% 60%) 0%, transparent 50%)"
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl leading-none">MIZAAM</div>
            <div className="text-xs text-white/60 mt-1">HR, CRM & Finance Suite</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Zamonaviy HR<br/>boshqaruvi. <span className="text-primary-glow">Bir joyda.</span>
          </h2>
          <p className="text-white/70 max-w-md">
            Xodimlar, vazifalar, davomat, CRM va moliyaviy jarayonlarni yagona platformada boshqaring.
          </p>
          <div className="grid grid-cols-4 gap-3 max-w-lg">
            {liveStats.map(s => (
              <div key={s.v} className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                <div className="font-display text-2xl font-bold">{s.k}</div>
                <div className="text-xs text-white/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">© 2026 MIZAAM. Barcha huquqlar himoyalangan.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-bold text-xl">MIZAAM</div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                {isAdminLogin ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
              </div>
              <h1 className="font-display text-3xl font-bold">
                {isAdminLogin ? "Super admin kirish" : "HR panelga kirish"}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {isAdminLogin
                ? "Faqat super admin login-paroli bilan admin panelga kiring."
                : selectedCompany
                  ? `${selectedCompany.name} uchun berilgan HR login-parol bilan kiring.`
                  : "Kompaniya uchun berilgan HR login-parol bilan kiring."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isAdminLogin ? "super-admin-login" : "company-login"}
                readOnly={Boolean(selectedCompany)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-gradient-primary text-white shadow-glow hover:opacity-95">
            Tizimga kirish
          </Button>
        </form>
      </div>
    </div>
  );
}
