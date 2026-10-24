// Каркас всех страниц: шапка магазина (поиск, тема, язык, избранное, сравнение, корзина),
// выезжающая корзина и подвал. Подключается на каждой странице через mountShell().
import { mountLangSwitcher, t, loc } from "./i18n.js";
import { api, fmtKzt, fmtNum, esc, typeLabel, coverHtml } from "./common.js";
import { ICON, LOGO } from "./icons.js";
import { getCart, getFavs, getCompare, setCartItem, removeCartItem } from "./state.js";

const $ = (id) => document.getElementById(id);
let batchCache = null;
let config = null;

// --- Тема: светлая / тёмная (по умолчанию как в системе) ---
function currentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit) return explicit;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("kultas-theme", next);
  } catch {
    // тема не запомнится — не страшно
  }
  renderThemeIcon();
  window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
}

function renderThemeIcon() {
  const btn = $("themeBtn");
  if (!btn) return;
  btn.innerHTML = currentTheme() === "dark" ? ICON.sun : ICON.moon;
  btn.title = t("theme_toggle");
}

// --- Шапка и подвал ---
function headerHtml(active) {
  const nav = [
    ["catalog", "/#catalog", "nav_catalog"],
    ["requests", "/requests.html", "nav_requests"],
    ["track", "/track.html", "nav_track"],
    ["calc", "/#calc", "nav_calc"],
    ["cabinet", "/dashboard.html", "nav_cabinet"],
  ];
  return `
    <div class="topbar"><div class="wrap topbar-in">
      <a class="logo" href="/">${LOGO}<span>KülTas</span></a>
      <form class="search" id="searchForm" role="search">
        <input id="searchInput" type="search" data-i18n-ph="search_ph" autocomplete="off">
        <button type="submit" aria-label="search">${ICON.search}</button>
      </form>
      <div class="tools">
        <a class="sell-btn" href="/sell.html" data-i18n="sell_cta"></a>
        <button class="icon-btn" id="themeBtn" type="button"></button>
        <div class="lang"></div>
        <a class="icon-btn" href="/?fav=1#catalog" data-i18n-title="fav">${ICON.heart}<span class="count" data-count="fav"></span></a>
        <a class="icon-btn" href="/compare.html" data-i18n-title="compare">${ICON.compare}<span class="count" data-count="compare"></span></a>
        <button class="icon-btn cart-btn" id="cartBtn" type="button">${ICON.cart}<span class="count" data-count="cart"></span><span class="cart-label" data-i18n="cart"></span></button>
      </div>
    </div></div>
    <nav class="subnav"><div class="wrap">
      ${nav.map(([key, href, label]) => `<a href="${href}" class="${key === active ? "active" : ""}" data-i18n="${label}"></a>`).join("")}
    </div></nav>`;
}

function drawerHtml() {
  return `
    <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
    <aside class="drawer" id="cartDrawer" aria-hidden="true">
      <div class="drawer-head">
        <h3 data-i18n="cart_title"></h3>
        <button class="icon-btn" id="cartClose" type="button" aria-label="close">${ICON.close}</button>
      </div>
      <div class="drawer-body" id="cartItems"></div>
      <div class="drawer-foot" id="cartFoot"></div>
    </aside>`;
}

function renderCounts() {
  const counts = { cart: getCart().length, fav: getFavs().length, compare: getCompare().length };
  document.querySelectorAll("[data-count]").forEach((el) => {
    const n = counts[el.dataset.count];
    el.textContent = n || "";
    el.hidden = !n;
  });
}

// --- Корзина ---
async function ensureData() {
  if (!batchCache) [batchCache, config] = await Promise.all([api("/api/batches"), api("/api/config")]);
}

export async function openCart() {
  await ensureData();
  renderCart();
  $("cartDrawer").classList.add("open");
  $("cartDrawer").setAttribute("aria-hidden", "false");
  $("drawerBackdrop").hidden = false;
}

function closeCart() {
  $("cartDrawer").classList.remove("open");
  $("cartDrawer").setAttribute("aria-hidden", "true");
  $("drawerBackdrop").hidden = true;
}

