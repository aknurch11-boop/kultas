// Параметры экономики и демо. Всё, что помечено «предположение», — гипотезы команды,
// их можно поменять переменными окружения без правки кода.
const num = (value, fallback) => (Number.isFinite(Number(value)) && value !== undefined && value !== "" ? Number(value) : fallback);

export const CONFIG = {
  // ≈ 2 200 ₸ за мешок 50 кг (OLX, Астана, июль 2026) → ≈ 44 000 ₸/т. Пересчёт команды, розничная цена.
  cementPricePerTon: num(process.env.CEMENT_PRICE_KZT, 44_000),
  // 0,67 (Индия, CII) – 0,81 (Eagle Materials) т CO₂ на т цемента. Берём 0,7 — предположение.
  co2PerTonCement: num(process.env.CO2_PER_TON, 0.7),
  // Грузоподъёмность цементовоза — предположение.
  truckCapacityTons: num(process.env.TRUCK_CAPACITY_T, 25),
  // Комиссия платформы с каждой тонны — предположение.
  commissionPerTon: num(process.env.COMMISSION_PER_TON_KZT, 2_000),
  // Расход цемента на 1 м³ бетона — предположение для калькулятора.
  cementPerM3Kg: num(process.env.CEMENT_PER_M3_KG, 350),
  // ≈20% — ориентир из дорожного строительства Алматы (Forbes.kz).
  replacementPct: num(process.env.REPLACEMENT_PCT, 20),
  // Тариф доставки сыпучего груза, ₸ за тонну на километр — предположение.
  deliveryPerTonKm: num(process.env.DELIVERY_KZT_PER_TKM, 30),
  // Сколько секунд длится поездка в демо-режиме (настоящая дорога — часы).
  demoTripSeconds: num(process.env.DEMO_TRIP_SECONDS, 150),
};
