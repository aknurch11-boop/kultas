// Оформление заказа: точка доставки на карте → расчёт доставки по реальным дорогам → заказ и трекинг.
import { t, loc } from "./i18n.js";
import { api, postJson, createMap, endpointIcon, fmtNum, fmtKzt, esc, typeLabel, coverHtml } from "./common.js";
import { mountShell, invalidateBatches } from "./shell.js";
import { getCart, clearCart } from "./state.js";

const $ = (id) => document.getElementById(id);
let batches = [];
let config = null;
let dest = null;
let quote = null;
let destMarker = null;

mountShell("");

const map = createMap("kMap", { zoom: 6 });

function lines() {
  return getCart()
    .map((item) => ({ ...item, batch: batches.find((b) => b.id === item.batchId) }))
    .filter((l) => l.batch);
}

function render() {
  const list = lines();
  if (!list.length) {
    $("kLines").innerHTML = `<p class="muted">${t("cart_empty")}</p><a class="btn ghost sm" href="/#catalog">${t("nav_catalog")}</a>`;
    $("kPlace").disabled = true;
    ["kGoods", "kDelivery", "kService", "kTotal"].forEach((id) => ($(id).textContent = "—"));
    return;
  }
  $("kPlace").disabled = false;
  $("kLines").innerHTML = list
    .map(({ batch, tons }) => {
      const q = quote?.quotes.find((x) => x.batchId === batch.id);
      return `
      <div class="ck-line">
        ${coverHtml(batch, "sm")}
        <div><b>${esc(loc(batch.plant))}</b><br><span class="small muted">${fmtNum(tons)} ${t("t")} · ${esc(typeLabel(batch.type))}${q ? ` · ${t("ck_km", { km: fmtNum(q.distanceKm), trips: q.trips })}` : ""}</span></div>
        <b>${fmtKzt(tons * batch.pricePerTon)}</b>
      </div>`;
    })
    .join("");

  const goods = list.reduce((s, l) => s + l.tons * l.batch.pricePerTon, 0);
  const tons = list.reduce((s, l) => s + l.tons, 0);
  $("kGoods").textContent = fmtKzt(goods);
  $("kService").textContent = fmtKzt(tons * config.commissionPerTon);
  $("kDelivery").textContent = quote ? fmtKzt(quote.totals.delivery) : t("ck_delivery_next");
  $("kTotal").textContent = quote ? fmtKzt(quote.totals.total) : "—";
}

async function requestQuote() {
  if (!dest || !lines().length) return;
  $("kDelivery").textContent = "…";
  try {
    quote = await postJson("/api/quote", { items: getCart(), dest });
  } catch {
    quote = null;
  }
  render();
}

function setDest(latlng) {
  dest = { lat: latlng.lat, lng: latlng.lng };
  if (!destMarker) destMarker = L.marker(latlng, { icon: endpointIcon("to") }).addTo(map);
  else destMarker.setLatLng(latlng);
  $("kDestHint").textContent = `✓ ${t("order_dest_set")}`;
  $("kDestHint").classList.add("ok");
  requestQuote();
}

map.on("click", (e) => setDest(e.latlng));
$("kGeo").addEventListener("click", () => {
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
      map.setView(latlng, 12);
      setDest(latlng);
    },
    () => {},
    { timeout: 10000 },
  );
});

$("kPlace").addEventListener("click", async () => {
  const showError = (key) => {
    $("kError").textContent = t(key);
    $("kError").hidden = false;
  };
  $("kError").hidden = true;
  if ($("kCompany").value.trim().length < 2) return showError("err_company");
  if (!dest) return showError("ck_need_dest");
  $("kPlace").disabled = true;
  $("kPlace").textContent = t("ck_placing");
  try {
    const { codes } = await postJson("/api/checkout", { items: getCart(), company: $("kCompany").value, contact: $("kContact").value, dest });
    const placed = lines();
    clearCart();
    invalidateBatches();
    $("doneLinks").innerHTML = codes
      .map((code, i) => `<a href="/track.html?code=${encodeURIComponent(code)}"><span>${esc(code)} · ${esc(loc(placed[i]?.batch.plant))}</span><span>${t("ck_track")} →</span></a>`)
      .join("");
    $("ckView").hidden = true;
    $("doneView").hidden = false;
  } catch (err) {
    showError({ company: "err_company", tons_available: "err_tons_available", dest: "err_dest" }[err.code] ?? "err_generic");
    $("kPlace").disabled = false;
    $("kPlace").textContent = t("ck_place");
  }
});

window.addEventListener("statechange", (e) => {
  if (e.detail !== "cart") return;
  quote = null;
  render();
  requestQuote();
});
window.addEventListener("langchange", render);

[batches, config] = await Promise.all([api("/api/batches"), api("/api/config")]);
const origins = lines().map((l) => [l.batch.lat, l.batch.lng]);
origins.forEach((p) => L.marker(p, { icon: endpointIcon("from") }).addTo(map));
if (origins.length) map.fitBounds(L.latLngBounds(origins).pad(0.6), { maxZoom: 9 });
render();
