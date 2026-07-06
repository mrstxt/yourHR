import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, CalendarClock, Send } from "lucide-react";
import { toast } from "sonner";

interface ScheduledMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  location: string;
  message: string;
  status: "scheduled" | "sent";
  createdAt: string;
  sentAt?: string;
  sentCount?: number;
}

const emptyMeeting = { title: "", time: "", location: "", message: "" };
const emptySchedule = { title: "", scheduledAt: "", location: "", message: "" };

function dueNow(value: string) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

export default function Notifications() {
  const [meeting, setMeeting] = useState(emptyMeeting);
  const [schedule, setSchedule] = useState(emptySchedule);
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([]);

  const dueMeetings = useMemo(
    () => scheduledMeetings.filter((item) => item.status !== "sent" && dueNow(item.scheduledAt)),
    [scheduledMeetings]
  );

  const loadScheduled = () => {
    fetch("/api/meetings/scheduled")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setScheduledMeetings(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  };

  useEffect(() => {
    loadScheduled();
    const timer = setInterval(loadScheduled, 30000);
    return () => clearInterval(timer);
  }, []);

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
      setMeeting(emptyMeeting);
    } catch {
      toast.error("Bildirishnoma yuborilmadi");
    }
  };

  const scheduleMeeting = async () => {
    if (!schedule.title || !schedule.scheduledAt) {
      toast.error("Reja mavzusi va vaqtini kiriting");
      return;
    }

    try {
      const response = await fetch("/api/meetings/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const data = await response.json();
      setScheduledMeetings((prev) => [data, ...prev]);
      setSchedule(emptySchedule);
      toast.success("Yig'ilish rejalashtirildi");
    } catch {
      toast.error("Yig'ilishni rejalashtirib bo'lmadi");
    }
  };

  const sendScheduled = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/scheduled/${meetingId}/send`, { method: "POST" });
      const data = await response.json();
      setScheduledMeetings((prev) => prev.map((item) => item.id === meetingId ? data.meeting : item));
      toast.success(`Bildirishnoma yuborildi: ${data.sent ?? 0} xodim`);
    } catch {
      toast.error("Bildirishnoma yuborilmadi");
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="card-elevated p-5">
        <h3 className="font-display font-bold text-lg mb-1">Bildirishnomalar</h3>
        <p className="text-sm text-muted-foreground">Muhim xabar va yig'ilishlarni hozir yuboring yoki oldindan rejalashtirib qo'ying.</p>
      </div>

      {dueMeetings.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <div className="font-semibold">Rejalashtirilgan yig'ilish vaqti keldi</div>
          <div className="text-sm text-muted-foreground mt-1">{dueMeetings.length} ta yig'ilish yuborishni kutmoqda.</div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Hozir yuborish</h3>
              <p className="text-sm text-muted-foreground">Xodimlarga bir vaqtda Telegram orqali yuboriladi.</p>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Mavzu</Label><Input value={meeting.title} onChange={e => setMeeting({ ...meeting, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Vaqt</Label><Input value={meeting.time} onChange={e => setMeeting({ ...meeting, time: e.target.value })} placeholder="Bugun 17:00" /></div>
          <div className="space-y-1.5"><Label>Joy</Label><Input value={meeting.location} onChange={e => setMeeting({ ...meeting, location: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Izoh</Label><Textarea rows={4} value={meeting.message} onChange={e => setMeeting({ ...meeting, message: e.target.value })} /></div>
          <Button onClick={notifyMeeting} className="w-full bg-gradient-primary text-white shadow-glow">
            <Send className="h-4 w-4 mr-2" /> Barchaga yuborish
          </Button>
        </div>

        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white flex items-center justify-center">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Rejalashtirib qo'yish</h3>
              <p className="text-sm text-muted-foreground">Rahbar aytgan yig'ilishni oldindan kiritib qo'ying, platforma vaqti kelganda yuboradi.</p>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Mavzu</Label><Input value={schedule.title} onChange={e => setSchedule({ ...schedule, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Reja vaqti</Label><Input type="datetime-local" value={schedule.scheduledAt} onChange={e => setSchedule({ ...schedule, scheduledAt: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Joy</Label><Input value={schedule.location} onChange={e => setSchedule({ ...schedule, location: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Izoh</Label><Textarea rows={4} value={schedule.message} onChange={e => setSchedule({ ...schedule, message: e.target.value })} /></div>
          <Button onClick={scheduleMeeting} variant="outline" className="w-full">
            <CalendarClock className="h-4 w-4 mr-2" /> Rejalashtirish
          </Button>
        </div>
      </div>

      <div className="card-elevated p-5">
        <h3 className="font-display font-bold mb-3">Rejalashtirilgan yig'ilishlar</h3>
        <div className="space-y-3">
          {scheduledMeetings.length === 0 && <div className="text-sm text-muted-foreground">Hali yig'ilish rejalashtirilmagan.</div>}
          {scheduledMeetings.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.title}</div>
                  <Badge variant={item.status === "sent" ? "default" : dueNow(item.scheduledAt) ? "destructive" : "secondary"}>
                    {item.status === "sent" ? "Yuborilgan" : dueNow(item.scheduledAt) ? "Vaqti keldi" : "Rejada"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{item.scheduledAt.replace("T", " ")} · {item.location || "Joy kiritilmagan"}</div>
                {item.message && <div className="text-sm mt-2">{item.message}</div>}
                {item.sentAt && <div className="text-xs text-muted-foreground mt-2">Yuborilgan: {item.sentAt} · {item.sentCount ?? 0} xodim</div>}
              </div>
              {item.status !== "sent" && (
                <Button onClick={() => sendScheduled(item.id)} className="bg-gradient-primary text-white">
                  <Send className="h-4 w-4 mr-2" /> Hozir yuborish
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
