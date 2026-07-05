import { useState, useEffect, useRef } from "react";
import { useHR } from "@/context/HRContext";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const { employees, chats, sendMessage } = useHR();
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()));
  const selected = employees.find(e => e.id === selectedId);
  const messages = chats[selectedId] ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, selectedId]);

  const send = () => {
    if (!text.trim()) return;
    sendMessage(selectedId, text.trim());
    setText("");
    toast.success("Xabar yuborildi");
  };

  return (
    <div className="card-elevated overflow-hidden h-[calc(100vh-8rem)] grid grid-cols-1 md:grid-cols-[280px_1fr]">
      <div className="border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition text-left border-b border-border last:border-0",
                selectedId === e.id && "bg-accent"
              )}
            >
              <AvatarBubble initials={e.avatarInitials} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{e.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{e.position}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        {selected && (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <AvatarBubble initials={selected.avatarInitials} />
              <div>
                <div className="font-semibold text-sm">{selected.fullName}</div>
                <div className="text-xs text-success flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Onlayn
                </div>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-muted/20">
              {messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">Xabarlar hali yo'q. Boshlang!</div>}
              {messages.map(m => (
                <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                    m.fromMe ? "bg-gradient-primary text-white shadow-glow rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
                  )}>
                    <div>{m.text}</div>
                    <div className={cn("text-[10px] mt-1", m.fromMe ? "text-white/70" : "text-muted-foreground")}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Xabar yozing..." />
              <Button onClick={send} size="icon" className="bg-gradient-primary text-white shadow-glow"><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
