// Общие функции всех страниц: запросы к API, карта, иконки, форматирование.
// Leaflet (глобальная переменная L) подключается в HTML до модулей.
import { getLang, t } from "./i18n.js";

export const ASTANA = [51.1694, 71.4491];

// Виды золошлаковых материалов (порядок = порядок в фильтрах и форме).
export const TYPES = ["fly_ash", "ash_slag", "slag", "cenospheres"];
export const TYPE_COLOR = { fly_ash: "#1d4ed8", ash_slag: "#475569", slag: "#7c3aed", cenospheres: "#0891b2" };

// Фото видов золы для раздела «Какая бывает зола» (Wikimedia Commons, свободные лицензии).
export const TYPE_PHOTO = {
  fly_ash: { src: "/img/ash/fly_ash.jpg", credit: "FHWA, U.S. DOT — public domain", url: "https://commons.wikimedia.org/wiki/File:Fly_Ash_FHWA_dot_gov.jpg" },
  ash_slag: { src: "/img/ash/ash_slag.jpg", credit: "Dr Anatoly — CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:The_ash_pond_of_the_thermal_power_plant_is_a_future_mineral_Deposit.jpg" },
  slag: { src: "/img/ash/slag.jpg", credit: "Fintan264 — CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Lynemouth_power_station_ash.JPG" },
  cenospheres: { src: "/img/ash/cenospheres.jpg", credit: "Dr Anatoly — CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Microphotography_of_the_hollow_cenosphere.jpg" },
};

export const typePhotoHtml = (type) => `<img class="type-photo" src="${TYPE_PHOTO[type].src}" alt="" loading="lazy">`;

// Строка с авторами фото — требование лицензий CC BY / CC BY-SA.
export const photoCreditsHtml = (label) =>
  `<p class="credits">${label}: ${Object.values(TYPE_PHOTO)
    .map((p) => `<a href="${p.url}" target="_blank" rel="noopener">${p.credit}</a>`)
    .join(" · ")} (Wikimedia Commons)</p>`;

// Обложка карточки: первое фото партии или «образец материала», если фото нет.
export function coverHtml(batch, cls = "") {
  const photo = batch.photos?.[0];
  return photo
    ? `<img class="cover ${cls}" src="${photo}" alt="" loading="lazy">`
    : `<div class="swatch ${batch.type} ${cls}"></div>`;
}

export async function api(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `http_${res.status}`);
    err.code = body.error;
    throw err;
  }
  return body;
}

export const postJson = (url, data) =>
  api(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export function createMap(elementId, { center = ASTANA, zoom = 6 } = {}) {
  const map = L.map(elementId, { scrollWheelZoom: false, zoomControl: true }).setView(center, zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);
  return map;
}

// Иконка станции/партии: кружок цвета типа золы с тоннажем.
export function batchIcon(batch) {
  const label = batch.tonsAvailable >= 1000 ? `${Math.round(batch.tonsAvailable / 100) / 10}k` : String(batch.tonsAvailable);
  return L.divIcon({
    className: "pin",
    html: `<span style="--c:${TYPE_COLOR[batch.type]}">${label}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const TRUCK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';

export const truckIcon = () =>
  L.divIcon({ className: "truck", html: `<span class="truck-pulse"></span><span class="truck-body">${TRUCK_SVG}</span>`, iconSize: [46, 46], iconAnchor: [23, 23] });

export const endpointIcon = (kind) =>
  L.divIcon({ className: `endpoint ${kind}`, html: kind === "from" ? "🏭" : "🏗️", iconSize: [36, 36], iconAnchor: [18, 18] });

export function fmtNum(n, digits = 0) {
  const locale = { ru: "ru-RU", kk: "kk-KZ", en: "en-US" }[getLang()];
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}

export const fmtKzt = (n) => `${fmtNum(Math.round(n))} ₸`;

// 125000 мс → «2:05»
export function fmtCountdown(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtTime(ms) {
  const locale = { ru: "ru-RU", kk: "kk-KZ", en: "en-GB" }[getLang()];
  return new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export const typeLabel = (type) => t(`type_${type}`);
