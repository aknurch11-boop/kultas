// Хранилище партий и заказов: JSON-файл. Для MVP достаточно; в продакшене — PostgreSQL + PostGIS.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { CONFIG } from "./config.js";
import { getRoute } from "./route.js";
import { buildTimeline, tripState } from "../public/js/trip.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(here, "..", "data", "kultas.json");

// Демо-партии. Координаты станций — из OpenStreetMap. Объёмы, цены и анализы — ДЕМО-данные,
// не реальные предложения и не реальные анализы этих станций.
const SEED_BATCHES = [
  {
    id: "b-astana-fly", code: "KT-B-101", type: "fly_ash", tons: 1200, pricePerTon: 9000,
    plant: { ru: "ТЭЦ-2, Астана", kk: "Астана ЖЭО-2", en: "CHP-2, Astana" },
    city: { ru: "Астана", kk: "Астана", en: "Astana" }, lat: 51.1869, lng: 71.5124,
    lab: { main: 88.4, cao: 3.1, loi: 2.6, so3: 0.4, moisture: 0.5, activity: 255, testedAt: "2026-10-10" },
    subtype: "acid", gostKind: "II", shipment: ["pneumo", "bigbag"],
  },
  {
    id: "b-astana-slag", code: "KT-B-102", type: "ash_slag", tons: 5000, pricePerTon: 4000, shipment: ["bulk"],
    plant: { ru: "ТЭЦ-2, Астана", kk: "Астана ЖЭО-2", en: "CHP-2, Astana" },
    city: { ru: "Астана", kk: "Астана", en: "Astana" }, lat: 51.1902, lng: 71.5181,
    lab: { main: 84.9, cao: 3.6, loi: 4.8, so3: 0.6, moisture: 12.0, activity: 270, testedAt: "2026-10-12" },
  },
  {
    id: "b-ekib-fly", code: "KT-B-201", type: "fly_ash", tons: 3000, pricePerTon: 7000,
    plant: { ru: "ГРЭС-1, Экибастуз", kk: "Екібастұз ГРЭС-1", en: "GRES-1, Ekibastuz" },
    city: { ru: "Экибастуз", kk: "Екібастұз", en: "Ekibastuz" }, lat: 51.8917, lng: 75.39,
    lab: { main: 89.7, cao: 2.4, loi: 1.9, so3: 0.3, moisture: 0.4, activity: 240, testedAt: "2026-10-05" },
    subtype: "acid", gostKind: "I", shipment: ["pneumo"],
  },
  {
    id: "b-pvl-fly", code: "KT-B-301", type: "fly_ash", tons: 800, pricePerTon: 8000,
    plant: { ru: "ТЭЦ-3, Павлодар", kk: "Павлодар ЖЭО-3", en: "CHP-3, Pavlodar" },
    city: { ru: "Павлодар", kk: "Павлодар", en: "Pavlodar" }, lat: 52.3656, lng: 76.9338,
    lab: { main: 87.2, cao: 3.4, loi: 3.1, so3: 0.5, moisture: 0.6, activity: 262, testedAt: "2026-09-28" },
    subtype: "acid", gostKind: "III", shipment: ["pneumo", "bigbag"],
  },
  {
    id: "b-krg-slag", code: "KT-B-401", type: "ash_slag", tons: 2500, pricePerTon: 5000, shipment: ["bulk"],
    plant: { ru: "ТЭЦ-3, Караганда", kk: "Қарағанды ЖЭО-3", en: "CHP-3, Karaganda" },
    city: { ru: "Караганда", kk: "Қарағанды", en: "Karaganda" }, lat: 49.916, lng: 73.2375,
    lab: { main: 83.5, cao: 4.2, loi: 5.2, so3: 0.7, moisture: 10.5, activity: 280, testedAt: "2026-10-01" },
  },
  {
    id: "b-krg-bottom", code: "KT-B-402", type: "slag", tons: 1500, pricePerTon: 3000, shipment: ["bulk"],
    plant: { ru: "ТЭЦ-3, Караганда", kk: "Қарағанды ЖЭО-3", en: "CHP-3, Karaganda" },
    city: { ru: "Караганда", kk: "Қарағанды", en: "Karaganda" }, lat: 49.9185, lng: 73.2421,
    lab: { main: 82.1, cao: 4.6, loi: 6.0, so3: 0.5, moisture: 8.0, activity: 275, testedAt: "2026-10-02" },
  },
  {
    id: "b-ekib-ceno", code: "KT-B-202", type: "cenospheres", tons: 40, pricePerTon: 45000, shipment: ["bigbag"],
    plant: { ru: "ГРЭС-1, Экибастуз", kk: "Екібастұз ГРЭС-1", en: "GRES-1, Ekibastuz" },
    city: { ru: "Экибастуз", kk: "Екібастұз", en: "Ekibastuz" }, lat: 51.8949, lng: 75.3951,
    lab: { main: 92.5, cao: 1.1, loi: 0.8, so3: 0.1, moisture: 0.3, activity: 230, testedAt: "2026-10-06" },
  },
];

