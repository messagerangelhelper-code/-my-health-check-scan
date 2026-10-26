import { INGREDIENTS, LEVELS, ALLERGENS, AVOID_OPTIONS } from "./ingredients.js";

// Makes label text easy to search: lower case, "E 129"/"E-129" -> "e129", "FD&C" removed.
export function normalizeText(text) {
  return ` ${(text || "")
    .toLowerCase()
    .replace(/fd\s*&\s*c/g, " ")
    .replace(/\be[\s-]?(\d{3}[a-z]?)\b/g, "e$1")
    .replace(/[_*]/g, " ")
    .replace(/\s+/g, " ")} `;
}

function eCodes(tags) {
  return new Set((tags || []).map((t) => String(t).replace(/^[a-z]{2}:/, "").toLowerCase()));
}

function firstMatch(regexes, text) {
  for (const r of regexes) {
    const m = text.match(r);
    if (m) return m[0].trim();
  }
  return null;
}

// Traffic-light levels per 100 g (or per 100 ml for drinks), from the UK front-of-pack guidance.
const LIMITS = {
  food: { fat: [3, 17.5], satfat: [1.5, 5], sugars: [5, 22.5], salt: [0.3, 1.5] },
  drink: { fat: [1.5, 8.75], satfat: [0.75, 2.5], sugars: [2.5, 11.25], salt: [0.3, 0.75] },
};

const NUTRIENTS = [
  { id: "sugars", key: "sugars_100g", name: "Sugar" },
  { id: "salt", key: "salt_100g", name: "Salt" },
  { id: "satfat", key: "saturated-fat_100g", name: "Saturated fat" },
  { id: "fat", key: "fat_100g", name: "Fat" },
  { id: "fiber", key: "fiber_100g", name: "Fiber" },
  { id: "proteins", key: "proteins_100g", name: "Protein" },
];

export const NOVA = {
  1: "Unprocessed or minimally processed",
  2: "Processed cooking ingredient",
  3: "Processed food",
  4: "Ultra-processed food",
};

// Drinks are measured per 100 ml, everything else per 100 g.
// Coffee grounds, tea bags and drink powders are filed under "beverages" but aren't drinks yet.
const NOT_YET_DRINKS = /^en:(?:coffees|ground-coffees|instant-coffees|coffee-beans|coffee-capsules|coffee-pods|teas|tea-bags|black-teas|green-teas|herbal-teas|infusions|cocoa-powders|powdered-drinks|drink-mixes|beverage-preparations|sweeteners)$/;
const READY_DRINKS = /^en:[a-z-]*(?:drinks|sodas|juices|waters|nectars|iced-coffees|iced-teas|milks)$/;

export function isDrink(product) {
  const tags = (product.categories_tags || []).filter((c) => c !== "en:powdered-drinks");
  const beverage = tags.some((c) => c === "en:beverages" || (/^en:[a-z-]*(?:drinks|beverages|sodas|juices|waters)$/.test(c) && !/foods-and-beverages$/.test(c)));
  if (!beverage) return false;
  const notYet = (product.categories_tags || []).some((c) => NOT_YET_DRINKS.test(c));
  const ready = tags.some((c) => READY_DRINKS.test(c) && !/-and-beverages$/.test(c));
  return !notYet || ready;
}

export function nutritionFacts(product) {
  const n = product.nutriments || {};
  const limits = isDrink(product) ? LIMITS.drink : LIMITS.food;
  const unit = isDrink(product) ? "100 ml" : "100 g";
  return NUTRIENTS.map((x) => {
    const raw = n[x.key];
    const value = raw === undefined || raw === null || raw === "" ? null : Number(raw);
    let level = null;
    if (value !== null && !Number.isNaN(value) && limits[x.id]) {
      const [low, high] = limits[x.id];
      level = value <= low ? "low" : value > high ? "high" : "medium";
    }
    return { ...x, value: value === null || Number.isNaN(value) ? null : value, level, unit };
  });
}

export function analyze(product, settings = {}) {
  const textRaw = product.ingredients_text_en || product.ingredients_text || "";
  const text = normalizeText(textRaw);
  const adds = eCodes(product.additives_tags);
  const hasIngredients = textRaw.trim().length > 0 || adds.size > 0;
  const chosenAllergens = new Set(settings.allergens || []);
  const chosenAvoid = new Set(settings.avoid || []);

  const flags = [];
  for (const item of INGREDIENTS) {
    const byE = item.e.find((e) => adds.has(e) || text.includes(` ${e} `) || new RegExp(`\\b${e}\\b`).test(text));
    const byName = firstMatch(item.match, text);
    if (byE || byName) flags.push({ ...item, levelInfo: LEVELS[item.level], found: byName || byE.toUpperCase() });
  }
  flags.sort((a, b) => LEVELS[b.level].rank - LEVELS[a.level].rank);
  const flaggedIds = new Set(flags.map((f) => f.id));

  const allergenTags = new Set(product.allergens_tags || []);
  const traceTags = new Set(product.traces_tags || []);
  const allergens = ALLERGENS.map((a) => {
    const word = firstMatch(a.words, text);
    const contains = a.tags.some((t) => allergenTags.has(t)) || !!word;
    const maybe = !contains && a.tags.some((t) => traceTags.has(t));
    return { ...a, contains, maybe, found: word, chosen: chosenAllergens.has(a.id) };
  }).filter((a) => a.contains || a.maybe);

  const avoid = AVOID_OPTIONS.filter((o) => chosenAvoid.has(o.id)).map((o) => {
    const hits = [];
    for (const id of o.ingredientIds || []) if (flaggedIds.has(id)) hits.push(flags.find((f) => f.id === id).found);
    for (const e of o.e) if (adds.has(e) || new RegExp(`\\b${e}\\b`).test(text)) hits.push(e.toUpperCase());
    for (const r of o.words) {
      const m = text.match(r);
      if (m) hits.push(m[0].trim());
    }
    return { ...o, hits: [...new Set(hits)] };
  }).filter((o) => o.hits.length > 0);

  const myAllergens = allergens.filter((a) => a.chosen);
  const nova = Number(product.nova_group) || null;
  const nutriscore = /^[a-e]$/.test(product.nutriscore_grade || "") ? product.nutriscore_grade : null;

  let verdict = "green";
  if (!hasIngredients) verdict = "unknown";
  else if (flags.some((f) => f.level === "removed") || myAllergens.some((a) => a.contains)) verdict = "red";
  else if (flags.length || myAllergens.some((a) => a.maybe) || avoid.length) verdict = "amber";

  const headline = {
    red: myAllergens.some((a) => a.contains) ? "Contains an allergen you're avoiding" : "Contains an ingredient being removed from U.S. food",
    amber: flags.length ? `${flags.length} ingredient${flags.length === 1 ? "" : "s"} to know about` : "Has something on your list",
    green: "No flagged ingredients found",
    unknown: "No ingredient list yet",
  }[verdict];

  // Lower is better. Used to rank healthier options.
  const score =
    flags.reduce((s, f) => s + LEVELS[f.level].rank * 3, 0) +
    myAllergens.reduce((s, a) => s + (a.contains ? 20 : 4), 0) +
    avoid.length * 3 +
    (nutriscore ? "abcde".indexOf(nutriscore) : 2) +
    (nova ? nova - 1 : 1.5);

  return { verdict, headline, flags, allergens, myAllergens, avoid, nova, nutriscore, nutrition: nutritionFacts(product), hasIngredients, score, ingredientsText: textRaw };
}
