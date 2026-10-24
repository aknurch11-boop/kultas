// «Разместить партию» как объявление на OLX: фото с камеры → вид золы → объём и цена → место по GPS.
import { t } from "./i18n.js";
import { postJson, createMap, fmtNum, fmtKzt, esc, typeLabel, typePhotoHtml, photoCreditsHtml, TYPES, TYPE_COLOR } from "./common.js";
import { ICON } from "./icons.js";
import { mountShell } from "./shell.js";

const $ = (id) => document.getElementById(id);
const MAX_PHOTOS = 3;
const state = { photos: [], type: null, subtype: null, gostKind: null, shipment: new Set(), point: null };

mountShell("");

// --- 1. Фото: сжимаем в браузере до 1280 px, чтобы загрузка была быстрой даже по мобильной сети ---
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function compress(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

$("photoInput").addEventListener("change", async (e) => {
  const files = [...e.target.files].slice(0, MAX_PHOTOS - state.photos.length);
  for (const file of files) {
    try {
      state.photos.push(await compress(file));
    } catch {
      showError("err_photo");
    }
  }
  e.target.value = "";
  renderPhotos();
  renderPreview();
});

function renderPhotos() {
  $("thumbs").innerHTML = state.photos
    .map((src, i) => `<div class="thumb"><img src="${src}" alt=""><button type="button" data-rm="${i}" aria-label="remove">${ICON.close}</button></div>`)
    .join("");
  document.querySelector(".dropzone").hidden = state.photos.length >= MAX_PHOTOS;
}

$("thumbs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-rm]");
  if (!btn) return;
  state.photos.splice(Number(btn.dataset.rm), 1);
  renderPhotos();
  renderPreview();
});

// --- 2. Вид золы ---
function renderTypes() {
  $("typeCards").innerHTML = TYPES.map(
    (type) => `
    <button type="button" class="type-card ${state.type === type ? "on" : ""}" data-type="${type}" style="--c:${TYPE_COLOR[type]}">
      ${typePhotoHtml(type)}
      <b>${esc(typeLabel(type))}</b>
      <span>${esc(t(`desc_${type}`))}</span>
      <small>${esc(t(`use_${type}`))}</small>
    </button>`,
  ).join("");
  $("typeCredits").innerHTML = photoCreditsHtml(t("photo_credits"));
  $("flyOptions").hidden = state.type !== "fly_ash";
  const chip = (group, value, label, current) => `<button type="button" class="chip ${current === value ? "on" : ""}" data-${group}="${value ?? ""}">${esc(label)}</button>`;
  $("subChips").innerHTML = [["acid", t("sub_acid")], ["basic", t("sub_basic")], [null, t("sub_unknown")]].map(([v, l]) => chip("sub", v, l, state.subtype)).join("");
  $("gostChips").innerHTML = [...["I", "II", "III", "IV"].map((k) => [k, t(`gost_${k}`)]), [null, t("sub_unknown")]].map(([v, l]) => chip("gost", v, l, state.gostKind)).join("");
  $("shipChips").innerHTML = ["bulk", "pneumo", "bigbag"]
    .map((s) => `<button type="button" class="chip ${state.shipment.has(s) ? "on" : ""}" data-ship="${s}">${esc(t(`ship_${s}`))}</button>`)
    .join("");
}

document.querySelector(".sell-steps").addEventListener("click", (e) => {
  const typeBtn = e.target.closest("[data-type]");
  const sub = e.target.closest("[data-sub]");
  const gost = e.target.closest("[data-gost]");
  const ship = e.target.closest("[data-ship]");
  if (typeBtn) state.type = typeBtn.dataset.type;
  else if (sub) state.subtype = sub.dataset.sub || null;
  else if (gost) state.gostKind = gost.dataset.gost || null;
  else if (ship) state.shipment.has(ship.dataset.ship) ? state.shipment.delete(ship.dataset.ship) : state.shipment.add(ship.dataset.ship);
  else return;
  renderTypes();
  renderPreview();
});

// Подсказка класса по CaO: ≤ 10% — кислая, > 10% — основная (ГОСТ 25818-91)
$("lCao").addEventListener("input", () => {
  const v = Number($("lCao").value);
  const has = $("lCao").value !== "" && Number.isFinite(v);
  $("caoHint").hidden = !has;
  if (!has) return;
  const cls = v <= 10 ? "acid" : "basic";
  $("caoHint").textContent = t("sell_cao_hint", { v: fmtNum(v, 1), c: t(`sub_short_${cls}`) });
  if (state.type === "fly_ash" && !state.subtype) {
    state.subtype = cls;
    renderTypes();
  }
});

