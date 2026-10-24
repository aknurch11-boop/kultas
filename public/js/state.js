// Корзина, избранное и сравнение — хранятся в браузере (localStorage), как в обычном интернет-магазине.
const KEYS = { cart: "kultas-cart", fav: "kultas-fav", compare: "kultas-compare" };
export const COMPARE_MAX = 3;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(KEYS[key])) ?? [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch {
    // без localStorage корзина живёт только до перезагрузки страницы
  }
  memory[key] = value;
  window.dispatchEvent(new CustomEvent("statechange", { detail: key }));
}

const memory = { cart: read("cart"), fav: read("fav"), compare: read("compare") };

// Корзина: [{ batchId, tons }]
export const getCart = () => memory.cart;
export function setCartItem(batchId, tons) {
  const cart = memory.cart.filter((i) => i.batchId !== batchId);
  if (tons > 0) cart.push({ batchId, tons });
  write("cart", cart);
}
export const removeCartItem = (batchId) => setCartItem(batchId, 0);
export const clearCart = () => write("cart", []);
export const cartTons = (batchId) => memory.cart.find((i) => i.batchId === batchId)?.tons ?? 0;

// Избранное и сравнение: списки id партий
export const getFavs = () => memory.fav;
export const isFav = (id) => memory.fav.includes(id);
export const toggleFav = (id) => write("fav", isFav(id) ? memory.fav.filter((x) => x !== id) : [...memory.fav, id]);

export const getCompare = () => memory.compare;
export const inCompare = (id) => memory.compare.includes(id);
// Возвращает false, если в сравнении уже 3 партии.
export function toggleCompare(id) {
  if (inCompare(id)) {
    write("compare", memory.compare.filter((x) => x !== id));
    return true;
  }
  if (memory.compare.length >= COMPARE_MAX) return false;
  write("compare", [...memory.compare, id]);
  return true;
}
