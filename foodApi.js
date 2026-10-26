// Open Food Facts: a free, public food database (no account or key needed).
// https://world.openfoodfacts.org
const BASE = "https://world.openfoodfacts.org";
const FIELDS = [
  "code", "product_name", "product_name_en", "brands", "image_front_small_url", "image_front_url",
  "ingredients_text_en", "ingredients_text", "additives_tags", "allergens_tags", "traces_tags",
  "nutriscore_grade", "nova_group", "nutriments", "categories_tags", "quantity",
].join(",");

export function cleanBarcode(value) {
  return String(value || "").replace(/\D/g, "");
}

export function productName(p) {
  return (p.product_name_en || p.product_name || "").trim() || "Unnamed product";
}

async function getJson(url, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) throw new Error("busy");
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Returns the product, or null when the barcode isn't in the database.
export async function fetchProduct(barcode) {
  const code = cleanBarcode(barcode);
  if (code.length < 6) throw new Error("That barcode looks too short. Check the numbers and try again.");
  const tries = [code];
  if (code.length === 12) tries.push(`0${code}`); // UPC-A is often stored as EAN-13 with a leading 0
  if (code.length === 13 && code.startsWith("0")) tries.push(code.slice(1));
  for (const c of tries) {
    let data;
    try {
      data = await getJson(`${BASE}/api/v2/product/${c}.json?fields=${FIELDS}`);
    } catch (e) {
      if (e.message === "busy") throw new Error("The food database is busy. Please wait a minute and try again.");
      throw new Error("Couldn't reach the food database. Check your internet connection and try again.");
    }
    if (data && data.status === 1 && data.product) return { ...data.product, code: data.product.code || c };
  }
  return null;
}

// Most specific category the product belongs to (the database lists them broad to narrow).
export function mainCategory(p) {
  const cats = (p.categories_tags || []).filter((c) => c.startsWith("en:"));
  return cats.length ? cats[cats.length - 1] : null;
}

export function categoryLabel(tag) {
  if (!tag) return "";
  const s = tag.replace(/^en:/, "").replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Popular products in the same category, sold in the U.S. when possible.
export async function fetchSimilar(p) {
  const cat = mainCategory(p);
  if (!cat) return [];
  const run = async (country) => {
    const q = new URLSearchParams({ categories_tags: cat, fields: FIELDS, page_size: "40", sort_by: "unique_scans_n" });
    if (country) q.set("countries_tags", "en:united-states");
    const data = await getJson(`${BASE}/api/v2/search?${q}`, 15000);
    return (data && data.products) || [];
  };
  let list = [];
  try {
    list = await run(true);
    if (list.length < 5) list = list.concat(await run(false));
  } catch {
    return [];
  }
  const seen = new Set([cleanBarcode(p.code)]);
  return list.filter((x) => {
    const c = cleanBarcode(x.code);
    if (!c || seen.has(c)) return false;
    seen.add(c);
    return !!(x.ingredients_text_en || x.ingredients_text || (x.additives_tags || []).length) && productName(x) !== "Unnamed product";
  });
}
