import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = valueParts.join("=").trim();
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const DATA_FILE = path.join(process.cwd(), "yourhr-data.json");
const DIST_DIR = path.join(process.cwd(), "dist");
let telegramOffset = 0;
const pendingReport = new Set();
const pendingChat = new Set();
const pendingAuth = new Map();
const pendingCv = new Set();
const defaultAdminCredentials = { username: "admin", password: "admin123" };
const defaultFinanceSettings = {
  companyIncome: 0,
  utilities: 0,
  officeRent: 0,
  extraExpenses: 0,
  marketingExpenses: 0,
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

function today() {
  const value = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value || String(value.getFullYear());
  const month = parts.find((part) => part.type === "month")?.value || String(value.getMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value || String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const uid = (prefix) => `${prefix}${Date.now()}${crypto.randomBytes(2).toString("hex")}`;
const timeNow = () => new Date().toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });

function webhookUrl() {
  const base = PUBLIC_URL.trim().replace(/\/$/, "");
  if (!base) return "";
  if (base.endsWith("/api/telegram/webhook")) return base;
  return `${base}/api/telegram/webhook`;
}

const seed = {
  companies: [],
  adminCredentials: defaultAdminCredentials,
  financeSettings: defaultFinanceSettings,
  paidPayroll: {},
  employees: [],
  tasks: [],
  attendance: [],
  reports: [],
  tickets: [],
  scheduledMeetings: [],
  rules: {
    lateFine: 50000,
    taskDelayFine: 100000,
    minKpi: 70,
    earlyBonus: 200000,
    workStart: "09:00",
    workEnd: "18:00",
    graceMinutes: 10,
    fineAfterMinutes: 30,
    warningAfterMinutes: 60,
    attendanceFineAmount: 50000,
    companyPolicy: "Ishga o'z vaqtida kelish, vazifalarni muddatida bajarish va HR bilan aloqa qilish majburiy.",
  },
  chats: {},
};

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

function slugify(value) {
  return String(value || "xodim")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "xodim";
}

function makePassword() {
  return `tg${Math.random().toString(36).slice(2, 8)}`;
}

function ensureEmployeeCredentials() {
  const used = new Set();
  for (const employee of db.employees) {
    let login = employee.telegramLogin || slugify(employee.fullName);
    let suffix = 2;
    while (used.has(login)) {
      login = `${slugify(employee.fullName)}-${suffix}`;
      suffix += 1;
    }
    employee.telegramLogin = login;
    employee.telegramPassword = employee.telegramPassword || makePassword();
    employee.telegramChatId = employee.telegramChatId || "";
    if (employee.telegramChatId && !/^-?\d+$/.test(String(employee.telegramChatId))) employee.telegramChatId = "";
    const salesEmployee = String(employee.position || "").toLowerCase().includes("sotuv") || String(employee.position || "").toLowerCase().includes("sales");
    employee.compensationType = employee.compensationType || (salesEmployee ? "sales" : "bonus");
    if (employee.compensationType === "sales") {
      employee.salesKpiPercent = Number(employee.salesKpiPercent ?? employee.kpi ?? 0);
      employee.monthlySalesAmount = Number(employee.monthlySalesAmount ?? 0);
      employee.monthlyBonus = 0;
      employee.kpi = employee.salesKpiPercent;
    } else {
      employee.monthlyBonus = Number(employee.monthlyBonus ?? 0);
      employee.salesKpiPercent = 0;
      employee.monthlySalesAmount = 0;
      employee.kpi = 0;
    }
    used.add(login);
  }
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }

  return { ...structuredClone(seed), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
}

let db = loadDb();
db.companies = Array.isArray(db.companies) ? db.companies : [];
db.adminCredentials = db.adminCredentials?.username && db.adminCredentials?.password ? db.adminCredentials : defaultAdminCredentials;
db.financeSettings = { ...defaultFinanceSettings, ...(db.financeSettings || {}) };
db.paidPayroll = db.paidPayroll && typeof db.paidPayroll === "object" ? db.paidPayroll : {};
db.scheduledMeetings = Array.isArray(db.scheduledMeetings) ? db.scheduledMeetings : [];
ensureEmployeeCredentials();
saveDb();

function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => raw += chunk);
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON noto'g'ri"));
      }
    });
  });
}

