import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Employee, Task, Attendance, DailyReport, SupportTicket, RuleSettings, ChatMessage, TaskStatus, ReportStatus, TicketStatus, Lead, LeadStage, LostReason } from "@/types/hr";
import {
  initialAttendance,
  initialChats,
  initialEmployees,
  initialReports,
  initialRules,
  initialTasks,
  initialTickets,
  initialLeads,
} from "@/data/mockData";
import { localDate, localTime } from "@/lib/datetime";

interface HRContextValue {
  employees: Employee[];
  tasks: Task[];
  attendance: Attendance[];
  reports: DailyReport[];
  tickets: SupportTicket[];
  rules: RuleSettings;
  chats: Record<string, ChatMessage[]>;
  leads: Lead[];
  addEmployee: (e: Omit<Employee, "id" | "avatarInitials">) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "createdAt" | "employeeName">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addReport: (r: Omit<DailyReport, "id" | "date" | "status">) => void;
  updateReportStatus: (id: string, status: ReportStatus) => void;
  addTicket: (t: Omit<SupportTicket, "id" | "createdAt" | "status" | "reply">) => void;
  updateTicket: (id: string, patch: Partial<SupportTicket>) => void;
  sendMessage: (employeeId: string, text: string) => void;
  updateRules: (r: RuleSettings) => void;
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "notes"> & { note?: string }) => { ok: boolean; message: string };
  updateLeadStage: (id: string, stage: LeadStage, options?: { lostReason?: LostReason; note?: string }) => { ok: boolean; message: string };
  addLeadNote: (id: string, note: string) => void;
}

const HRContext = createContext<HRContextValue | null>(null);

interface StoredHRData {
  employees: Employee[];
  tasks: Task[];
  attendance: Attendance[];
  reports: DailyReport[];
  tickets: SupportTicket[];
  rules: RuleSettings;
  chats: Record<string, ChatMessage[]>;
  leads: Lead[];
}

