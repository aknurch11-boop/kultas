// Главная-витрина: живой счётчик, каталог с фильтрами (как в интернет-магазине), корзина,
// избранное, сравнение, карта партий, свежие запросы покупателей, калькулятор выгоды.
import { t, loc } from "./i18n.js";
import { api, createMap, batchIcon, fmtNum, fmtKzt, esc, typeLabel, coverHtml, typePhotoHtml, photoCreditsHtml, ASTANA, TYPES, TYPE_COLOR } from "./common.js";
import { haversineKm } from "./trip.js";
import { ICON } from "./icons.js";
import { mountShell, toast, openCart } from "./shell.js";
import { setCartItem, cartTons, isFav, toggleFav, inCompare, toggleCompare } from "./state.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

let config = null;
let batches = [];
let origin = { point: ASTANA, label: "from_astana" };
const filters = { q: params.get("q") ?? "", types: new Set(), sub: "", city: "", priceMax: 0, minTons: 0, radius: 0, onlyLab: false, onlyFav: params.get("fav") === "1" };
let sort = "near";
let view = "grid";
let map = null;
let mapLayer = null;
const qty = {}; // выбранный объём на карточке до добавления в корзину

mountShell("catalog");

// --- Живой счётчик (как у Ecosia) ---
const shown = {};
function animateTo(el, key, target) {
  const from = shown[key] ?? 0;
  const start = performance.now();
  const digits = key === "co2Avoided" ? 1 : 0;
  const step = (now) => {
    const k = Math.min(1, (now - start) / 800);
    el.textContent = fmtNum(from + (target - from) * (1 - (1 - k) ** 3), digits);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  shown[key] = target;
}

async function refreshStats() {
  const stats = await api("/api/stats");
  document.querySelectorAll("#impact [data-k]").forEach((el) => animateTo(el, el.dataset.k, stats[el.dataset.k]));
}

// --- Каталог ---
function visibleBatches() {
  const q = filters.q.toLowerCase();
  const list = batches
    .map((b) => ({ ...b, dist: haversineKm(origin.point, [b.lat, b.lng]) }))
    .filter((b) => {
      if (b.tonsAvailable <= 0) return false;
      if (filters.types.size && !filters.types.has(b.type)) return false;
      if (filters.sub && b.subtype !== filters.sub) return false;
      if (filters.city && loc(b.city) !== filters.city) return false;
      if (filters.priceMax && b.pricePerTon > filters.priceMax) return false;
      if (filters.minTons && b.tonsAvailable < filters.minTons) return false;
      if (filters.radius && b.dist > filters.radius) return false;
      if (filters.onlyLab && b.lab?.main == null) return false;
      if (filters.onlyFav && !isFav(b.id)) return false;
      if (q) {
        const hay = [loc(b.plant), loc(b.city), b.code, typeLabel(b.type), t(`use_${b.type}`)].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  const by = {
    near: (a, b) => a.dist - b.dist,
    cheap: (a, b) => a.pricePerTon - b.pricePerTon,
    big: (a, b) => b.tonsAvailable - a.tonsAvailable,
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  };
  return list.sort(by[sort]);
}

function productHtml(b) {
  const tons = qty[b.id] ?? (cartTons(b.id) || Math.min(config.truckCapacityTons, b.tonsAvailable));
  const inCart = cartTons(b.id) > 0;
  const hasLab = b.lab?.main != null;
  return `
    <article class="card product" data-id="${esc(b.id)}">
      <div class="product-media">
        ${coverHtml(b)}
        <div class="badges">
          <span class="pill">${esc(typeLabel(b.type))}</span>
          ${b.subtype ? `<span class="pill">${esc(t(`sub_short_${b.subtype}`))}${b.gostKind ? ` · ${esc(t("gost_short", { k: b.gostKind }))}` : ""}</span>` : ""}
          ${hasLab ? `<span class="pill eco">${ICON.verified}${t("passport_ok")}</span>` : ""}
          ${b.demo ? `<span class="tag">${t("demo")}</span>` : ""}
        </div>
        <button class="icon-btn fav ${isFav(b.id) ? "on" : ""}" data-act="fav" title="${t("fav")}">${isFav(b.id) ? ICON.heartFull : ICON.heart}</button>
      </div>
      <div class="product-body">
        <div class="price">${fmtKzt(b.pricePerTon)} <small>${t("per_t")}</small></div>
        <h3><a href="/passport.html?id=${encodeURIComponent(b.id)}">${esc(loc(b.plant))}</a></h3>
        <div class="specs">
          <span><b>${fmtNum(b.tonsAvailable)} ${t("t")}</b> ${t("available")}</span>
          <span>${ICON.pin.replace("<svg", '<svg style="display:inline;width:13px;height:13px;vertical-align:-2px"')} ${fmtNum(b.dist)} ${t("km")} ${t(origin.label)}</span>
          <span>${esc(t(`use_${b.type}`))} · ${esc(b.code)}</span>
        </div>
        <div class="buy">
          <div class="stepper-input">
            <button type="button" data-act="minus">−</button>
            <input type="number" min="1" max="${b.tonsAvailable}" value="${tons}" data-act="qty">
            <button type="button" data-act="plus">+</button>
          </div>
          <button class="btn primary sm ${inCart ? "added" : ""}" data-act="cart">${inCart ? `✓ ${t("in_cart")}` : t("to_cart")}</button>
          <button class="icon-btn sm ${inCompare(b.id) ? "on" : ""}" data-act="compare" title="${t("compare")}">${ICON.compare}</button>
        </div>
      </div>
    </article>`;
}

function render() {
  const list = visibleBatches();
  $("found").textContent = t("found", { n: list.length });
  $("grid").innerHTML = list.length ? list.map(productHtml).join("") : `<p class="muted">${t("no_batches")}</p>`;
  if (view === "map") renderMap(list);
}

function renderMap(list) {
  if (!map) {
    map = createMap("map", { zoom: 6 });
    mapLayer = L.layerGroup().addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 50);
  mapLayer.clearLayers();
  list.forEach((b) =>
    L.marker([b.lat, b.lng], { icon: batchIcon(b) })
      .bindPopup(`<b>${esc(loc(b.plant))}</b><br>${esc(typeLabel(b.type))} · ${fmtNum(b.tonsAvailable)} ${t("t")}<br>${fmtKzt(b.pricePerTon)}/${t("t")}<br><a href="/passport.html?id=${encodeURIComponent(b.id)}">${t("btn_passport")} →</a>`)
      .addTo(mapLayer),
  );
  if (list.length) map.fitBounds(L.latLngBounds(list.map((b) => [b.lat, b.lng])).pad(0.3), { maxZoom: 10 });
}

$("grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const card = btn.closest(".product");
  const id = card.dataset.id;
  const batch = batches.find((b) => b.id === id);
  const input = card.querySelector("[data-act='qty']");
  const clamp = (v) => Math.max(1, Math.min(batch.tonsAvailable, Math.round(v) || 1));
  const act = btn.dataset.act;
  if (act === "minus" || act === "plus") {
    qty[id] = clamp(Number(input.value) + (act === "plus" ? 25 : -25));
    input.value = qty[id];
  } else if (act === "cart") {
    setCartItem(id, clamp(Number(input.value)));
    toast(`${t("added_to_cart")}: ${loc(batch.plant)} · ${fmtNum(clamp(Number(input.value)))} ${t("t")}`);
  } else if (act === "fav") {
    toggleFav(id);
  } else if (act === "compare") {
    if (!toggleCompare(id)) toast(t("compare_full"));
  }
});

$("grid").addEventListener("change", (e) => {
  if (e.target.dataset.act !== "qty") return;
  const id = e.target.closest(".product").dataset.id;
  qty[id] = Math.max(1, Math.round(Number(e.target.value)) || 1);
});

// --- Виды золы: гид на главной + фильтры ---
function renderTypeControls() {
  $("fType").innerHTML = TYPES.map((type) => `<button class="chip ${filters.types.has(type) ? "on" : ""}" data-type="${type}">${esc(typeLabel(type))}</button>`).join("");
  $("fSub").innerHTML = [["", t("rq_all")], ["acid", t("sub_short_acid")], ["basic", t("sub_short_basic")]]
    .map(([v, l]) => `<button class="chip ${filters.sub === v ? "on" : ""}" data-sub="${v}">${esc(l)}</button>`)
    .join("");
  $("typesGuide").innerHTML = TYPES.map((type) => {
    const count = batches.filter((b) => b.type === type && b.tonsAvailable > 0).length;
    return `
      <button class="type-card" data-guide="${type}" style="--c:${TYPE_COLOR[type]}">
        ${typePhotoHtml(type)}
        <b>${esc(typeLabel(type))}</b>
        <span>${esc(t(`desc_${type}`))}</span>
        <small>${esc(t(`use_${type}`))} · ${t("found", { n: count })}</small>
      </button>`;
  }).join("");
  $("typesCredits").innerHTML = photoCreditsHtml(t("photo_credits"));
}

$("typesGuide").addEventListener("click", (e) => {
  const card = e.target.closest("[data-guide]");
  if (!card) return;
  filters.types = new Set([card.dataset.guide]);
  renderTypeControls();
  render();
  $("catalog").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});

$("fSub").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-sub]");
  if (!chip) return;
  filters.sub = chip.dataset.sub;
  renderTypeControls();
  render();
});

