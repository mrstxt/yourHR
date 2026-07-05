import { Employee, Task, Attendance, DailyReport, SupportTicket, RuleSettings, ChatMessage } from "@/types/hr";

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
const daysAhead = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

export const initialEmployees: Employee[] = [
  { id: "e1", fullName: "Aziza Karimova", position: "HR Menejer", salary: 12000000, kpi: 0, compensationType: "bonus", monthlyBonus: 500000, status: "Faol", avatarInitials: "AK", phone: "+998 90 123 45 67", email: "aziza@company.uz", joinedAt: "2022-03-15" },
  { id: "e2", fullName: "Bekzod Yusupov", position: "Frontend Dasturchi", salary: 18000000, kpi: 0, compensationType: "bonus", monthlyBonus: 700000, status: "Faol", avatarInitials: "BY", phone: "+998 90 234 56 78", email: "bekzod@company.uz", joinedAt: "2021-07-01" },
  { id: "e3", fullName: "Dilnoza Rahimova", position: "UI/UX Dizayner", salary: 14000000, kpi: 0, compensationType: "bonus", monthlyBonus: 600000, status: "Faol", avatarInitials: "DR", phone: "+998 90 345 67 89", email: "dilnoza@company.uz", joinedAt: "2023-01-10" },
  { id: "e4", fullName: "Sardor Xoliqov", position: "Backend Dasturchi", salary: 20000000, kpi: 0, compensationType: "bonus", monthlyBonus: 800000, status: "Faol", avatarInitials: "SX", phone: "+998 90 456 78 90", email: "sardor@company.uz", joinedAt: "2020-11-20" },
  { id: "e5", fullName: "Malika Tursunova", position: "Marketing", salary: 11000000, kpi: 0, compensationType: "bonus", monthlyBonus: 300000, status: "Ta'tilda", avatarInitials: "MT", phone: "+998 90 567 89 01", email: "malika@company.uz", joinedAt: "2022-09-05" },
  { id: "e6", fullName: "Javohir Nazarov", position: "QA Muhandis", salary: 13500000, kpi: 0, compensationType: "bonus", monthlyBonus: 400000, status: "Faol", avatarInitials: "JN", phone: "+998 90 678 90 12", email: "javohir@company.uz", joinedAt: "2023-05-18" },
  { id: "e7", fullName: "Zilola Abdullayeva", position: "Sotuv menejeri", salary: 10500000, kpi: 3, compensationType: "sales", salesKpiPercent: 3, monthlySalesAmount: 85000000, status: "Faol", avatarInitials: "ZA", phone: "+998 90 789 01 23", email: "zilola@company.uz", joinedAt: "2022-06-22" },
  { id: "e8", fullName: "Rustam Islomov", position: "DevOps", salary: 22000000, kpi: 0, compensationType: "bonus", monthlyBonus: 900000, status: "Faol", avatarInitials: "RI", phone: "+998 90 890 12 34", email: "rustam@company.uz", joinedAt: "2019-08-30" },
];

export const initialTasks: Task[] = [
  { id: "t1", title: "Yangi login sahifa dizayni", description: "Loginda social auth qo'shish", employeeId: "e3", employeeName: "Dilnoza Rahimova", status: "Bajarilmoqda", priority: "Yuqori", deadline: daysAhead(2), bonusAmount: 500000, createdAt: daysAgo(3) },
  { id: "t2", title: "API optimizatsiya", description: "Endpointlarni kesh bilan qoplash", employeeId: "e4", employeeName: "Sardor Xoliqov", status: "Kutilmoqda", priority: "Shoshilinch", deadline: daysAhead(1), bonusAmount: 800000, createdAt: daysAgo(1) },
  { id: "t3", title: "Dashboard KPI grafiklari", description: "Recharts bilan grafiklar", employeeId: "e2", employeeName: "Bekzod Yusupov", status: "Bajarildi", priority: "O'rta", deadline: daysAgo(1), bonusAmount: 400000, createdAt: daysAgo(5) },
  { id: "t4", title: "Sotuv kampaniyasi", description: "Sentyabr uchun reja", employeeId: "e7", employeeName: "Zilola Abdullayeva", status: "Tasdiqlangan", priority: "O'rta", deadline: daysAhead(7), bonusAmount: 600000, createdAt: daysAgo(2) },
  { id: "t5", title: "CI/CD pipeline yangilash", description: "GitHub Actions migratsiyasi", employeeId: "e8", employeeName: "Rustam Islomov", status: "Bajarildi", priority: "Yuqori", deadline: daysAgo(2), bonusAmount: 700000, createdAt: daysAgo(6) },
  { id: "t6", title: "Test rejasi tayyorlash", description: "Regression test suite", employeeId: "e6", employeeName: "Javohir Nazarov", status: "Rad etildi", priority: "Past", deadline: daysAhead(5), bonusAmount: 300000, createdAt: daysAgo(4) },
];

