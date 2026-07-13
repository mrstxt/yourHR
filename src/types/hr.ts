export type EmployeeStatus = "Faol" | "Ta'tilda" | "Ishdan bo'shatilgan";
export type TaskStatus = "Kutilmoqda" | "Tasdiqlangan" | "Bajarilmoqda" | "Bajarildi" | "Rad etildi";
export type TaskPriority = "Past" | "O'rta" | "Yuqori" | "Shoshilinch";
export type AttendanceStatus = "Vaqtida" | "Kechikdi" | "Kelmagan" | "Erta ketdi";
export type ReportStatus = "Kutilmoqda" | "Tasdiqlangan" | "Rad etilgan";
export type TicketStatus = "Ochiq" | "Jarayonda" | "Hal qilindi";
export type UserRole = "Admin" | "HR Manager";
export type LeadStage = "Yangi lid" | "Bog'lanildi" | "Qiziqish bildirdi" | "Taklif yuborildi" | "Muzokara" | "G'olib" | "Yo'qotilgan";
export type LeadSource = "Telegram" | "Sayt forma" | "Qo'lda" | "WhatsApp" | "Instagram" | "Facebook";
export type LostReason = "Narx" | "Vaqt" | "Ishonchsizlik" | "Mahsulot mos kelmadi" | "Raqobatchi";

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
  compensationType?: "sales" | "bonus";
  salesKpiPercent?: number;
  monthlySalesAmount?: number;
  monthlyBonus?: number;
  status: EmployeeStatus;
  avatarInitials: string;
  phone?: string;
  email?: string;
  address?: string;
  education?: string;
  cardNumber?: string;
  joinedAt?: string;
  cvFileId?: string;
  cvFileName?: string;
  cvMimeType?: string;
  cvUploadedAt?: string;
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
  attachments?: {
    type: "photo";
    fileId: string;
    caption?: string;
  }[];
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
  workStart: string;
  workEnd: string;
  graceMinutes: number;
  fineAfterMinutes: number;
  warningAfterMinutes: number;
  attendanceFineAmount: number;
  companyPolicy: string;
}

export interface ChatMessage {
  id: string;
  employeeId: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  ownerId: string;
  ownerName: string;
  stage: LeadStage;
  value: number;
  createdAt: string;
  lastContactAt: string;
  slaHours: number;
  notes: string[];
  lostReason?: LostReason;
}

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  companyId?: string;
  companyName?: string;
}
