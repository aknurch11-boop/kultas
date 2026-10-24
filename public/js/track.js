// Трекинг груза, как у доставки пиццы: этапы, машина на карте, обратный отсчёт, эко-сертификат.
import { t, loc } from "./i18n.js";
import { mountShell } from "./shell.js";
import { api, createMap, truckIcon, endpointIcon, fmtNum, fmtCountdown, fmtTime, esc, typeLabel } from "./common.js";
import { PHASES, tripState, cumulative, pointAt } from "./trip.js";

const $ = (id) => document.getElementById(id);
const code = new URLSearchParams(location.search).get("code");

let data = null; // { order, batch }
let clockOffset = 0; // разница часов сервера и браузера
let map = null;
let truck = null;
let traveled = null;
let cum = null;
let lastPhase = null;
let co2PerTon = 0.7;

function showFind(errorKey) {
  $("findBox").hidden = false;
  $("tracker").hidden = true;
  if (errorKey) {
    $("findError").textContent = t(errorKey);
    $("findError").hidden = false;
  }
}

$("findForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const value = $("findCode").value.trim() || "KT-1001";
  location.href = `/track.html?code=${encodeURIComponent(value)}`;
});

async function load() {
  try {
    const [res, config] = await Promise.all([api(`/api/orders/${encodeURIComponent(code)}`), api("/api/config")]);
    clockOffset = res.serverNow - Date.now();
    co2PerTon = config.co2PerTonCement;
    data = res;
  } catch {
    return showFind("not_found");
  }
  $("findBox").hidden = true;
  $("tracker").hidden = false;
  drawMap();
  renderStatic();
  requestAnimationFrame(tick);
}

function drawMap() {
  const { order, batch } = data;
  const coords = order.route.coords;
  cum = cumulative(coords);
  map = createMap("map", { center: coords[0], zoom: 10 });
  L.polyline(coords, { color: "#15211d", weight: 5, opacity: 0.45, dashArray: "8 8" }).addTo(map);
  traveled = L.polyline([coords[0]], { color: "#0e5a47", weight: 7 }).addTo(map);
  L.marker([batch.lat, batch.lng], { icon: endpointIcon("from") }).addTo(map);
  L.marker([order.dest.lat, order.dest.lng], { icon: endpointIcon("to") }).addTo(map);
  truck = L.marker(coords[0], { icon: truckIcon(), zIndexOffset: 1000 }).addTo(map);
  map.fitBounds(L.latLngBounds(coords).pad(0.15));
}

function renderStatic() {
  const { order, batch } = data;
  $("tCode").textContent = order.code;
  $("tPassport").href = `/passport.html?id=${encodeURIComponent(batch.id)}`;
  $("tFrom").textContent = loc(batch.plant);
  $("tTo").textContent = loc(order.dest.label);
  $("tCargo").textContent = `${fmtNum(order.tons)} ${t("t")} · ${typeLabel(batch.type)}${order.trips > 1 ? ` · ${t("trip_of", { n: order.trips })}` : ""}`;
  $("tRoute").textContent = `${fmtNum(order.route.distanceKm, 1)} ${t("km")} · ${t("road_time", { min: fmtNum(order.route.durationMin) })}`;
  $("tDriver").textContent = order.truck.driver;
  $("tTruck").textContent = order.truck.plate;
  lastPhase = null; // перерисовать этапы на новом языке
}

function renderStepper(phase) {
  const current = PHASES.indexOf(phase);
  $("stepper").innerHTML = PHASES.map((p, i) => {
    const cls = i < current || phase === "delivered" ? "done" : i === current ? "now" : "";
    const time = i <= current ? `<small>${fmtTime(data.order.timeline[p])}</small>` : "";
    return `<div class="${cls}">${esc(t(`phase_${p}`))}${time}</div>`;
  }).join("");
}

let lastDraw = 0;
function tick(now) {
  const { order } = data;
  const state = tripState(order.timeline, Date.now() + clockOffset);

  if (state.phase !== lastPhase) {
    renderStepper(state.phase);
    lastPhase = state.phase;
    if (state.phase === "delivered") showCert();
  }

  const eta = fmtCountdown(state.etaMs);
  $("tEta").textContent = state.phase === "delivered" ? "✓" : eta;
  $("tMsg").textContent = t(`msg_${state.phase}`, { driver: order.truck.driver, tons: fmtNum(order.tons), eta });
  $("tProgress").style.width = `${Math.round(state.progress * 100)}%`;

  // Двигаем машину 10 раз в секунду — плавно и без лишней нагрузки.
  if (now - lastDraw > 100) {
    lastDraw = now;
    const coords = order.route.coords;
    const { point, index } = pointAt(coords, cum, state.progress);
    truck.setLatLng(point);
    traveled.setLatLngs([...coords.slice(0, index + 1), point]);
  }

  if (state.phase !== "delivered") requestAnimationFrame(tick);
  else {
    truck.setLatLng([order.dest.lat, order.dest.lng]);
    traveled.setLatLngs(order.route.coords);
  }
}

function showCert() {
  const { order, batch } = data;
  $("certText").textContent = t("cert_text", {
    company: loc(order.dest.label) || order.company,
    tons: fmtNum(order.tons),
    plant: loc(batch.plant),
    co2: fmtNum(order.tons * co2PerTon, 1),
  });
  $("cert").hidden = false;
}

$("certPrint").addEventListener("click", () => {
  const copy = $("cert").cloneNode(true);
  copy.classList.add("print-target");
  copy.removeAttribute("id");
  $("page").prepend(copy);
  document.body.classList.add("print-cert");
  window.print();
  document.body.classList.remove("print-cert");
  copy.remove();
});

$("tShare").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    $("tShare").textContent = t("copied");
  } catch {
    prompt(t("share"), location.href);
  }
});

mountShell("track");
window.addEventListener("langchange", () => {
  if (!data) return;
  renderStatic();
  if (!$("cert").hidden) showCert();
  if (tripState(data.order.timeline, Date.now() + clockOffset).phase === "delivered") {
    renderStepper("delivered");
    lastPhase = "delivered";
    $("tMsg").textContent = t("msg_delivered", { tons: fmtNum(data.order.tons) });
  }
});

if (code) load();
else showFind();