async function telegram(method, body) {
  if (!BOT_TOKEN) return { ok: false, skipped: true };

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function setBotCommands() {
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Xodim sifatida botga ulanish" },
      { command: "login", description: "Login va parol bilan kirish" },
      { command: "tasks", description: "Menga biriktirilgan vazifalar" },
      { command: "cv", description: "CV yoki resume yuborish" },
      { command: "help", description: "Botdan foydalanish" },
    ],
  });
}

async function configureTelegramDelivery() {
  if (!BOT_TOKEN) return;
  await setBotCommands();

  if (PUBLIC_URL) {
    const url = webhookUrl();
    const result = await telegram("setWebhook", {
      url,
      drop_pending_updates: false,
    });
    console.log(`Telegram webhook: ${url}`);
    console.log(result.ok ? "Telegram webhook enabled" : `Telegram webhook error: ${JSON.stringify(result)}`);
    return;
  }

  await telegram("deleteWebhook", { drop_pending_updates: false });
  console.log("Telegram polling mode enabled");
  pollTelegram();
}

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: "✅ Keldim" }, { text: "🏁 Ketdim" }],
      [{ text: "📋 Mening vazifalarim" }, { text: "📝 Kunlik hisobot" }],
      [{ text: "💬 HR bilan chat" }, { text: "📎 CV yuborish" }],
    ],
    resize_keyboard: true,
  };
}

function authHelpText() {
  return [
    "Assalomu alaykum. Botdan foydalanish uchun avval login kiriting.",
    "Login va parol HR panelda xodim qo'shilganda beriladi.",
  ].join("\n");
}

async function confirmEmployeeLogin(chatId, employee) {
  employee.telegramChatId = chatId;
  saveDb();
  await telegram("sendMessage", {
    chat_id: chatId,
    text: `✅ Tasdiqlandi. ${employee.fullName}, botga muvaffaqiyatli kirdingiz.`,
    reply_markup: mainKeyboard(),
  });
}

async function sendTaskToEmployee(task) {
  const employee = db.employees.find((item) => item.id === task.employeeId);
  if (!employee?.telegramChatId) return { ok: false, skipped: true };

  return telegram("sendMessage", {
    chat_id: employee.telegramChatId,
    parse_mode: "HTML",
    text: [
      "📌 <b>Yangi vazifa</b>",
      `<b>${task.title}</b>`,
      task.description || "",
      `Muddat: ${task.deadline || "-"}`,
      `Muhimlik: ${task.priority}`,
      `Bonus: ${Number(task.bonusAmount || 0).toLocaleString("uz-UZ")} so'm`,
    ].filter(Boolean).join("\n"),
    reply_markup: {
      inline_keyboard: [[
        { text: "Boshladim", callback_data: `task:${task.id}:Bajarilmoqda` },
        { text: "Bajarildi", callback_data: `task:${task.id}:Bajarildi` },
      ]],
    },
  });
}

function employeeTaskList(employeeId) {
  const tasks = db.tasks.filter((task) => task.employeeId === employeeId && task.status !== "Bajarildi" && task.status !== "Rad etildi");
  if (!tasks.length) return "Sizga biriktirilgan ochiq vazifa yo'q.";

  return tasks.map((task, index) => [
    `${index + 1}. ${task.title}`,
    `Holat: ${task.status}`,
    `Muddat: ${task.deadline || "-"}`,
    task.description ? `Izoh: ${task.description}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}

async function sendEmployeeTasks(chatId, employeeId) {
  const tasks = db.tasks.filter((task) => task.employeeId === employeeId && task.status !== "Bajarildi" && task.status !== "Rad etildi");
  if (!tasks.length) {
    await telegram("sendMessage", { chat_id: chatId, text: "Sizga biriktirilgan ochiq vazifa yo'q.", reply_markup: mainKeyboard() });
    return;
  }

  for (const task of tasks) {
    await telegram("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: [
        `📌 <b>${task.title}</b>`,
        task.description || "",
        `Holat: ${task.status}`,
        `Muddat: ${task.deadline || "-"}`,
        `Muhimlik: ${task.priority}`,
        `Bonus: ${Number(task.bonusAmount || 0).toLocaleString("uz-UZ")} so'm`,
      ].filter(Boolean).join("\n"),
      reply_markup: {
        inline_keyboard: [[
          { text: "Boshladim", callback_data: `task:${task.id}:Bajarilmoqda` },
          { text: "Bajarildi", callback_data: `task:${task.id}:Bajarildi` },
        ]],
      },
    });
  }
}

