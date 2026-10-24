// Сравнение до 3 партий в таблице; лучшее значение в каждой строке помечено ★.
import { t, loc } from "./i18n.js";
import { api, fmtNum, fmtKzt, esc, typeLabel, coverHtml, ASTANA } from "./common.js";
import { haversineKm } from "./trip.js";
import { mountShell, toast } from "./shell.js";
import { getCompare, toggleCompare, setCartItem, cartTons } from "./state.js";

const $ = (id) => document.getElementById(id);
let batches = [];
let config = null;

mountShell("");

// [подпись, получить значение, формат, что лучше: "min" | "max" | null]
const ROWS = [
  ["pp_type", (b) => b.type, (v) => typeLabel(v), null],
  ["pp_class", (b) => b.subtype, (v) => t(`sub_short_${v}`), null],
  ["pp_gost", (b) => b.gostKind, (v) => t(`gost_${v}`), null],
  ["pp_ship", (b) => (b.shipment?.length ? b.shipment : null), (v) => v.map((s) => t(`ship_${s}`)).join(", "), null],
  ["pp_price", (b) => b.pricePerTon, (v) => `${fmtKzt(v)}/${t("t")}`, "min"],
  ["pp_available", (b) => b.tonsAvailable, (v) => `${fmtNum(v)} ${t("t")}`, "max"],
  ["cmp_distance", (b) => haversineKm(ASTANA, [b.lat, b.lng]), (v) => `${fmtNum(v)} ${t("km")}`, "min"],
  ["lab_main", (b) => b.lab?.main, (v) => fmtNum(v, 1), "max"],
  ["lab_cao", (b) => b.lab?.cao, (v) => fmtNum(v, 1), null],
  ["lab_loi", (b) => b.lab?.loi, (v) => fmtNum(v, 1), "min"],
  ["lab_moisture", (b) => b.lab?.moisture, (v) => fmtNum(v, 1), "min"],
  ["lab_activity", (b) => b.lab?.activity, (v) => fmtNum(v), "min"],
  ["pp_tested", (b) => b.lab?.testedAt, (v) => v, null],
];

function render() {
  const list = getCompare().map((id) => batches.find((b) => b.id === id)).filter(Boolean);
  if (!list.length) {
    $("cmp").innerHTML = `<p class="muted">${t("cmp_empty")}</p><a class="btn primary" href="/#catalog">${t("nav_catalog")}</a>`;
    return;
  }
  const head = list
    .map(
      (b) => `<td><div class="cmp-head">
        ${coverHtml(b, "cmp-cover")}
        <a href="/passport.html?id=${encodeURIComponent(b.id)}"><b>${esc(loc(b.plant))}</b></a>
        <span class="small muted">${esc(b.code)}${b.demo ? ` · ${t("demo")}` : ""}</span>
        <div class="row">
          <button class="btn primary sm" data-cart="${esc(b.id)}">${cartTons(b.id) ? `✓ ${t("in_cart")}` : t("to_cart")}</button>
          <button class="btn ghost sm" data-remove="${esc(b.id)}">${t("remove")}</button>
        </div>
      </div></td>`,
    )
    .join("");

  const rows = ROWS.map(([label, get, fmt, better]) => {
    const values = list.map(get);
    const nums = values.filter((v) => typeof v === "number");
    const best = better && nums.length > 1 ? (better === "min" ? Math.min(...nums) : Math.max(...nums)) : null;
    const cells = values
      .map((v) => `<td class="${best !== null && v === best ? "best" : ""}">${v == null ? t("lab_none") : esc(fmt(v))}</td>`)
      .join("");
    return `<tr><th>${t(label)}</th>${cells}</tr>`;
  }).join("");

  $("cmp").innerHTML = `<table class="cmp"><tbody><tr><th></th>${head}</tr>${rows}</tbody></table>`;
}

$("cmp").addEventListener("click", (e) => {
  const add = e.target.closest("[data-cart]");
  const rm = e.target.closest("[data-remove]");
  if (add) {
    const b = batches.find((x) => x.id === add.dataset.cart);
    setCartItem(b.id, Math.min(config.truckCapacityTons, b.tonsAvailable));
    toast(`${t("added_to_cart")}: ${loc(b.plant)}`);
  }
  if (rm) toggleCompare(rm.dataset.remove);
});

window.addEventListener("statechange", render);
window.addEventListener("langchange", render);
[batches, config] = await Promise.all([api("/api/batches"), api("/api/config")]);
render();
