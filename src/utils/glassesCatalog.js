// src/utils/glassesCatalog.js

export const GLASSES_CATALOG = [
  {
    id: "classic-black-rect",
    name: "Classic Rectangular Black",
    src: "/black-glasses.webp",
    styles: ["rectangle", "wayfarer"],
    recommendedFor: ["round", "oval", "heart"],
  },
  {
    id: "thin-gold-round",
    name: "Thin Gold Round",
    src: "/glasses3.png",
    styles: ["round"],
    recommendedFor: ["square", "diamond"],
  },
  {
    id: "glass2",
    name: "Glass 2",
    src: "/glass2.png",
    styles: ["wayfarer", "rectangle"],
    recommendedFor: ["oval", "oblong", "round"],
  },
  {
    id: "glass3",
    name: "Glass 3",
    src: "/glasses3.png",
    styles: ["round"],
    recommendedFor: ["square", "diamond"],
  },
  {
    id: "glass4",
    name: "Glass 4",
    src: "/glass4.png",
    styles: ["aviator"],
    recommendedFor: ["heart", "square", "diamond"],
  },
  
];

export async function loadCatalog() {
  try {
    const resp = await fetch('http://localhost:4000/api/catalog');
    if (!resp.ok) throw new Error('DB fetch failed');
    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items; // return even if empty; only fall back if request fails
  } catch {
    return GLASSES_CATALOG; // network/server error fallback
  }
}

export async function saveCatalog(items) {
  try {
    const resp = await fetch('http://localhost:4000/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!resp.ok) return false;
    return true;
  } catch (err) {
    console.error('Failed to save catalog:', err);
    return false;
  }
}

export const getSuggestionsForShape = (shape, catalog) => {
  const list = Array.isArray(catalog) ? catalog : [];
  if (!shape || shape === "unknown") return list;
  const prioritized = list.filter((g) => g.recommendedFor?.includes(shape));
  const others = list.filter((g) => !g.recommendedFor?.includes(shape));
  return [...prioritized, ...others];
}; 