// --- Фильтры ---
function fillCities() {
  const cities = [...new Set(batches.map((b) => loc(b.city)).filter(Boolean))].sort();
  $("fCity").innerHTML = `<option value="">${t("f_city_all")}</option>` + cities.map((c) => `<option ${c === filters.city ? "selected" : ""}>${esc(c)}</option>`).join("");
}

function labelRadius() {
  document.querySelectorAll("#fRadius .chip[data-r]:not([data-r='0'])").forEach((c) => (c.textContent = `${c.dataset.r} ${t("km")}`));
}

$("fType").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const type = chip.dataset.type;
  filters.types.has(type) ? filters.types.delete(type) : filters.types.add(type);
  chip.classList.toggle("on", filters.types.has(type));
  render();
});
$("fRadius").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filters.radius = Number(chip.dataset.r);
  document.querySelectorAll("#fRadius .chip").forEach((c) => c.classList.toggle("on", c === chip));
  render();
});
$("fromMe").addEventListener("click", () => {
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      origin = { point: [pos.coords.latitude, pos.coords.longitude], label: "from_you" };
      $("fromMe").classList.add("on");
      render();
    },
    () => {},
    { timeout: 10000 },
  );
});
$("fCity").addEventListener("change", (e) => ((filters.city = e.target.value), render()));
$("fPrice").addEventListener("input", (e) => ((filters.priceMax = Number(e.target.value) || 0), render()));
$("fTons").addEventListener("input", (e) => ((filters.minTons = Number(e.target.value) || 0), render()));
$("fLab").addEventListener("change", (e) => ((filters.onlyLab = e.target.checked), render()));
$("fFav").addEventListener("change", (e) => ((filters.onlyFav = e.target.checked), render()));
$("sort").addEventListener("change", (e) => ((sort = e.target.value), render()));
$("fReset").addEventListener("click", () => {
  Object.assign(filters, { q: "", sub: "", city: "", priceMax: 0, minTons: 0, radius: 0, onlyLab: false, onlyFav: false });
  filters.types.clear();
  renderTypeControls();
  ["fPrice", "fTons"].forEach((id) => ($(id).value = ""));
  ["fLab", "fFav"].forEach((id) => ($(id).checked = false));
  $("searchInput").value = "";
  document.querySelectorAll("#fType .chip").forEach((c) => c.classList.remove("on"));
  document.querySelectorAll("#fRadius .chip").forEach((c) => c.classList.toggle("on", c.dataset.r === "0"));
  fillCities();
  render();
});
$("view").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  view = chip.dataset.view;
  document.querySelectorAll("#view .chip").forEach((c) => c.classList.toggle("on", c === chip));
  $("grid").hidden = view !== "grid";
  $("map").hidden = view !== "map";
  render();
});
window.addEventListener("kultas:search", (e) => ((filters.q = e.detail ?? ""), render()));