function findEmployeeByChat(chatId) {
  return db.employees.find((item) => String(item.telegramChatId) === String(chatId));
}

function upsertAttendance(employee, patch) {
  const date = today();
  let row = db.attendance.find((item) => item.employeeId === employee.id && item.date === date);
  if (!row) {
    row = {
      id: uid("a"),
      employeeId: employee.id,
      employeeName: employee.fullName,
      date,
      checkIn: "-",
      checkOut: "-",
      status: "Vaqtida",
    };
    db.attendance.push(row);
  }

  Object.assign(row, patch);
  return row;
}

function addEmployeeReport(employee, content, attachments = []) {
  db.reports.unshift({
    id: uid("r"),
    employeeId: employee.id,
    employeeName: employee.fullName,
    content,
    date: today(),
    status: "Kutilmoqda",
    attachments,
  });
}

function messagePhotoAttachment(message) {
  const photos = message.photo || [];
  if (!photos.length) return null;

  const largestPhoto = photos[photos.length - 1];
  return {
    type: "photo",
    fileId: largestPhoto.file_id,
    caption: message.caption || "",
  };
}

function messageCvAttachment(message) {
  if (message.document?.file_id) {
    return {
      fileId: message.document.file_id,
      fileName: message.document.file_name || "resume",
      mimeType: message.document.mime_type || "application/octet-stream",
    };
  }

  const photo = messagePhotoAttachment(message);
  if (!photo) return null;
  return {
    fileId: photo.fileId,
    fileName: "resume-photo.jpg",
    mimeType: "image/jpeg",
  };
}

function addEmployeeChat(employee, text, fromMe = false) {
  db.chats[employee.id] = [
    ...(db.chats[employee.id] || []),
    { id: uid("m"), employeeId: employee.id, fromMe, text, time: timeNow() },
  ];
}

function parseTashkentDateTime(value) {
  if (!value) return null;
  if (/[zZ]|[+-]\d\d:\d\d$/.test(value)) return new Date(value);
  return new Date(`${value.length === 16 ? `${value}:00` : value}+05:00`);
}

function meetingText(meeting) {
  return [
    "📣 Muhim yig'ilish",
    `Mavzu: ${meeting.title || "Muhim yig'ilish"}`,
    meeting.scheduledAt ? `Vaqt: ${meeting.scheduledAt.replace("T", " ")}` : meeting.time ? `Vaqt: ${meeting.time}` : "",
    meeting.location ? `Joy: ${meeting.location}` : "",
    meeting.message ? `Izoh: ${meeting.message}` : "",
  ].filter(Boolean).join("\n");
}

async function sendMeetingToEmployees(meeting) {
  const results = [];
  for (const employee of db.employees) {
    if (!employee.telegramChatId) continue;
    const result = await telegram("sendMessage", {
      chat_id: employee.telegramChatId,
      text: meetingText(meeting),
      reply_markup: mainKeyboard(),
    });
    results.push({ employeeId: employee.id, ok: result.ok });
  }
  return results;
}

async function processScheduledMeetings() {
  if (!BOT_TOKEN || !Array.isArray(db.scheduledMeetings)) return;
  const now = Date.now();
  let changed = false;

  for (const meeting of db.scheduledMeetings) {
    if (meeting.status === "sent") continue;
    const scheduledDate = parseTashkentDateTime(meeting.scheduledAt);
    if (!scheduledDate || scheduledDate.getTime() > now) continue;

    const results = await sendMeetingToEmployees(meeting);
    meeting.status = "sent";
    meeting.sentAt = `${today()} ${timeNow()}`;
    meeting.sentCount = results.length;
    changed = true;
  }

  if (changed) saveDb();
}