function renderCart() {
  if (!batchCache) return;
  const lines = getCart()
    .map((item) => ({ ...item, batch: batchCache.find((b) => b.id === item.batchId) }))
    .filter((l) => l.batch);

  if (!lines.length) {
    $("cartItems").innerHTML = `<div class="empty">${ICON.cart}<p>${t("cart_empty")}</p><a class="btn primary" href="/#catalog">${t("nav_catalog")}</a></div>`;
    $("cartFoot").innerHTML = "";
    return;
  }

  $("cartItems").innerHTML = lines
    .map(
      ({ batch, tons }) => `
      <div class="cart-line" data-id="${esc(batch.id)}">
        ${coverHtml(batch, "sm")}
        <div class="cart-info">
          <b>${esc(loc(batch.plant))}</b>
          <span class="small muted">${esc(typeLabel(batch.type))} · ${fmtKzt(batch.pricePerTon)}/${t("t")}</span>
          <div class="stepper-input">
            <button type="button" data-step="-25">−</button>
            <input type="number" min="1" max="${batch.tonsAvailable}" value="${tons}" data-tons>
            <button type="button" data-step="25">+</button>
            <span class="small muted">${t("t")}</span>
          </div>
        </div>
        <div class="cart-sum">
          <b>${fmtKzt(tons * batch.pricePerTon)}</b>
          <button class="icon-btn sm" type="button" data-remove aria-label="remove">${ICON.trash}</button>
        </div>
      </div>`,
    )
    .join("");

  const goods = lines.reduce((s, l) => s + l.tons * l.batch.pricePerTon, 0);
  const tons = lines.reduce((s, l) => s + l.tons, 0);
  $("cartFoot").innerHTML = `
    <div class="sum-row"><span>${t("ck_goods")} · ${fmtNum(tons)} ${t("t")}</span><b>${fmtKzt(goods)}</b></div>
    <div class="sum-row muted"><span>${t("ck_service")}</span><span>${fmtKzt(tons * config.commissionPerTon)}</span></div>
    <div class="sum-row muted"><span>${t("ck_delivery")}</span><span>${t("ck_delivery_next")}</span></div>
    <a class="btn primary block" href="/checkout.html">${t("checkout_btn")}</a>`;
}

function onCartInput(e) {
  const line = e.target.closest(".cart-line");
  if (!line) return;
  const id = line.dataset.id;
  const batch = batchCache.find((b) => b.id === id);
  const input = line.querySelector("[data-tons]");
  const clamp = (v) => Math.max(1, Math.min(batch.tonsAvailable, Math.round(v) || 1));
  if (e.target.closest("[data-remove]")) return removeCartItem(id);
  if (e.target.closest("[data-step]")) setCartItem(id, clamp(Number(input.value) + Number(e.target.closest("[data-step]").dataset.step)));
  else if (e.type === "change" && e.target === input) setCartItem(id, clamp(Number(input.value)));
}

// Обновить кэш партий (например, после заказа количество изменилось)
export function invalidateBatches() {
  batchCache = null;
}

export function mountShell(active) {
  const header = document.getElementById("shell");
  header.className = "shell";
  header.innerHTML = headerHtml(active);
  document.body.insertAdjacentHTML("beforeend", drawerHtml());
  const foot = document.getElementById("foot");
  if (foot) {
    foot.className = "foot";
    foot.innerHTML = `<div class="wrap foot-in"><a class="logo" href="/">${LOGO}<span>KülTas</span></a><span data-i18n="footer_note"></span></div>`;
  }

  const params = new URLSearchParams(location.search);
  $("searchInput").value = params.get("q") ?? "";
  $("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("searchInput").value.trim();
    if (location.pathname === "/" || location.pathname === "/index.html") {
      // своё имя события: у <input type="search"> есть встроенное событие "search"
      window.dispatchEvent(new CustomEvent("kultas:search", { detail: q }));
      document.getElementById("catalog")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else {
      location.href = `/?q=${encodeURIComponent(q)}#catalog`;
    }
  });

  $("themeBtn").addEventListener("click", toggleTheme);
  $("cartBtn").addEventListener("click", openCart);
  $("cartClose").addEventListener("click", closeCart);
  $("drawerBackdrop").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());
  $("cartItems").addEventListener("click", onCartInput);
  $("cartItems").addEventListener("change", onCartInput);

  mountLangSwitcher();
  renderThemeIcon();
  renderCounts();
  window.addEventListener("statechange", () => {
    renderCounts();
    renderCart();
  });
  window.addEventListener("langchange", () => {
    renderThemeIcon();
    renderCart();
    document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
}

// Короткое всплывающее уведомление («Добавлено в корзину»)
export function toast(message) {
  let box = document.getElementById("toast");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast";
    box.className = "toast";
    document.body.append(box);
  }
  box.textContent = message;
  box.classList.add("show");
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.classList.remove("show"), 2200);
}
