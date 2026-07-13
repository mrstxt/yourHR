import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Employee, Task, Attendance, DailyReport, SupportTicket, RuleSettings, ChatMessage, TaskStatus, ReportStatus, TicketStatus } from "@/types/hr";
import {
  initialAttendance,
  initialChats,
  initialEmployees,
  initialReports,
  initialRules,
  initialTasks,
  initialTickets,
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
}

function readStoredData(): StoredHRData {
  return {
    employees: initialEmployees,
    tasks: initialTasks,
    attendance: initialAttendance,
    reports: initialReports,
    tickets: initialTickets,
    rules: initialRules,
    chats: initialChats,
  };
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
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [backendReady]);

  useEffect(() => {
    if (!loaded) return;
    if (backendReady) {
      fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees, tasks, attendance, reports, tickets, rules, chats }),
      }).catch(() => undefined);
    }
  }, [backendReady, loaded, employees, tasks, attendance, reports, tickets, rules, chats]);

  const value = useMemo<HRContextValue>(() => ({
    employees, tasks, attendance, reports, tickets, rules, chats,
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
  }), [backendReady, employees, tasks, attendance, reports, tickets, rules, chats]);

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};

export function useHR() {
  const ctx = useContext(HRContext);
  if (!ctx) throw new Error("useHR must be used within HRProvider");
  return ctx;
}
