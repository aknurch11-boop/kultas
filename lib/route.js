// Маршрут машины по реальным дорогам через открытый сервис OSRM.
// Если сервис недоступен — рисуем прямую линию, чтобы трекинг работал всегда.
import { haversineKm } from "../public/js/trip.js";

const OSRM = "https://router.project-osrm.org/route/v1/driving";

export async function getRoute(from, to) {
  try {
    const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "KulTas/1.0 (hackathon demo)" } });
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) throw new Error(data.code || "no route");
    const route = data.routes[0];
    return {
      coords: thin(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), 400),
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      source: "osrm",
    };
  } catch (err) {
    console.warn("OSRM unavailable, using straight line:", err.message);
    return straightLine(from, to);
  }
}

function straightLine(from, to) {
  const coords = Array.from({ length: 40 }, (_, i) => {
    const k = i / 39;
    return [from.lat + (to.lat - from.lat) * k, from.lng + (to.lng - from.lng) * k];
  });
  const distanceKm = Math.round(haversineKm([from.lat, from.lng], [to.lat, to.lng]) * 1.25 * 10) / 10;
  return { coords, distanceKm, durationMin: Math.round((distanceKm / 60) * 60), source: "line" };
}

// Оставляем не больше max точек, чтобы ответ API был лёгким.
function thin(coords, max) {
  if (coords.length <= max) return coords;
  const step = Math.ceil(coords.length / max);
  const out = coords.filter((_, i) => i % step === 0);
  out.push(coords[coords.length - 1]);
  return out;
}
