import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Employee, Task, Attendance, DailyReport, SupportTicket, RuleSettings, ChatMessage, TaskStatus, ReportStatus, TicketStatus } from "@/types/hr";
import { initialEmployees, initialTasks, initialAttendance, initialReports, initialTickets, initialRules, initialChats } from "@/data/mockData";

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
const HR_DATA_KEY = "yourhr_hr_data";

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
  const fallback: StoredHRData = {
    employees: initialEmployees,
    tasks: initialTasks,
    attendance: initialAttendance,
    reports: initialReports,
    tickets: initialTickets,
    rules: initialRules,
    chats: initialChats,
  };

  const raw = localStorage.getItem(HR_DATA_KEY);
  if (!raw) return fallback;

  try {
    return { ...fallback, ...JSON.parse(raw) };
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
  const [attendance] = useState<Attendance[]>(stored.attendance);
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
    if (!loaded) return;
    localStorage.setItem(HR_DATA_KEY, JSON.stringify({ employees, tasks, attendance, reports, tickets, rules, chats }));
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
    addEmployee: (e) => setEmployees(prev => [...prev, { ...e, id: `e${Date.now()}`, avatarInitials: initials(e.fullName), telegramChatId: e.telegramChatId ?? "" }]),
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
            setTasks(prev => [{ ...t, id: `t${Date.now()}`, createdAt: new Date().toISOString().slice(0,10), employeeName: emp?.fullName ?? "" }, ...prev]);
          });
        return;
      }

      setTasks(prev => [{ ...t, id: `t${Date.now()}`, createdAt: new Date().toISOString().slice(0,10), employeeName: emp?.fullName ?? "" }, ...prev]);
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
    addReport: (r) => setReports(prev => [{ ...r, id: `r${Date.now()}`, date: new Date().toISOString().slice(0,10), status: "Kutilmoqda" }, ...prev]),
    updateReportStatus: (id, status) => setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r)),
    addTicket: (t) => setTickets(prev => [{ ...t, id: `s${Date.now()}`, createdAt: new Date().toISOString().slice(0,10), status: "Ochiq", reply: "" }, ...prev]),
    updateTicket: (id, patch) => setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)),
    sendMessage: (employeeId, text) => setChats(prev => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] ?? []), { id: `m${Date.now()}`, employeeId, fromMe: true, text, time: new Date().toTimeString().slice(0,5) }]
    })),
    updateRules: (r) => setRules(r),
  }), [employees, tasks, attendance, reports, tickets, rules, chats]);

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};

export function useHR() {
  const ctx = useContext(HRContext);
  if (!ctx) throw new Error("useHR must be used within HRProvider");
  return ctx;
}