// --- Свежие запросы покупателей ---
async function renderRequests() {
  const list = (await api("/api/requests")).slice(0, 3);
  $("reqStrip").innerHTML = list
    .map(
      (r) => `
      <a class="card rq" href="/requests.html" style="text-decoration:none">
        <div class="rq-head"><span class="pill">${esc(typeLabel(r.type))}</span>${r.demo ? `<span class="tag">${t("demo")}</span>` : ""}</div>
        <div class="rq-need">${fmtNum(r.tons)} ${t("t")}</div>
        <div class="rq-meta"><span><b>${esc(loc(r.company))}</b></span><span>${esc(loc(r.city))}</span>${r.maxPrice ? `<span>${t("rq_budget", { p: fmtKzt(r.maxPrice) })}</span>` : ""}</div>
        <span class="small muted">${t("rq_offers", { n: r.offers.length })}</span>
      </a>`,
    )
    .join("");
}

// --- Калькулятор выгоды ---
const CALC = ["cVolume", "cCement", "cReplace", "cCementPrice", "cAshPrice"];
function initCalc() {
  const cheapestFly = batches.filter((b) => b.type === "fly_ash").sort((a, b) => a.pricePerTon - b.pricePerTon)[0];
  $("cVolume").value = 1000;
  $("cCement").value = config.cementPerM3Kg;
  $("cReplace").value = config.replacementPct;
  $("cCementPrice").value = config.cementPricePerTon;
  $("cAshPrice").value = cheapestFly?.pricePerTon ?? 9000;
  CALC.forEach((id) => $(id).addEventListener("input", renderCalc));
  renderCalc();
}
function renderCalc() {
  const v = Object.fromEntries(CALC.map((id) => [id, Math.max(0, Number($(id).value) || 0)]));
  const ashTons = ((v.cVolume * v.cCement) / 1000) * (v.cReplace / 100);
  $("oAsh").textContent = `${fmtNum(ashTons, 1)} ${t("t")}`;
  $("oSave").textContent = fmtKzt(ashTons * (v.cCementPrice - v.cAshPrice));
  $("oCo2").textContent = `${fmtNum(ashTons * config.co2PerTonCement, 1)} ${t("t")}`;
  $("oTrucks").textContent = fmtNum(Math.ceil(ashTons / config.truckCapacityTons));
}

// --- Старт ---
window.addEventListener("statechange", (e) => {
  if (e.detail === "cart" || e.detail === "fav" || e.detail === "compare") render();
});
window.addEventListener("langchange", () => {
  labelRadius();
  renderTypeControls();
  fillCities();
  render();
  renderCalc();
  renderRequests();
  Object.keys(shown).forEach((k) => delete shown[k]);
  refreshStats();
});

[config, batches] = await Promise.all([api("/api/config"), api("/api/batches")]);
$("fFav").checked = filters.onlyFav;
labelRadius();
renderTypeControls();
fillCities();
render();
initCalc();
renderRequests();
refreshStats();
setInterval(refreshStats, 5000);
if (params.get("cart") === "1") openCart();