// Демо-запросы покупателей (доска запросов). Помечены demo: true.
const city = (ru, kk, en) => ({ ru, kk, en });
const SEED_REQUESTS = [
  {
    company: city("Завод ЖБИ (демо)", "ТБИ зауыты (демо)", "Precast plant (demo)"),
    type: "fly_ash", tons: 300, city: city("Астана", "Астана", "Astana"), deadline: "2026-11-15", maxPrice: 9500,
    comment: city("Для бетона класса B25, нужен паспорт качества.", "B25 сыныпты бетонға, сапа паспорты қажет.", "For B25 concrete, a quality passport is required."),
    offers: [{ plant: "ТЭЦ-2, Астана (демо)", price: 9000, comment: "" }],
  },
  {
    company: city("Дорожно-строительная компания (демо)", "Жол құрылысы компаниясы (демо)", "Road construction company (demo)"),
    type: "ash_slag", tons: 2000, city: city("Караганда", "Қарағанды", "Karaganda"), deadline: "2026-12-01", maxPrice: 5500,
    comment: city("Укрепление грунта под дорогу.", "Жол астындағы топырақты бекіту.", "Soil stabilisation for a road."),
    offers: [],
  },
  {
    company: city("Производитель газоблоков (демо)", "Газоблок өндірушісі (демо)", "Aerated block maker (demo)"),
    type: "fly_ash", tons: 120, city: city("Павлодар", "Павлодар", "Pavlodar"), deadline: "2026-11-10", maxPrice: 8500,
    comment: city("Каждый месяц, нужна стабильная влажность.", "Ай сайын, тұрақты ылғалдылық қажет.", "Monthly, stable moisture needed."),
    offers: [],
  },
  {
    company: city("Застройщик (демо)", "Құрылыс салушы (демо)", "Developer (demo)"),
    type: "fly_ash", tons: 800, city: city("Астана", "Астана", "Astana"), deadline: "2026-12-20", maxPrice: 10000,
    comment: city("Для фундаментов ЖК, нужен анализ на радиацию.", "ТК іргетастарына, радиацияға талдау қажет.", "For housing foundations, radiation test needed."),
    offers: [],
  },
];

const DEMO_PLANT = { lat: 51.124, lng: 71.56, label: { ru: "Бетонный завод (демо), Астана", kk: "Бетон зауыты (демо), Астана", en: "Concrete plant (demo), Astana" } };
const LIVE_DEMO_CODE = "KT-1001";

let db = { batches: [], orders: [] };

export async function init() {
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    db = { batches: SEED_BATCHES.map((b) => ({ ...b, tonsAvailable: b.tons, demo: true, createdAt: new Date().toISOString() })), orders: [] };
    const yesterday = Date.now() - 26 * 3600_000;
    await createOrder({ batchId: "b-ekib-fly", tons: 50, company: "Бетонный завод (демо)", contact: "", dest: DEMO_PLANT }, { code: "KT-0999", startMs: yesterday, demo: true });
    await createOrder({ batchId: "b-astana-fly", tons: 25, company: "Бетонный завод (демо)", contact: "", dest: DEMO_PLANT }, { code: LIVE_DEMO_CODE, startMs: Date.now() - 35_000, tripSeconds: 300, demo: true });
  }
  if (!db.requests) {
    const now = Date.now();
    db.requests = SEED_REQUESTS.map((r, i) => ({
      ...r,
      id: `r-${crypto.randomUUID().slice(0, 8)}`,
      contact: "",
      demo: true,
      createdAt: new Date(now - (i + 1) * 5 * 3600_000).toISOString(),
      offers: r.offers.map((o) => ({ ...o, createdAt: new Date(now - i * 3600_000).toISOString() })),
    }));
  }
  restartLiveDemo();
  persist();
}

