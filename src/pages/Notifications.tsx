import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const [meeting, setMeeting] = useState({ title: "", time: "", location: "", message: "" });

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

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card-elevated p-5">
        <h3 className="font-display font-bold text-lg mb-1">Bildirishnomalar</h3>
        <p className="text-sm text-muted-foreground">Muhim xabar va yig'ilishlarni Telegram botga ulangan barcha xodimlarga yuboring.</p>
      </div>

      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Yig'ilish bildirishnomasi</h3>
            <p className="text-sm text-muted-foreground">Xodimlarga bir vaqtda Telegram orqali yuboriladi.</p>
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
  );
}
