// Ingredients are stored as comma-separated text on the menu item:
//   ingredients:   "Tomato, Onion, Cheese"
//   ingredientsAm: "ቲማቲም, ሽንኩርት, አይብ"   (same order)
// Returns [{ en, am }] — `am` falls back to the English name.
const split = (v) =>
  (v || '')
    .split(/[,،፣]/)
    .map((x) => x.trim())
    .filter(Boolean);

export function parseIngredients(item) {
  const en = split(item?.ingredients);
  const am = split(item?.ingredientsAm);
  return en.map((name, i) => ({ en: name, am: am[i] || name }));
}
