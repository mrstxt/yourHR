import { useEffect, useState } from "react";
import { useHR } from "@/context/HRContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertOctagon, Award, Bell, CalendarClock, Clock3, Save, Timer, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { RuleSettings } from "@/types/hr";
import { cn } from "@/lib/utils";

export default function Rules() {
  const { rules, updateRules } = useHR();
  const [form, setForm] = useState<RuleSettings>(rules);
  const [meeting, setMeeting] = useState({ title: "", time: "", location: "", message: "" });

  useEffect(() => setForm(rules), [rules]);

  const save = () => {
    updateRules(form);
    toast.success("Qoidalar saqlandi");
  };

  const notifyMeeting = async () => {
    if (!meeting.title || !meeting.time) {
      toast.error("Yig'ilish mavzusi va vaqtini kiriting");
      return;
    }

    try {
      const response = await fetch("/api/meetings/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meeting),
      });
      const data = await response.json();
      toast.success(`Yig'ilish bildirishnomasi yuborildi: ${data.sent ?? 0} xodim`);
      setMeeting({ title: "", time: "", location: "", message: "" });
    } catch {
      toast.error("Bildirishnoma yuborilmadi");
    }
  };

  const fields = [
    { key: "lateFine" as const, label: "Kechikish jarimasi", desc: "Standart kechikish jarimasi", icon: Timer, gradient: "from-amber-500 to-orange-500" },
    { key: "taskDelayFine" as const, label: "Vazifa kechikishi jarimasi", desc: "Muddatida bajarilmagan vazifa uchun", icon: AlertOctagon, gradient: "from-rose-500 to-pink-500" },
    { key: "minKpi" as const, label: "KPI minimal chegarasi", desc: "Ushbu darajadan past = risk", icon: TrendingUp, gradient: "from-indigo-500 to-blue-500" },
    { key: "earlyBonus" as const, label: "Erta bajarish bonusi", desc: "Yuqori natija uchun bonus", icon: Award, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="card-elevated p-5">
        <h3 className="font-display font-bold text-lg mb-1">Korxona qoidalari</h3>
        <p className="text-sm text-muted-foreground">Har bir korxona ish vaqti, kechikish va yig'ilish qoidalarini o'z tartibiga moslaydi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {fields.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="card-elevated p-5">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-3", f.gradient)}>
                <Icon className="h-5 w-5" />
              </div>
              <Label className="font-semibold text-base">{f.label}</Label>
              <div className="text-xs text-muted-foreground mb-3">{f.desc}</div>
              <Input type="number" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: +e.target.value })} className="text-lg font-semibold" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white flex items-center justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Ish vaqti va kechikish tartibi</h3>
              <p className="text-sm text-muted-foreground">Template: 10 daqiqa kechiksa jarima yo'q, 30 daqiqadan keyin jarima, 60 daqiqadan keyin ogohlantirish.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Ish boshlanishi</Label><Input type="time" value={form.workStart} onChange={e => setForm({ ...form, workStart: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Ish tugashi</Label><Input type="time" value={form.workEnd} onChange={e => setForm({ ...form, workEnd: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Jarimasiz kechikish (min)</Label><Input type="number" value={form.graceMinutes} onChange={e => setForm({ ...form, graceMinutes: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Jarima boshlanishi (min)</Label><Input type="number" value={form.fineAfterMinutes} onChange={e => setForm({ ...form, fineAfterMinutes: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Ogohlantirish (min)</Label><Input type="number" value={form.warningAfterMinutes} onChange={e => setForm({ ...form, warningAfterMinutes: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Davomat jarimasi</Label><Input type="number" value={form.attendanceFineAmount} onChange={e => setForm({ ...form, attendanceFineAmount: +e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Korxona ichki qoidalari</Label>
            <Textarea rows={5} value={form.companyPolicy} onChange={e => setForm({ ...form, companyPolicy: e.target.value })} />
          </div>
          <Button onClick={save} className="bg-gradient-primary text-white shadow-glow">
            <Save className="h-4 w-4 mr-2" /> Qoidalarni saqlash
          </Button>
        </div>

        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Yig'ilish bildirishnomasi</h3>
              <p className="text-sm text-muted-foreground">Telegram botga ulangan barcha xodimlarga bir vaqtda yuboriladi.</p>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Mavzu</Label><Input value={meeting.title} onChange={e => setMeeting({ ...meeting, title: e.target.value })} placeholder="Masalan: Haftalik yig'ilish" /></div>
          <div className="space-y-1.5"><Label>Vaqt</Label><Input value={meeting.time} onChange={e => setMeeting({ ...meeting, time: e.target.value })} placeholder="Bugun 17:00" /></div>
          <div className="space-y-1.5"><Label>Joy</Label><Input value={meeting.location} onChange={e => setMeeting({ ...meeting, location: e.target.value })} placeholder="Ofis / Zoom / Telegram" /></div>
          <div className="space-y-1.5"><Label>Izoh</Label><Textarea rows={4} value={meeting.message} onChange={e => setMeeting({ ...meeting, message: e.target.value })} /></div>
          <Button onClick={notifyMeeting} className="w-full bg-gradient-primary text-white shadow-glow">
            <Bell className="h-4 w-4 mr-2" /> Barchaga yuborish
          </Button>
        </div>
      </div>
    </div>
  );
}
