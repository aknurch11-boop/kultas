// Доска запросов покупателей (RFQ): заводы публикуют потребность, ТЭЦ откликаются своей ценой.
import { t, loc } from "./i18n.js";
import { api, postJson, fmtNum, fmtKzt, esc, typeLabel } from "./common.js";
import { mountShell, toast } from "./shell.js";

const $ = (id) => document.getElementById(id);
let requests = [];
let typeFilter = "";
let openForm = null; // id запроса, у которого открыта форма отклика

mountShell("requests");

function fmtDate(iso) {
  if (!iso) return "";
  const locale = { ru: "ru-RU", kk: "kk-KZ", en: "en-GB" }[document.documentElement.lang] ?? "ru-RU";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long" });
}

function requestHtml(r) {
  const best = r.offers.length ? Math.min(...r.offers.map((o) => o.price)) : null;
  const offers = r.offers.length
    ? r.offers
        .slice()
        .sort((a, b) => a.price - b.price)
        .map((o) => `<div class="offer"><span>${esc(loc(o.plant))}${o.comment ? ` · <span class="muted">${esc(o.comment)}</span>` : ""}</span><b>${fmtKzt(o.price)}/${t("t")}${o.price === best ? ` <span class="pill eco">${t("offer_best")}</span>` : ""}</b></div>`)
        .join("")
    : `<span class="small muted">${t("rq_no_offers")}</span>`;

  const form =
    openForm === r.id
      ? `<form class="offer-form" data-offer="${esc(r.id)}">
          <input name="plant" maxlength="80" placeholder="${esc(t("offer_plant"))}" required>
          <input name="price" type="number" min="0" step="100" placeholder="${esc(t("offer_price"))}" required>
          <input class="full" name="comment" maxlength="200" placeholder="${esc(t("offer_comment"))}">
          <button class="btn primary sm full" type="submit">${t("offer_submit")}</button>
        </form>`
      : `<button class="btn ghost sm" data-respond="${esc(r.id)}">${t("rq_respond")}</button>`;

  return `
    <article class="card rq">
      <div class="rq-head">
        <div>
          <div class="rq-need">${t("rq_need")}: ${fmtNum(r.tons)} ${t("t")} · ${esc(typeLabel(r.type))}</div>
          <div class="rq-meta">
            <span><b>${esc(loc(r.company))}</b></span>
            ${loc(r.city) ? `<span>${esc(loc(r.city))}</span>` : ""}
            ${r.deadline ? `<span>${t("rq_until", { d: fmtDate(r.deadline) })}</span>` : ""}
            ${r.maxPrice ? `<span>${t("rq_budget", { p: fmtKzt(r.maxPrice) })}</span>` : ""}
          </div>
        </div>
        <div class="row"><span class="pill">${t("rq_offers", { n: r.offers.length })}</span>${r.demo ? `<span class="tag">${t("demo")}</span>` : ""}</div>
      </div>
      ${loc(r.comment) ? `<p class="small" style="margin:0">${esc(loc(r.comment))}</p>` : ""}
      <div class="offers">${offers}</div>
      <div>${form}</div>
    </article>`;
}

function render() {
  const list = requests.filter((r) => !typeFilter || r.type === typeFilter);
  $("rqList").innerHTML = list.map(requestHtml).join("");
}

async function load() {
  requests = await api("/api/requests");
  render();
}

$("rqFilter").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  typeFilter = chip.dataset.type;
  document.querySelectorAll("#rqFilter .chip").forEach((c) => c.classList.toggle("on", c === chip));
  render();
});

$("rqList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-respond]");
  if (!btn) return;
  openForm = btn.dataset.respond;
  render();
  document.querySelector(`[data-offer="${openForm}"] input`)?.focus();
});

$("rqList").addEventListener("submit", async (e) => {
  const form = e.target.closest("[data-offer]");
  if (!form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    await postJson(`/api/requests/${encodeURIComponent(form.dataset.offer)}/offers`, { ...data, price: Number(data.price) });
    openForm = null;
    toast(t("offer_sent"));
    await load();
  } catch {
    toast(t("err_generic"));
  }
});

$("rqForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("rError").hidden = true;
  $("rOk").hidden = true;
  try {
    await postJson("/api/requests", {
      company: $("rCompany").value,
      type: $("rType").value,
      tons: Number($("rTons").value),
      city: $("rCity").value,
      deadline: $("rDeadline").value,
      maxPrice: $("rPrice").value,
      comment: $("rComment").value,
      contact: $("rContact").value,
    });
    $("rqForm").reset();
    $("rOk").textContent = `✓ ${t("rq_created")}`;
    $("rOk").hidden = false;
    await load();
  } catch (err) {
    $("rError").textContent = t({ company: "err_company", tons: "err_tons", price: "err_price" }[err.code] ?? "err_generic");
    $("rError").hidden = false;
  }
});

window.addEventListener("langchange", render);
load();