// --- 4. Место: GPS телефона или клик по карте ---
const map = createMap("sellMap", { zoom: 5 });
let marker = null;
function setPoint(latlng) {
  state.point = { lat: latlng.lat, lng: latlng.lng };
  if (!marker) marker = L.marker(latlng).addTo(map);
  else marker.setLatLng(latlng);
  $("locHint").textContent = `✓ ${t("db_loc_set")}`;
  $("locHint").classList.add("ok");
}
map.on("click", (e) => setPoint(e.latlng));
$("gpsBtn").addEventListener("click", () => {
  $("locHint").textContent = t("sell_gps_wait");
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
      map.setView(latlng, 14);
      setPoint(latlng);
    },
    () => ($("locHint").textContent = t("sell_gps_fail")),
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

// --- Превью карточки ---
function renderPreview() {
  const type = state.type ?? "fly_ash";
  const tons = Number($("sTons").value) || 0;
  const price = Number($("sPrice").value) || 0;
  const cover = state.photos[0] ? `<img class="cover" src="${state.photos[0]}" alt="">` : `<div class="swatch ${type}"></div>`;
  const badges = [
    state.type ? `<span class="pill">${esc(typeLabel(type))}</span>` : "",
    state.subtype ? `<span class="pill">${esc(t(`sub_short_${state.subtype}`))}</span>` : "",
    state.gostKind ? `<span class="pill">${esc(t("gost_short", { k: state.gostKind }))}</span>` : "",
  ].join("");
  $("preview").innerHTML = `
    <article class="card product">
      <div class="product-media">${cover}<div class="badges">${badges}</div></div>
      <div class="product-body">
        <div class="price">${fmtKzt(price)} <small>${t("per_t")}</small></div>
        <h3>${esc($("sPlant").value || "—")}</h3>
        <div class="specs">
          <span><b>${fmtNum(tons)} ${t("t")}</b> ${t("available")}</span>
          <span>${esc($("sCity").value)}</span>
          <span>${[...state.shipment].map((s) => esc(t(`ship_${s}`))).join(" · ")}</span>
        </div>
      </div>
    </article>`;
}
["sTons", "sPrice", "sPlant", "sCity"].forEach((id) => $(id).addEventListener("input", renderPreview));

// --- Публикация ---
function showError(key) {
  $("sError").textContent = t(key);
  $("sError").hidden = false;
}

$("sellForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("sError").hidden = true;
  if (!state.type) return showError("err_type");
  if ($("sPlant").value.trim().length < 2) return showError("err_plant");
  if (!(Number($("sTons").value) > 0)) return showError("err_tons");
  if ($("sPrice").value === "" || Number($("sPrice").value) < 0) return showError("err_price");
  if (!state.point) return showError("err_location");

  const btn = $("sSubmit");
  btn.disabled = true;
  btn.textContent = t("sell_publishing");
  const num = (id) => $(id).value;
  try {
    const batch = await postJson("/api/batches", {
      plant: $("sPlant").value,
      city: $("sCity").value,
      type: state.type,
      subtype: state.subtype,
      gostKind: state.gostKind,
      shipment: [...state.shipment],
      photos: state.photos,
      tons: Number($("sTons").value),
      pricePerTon: Number($("sPrice").value),
      lat: state.point.lat,
      lng: state.point.lng,
      lab: { main: num("lMain"), cao: num("lCao"), loi: num("lLoi"), so3: num("lSo3"), moisture: num("lMoisture"), activity: num("lActivity") },
    });
    location.href = `/passport.html?id=${encodeURIComponent(batch.id)}`;
  } catch (err) {
    showError({ plant: "err_plant", type: "err_type", location: "err_location", tons: "err_tons", price: "err_price", photo: "err_photo" }[err.code] ?? "err_generic");
    btn.disabled = false;
    btn.textContent = t("sell_publish");
  }
});

window.addEventListener("langchange", () => {
  renderTypes();
  renderPreview();
});
renderTypes();
renderPhotos();
renderPreview();
