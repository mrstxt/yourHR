import { Bot, Camera, CheckCircle2, Megaphone, PlugZap, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { name: "Telegram bot", status: "Ulangan", detail: "Mavjud bot handlerlari orqali lid va xodim amallari" },
  { name: "Sayt forma", status: "Tayyor", detail: "Qo'lda kiritish va web formadan lid qabul qilish" },
  { name: "WhatsApp Business", status: "Rejada", detail: "Twilio yoki 360dialog BSP orqali" },
  { name: "Instagram/Facebook", status: "Rejada", detail: "Meta Business API va App Review talab qilinadi" },
  { name: "Webhook queue", status: "Rejada", detail: "Retry mexanizmi bilan ishonchli qabul qilish" },
];

const automations = [
  "Yangi lidga darhol avtomatik salomlashish xabari",
  "N kun harakatsiz lid bo'yicha mas'ul xodimga ichki eslatma",
  "Bitim yopilganda mijozga avtomatik tasdiqlash xabari",
  "Segmentlangan broadcast kampaniyalari uchun ehtiyotkor navbat",
  "Email marketing kampaniyalari uchun keyingi modul",
];

const security = [
  "RBAC: maosh, karta va moliya ma'lumotlari faqat tegishli rolga ko'rinadi",
  "Bot parol va karta raqamlarini shifrlab saqlash",
  "Lavozim, maosh va qoida o'zgarishlari bo'yicha audit tarixi",
  "Qoida o'zgarganda eski hisob-kitoblar qayta hisoblanib ketmasligi",
  "Shaxsga doir ma'lumotlar uchun O'zbekiston talablari bo'yicha tayyorgarlik",
];

const premium = [
  "Face ID orqali xodim davomati",
  "Video saqlamasdan yuz embeddingi asosida tanish",
  "Anonim umumiy tashrif hisoblagichi",
  "Rozilik varaqasi va premium modul sifatida alohida yoqish",
];

const roadmap = [
  { title: "SOP", text: "Lavozim bo'yicha standart jarayonlar, checklist va onboarding" },
  { title: "Kaizen", text: "Xodimlardan yaxshilash takliflari va rag'batlantirish workflow'i" },
  { title: "Sotuv tahlili", text: "Yo'qotilgan lid sabablari, qo'ng'iroq transkripsiyasi va AI tahlil" },
  { title: "Ishga olish testi", text: "Savol banki, baholash rubrikasi va KPI bilan solishtirish" },
];

export default function Automation() {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Integratsiya va avtomatizatsiya</h1>
            <p className="text-sm text-muted-foreground">CRM manbalari, marketing triggerlari, xavfsizlik va premium modullar nazorati.</p>
          </div>
          <Badge variant="outline">MIZAAM 1.0 + roadmap</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel icon={PlugZap} title="Lid manbalari">
          <div className="space-y-3">
            {integrations.map((item) => (
              <div key={item.name} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
                  </div>
                  <Badge variant={item.status === "Ulangan" ? "default" : "outline"}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={Megaphone} title="Marketing avtomatizatsiyasi">
          <Checklist items={automations} />
        </Panel>

        <Panel icon={ShieldCheck} title="Xavfsizlik va huquqiy muvofiqlik">
          <Checklist items={security} />
        </Panel>

        <Panel icon={Camera} title="Premium Computer Vision">
          <Checklist items={premium} />
        </Panel>
      </div>

      <Panel icon={Workflow} title="Zahiradagi katta yo'nalishlar">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roadmap.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-4">
              <div className="font-display font-bold">{item.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel icon={Bot} title="Telegram va xodim kanali">
        <Checklist items={[
          "Ishga kelgan/ketganini belgilash",
          "Kunlik hisobot yuborish",
          "Vazifalarni ko'rish va status yangilash",
          "HR bilan chat orqali bog'lanish",
          "Xodim web-paneli bilan real vaqt sinxron preview",
        ]} />
      </Panel>

      <Panel icon={PlugZap} title="Avtomatik lead qabul qilish">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <CodeBox
            title="Sayt forma"
            code={`POST /api/leads/intake\n{\n  "source": "Sayt forma",\n  "name": "Ali Valiyev",\n  "phone": "+998901112233",\n  "message": "Demo kerak"\n}`}
          />
          <CodeBox
            title="Social webhook"
            code={`POST /api/social/webhook\n{\n  "source": "Instagram",\n  "lead": {\n    "name": "Madina",\n    "phone": "+998912223344"\n  }\n}`}
          />
          <CodeBox
            title="Telegram guruh"
            code={`Botni guruhga qo'shing.\nXabarda telefon bo'lsa CRMga tushadi:\n"Akmal +998 93 123 45 67 demo so'radi"\n\nYoki private chatda:\n/lead Akmal +998931234567`}
          />
        </div>
      </Panel>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function CodeBox({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 font-semibold">{title}</div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
