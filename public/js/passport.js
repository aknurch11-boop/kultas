// Карточка товара = цифровой паспорт партии (идея EU Digital Product Passport):
// покупка, состав, источник, QR-код.
import { t, loc } from "./i18n.js";
import { api, createMap, batchIcon, fmtNum, fmtKzt, typeLabel } from "./common.js";
import { ICON } from "./icons.js";
import { mountShell, toast } from "./shell.js";
import { setCartItem, cartTons, isFav, toggleFav, inCompare, toggleCompare } from "./state.js";

const $ = (id) => document.getElementById(id);
const id = new URLSearchParams(location.search).get("id");
let batch = null;
let config = null;

mountShell("catalog");

const LAB_ROWS = ["main", "cao", "loi", "so3", "moisture", "activity"];

function clampQty(v) {
  return Math.max(1, Math.min(batch.tonsAvailable, Math.round(v) || 1));
}

function renderBuy() {
  const inCart = cartTons(batch.id) > 0;
  $("ppPriceBig").textContent = fmtKzt(batch.pricePerTon);
  $("ppCart").textContent = inCart ? `✓ ${t("in_cart")}` : t("to_cart");
  $("ppCart").classList.toggle("added", inCart);
  $("ppFav").innerHTML = isFav(batch.id) ? ICON.heartFull : ICON.heart;
  $("ppFav").classList.toggle("on", isFav(batch.id));
  $("ppFav").title = t("fav");
  $("ppCompare").innerHTML = ICON.compare;
  $("ppCompare").classList.toggle("on", inCompare(batch.id));
  $("ppCompare").title = t("compare");
  $("ppQtyTotal").textContent = `${t("order_total")}: ${fmtKzt(clampQty(Number($("ppQty").value)) * batch.pricePerTon)}`;
}

function render() {
  $("ppTitle").textContent = loc(batch.plant);
  $("ppCode").textContent = `${batch.code} · ${loc(batch.city)}`;
  $("ppOrigin").textContent = loc(batch.plant);
  $("ppType").textContent = typeLabel(batch.type);
  $("ppTons").textContent = `${fmtNum(batch.tonsAvailable)} ${t("t")}`;
  $("ppPrice").textContent = `${fmtKzt(batch.pricePerTon)}/${t("t")}`;
  $("ppSubBox").hidden = !batch.subtype;
  if (batch.subtype) $("ppSub").textContent = t(`sub_${batch.subtype}`);
  $("ppGostBox").hidden = !batch.gostKind;
  if (batch.gostKind) $("ppGost").textContent = t(`gost_${batch.gostKind}`);
  $("ppShipBox").hidden = !batch.shipment?.length;
  if (batch.shipment?.length) $("ppShip").textContent = batch.shipment.map((s) => t(`ship_${s}`)).join(", ");
  const photos = batch.photos ?? [];
  $("ppGallery").hidden = !photos.length;
  $("ppGallery").classList.toggle("many", photos.length > 1);
  $("ppGallery").innerHTML = photos.map((src) => `<img src="${src}" alt="${t("pp_photos")}">`).join("");

  const lab = batch.lab ?? {};
  const rows = LAB_ROWS.map((k) => [t(`lab_${k}`), lab[k] == null ? t("lab_none") : fmtNum(lab[k], 1)]);
  rows.push([t("pp_tested"), lab.testedAt ?? t("lab_none")]);
  $("ppLab").innerHTML = rows.map(([name, value]) => `<tr><td>${name}</td><td>${value}</td></tr>`).join("");
  $("ppDemo").hidden = !batch.demo;
  $("ppCo2").textContent = t("pp_co2", { co2: fmtNum(batch.tonsAvailable * config.co2PerTonCement) });
  renderBuy();
}

async function load() {
  try {
    [batch, config] = await Promise.all([api(`/api/batches/${encodeURIComponent(id)}`), api("/api/config")]);
  } catch {
    $("ppMissing").hidden = false;
    return;
  }
  $("passport").hidden = false;
  $("ppQty").max = batch.tonsAvailable;
  $("ppQty").value = cartTons(batch.id) || Math.min(config.truckCapacityTons, batch.tonsAvailable);
  render();

  new QRCode($("qr"), { text: location.href, width: 128, height: 128, colorDark: "#0f172a", colorLight: "#ffffff" });
  const map = createMap("ppMap", { center: [batch.lat, batch.lng], zoom: 11 });
  L.marker([batch.lat, batch.lng], { icon: batchIcon(batch) }).addTo(map);
}

$("ppMinus").addEventListener("click", () => (($("ppQty").value = clampQty(Number($("ppQty").value) - 25)), renderBuy()));
$("ppPlus").addEventListener("click", () => (($("ppQty").value = clampQty(Number($("ppQty").value) + 25)), renderBuy()));
$("ppQty").addEventListener("input", renderBuy);
$("ppCart").addEventListener("click", () => {
  const tons = clampQty(Number($("ppQty").value));
  setCartItem(batch.id, tons);
  toast(`${t("added_to_cart")}: ${fmtNum(tons)} ${t("t")}`);
});
$("ppFav").addEventListener("click", () => toggleFav(batch.id));
$("ppCompare").addEventListener("click", () => toggleCompare(batch.id) || toast(t("compare_full")));
$("ppPrint").addEventListener("click", () => window.print());

window.addEventListener("statechange", () => batch && renderBuy());
window.addEventListener("langchange", () => batch && render());
load();