export const initialAttendance: Attendance[] = [
  { id: "a1", employeeId: "e1", employeeName: "Aziza Karimova", date: iso(today), checkIn: "09:02", checkOut: "18:05", status: "Vaqtida" },
  { id: "a2", employeeId: "e2", employeeName: "Bekzod Yusupov", date: iso(today), checkIn: "09:32", checkOut: "18:10", status: "Kechikdi" },
  { id: "a3", employeeId: "e3", employeeName: "Dilnoza Rahimova", date: iso(today), checkIn: "08:55", checkOut: "17:30", status: "Erta ketdi" },
  { id: "a4", employeeId: "e4", employeeName: "Sardor Xoliqov", date: iso(today), checkIn: "-", checkOut: "-", status: "Kelmagan" },
  { id: "a5", employeeId: "e6", employeeName: "Javohir Nazarov", date: iso(today), checkIn: "09:41", checkOut: "18:15", status: "Kechikdi" },
  { id: "a6", employeeId: "e7", employeeName: "Zilola Abdullayeva", date: iso(today), checkIn: "09:00", checkOut: "18:00", status: "Vaqtida" },
  { id: "a7", employeeId: "e8", employeeName: "Rustam Islomov", date: iso(today), checkIn: "08:50", checkOut: "18:20", status: "Vaqtida" },
];

export const initialReports: DailyReport[] = [
  { id: "r1", employeeId: "e2", employeeName: "Bekzod Yusupov", content: "Bugun dashboard sahifasining KPI kartalarini yakunladim. Ertaga chartlar bilan davom etaman.", date: iso(today), status: "Kutilmoqda" },
  { id: "r2", employeeId: "e3", employeeName: "Dilnoza Rahimova", content: "Login sahifasining ikkinchi variantini tayyorladim, review kutmoqdaman.", date: iso(today), status: "Tasdiqlangan" },
  { id: "r3", employeeId: "e4", employeeName: "Sardor Xoliqov", content: "API optimizatsiya boshlandi, ma'lumotlar bazasi query'lari qayta yozildi.", date: daysAgo(1), status: "Kutilmoqda" },
  { id: "r4", employeeId: "e7", employeeName: "Zilola Abdullayeva", content: "Uchta yangi mijoz bilan uchrashuv o'tkazildi, ikkitasi shartnoma bosqichida.", date: iso(today), status: "Tasdiqlangan" },
  { id: "r5", employeeId: "e6", employeeName: "Javohir Nazarov", content: "Regression testlar rejasi tuzildi, lekin scope aniqlashtirilishi kerak.", date: daysAgo(1), status: "Rad etilgan" },
];

export const initialTickets: SupportTicket[] = [
  { id: "s1", title: "Kompyuter sekin ishlaydi", description: "RAM yetishmayapti, ishga xalaqit bermoqda", category: "IT", status: "Ochiq", reply: "", createdAt: daysAgo(1), employeeName: "Bekzod Yusupov" },
  { id: "s2", title: "Ta'til so'rovi", description: "5 kunlik ta'til so'ramoqchiman", category: "HR", status: "Jarayonda", reply: "Ko'rib chiqilmoqda", createdAt: daysAgo(3), employeeName: "Dilnoza Rahimova" },
  { id: "s3", title: "Maosh haqida savol", description: "Bonusim qachon qo'shiladi?", category: "Moliya", status: "Hal qilindi", reply: "Bonus keyingi oyda hisoblanadi.", createdAt: daysAgo(7), employeeName: "Javohir Nazarov" },
];

export const initialRules: RuleSettings = {
  lateFine: 50000,
  taskDelayFine: 100000,
  minKpi: 70,
  earlyBonus: 200000,
};

export const initialChats: Record<string, ChatMessage[]> = {
  e2: [
    { id: "m1", employeeId: "e2", fromMe: false, text: "Salom, dashboard task bo'yicha savolim bor edi", time: "09:15" },
    { id: "m2", employeeId: "e2", fromMe: true, text: "Salom Bekzod, ayting", time: "09:16" },
  ],
  e3: [
    { id: "m3", employeeId: "e3", fromMe: false, text: "Login mockuplarini yubordim, ko'rib chiqing", time: "10:30" },
  ],
};