function readStoredData(): StoredHRData {
  const fallback = {
    employees: initialEmployees,
    tasks: initialTasks,
    attendance: initialAttendance,
    reports: initialReports,
    tickets: initialTickets,
    rules: initialRules,
    chats: initialChats,
    leads: initialLeads,
  };
  try {
    const raw = localStorage.getItem("mizaam-hr-state");
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("");
}

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = useMemo(readStoredData, []);
  const [backendReady, setBackendReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(stored.employees);
  const [tasks, setTasks] = useState<Task[]>(stored.tasks);
  const [attendance, setAttendance] = useState<Attendance[]>(stored.attendance);
  const [reports, setReports] = useState<DailyReport[]>(stored.reports);
  const [tickets, setTickets] = useState<SupportTicket[]>(stored.tickets);
  const [rules, setRules] = useState<RuleSettings>(stored.rules);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(stored.chats);
  const [leads, setLeads] = useState<Lead[]>(stored.leads);

  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        setEmployees(data.employees ?? stored.employees);
        setTasks(data.tasks ?? stored.tasks);
        setAttendance(data.attendance ?? stored.attendance);
        setReports(data.reports ?? stored.reports);
        setTickets(data.tickets ?? stored.tickets);
        setRules(data.rules ?? stored.rules);
        setChats(data.chats ?? stored.chats);
        setLeads(data.leads ?? stored.leads);
        setBackendReady(true);
      })
      .catch(() => setBackendReady(false))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!backendReady) return;
    const timer = setInterval(() => {
      fetch("/api/state")
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          setEmployees(data.employees ?? []);
          setTasks(data.tasks ?? []);
          setAttendance(data.attendance ?? []);
          setReports(data.reports ?? []);
          setTickets(data.tickets ?? []);
          setRules(data.rules ?? initialRules);
          setChats(data.chats ?? {});
          setLeads(data.leads ?? initialLeads);
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [backendReady]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("mizaam-hr-state", JSON.stringify({ employees, tasks, attendance, reports, tickets, rules, chats, leads }));
    if (backendReady) {
      fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees, tasks, attendance, reports, tickets, rules, chats, leads }),
      }).catch(() => undefined);
    }
  }, [backendReady, loaded, employees, tasks, attendance, reports, tickets, rules, chats, leads]);

  const value = useMemo<HRContextValue>(() => ({
    employees, tasks, attendance, reports, tickets, rules, chats, leads,
    addEmployee: (e) => {
      const fallback = {
        ...e,
        id: `e${Date.now()}`,
        avatarInitials: initials(e.fullName),
        telegramLogin: e.telegramLogin || e.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24),
        telegramPassword: e.telegramPassword || `tg${Math.random().toString(36).slice(2, 8)}`,
        telegramChatId: "",
      };

      if (backendReady) {
        fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallback),
        })
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((employee) => setEmployees(prev => [...prev, employee]))
          .catch(() => setEmployees(prev => [...prev, fallback]));
        return;
      }

      setEmployees(prev => [...prev, fallback]);
    },
    updateEmployee: (id, patch) => setEmployees(prev => prev.map(x => x.id === id ? { ...x, ...patch, avatarInitials: patch.fullName ? initials(patch.fullName) : x.avatarInitials } : x)),
    deleteEmployee: (id) => setEmployees(prev => prev.filter(x => x.id !== id)),
    addTask: (t) => {
      const emp = employees.find(e => e.id === t.employeeId);
      if (backendReady) {
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        })
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data) => setTasks(prev => [data.task, ...prev]))
          .catch(() => {
            setTasks(prev => [{ ...t, id: `t${Date.now()}`, createdAt: localDate(), employeeName: emp?.fullName ?? "" }, ...prev]);
          });
        return;
      }

      setTasks(prev => [{ ...t, id: `t${Date.now()}`, createdAt: localDate(), employeeName: emp?.fullName ?? "" }, ...prev]);
    },
    updateTaskStatus: (id, status) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (backendReady) {
        fetch(`/api/tasks/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }).catch(() => undefined);
      }
    },
    addReport: (r) => setReports(prev => [{ ...r, id: `r${Date.now()}`, date: localDate(), status: "Kutilmoqda" }, ...prev]),
    updateReportStatus: (id, status) => setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r)),
    addTicket: (t) => setTickets(prev => [{ ...t, id: `s${Date.now()}`, createdAt: localDate(), status: "Ochiq", reply: "" }, ...prev]),
    updateTicket: (id, patch) => setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)),
    sendMessage: (employeeId, text) => {
      if (backendReady) {
        fetch(`/api/chats/${employeeId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data) => setChats(prev => ({ ...prev, [employeeId]: data.messages })))
          .catch(() => setChats(prev => ({
            ...prev,
            [employeeId]: [...(prev[employeeId] ?? []), { id: `m${Date.now()}`, employeeId, fromMe: true, text, time: localTime() }]
          })));
        return;
      }

      setChats(prev => ({
        ...prev,
        [employeeId]: [...(prev[employeeId] ?? []), { id: `m${Date.now()}`, employeeId, fromMe: true, text, time: localTime() }]
      }));
    },
    updateRules: (r) => setRules(r),
    addLead: (lead) => {
      const duplicate = leads.find((item) => item.phone.replace(/\D/g, "") === lead.phone.replace(/\D/g, ""));
      const employee = employees.find((item) => item.id === lead.ownerId);
      const ownerName = employee?.fullName || lead.ownerName || "Mas'ul belgilanmagan";
      const note = lead.note?.trim() || "Lid qo'shildi";

      if (duplicate) {
        setLeads(prev => prev.map(item => item.id === duplicate.id ? {
          ...item,
          name: lead.name || item.name,
          source: lead.source,
          ownerId: lead.ownerId,
          ownerName,
          value: Math.max(item.value, Number(lead.value || 0)),
          lastContactAt: localDate(),
          notes: [`Dublikat birlashtirildi: ${note}`, ...item.notes],
        } : item));
        return { ok: true, message: "Dublikat lid topildi va mavjud kartochkaga birlashtirildi" };
      }

      const nextLead: Lead = {
        ...lead,
        id: `l${Date.now()}`,
        ownerName,
        value: Number(lead.value || 0),
        createdAt: localDate(),
        lastContactAt: localDate(),
        notes: [note],
      };
      setLeads(prev => [nextLead, ...prev]);
      return { ok: true, message: "Yangi lid qo'shildi" };
    },
    updateLeadStage: (id, stage, options) => {
      if (stage === "Yo'qotilgan" && !options?.lostReason) {
        return { ok: false, message: "Yo'qotilgan lid uchun sabab majburiy" };
      }

      setLeads(prev => prev.map(lead => lead.id === id ? {
        ...lead,
        stage,
        lostReason: stage === "Yo'qotilgan" ? options?.lostReason : undefined,
        lastContactAt: localDate(),
        notes: options?.note ? [options.note, ...lead.notes] : lead.notes,
      } : lead));
      return { ok: true, message: "Lid bosqichi yangilandi" };
    },
    addLeadNote: (id, note) => {
      const clean = note.trim();
      if (!clean) return;
      setLeads(prev => prev.map(lead => lead.id === id ? {
        ...lead,
        lastContactAt: localDate(),
        notes: [clean, ...lead.notes],
      } : lead));
    },
  }), [backendReady, employees, tasks, attendance, reports, tickets, rules, chats, leads]);

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};

export function useHR() {
  const ctx = useContext(HRContext);
  if (!ctx) throw new Error("useHR must be used within HRProvider");
  return ctx;
}
