import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<UserRole>("Admin");

  const chooseRole = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === "Admin") {
      setUsername("admin");
      setPassword("admin123");
      return;
    }

    setUsername("");
    setPassword("");
  };

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
            <div className="font-display font-bold text-2xl leading-none">yourHR Pro</div>
            <div className="text-xs text-white/60 mt-1">Enterprise HR Suite</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Zamonaviy HR<br/>boshqaruvi. <span className="text-primary-glow">Bir joyda.</span>
          </h2>
          <p className="text-white/70 max-w-md">
            Xodimlar, vazifalar, davomat va moliyaviy jarayonlarni yagona premium platformada boshqaring.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "250+", v: "Xodim" },
              { k: "1.2k", v: "Vazifa" },
              { k: "98%", v: "Davomat" },
            ].map(s => (
              <div key={s.v} className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                <div className="font-display text-2xl font-bold">{s.k}</div>
                <div className="text-xs text-white/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">© 2026 yourHR Pro. Barcha huquqlar himoyalangan.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-bold text-xl">yourHR Pro</div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-3xl font-bold">Xush kelibsiz</h1>
            <p className="text-muted-foreground text-sm">
              Avval panel turini tanlang, keyin berilgan login-parol bilan kiring.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["Admin", "HR Manager"] as UserRole[]).map(r => {
              const active = role === r;
              const Icon = r === "Admin" ? ShieldCheck : Users;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => chooseRole(r)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    active ? "border-primary bg-accent shadow-glow" : "border-border hover:border-primary/40"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="font-semibold text-sm">{r}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {r === "Admin" ? "Super admin panel" : "Kompaniya HR paneli"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Login</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder={role === "Admin" ? "admin" : "company-login"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-gradient-primary text-white shadow-glow hover:opacity-95">
            Tizimga kirish
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Admin: <b>admin / admin123</b>. HR login-parol super admin tomonidan yaratiladi.
          </div>
        </form>
      </div>
    </div>
  );
}
