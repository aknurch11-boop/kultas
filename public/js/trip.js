// Логика поездки, общая для сервера и браузера (один файл — одинаковый расчёт везде).
// Этапы как у трекинга доставки пиццы: принят → зарезервирован → погрузка → в пути → доставлено.

export const PHASES = ["accepted", "reserved", "loading", "in_transit", "delivered"];

// Время начала каждого этапа (мс). Поездка в демо ускорена до tripSeconds.
export function buildTimeline(startMs, tripSeconds) {
  const inTransit = startMs + 30_000;
  return {
    accepted: startMs,
    reserved: startMs + 8_000,
    loading: startMs + 18_000,
    in_transit: inTransit,
    delivered: inTransit + tripSeconds * 1000,
  };
}

export function tripState(timeline, nowMs) {
  let phase = PHASES[0];
  for (const p of PHASES) if (nowMs >= timeline[p]) phase = p;
  const span = timeline.delivered - timeline.in_transit;
  const progress = phase === "delivered" ? 1 : phase === "in_transit" ? (nowMs - timeline.in_transit) / span : 0;
  return { phase, progress: Math.min(1, Math.max(0, progress)), etaMs: Math.max(0, timeline.delivered - nowMs) };
}

export function haversineKm([lat1, lng1], [lat2, lng2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// Накопленное расстояние вдоль маршрута — чтобы двигать машину равномерно по дороге.
export function cumulative(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]));
  return cum;
}

// Точка на маршруте для доли пути progress (0..1) и индекс последней пройденной вершины.
export function pointAt(coords, cum, progress) {
  const target = cum[cum.length - 1] * progress;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const segment = cum[i] - cum[i - 1] || 1;
  const k = Math.min(1, Math.max(0, (target - cum[i - 1]) / segment));
  const [a, b] = [coords[i - 1], coords[i]];
  return { point: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], index: i - 1 };
}
