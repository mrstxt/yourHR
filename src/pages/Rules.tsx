import { useState } from "react";
import { useHR } from "@/context/HRContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertOctagon, TrendingUp, Award, Timer, Save } from "lucide-react";
import { toast } from "sonner";
import { RuleSettings } from "@/types/hr";
import { cn } from "@/lib/utils";

export default function Rules() {
  const { rules, updateRules } = useHR();
  const [form, setForm] = useState<RuleSettings>(rules);

  const save = () => {
    updateRules(form);
    toast.success("Sozlamalar saqlandi");
  };

  const fields = [
    { key: "lateFine" as const, label: "Kechikish jarimasi", desc: "Har bir kechikish uchun", icon: Timer, gradient: "from-amber-500 to-orange-500" },
    { key: "taskDelayFine" as const, label: "Vazifa kechikishi jarimasi", desc: "Muddatida bajarilmagan vazifa uchun", icon: AlertOctagon, gradient: "from-rose-500 to-pink-500" },
    { key: "minKpi" as const, label: "KPI minimal chegarasi", desc: "Ushbu darajadan past = jarima", icon: TrendingUp, gradient: "from-indigo-500 to-blue-500" },
    { key: "earlyBonus" as const, label: "Erta bajarish bonusi", desc: "Yuqori KPI uchun bonus", icon: Award, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="card-elevated p-5">
        <h3 className="font-display font-bold text-lg mb-1">HR qoidalari</h3>
        <p className="text-sm text-muted-foreground">Ushbu sozlamalar moliyaviy hisob-kitobda ishlatiladi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="card-elevated p-5">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-3", f.gradient)}>
                <Icon className="h-5 w-5" />
              </div>
              <Label className="font-semibold text-base">{f.label}</Label>
              <div className="text-xs text-muted-foreground mb-3">{f.desc}</div>
              <Input
                type="number"
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: +e.target.value })}
                className="text-lg font-semibold"
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} className="bg-gradient-primary text-white shadow-glow">
          <Save className="h-4 w-4 mr-2" /> Sozlamalarni saqlash
        </Button>
      </div>
    </div>
  );
}
