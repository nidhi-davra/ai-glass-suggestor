// src/pages/CatalogManager.jsx
import React, { useMemo, useState, useEffect } from "react";
import { GLASSES_CATALOG, loadCatalog } from "../utils/glassesCatalog";
import { analyzeFrameWithOpenAI } from "../utils/openaiVision";
import { downscaleDataUrl } from "../utils/imageUtils";
import { layout, text, button as btn, card } from "../utils/styles";

export default function CatalogManager() {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [customItems, setCustomItems] = useState([]);
  const [baseItems, setBaseItems] = useState([]);

  useEffect(() => {
    (async () => {
      const fromDb = await loadCatalog();
      setBaseItems(fromDb.length ? fromDb : GLASSES_CATALOG);
    })();
  }, []);

  const items = useMemo(() => {
    const byId = new Map();
    // Prefer DB-loaded items over temporary uploads when ids collide
    customItems.forEach((it) => byId.set(it.id, it));
    baseItems.forEach((it) => byId.set(it.id, it));
    return Array.from(byId.values());
  }, [baseItems, customItems]);




  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const toAdd = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const rawDataUrl = await readFileAsDataURL(file);
      const dataUrl = await downscaleDataUrl(rawDataUrl, 700, 0.82);
      const base = file.name.replace(/\.[^/.]+$/, "");
      const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const id = `upload-${Date.now()}-${slug}`;
      toAdd.push({ id, name: base, src: dataUrl, styles: [], recommendedFor: [] });
    }
    if (toAdd.length === 0) return;

    // Add to local state immediately for UI
    setCustomItems((prev) => [...prev, ...toAdd]);

    // Auto-save newly uploaded items to DB immediately
    try {
      const resp = await fetch('http://localhost:4000/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: toAdd }),
      });
      if (resp.ok) {
        try { localStorage.setItem('catalog:dirty', String(Date.now())); } catch {}
        const refreshed = await loadCatalog();
        setBaseItems(refreshed);
      }
    } catch (err) {
      console.error('Initial upload save failed:', err);
    }

    // Auto-analyze newly added items and then persist updates
    setIsRunning(true);
    const out = { ...results };
    try {
      for (const g of toAdd) {
        const res = await analyzeFrameWithOpenAI({ imageDataUrl: g.src });
        out[g.id] = res;
        setResults({ ...out });
      }

      const updatedUploads = toAdd.map((g) => ({
        ...g,
        ...(out[g.id]
          ? {
              styles: out[g.id].styles?.length ? out[g.id].styles : g.styles,
              recommendedFor: out[g.id].recommendedFor?.length ? out[g.id].recommendedFor : g.recommendedFor,
              reasoning: out[g.id].reasoning || g.reasoning || "",
            }
          : {}),
      }));
      try {
        const resp2 = await fetch('http://localhost:4000/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updatedUploads }),
        });
        if (resp2.ok) {
          try { localStorage.setItem('catalog:dirty', String(Date.now())); } catch {}
          const refreshed = await loadCatalog();
          setBaseItems(refreshed);
        }
      } catch {}
    } catch (err) {
      console.error(err);
      alert(err.message || String(err));
    } finally {
      setIsRunning(false);
    }

    // Reset input value so the same files can be re-uploaded if needed
    e.target.value = "";
  };

  const handleDeleteItem = async (id) => {
    const confirmed = window.confirm('Delete this item?');
    if (!confirmed) return;
    try {
      const resp = await fetch(`http://localhost:4000/api/catalog/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!resp.ok && resp.status !== 404) {
        const text = await resp.text();
        throw new Error(text || 'Delete failed');
      }
      // Remove from local state immediately
      setBaseItems((prev) => prev.filter((it) => it.id !== id));
      setCustomItems((prev) => prev.filter((it) => it.id !== id));
      try { localStorage.setItem('catalog:dirty', String(Date.now())); } catch {}
      // Reload from DB for consistency
      const refreshed = await loadCatalog();
      setBaseItems(refreshed);
    } catch (err) {
      console.error(err);
      alert(err.message || String(err));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Catalog Manager</h2>
          <p className="text-sm text-gray-600">Use OpenAI Vision to auto-suggest face shapes and styles per frame. Upload new frames below.</p>
        </div>
        <label className="btn-secondary">
          Upload frames
          <input type="file" accept="image/*" multiple onChange={handleUploadFiles} style={{ display: "none" }} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map((g) => {
          const r = results[g.id];
          return (
            <div key={g.id} className="rounded-xl border bg-white shadow-sm p-3 h-full flex flex-col border-gray-200">
              <div className="relative w-full h-40 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                <img src={g.src} alt={g.name} className="absolute inset-0 w-full h-full object-contain p-2" />
              </div>
              <div className="mt-2 h-16 overflow-hidden">
                <div className="font-semibold text-sm truncate" title={g.name}>{g.name}</div>
                <div className="text-[10px] text-gray-500 truncate">{g.id}</div>
                {Array.isArray(g.styles) && g.styles.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.styles.slice(0, 2).map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{s}</span>
                    ))}
                    {g.styles.length > 2 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">+{g.styles.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-auto flex justify-end pt-2">
                <button onClick={() => handleDeleteItem(g.id)} className="btn-danger">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 