export const listRequests = () => [...db.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function addRequest(input) {
  const request = { id: `r-${crypto.randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString(), demo: false, offers: [], ...input };
  db.requests.push(request);
  persist();
  return request;
}

export function addOffer(requestId, offer) {
  const request = db.requests.find((r) => r.id === requestId);
  if (!request) return null;
  request.offers.push({ ...offer, createdAt: new Date().toISOString() });
  persist();
  return request;
}

// Демо-машина KT-1001 всегда в пути, чтобы трекинг можно было показать в любой момент.
function restartLiveDemo() {
  const order = db.orders.find((o) => o.code === LIVE_DEMO_CODE);
  if (order && tripState(order.timeline, Date.now()).phase === "delivered") {
    order.timeline = buildTimeline(Date.now() - 35_000, 300);
  }
}

function persist() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
}

export const listBatches = () => [...db.batches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getBatch = (id) => db.batches.find((b) => b.id === id) ?? null;

export function addBatch(input) {
  const batch = {
    id: `b-${crypto.randomUUID().slice(0, 8)}`,
    code: `KT-B-${String(500 + db.batches.length).padStart(3, "0")}`,
    tonsAvailable: input.tons,
    demo: false,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.batches.push(batch);
  persist();
  return batch;
}

export const listOrders = () => [...db.orders].sort((a, b) => b.timeline.accepted - a.timeline.accepted);
export const getOrder = (code) => db.orders.find((o) => o.code === code.toUpperCase()) ?? null;

const DRIVERS = ["Ерлан", "Асхат", "Нурлан", "Марат", "Дана", "Айбек"];
const LETTERS = "ABCEHKMOPTX";

export async function createOrder(input, { code, startMs = Date.now(), tripSeconds = CONFIG.demoTripSeconds, demo = false } = {}) {
  const batch = getBatch(input.batchId);
  const route = await getRoute({ lat: batch.lat, lng: batch.lng }, input.dest);
  const pick = (s) => s[crypto.randomInt(s.length)];
  const order = {
    id: crypto.randomUUID(),
    code: code ?? uniqueCode(),
    batchId: batch.id,
    company: input.company,
    contact: input.contact,
    tons: input.tons,
    pricePerTon: batch.pricePerTon,
    dest: input.dest,
    route,
    trips: Math.ceil(input.tons / CONFIG.truckCapacityTons),
    truck: {
      plate: `${crypto.randomInt(100, 999)} ${pick(LETTERS)}${pick(LETTERS)}${pick(LETTERS)} 01`,
      driver: pick(DRIVERS),
    },
    timeline: buildTimeline(startMs, tripSeconds),
    demo,
  };
  batch.tonsAvailable = Math.max(0, batch.tonsAvailable - input.tons);
  db.orders.push(order);
  persist();
  return order;
}

function uniqueCode() {
  let code;
  do code = `KT-${crypto.randomInt(1000, 9999)}`;
  while (db.orders.some((o) => o.code === code));
  return code;
}

export function stats(now = Date.now()) {
  let delivered = 0;
  let inTransit = 0;
  for (const o of db.orders) {
    if (tripState(o.timeline, now).phase === "delivered") delivered += o.tons;
    else inTransit += o.tons;
  }
  return {
    tonsDelivered: delivered,
    tonsInTransit: inTransit,
    tonsAvailable: db.batches.reduce((s, b) => s + b.tonsAvailable, 0),
    co2Avoided: Math.round(delivered * CONFIG.co2PerTonCement * 10) / 10,
    orders: db.orders.length,
    batches: db.batches.length,
    revenue: delivered * CONFIG.commissionPerTon,
  };
}
