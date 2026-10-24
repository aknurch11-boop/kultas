// KülTas — бэкенд. Express отдаёт фронтенд (папка public) и REST API.
import express from "express";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "./lib/store.js";
import { CONFIG } from "./lib/config.js";
import { getRoute } from "./lib/route.js";
import { tripState } from "./public/js/trip.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
// Виды золошлаковых материалов: зола-унос, золошлаковая смесь, топливный шлак, ценосферы.
const TYPES = new Set(["fly_ash", "ash_slag", "slag", "cenospheres"]);
// Класс золы-уноса и вид по ГОСТ 25818-91, способ отгрузки.
const SUBTYPES = new Set(["acid", "basic"]);
const GOST_KINDS = new Set(["I", "II", "III", "IV"]);
const SHIPMENT = new Set(["bulk", "pneumo", "bigbag"]);
const UPLOAD_DIR = path.join(here, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
// Публикация партии приходит с фото (до 3 сжатых JPEG), поэтому лимит больше.
app.use("/api/batches", express.json({ limit: "8mb" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(here, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

// Фото приходят из браузера уже сжатыми, как data URL. Проверяем формат и размер и сохраняем файлом.
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
function savePhotos(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > 3) return null;
  const saved = [];
  for (const dataUrl of list) {
    const m = PHOTO_RE.exec(String(dataUrl));
    if (!m) return null;
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > 3 * 1024 * 1024) return null;
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    saved.push(`/uploads/${name}`);
  }
  return saved;
}

// Казахстан с запасом — чтобы не строить маршруты на другой конец света.
const inKazakhstan = (lat, lng) => lat > 40 && lat < 56 && lng > 46 && lng < 88;
const text = (v, max) => String(v ?? "").trim().slice(0, max);
const optNum = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

// Короткая версия заказа для списков (без координат маршрута).
function summary(order, now) {
  const batch = store.getBatch(order.batchId);
  const { route, ...rest } = order;
  return { ...rest, distanceKm: route.distanceKm, plant: batch?.plant, state: tripState(order.timeline, now) };
}

app.get("/api/config", (_req, res) => res.json(CONFIG));

app.get("/api/stats", (_req, res) => res.json(store.stats()));

app.get("/api/batches", (_req, res) => res.json(store.listBatches()));

app.get("/api/batches/:id", (req, res) => {
  const batch = store.getBatch(req.params.id);
  if (!batch) return res.status(404).json({ error: "not_found" });
  res.json(batch);
});

// ТЭЦ публикует новую партию.
app.post("/api/batches", (req, res) => {
  const b = req.body ?? {};
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const tons = Number(b.tons);
  const pricePerTon = Number(b.pricePerTon);
  const plant = text(b.plant, 80);
  if (plant.length < 2) return res.status(400).json({ error: "plant" });
  if (!TYPES.has(b.type)) return res.status(400).json({ error: "type" });
  if (!inKazakhstan(lat, lng)) return res.status(400).json({ error: "location" });
  if (!(tons > 0 && tons <= 10_000_000)) return res.status(400).json({ error: "tons" });
  if (!(pricePerTon >= 0 && pricePerTon <= 1_000_000)) return res.status(400).json({ error: "price" });
  const photos = savePhotos(b.photos);
  if (!photos) return res.status(400).json({ error: "photo" });

  const lab = b.lab ?? {};
  const batch = store.addBatch({
    plant,
    city: text(b.city, 40),
    type: b.type,
    subtype: b.type === "fly_ash" && SUBTYPES.has(b.subtype) ? b.subtype : null,
    gostKind: b.type === "fly_ash" && GOST_KINDS.has(b.gostKind) ? b.gostKind : null,
    shipment: Array.isArray(b.shipment) ? b.shipment.filter((s) => SHIPMENT.has(s)) : [],
    photos,
    lat,
    lng,
    tons,
    pricePerTon,
    lab: {
      main: optNum(lab.main),
      cao: optNum(lab.cao),
      loi: optNum(lab.loi),
      so3: optNum(lab.so3),
      moisture: optNum(lab.moisture),
      activity: optNum(lab.activity),
      testedAt: text(lab.testedAt, 10) || null,
    },
  });
  res.status(201).json(batch);
});

app.get("/api/orders", (_req, res) => {
  const now = Date.now();
  res.json({ serverNow: now, orders: store.listOrders().map((o) => summary(o, now)) });
});

// Трекинг: полный заказ с маршрутом + серверное время, чтобы браузер двигал машину синхронно.
app.get("/api/orders/:code", (req, res) => {
  const order = store.getOrder(req.params.code);
  if (!order) return res.status(404).json({ error: "not_found" });
  const now = Date.now();
  res.json({ serverNow: now, order: { ...order, state: tripState(order.timeline, now) }, batch: store.getBatch(order.batchId) });
});

// Завод заказывает золу. Сервер строит маршрут ТЭЦ → завод и запускает поездку.
app.post("/api/orders", async (req, res) => {
  const b = req.body ?? {};
  const batch = store.getBatch(b.batchId);
  if (!batch) return res.status(400).json({ error: "batch" });
  const tons = Number(b.tons);
  if (!(tons > 0)) return res.status(400).json({ error: "tons" });
  if (tons > batch.tonsAvailable) return res.status(400).json({ error: "tons_available" });
  const company = text(b.company, 80);
  if (company.length < 2) return res.status(400).json({ error: "company" });
  const lat = Number(b.dest?.lat);
  const lng = Number(b.dest?.lng);
  if (!inKazakhstan(lat, lng)) return res.status(400).json({ error: "dest" });

  const order = await store.createOrder({
    batchId: batch.id,
    tons,
    company,
    contact: text(b.contact, 80),
    dest: { lat, lng, label: company },
  });
  res.status(201).json({ code: order.code });
});

// --- Корзина: расчёт доставки и оформление нескольких партий сразу ---

function validateCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) return { error: "items" };
  const lines = [];
  for (const it of items) {
    const batch = store.getBatch(it.batchId);
    const tons = Number(it.tons);
    if (!batch) return { error: "batch" };
    if (!(tons > 0)) return { error: "tons" };
    if (tons > batch.tonsAvailable) return { error: "tons_available", batchId: batch.id };
    lines.push({ batch, tons });
  }
  return { lines };
}

// Цена с доставкой: расстояние по реальным дорогам × тонны × тариф (тариф — предположение).
app.post("/api/quote", async (req, res) => {
  const { lines, error, batchId } = validateCart(req.body?.items);
  if (error) return res.status(400).json({ error, batchId });
  const lat = Number(req.body?.dest?.lat);
  const lng = Number(req.body?.dest?.lng);
  if (!inKazakhstan(lat, lng)) return res.status(400).json({ error: "dest" });

  const quotes = await Promise.all(
    lines.map(async ({ batch, tons }) => {
      const route = await getRoute({ lat: batch.lat, lng: batch.lng }, { lat, lng });
      return {
        batchId: batch.id,
        tons,
        goods: tons * batch.pricePerTon,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        trips: Math.ceil(tons / CONFIG.truckCapacityTons),
        delivery: Math.round(tons * route.distanceKm * CONFIG.deliveryPerTonKm),
        service: tons * CONFIG.commissionPerTon,
      };
    }),
  );
  const sum = (k) => quotes.reduce((s, q) => s + q[k], 0);
  res.json({ quotes, totals: { goods: sum("goods"), delivery: sum("delivery"), service: sum("service"), total: sum("goods") + sum("delivery") + sum("service") } });
});

app.post("/api/checkout", async (req, res) => {
  const { lines, error, batchId } = validateCart(req.body?.items);
  if (error) return res.status(400).json({ error, batchId });
  const company = text(req.body?.company, 80);
  if (company.length < 2) return res.status(400).json({ error: "company" });
  const lat = Number(req.body?.dest?.lat);
  const lng = Number(req.body?.dest?.lng);
  if (!inKazakhstan(lat, lng)) return res.status(400).json({ error: "dest" });

  const codes = [];
  for (const { batch, tons } of lines) {
    const order = await store.createOrder({ batchId: batch.id, tons, company, contact: text(req.body.contact, 80), dest: { lat, lng, label: company } });
    codes.push(order.code);
  }
  res.status(201).json({ codes });
});

// --- Доска запросов покупателей (RFQ) ---

app.get("/api/requests", (_req, res) => res.json(store.listRequests()));

app.post("/api/requests", (req, res) => {
  const b = req.body ?? {};
  const company = text(b.company, 80);
  const tons = Number(b.tons);
  const maxPrice = optNum(b.maxPrice);
  if (company.length < 2) return res.status(400).json({ error: "company" });
  if (!TYPES.has(b.type)) return res.status(400).json({ error: "type" });
  if (!(tons > 0 && tons <= 1_000_000)) return res.status(400).json({ error: "tons" });
  if (maxPrice !== null && !(maxPrice >= 0 && maxPrice <= 1_000_000)) return res.status(400).json({ error: "price" });
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(b.deadline ?? "") ? b.deadline : null;
  const request = store.addRequest({
    company,
    contact: text(b.contact, 80),
    type: b.type,
    tons,
    city: text(b.city, 40),
    deadline,
    maxPrice,
    comment: text(b.comment, 300),
  });
  res.status(201).json(request);
});

app.post("/api/requests/:id/offers", (req, res) => {
  const b = req.body ?? {};
  const plant = text(b.plant, 80);
  const price = Number(b.price);
  if (plant.length < 2) return res.status(400).json({ error: "plant" });
  if (!(price >= 0 && price <= 1_000_000)) return res.status(400).json({ error: "price" });
  const request = store.addOffer(req.params.id, { plant, price, comment: text(b.comment, 200) });
  if (!request) return res.status(404).json({ error: "not_found" });
  res.status(201).json(request);
});

app.use((err, _req, res, _next) => {
  if (err.type === "entity.too.large") return res.status(400).json({ error: "photo" });
  console.error(err);
  res.status(500).json({ error: "server" });
});

await store.init();
app.listen(PORT, () => console.log(`KülTas: http://localhost:${PORT}`));
