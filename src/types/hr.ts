export type EmployeeStatus = "Faol" | "Ta'tilda" | "Ishdan bo'shatilgan";
export type TaskStatus = "Kutilmoqda" | "Tasdiqlangan" | "Bajarilmoqda" | "Bajarildi" | "Rad etildi";
export type TaskPriority = "Past" | "O'rta" | "Yuqori" | "Shoshilinch";
export type AttendanceStatus = "Vaqtida" | "Kechikdi" | "Kelmagan" | "Erta ketdi";
export type ReportStatus = "Kutilmoqda" | "Tasdiqlangan" | "Rad etilgan";
export type TicketStatus = "Ochiq" | "Jarayonda" | "Hal qilindi";
export type UserRole = "Admin" | "HR Manager";

export interface CompanyAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  contactName: string;
  contactInfo: string;
  status: "active" | "suspended";
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  salary: number;
  kpi: number;
  status: EmployeeStatus;
  avatarInitials: string;
  phone?: string;
  email?: string;
  joinedAt?: string;
  telegramChatId?: string;
  telegramLogin?: string;
  telegramPassword?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  bonusAmount: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
}

export interface DailyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  content: string;
  date: string;
  status: ReportStatus;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  reply: string;
  createdAt: string;
  employeeName?: string;
}

export interface RuleSettings {
  lateFine: number;
  taskDelayFine: number;
  minKpi: number;
  earlyBonus: number;
}

export interface ChatMessage {
  id: string;
  employeeId: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  companyId?: string;
  companyName?: string;
}