async function handleTelegramUpdate(update) {
  if (update.message) {
    const chatId = String(update.message.chat.id);
    const photoAttachment = messagePhotoAttachment(update.message);
    const cvAttachment = messageCvAttachment(update.message);
    const text = String(update.message.text || update.message.caption || "").trim();
    const parts = text.split(/\s+/);
    const command = parts[0];

    if (command === "/start") {
      const existingEmployee = findEmployeeByChat(chatId);
      if (existingEmployee) {
        await telegram("sendMessage", {
          chat_id: chatId,
          text: `Siz allaqachon ${existingEmployee.fullName} sifatida kirgansiz.`,
          reply_markup: mainKeyboard(),
        });
        return;
      }

      pendingAuth.set(chatId, { step: "login" });
      await telegram("sendMessage", {
        chat_id: chatId,
        text: `${authHelpText()}\n\nLoginni yuboring:`,
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    const authState = pendingAuth.get(chatId);
    if (authState?.step === "login") {
      pendingAuth.set(chatId, { step: "password", login: text });
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "Endi parolni yuboring:",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (authState?.step === "password") {
      const employee = db.employees.find((item) => item.telegramLogin === authState.login && item.telegramPassword === text);
      if (!employee) {
        pendingAuth.set(chatId, { step: "login" });
        await telegram("sendMessage", {
          chat_id: chatId,
          text: "❌ Login yoki parol noto'g'ri.\nQayta loginni yuboring:",
          reply_markup: { remove_keyboard: true },
        });
        return;
      }

      pendingAuth.delete(chatId);
      await confirmEmployeeLogin(chatId, employee);
      return;
    }

    if (command === "/login") {
      const login = parts[1];
      const password = parts[2];
      if (!login) {
        pendingAuth.set(chatId, { step: "login" });
        await telegram("sendMessage", { chat_id: chatId, text: "Loginni yuboring:", reply_markup: { remove_keyboard: true } });
        return;
      }
      if (!password) {
        pendingAuth.set(chatId, { step: "password", login });
        await telegram("sendMessage", { chat_id: chatId, text: "Parolni yuboring:", reply_markup: { remove_keyboard: true } });
        return;
      }
      const employee = db.employees.find((item) => item.telegramLogin === login && item.telegramPassword === password);
      if (!employee) {
        await telegram("sendMessage", { chat_id: chatId, text: "Login yoki parol noto'g'ri. Qayta urinib ko'ring." });
        return;
      }

      await confirmEmployeeLogin(chatId, employee);
      return;
    }

    const employee = findEmployeeByChat(chatId);
    if (!employee) {
      await telegram("sendMessage", { chat_id: chatId, text: authHelpText() });
      return;
    }

    if (pendingReport.has(chatId)) {
      pendingReport.delete(chatId);
      const content = text || (photoAttachment ? "Rasmli hisobot yuborildi." : "");
      addEmployeeReport(employee, content, photoAttachment ? [photoAttachment] : []);
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: "✅ Kunlik hisobot HR panelga yuborildi.", reply_markup: mainKeyboard() });
      return;
    }

    if (pendingChat.has(chatId)) {
      pendingChat.delete(chatId);
      addEmployeeChat(employee, text, false);
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: "✅ Xabaringiz HR chatga yuborildi.", reply_markup: mainKeyboard() });
      return;
    }

    if (pendingCv.has(chatId)) {
      if (!cvAttachment) {
        await telegram("sendMessage", {
          chat_id: chatId,
          text: "CV yoki resume faylini document/PDF/rasm qilib yuboring.",
          reply_markup: { remove_keyboard: true },
        });
        return;
      }

      pendingCv.delete(chatId);
      employee.cvFileId = cvAttachment.fileId;
      employee.cvFileName = cvAttachment.fileName;
      employee.cvMimeType = cvAttachment.mimeType;
      employee.cvUploadedAt = `${today()} ${timeNow()}`;
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: "✅ CV/resume HR panelga yuklandi.", reply_markup: mainKeyboard() });
      return;
    }

    if (command === "/tasks" || text === "📋 Mening vazifalarim") {
      await sendEmployeeTasks(chatId, employee.id);
      return;
    }

    if (text === "✅ Keldim") {
      const checkIn = timeNow();
      upsertAttendance(employee, {
        checkIn,
        status: checkIn > "09:15" ? "Kechikdi" : "Vaqtida",
      });
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: `✅ Keldi vaqtingiz saqlandi: ${checkIn}`, reply_markup: mainKeyboard() });
      return;
    }

    if (text === "🏁 Ketdim") {
      const checkOut = timeNow();
      upsertAttendance(employee, { checkOut });
      pendingReport.add(chatId);
      saveDb();
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "🏁 Ketish vaqtingiz saqlandi.\n\nBugun ishlar va sizga berilgan vazifalar qilindimi? Kunlik hisobotni yozing yoki rasm yuboring:",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (text === "📝 Kunlik hisobot") {
      pendingReport.add(chatId);
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "Bugungi ishlaringiz bo'yicha hisobot yozing yoki rasm yuboring:",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (text === "💬 HR bilan chat") {
      pendingChat.add(chatId);
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "HRga yubormoqchi bo'lgan xabaringizni yozing:",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (command === "/cv" || text === "📎 CV yuborish") {
      pendingCv.add(chatId);
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "CV yoki resume faylini yuboring. PDF, Word document yoki rasm bo'lishi mumkin.",
        reply_markup: { remove_keyboard: true },
      });
      return;
    }

    if (command === "/help") {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "Tugmalar orqali ishlang:\n✅ Keldim\n🏁 Ketdim\n📋 Mening vazifalarim\n📝 Kunlik hisobot\n💬 HR bilan chat\n📎 CV yuborish",
        reply_markup: mainKeyboard(),
      });
      return;
    }

    if (text.toLowerCase().startsWith("hisobot:")) {
      addEmployeeReport(employee, text.slice("hisobot:".length).trim(), photoAttachment ? [photoAttachment] : []);
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: "✅ Hisobot HR panelga yuborildi.", reply_markup: mainKeyboard() });
      return;
    }

    await telegram("sendMessage", {
      chat_id: chatId,
      text: "Pastdagi tugmalardan foydalaning yoki /help ni bosing.",
      reply_markup: mainKeyboard(),
    });
  }

  if (update.callback_query) {
    const chatId = String(update.callback_query.message.chat.id);
    const [, taskId, status] = String(update.callback_query.data || "").split(":");
    const task = db.tasks.find((item) => item.id === taskId);
    const employee = findEmployeeByChat(chatId);
    if (task && employee && task.employeeId === employee.id) {
      task.status = status;
      saveDb();
      await telegram("answerCallbackQuery", { callback_query_id: update.callback_query.id, text: `Holat: ${status}` });
      await telegram("sendMessage", { chat_id: chatId, text: `✅ "${task.title}" holati yangilandi: ${status}` });
    }
  }
}

