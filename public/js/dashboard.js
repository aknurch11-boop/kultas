// Кабинет ТЭЦ: живые заказы и машины, партии, экономика платформы.
// Новые партии публикуются на странице «Разместить партию» (sell.html) — по фото.
import { t, loc } from "./i18n.js";
import { mountShell } from "./shell.js";
import { api, createMap, batchIcon, fmtNum, fmtKzt, fmtCountdown, esc, typeLabel } from "./common.js";
import { tripState } from "./trip.js";

const $ = (id) => document.getElementById(id);
let config = null;
let orders = [];
let clockOffset = 0;
let batches = [];

mountShell("cabinet");
const map = createMap("map", { zoom: 5 });
const layer = L.layerGroup().addTo(map);

async function refresh() {
  const [stats, list, b] = await Promise.all([api("/api/stats"), api("/api/orders"), api("/api/batches")]);
  clockOffset = list.serverNow - Date.now();
  orders = list.orders;
  batches = b;
  document.querySelectorAll("#tiles [data-k]").forEach((el) => {
    el.textContent = fmtNum(stats[el.dataset.k], el.dataset.k === "co2Avoided" ? 1 : 0);
  });
  $("econ").innerHTML = `
    <div><span>${t("econ_commission")}</span><b>${fmtKzt(config.commissionPerTon)}</b></div>
    <div><span>${t("econ_delivered")}</span><b>${fmtNum(stats.tonsDelivered)}</b></div>
    <div><span>${t("econ_revenue")}</span><b>${fmtKzt(stats.revenue)}</b></div>
    <div><span>${t("econ_orders")}</span><b>${fmtNum(stats.orders)}</b></div>`;
  renderBatches();
  renderOrders();
}

// Статусы считаем в браузере по общему расписанию поездки — таблица «живая» без лишних запросов.
function renderOrders() {
  const now = Date.now() + clockOffset;
  $("orders").innerHTML = orders
    .map((o) => {
      const s = tripState(o.timeline, now);
      const pillClass = s.phase === "delivered" ? "eco" : s.phase === "in_transit" ? "go" : "";
      const bar = s.phase === "in_transit" ? `<div class="mini-bar"><span style="width:${Math.round(s.progress * 100)}%"></span></div>` : "";
      const eta = s.phase !== "delivered" ? ` · ${fmtCountdown(s.etaMs)}` : "";
      return `<tr>
        <td><a href="/track.html?code=${encodeURIComponent(o.code)}">${esc(o.code)}</a>${o.demo ? ` <span class="tag">${t("demo")}</span>` : ""}</td>
        <td>${esc(loc(o.dest?.label) || o.company)}</td>
        <td>${fmtNum(o.tons)}</td>
        <td>${esc(loc(o.plant))} → ${fmtNum(o.distanceKm)} ${t("km")}</td>
        <td><span class="pill ${pillClass}">${esc(t(`phase_${s.phase}`))}${eta}</span>${bar}</td>
      </tr>`;
    })
    .join("");
}

function renderBatches() {
  layer.clearLayers();
  batches.forEach((b) => L.marker([b.lat, b.lng], { icon: batchIcon(b) }).bindPopup(esc(loc(b.plant))).addTo(layer));
  $("batches").innerHTML = batches
    .map(
      (b) => `<tr>
        <td><a href="/passport.html?id=${encodeURIComponent(b.id)}">${esc(b.code)}</a></td>
        <td>${esc(loc(b.plant))}</td>
        <td>${esc(typeLabel(b.type))}${b.photos?.length ? " 📷" : ""}</td>
        <td>${fmtNum(b.tonsAvailable)} / ${fmtNum(b.tons)} ${t("t")}</td>
        <td>${fmtKzt(b.pricePerTon)}/${t("t")}${b.demo ? ` <span class="tag">${t("demo")}</span>` : ""}</td>
      </tr>`,
    )
    .join("");
}

window.addEventListener("langchange", refresh);

config = await api("/api/config");
await refresh();
setInterval(renderOrders, 1000);
setInterval(refresh, 10000);
