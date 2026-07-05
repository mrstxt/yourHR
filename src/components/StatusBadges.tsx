import { AttendanceStatus, EmployeeStatus, ReportStatus, TaskPriority, TaskStatus, TicketStatus } from "@/types/hr";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted" | "primary";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span className={cn("status-chip border", toneClasses[tone], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, Tone> = {
    "Kutilmoqda": "muted", "Tasdiqlangan": "info", "Bajarilmoqda": "warning", "Bajarildi": "success", "Rad etildi": "danger"
  };
  return <StatusBadge label={status} tone={map[status]} />;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, Tone> = { "Past": "muted", "O'rta": "info", "Yuqori": "warning", "Shoshilinch": "danger" };
  return <StatusBadge label={priority} tone={map[priority]} />;
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const map: Record<EmployeeStatus, Tone> = { "Faol": "success", "Ta'tilda": "warning", "Ishdan bo'shatilgan": "danger" };
  return <StatusBadge label={status} tone={map[status]} />;
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, Tone> = { "Vaqtida": "success", "Kechikdi": "warning", "Kelmagan": "danger", "Erta ketdi": "info" };
  return <StatusBadge label={status} tone={map[status]} />;
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, Tone> = { "Kutilmoqda": "warning", "Tasdiqlangan": "success", "Rad etilgan": "danger" };
  return <StatusBadge label={status} tone={map[status]} />;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, Tone> = { "Ochiq": "info", "Jarayonda": "warning", "Hal qilindi": "success" };
  return <StatusBadge label={status} tone={map[status]} />;
}
