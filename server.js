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

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}${Date.now()}${crypto.randomBytes(2).toString("hex")}`;

const seed = {
  employees: [
    { id: "e1", fullName: "Aziza Karimova", position: "HR Menejer", salary: 12000000, kpi: 94, status: "Faol", avatarInitials: "AK", phone: "+998 90 123 45 67", email: "aziza@company.uz", joinedAt: "2022-03-15", telegramChatId: "" },
    { id: "e2", fullName: "Bekzod Yusupov", position: "Frontend Dasturchi", salary: 18000000, kpi: 88, status: "Faol", avatarInitials: "BY", phone: "+998 90 234 56 78", email: "bekzod@company.uz", joinedAt: "2021-07-01", telegramChatId: "" },
  ],
  tasks: [
    { id: "t1", title: "Dashboard KPI grafiklari", description: "Recharts bilan grafiklar", employeeId: "e2", employeeName: "Bekzod Yusupov", status: "Kutilmoqda", priority: "Yuqori", deadline: today(), bonusAmount: 500000, createdAt: today() },
  ],
  attendance: [],
  reports: [],
  tickets: [],
  rules: { lateFine: 50000, taskDelayFine: 100000, minKpi: 70, earlyBonus: 200000 },
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

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return structuredClone(seed);
  }

  return { ...structuredClone(seed), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
}

let db = loadDb();

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
      { command: "tasks", description: "Menga biriktirilgan vazifalar" },
      { command: "help", description: "Botdan foydalanish" },
    ],
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

async function handleTelegramUpdate(update) {
  if (update.message) {
    const chatId = String(update.message.chat.id);
    const text = String(update.message.text || "").trim();
    const [command, arg] = text.split(/\s+/, 2);

    if (command === "/start") {
      const employee = db.employees.find((item) => item.id === arg);
      if (!employee) {
        await telegram("sendMessage", {
          chat_id: chatId,
          text: "Assalomu alaykum. HR paneldan berilgan ulanish kodini yuboring: /start e2",
        });
        return;
      }

      employee.telegramChatId = chatId;
      saveDb();
      await telegram("sendMessage", {
        chat_id: chatId,
        text: `✅ ${employee.fullName}, botga ulandingiz.\nVazifalarni ko'rish: /tasks\nHisobot yuborish: hisobot: bugun ...`,
      });
      return;
    }

    const employee = db.employees.find((item) => String(item.telegramChatId) === chatId);
    if (!employee) {
      await telegram("sendMessage", { chat_id: chatId, text: "Avval HR paneldagi kodingiz bilan ulang: /start e2" });
      return;
    }

    if (command === "/tasks") {
      await telegram("sendMessage", { chat_id: chatId, text: employeeTaskList(employee.id) });
      return;
    }

    if (command === "/help") {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "Buyruqlar:\n/tasks - vazifalar\nhisobot: matn - kunlik hisobot yuborish\n\nVazifa kelganda tugmalar orqali statusni yangilang.",
      });
      return;
    }

    if (text.toLowerCase().startsWith("hisobot:")) {
      db.reports.unshift({
        id: uid("r"),
        employeeId: employee.id,
        employeeName: employee.fullName,
        content: text.slice("hisobot:".length).trim(),
        date: today(),
        status: "Kutilmoqda",
      });
      saveDb();
      await telegram("sendMessage", { chat_id: chatId, text: "✅ Hisobot HR panelga yuborildi." });
      return;
    }

    await telegram("sendMessage", {
      chat_id: chatId,
      text: "Buyruqlar:\n/tasks - vazifalar\nhisobot: matn - kunlik hisobot yuborish",
    });
  }

  if (update.callback_query) {
    const chatId = String(update.callback_query.message.chat.id);
    const [, taskId, status] = String(update.callback_query.data || "").split(":");
    const task = db.tasks.find((item) => item.id === taskId);
    const employee = db.employees.find((item) => String(item.telegramChatId) === chatId);
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

  if (req.method === "PUT" && url.pathname === "/api/state") {
    const body = await readBody(req);
    db = { ...db, ...body };
    saveDb();
    return sendJson(res, 200, db);
  }

  if (req.method === "POST" && url.pathname === "/api/employees") {
    const body = await readBody(req);
    const employee = { ...body, id: uid("e"), avatarInitials: initials(body.fullName), telegramChatId: body.telegramChatId || "" };
    db.employees.push(employee);
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

  const taskStatus = url.pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (req.method === "PATCH" && taskStatus) {
    const body = await readBody(req);
    const task = db.tasks.find((item) => item.id === taskStatus[1]);
    if (!task) return sendJson(res, 404, { error: "Vazifa topilmadi" });
    task.status = body.status;
    saveDb();
    return sendJson(res, 200, task);
  }

  if (req.method === "POST" && url.pathname === "/api/telegram/webhook") {
    const body = await readBody(req);
    await handleTelegramUpdate(body);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/telegram/set-webhook") {
    if (!PUBLIC_URL) return sendJson(res, 400, { error: "PUBLIC_URL env kerak" });
    const result = await telegram("setWebhook", { url: `${PUBLIC_URL.replace(/\/$/, "")}/api/telegram/webhook` });
    return sendJson(res, 200, result);
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
  if (BOT_TOKEN) {
    setBotCommands().catch((error) => console.error("Telegram commands error:", error.message));
    if (!PUBLIC_URL) {
      console.log("Telegram polling mode enabled");
      pollTelegram();
    }
  }
});