async function pollTelegram() {
  if (!BOT_TOKEN || PUBLIC_URL) return;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=25&offset=${telegramOffset}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.ok) return;

    for (const update of data.result) {
      telegramOffset = update.update_id + 1;
      await handleTelegramUpdate(update);
    }
  } catch (error) {
    console.error("Telegram polling error:", error.message);
  } finally {
    setTimeout(pollTelegram, 1000);
  }
}

async function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/state") {
    return sendJson(res, 200, db);
  }

  const telegramFile = url.pathname.match(/^\/api\/telegram\/file\/([^/]+)$/);
  if (req.method === "GET" && telegramFile) {
    if (!BOT_TOKEN) return sendJson(res, 503, { error: "Telegram bot token sozlanmagan" });

    const fileId = decodeURIComponent(telegramFile[1]);
    const fileInfo = await telegram("getFile", { file_id: fileId });
    if (!fileInfo.ok || !fileInfo.result?.file_path) return sendJson(res, 404, { error: "Fayl topilmadi" });

    const fileResponse = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`);
    if (!fileResponse.ok) return sendJson(res, 404, { error: "Faylni yuklab bo'lmadi" });

    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const fileName = url.searchParams.get("name") || path.basename(fileInfo.result.file_path);
    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${String(fileName).replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    });
    res.end(buffer);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/auth-state") {
    return sendJson(res, 200, {
      companies: db.companies || [],
      adminCredentials: db.adminCredentials || defaultAdminCredentials,
    });
  }

  if (req.method === "PUT" && url.pathname === "/api/auth-state") {
    const body = await readBody(req);
    if (Array.isArray(body.companies)) db.companies = body.companies;
    if (body.adminCredentials?.username && body.adminCredentials?.password) {
      db.adminCredentials = {
        username: String(body.adminCredentials.username).trim(),
        password: String(body.adminCredentials.password),
      };
    }
    saveDb();
    return sendJson(res, 200, {
      companies: db.companies || [],
      adminCredentials: db.adminCredentials || defaultAdminCredentials,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/finance-state") {
    const payrollKey = url.searchParams.get("payrollKey") || "default";
    return sendJson(res, 200, {
      settings: { ...defaultFinanceSettings, ...(db.financeSettings || {}) },
      paidIds: db.paidPayroll?.[payrollKey] || [],
    });
  }

  if (req.method === "PUT" && url.pathname === "/api/finance-state") {
    const body = await readBody(req);
    const payrollKey = body.payrollKey || "default";
    db.financeSettings = { ...defaultFinanceSettings, ...(body.settings || {}) };
    db.paidPayroll = db.paidPayroll && typeof db.paidPayroll === "object" ? db.paidPayroll : {};
    if (Array.isArray(body.paidIds)) db.paidPayroll[payrollKey] = body.paidIds;
    saveDb();
    return sendJson(res, 200, {
      settings: db.financeSettings,
      paidIds: db.paidPayroll[payrollKey] || [],
    });
  }

  const telegramPhoto = url.pathname.match(/^\/api\/telegram\/photo\/([^/]+)$/);
  if (req.method === "GET" && telegramPhoto) {
    if (!BOT_TOKEN) return sendJson(res, 503, { error: "Telegram bot token sozlanmagan" });

    const fileId = decodeURIComponent(telegramPhoto[1]);
    const fileInfo = await telegram("getFile", { file_id: fileId });
    if (!fileInfo.ok || !fileInfo.result?.file_path) return sendJson(res, 404, { error: "Rasm topilmadi" });

    const fileResponse = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`);
    if (!fileResponse.ok) return sendJson(res, 404, { error: "Rasmni yuklab bo'lmadi" });

    const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    });
    res.end(buffer);
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/state") {
    const body = await readBody(req);
    db = { ...db, ...body };
    ensureEmployeeCredentials();
    saveDb();
    return sendJson(res, 200, db);
  }

  if (req.method === "POST" && url.pathname === "/api/employees") {
    const body = await readBody(req);
    const employee = {
      ...body,
      id: uid("e"),
      avatarInitials: initials(body.fullName),
      telegramLogin: body.telegramLogin || slugify(body.fullName),
      telegramPassword: body.telegramPassword || makePassword(),
      telegramChatId: body.telegramChatId || "",
    };
    db.employees.push(employee);
    ensureEmployeeCredentials();
    saveDb();
    return sendJson(res, 201, employee);
  }

  if (req.method === "POST" && url.pathname === "/api/tasks") {
    const body = await readBody(req);
    const employee = db.employees.find((item) => item.id === body.employeeId);
    const task = {
      ...body,
      id: uid("t"),
      employeeName: employee?.fullName || "",
      createdAt: today(),
    };
    db.tasks.unshift(task);
    saveDb();
    const telegramResult = await sendTaskToEmployee(task);
    return sendJson(res, 201, { task, telegram: telegramResult });
  }

  if (req.method === "POST" && url.pathname === "/api/payroll/notify") {
    const body = await readBody(req);
    const text = body.message || "💳 Oylik hisob-kitobi tayyorlanmoqda. Iltimos, HR xabarlarini kuzatib boring.";
    const results = [];

    for (const employee of db.employees) {
      if (!employee.telegramChatId) continue;
      const result = await telegram("sendMessage", {
        chat_id: employee.telegramChatId,
        text,
        reply_markup: mainKeyboard(),
      });
      results.push({ employeeId: employee.id, ok: result.ok });
    }

    return sendJson(res, 200, { sent: results.length, results });
  }

  if (req.method === "POST" && url.pathname === "/api/meetings/notify") {
    const body = await readBody(req);
    const results = await sendMeetingToEmployees(body);

    return sendJson(res, 200, { sent: results.length, results });
  }

  if (req.method === "GET" && url.pathname === "/api/meetings/scheduled") {
    return sendJson(res, 200, db.scheduledMeetings || []);
  }

  if (req.method === "POST" && url.pathname === "/api/meetings/scheduled") {
    const body = await readBody(req);
    if (!body.title || !body.scheduledAt) return sendJson(res, 400, { error: "Mavzu va reja vaqti kerak" });
    const meeting = {
      id: uid("meet"),
      title: String(body.title).trim(),
      scheduledAt: String(body.scheduledAt),
      location: String(body.location || ""),
      message: String(body.message || ""),
      status: "scheduled",
      createdAt: `${today()} ${timeNow()}`,
    };
    db.scheduledMeetings.unshift(meeting);
    saveDb();
    return sendJson(res, 201, meeting);
  }

  const scheduledMeetingSend = url.pathname.match(/^\/api\/meetings\/scheduled\/([^/]+)\/send$/);
  if (req.method === "POST" && scheduledMeetingSend) {
    const meeting = db.scheduledMeetings.find((item) => item.id === scheduledMeetingSend[1]);
    if (!meeting) return sendJson(res, 404, { error: "Yig'ilish topilmadi" });
    const results = await sendMeetingToEmployees(meeting);
    meeting.status = "sent";
    meeting.sentAt = `${today()} ${timeNow()}`;
    meeting.sentCount = results.length;
    saveDb();
    return sendJson(res, 200, { meeting, sent: results.length, results });
  }

  const taskStatus = url.pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (req.method === "PATCH" && taskStatus) {
    const body = await readBody(req);
    const task = db.tasks.find((item) => item.id === taskStatus[1]);
    if (!task) return sendJson(res, 404, { error: "Vazifa topilmadi" });
    task.status = body.status;
    saveDb();
    return sendJson(res, 200, task);
  }

  const chatSend = url.pathname.match(/^\/api\/chats\/([^/]+)\/send$/);
  if (req.method === "POST" && chatSend) {
    const body = await readBody(req);
    const employee = db.employees.find((item) => item.id === chatSend[1]);
    if (!employee) return sendJson(res, 404, { error: "Xodim topilmadi" });
    if (!body.text) return sendJson(res, 400, { error: "Xabar matni kerak" });

    addEmployeeChat(employee, body.text, true);
    saveDb();

    let telegramResult = { ok: false, skipped: true };
    if (employee.telegramChatId) {
      telegramResult = await telegram("sendMessage", {
        chat_id: employee.telegramChatId,
        text: `💬 HR xabari:\n${body.text}`,
        reply_markup: mainKeyboard(),
      });
    }

    return sendJson(res, 200, { messages: db.chats[employee.id] || [], telegram: telegramResult });
  }

  if (req.method === "GET" && url.pathname === "/api/telegram/webhook") {
    return sendJson(res, 200, {
      ok: true,
      message: "Telegram webhook endpoint is ready. Telegram sends POST requests here.",
    });
  }

  if (req.method === "POST" && url.pathname === "/api/telegram/webhook") {
    const body = await readBody(req);
    await handleTelegramUpdate(body);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/telegram/set-webhook") {
    if (!PUBLIC_URL) return sendJson(res, 400, { error: "PUBLIC_URL env kerak" });
    const result = await telegram("setWebhook", { url: webhookUrl() });
    return sendJson(res, 200, result);
  }

  if (req.method === "GET" && url.pathname === "/api/telegram/status") {
    const result = await telegram("getWebhookInfo", {});
    return sendJson(res, 200, {
      publicUrl: PUBLIC_URL || null,
      webhookUrl: webhookUrl() || null,
      hasToken: Boolean(BOT_TOKEN),
      webhook: result,
    });
  }

  return sendJson(res, 404, { error: "API topilmadi" });
}

function serveStatic(req, res, url) {
  let filePath = path.join(DIST_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await routeApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Server xatosi" });
  }
});

server.listen(PORT, () => {
  console.log(`yourHR server: http://localhost:${PORT}`);
  console.log(BOT_TOKEN ? "Telegram bot token loaded" : "Telegram bot token not set");
  configureTelegramDelivery().catch((error) => console.error("Telegram setup error:", error.message));
  processScheduledMeetings().catch((error) => console.error("Meeting scheduler error:", error.message));
  setInterval(() => {
    processScheduledMeetings().catch((error) => console.error("Meeting scheduler error:", error.message));
  }, 60000);
});
