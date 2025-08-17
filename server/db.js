// server/db.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbFile = path.resolve(process.cwd(), 'server', 'data.sqlite');
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  src TEXT NOT NULL,
  styles TEXT NOT NULL,            -- JSON string of array
  recommended_for TEXT NOT NULL,   -- JSON string of array
  reasoning TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function normalizeItem(input) {
  const id = String(input.id || '').trim();
  const name = String(input.name || '').trim();
  const src = String(input.src || '').trim();
  const styles = Array.isArray(input.styles) ? input.styles.map(String) : [];
  const recommendedFor = Array.isArray(input.recommendedFor) ? input.recommendedFor.map(String) : [];
  const reasoning = typeof input.reasoning === 'string' ? input.reasoning : '';
  return { id, name, src, styles, recommendedFor, reasoning };
}

export function getAllItems() {
  const rows = db.prepare('SELECT id, name, src, styles, recommended_for AS recommendedFor, reasoning, created_at AS createdAt FROM catalog_items ORDER BY created_at DESC').all();
  return rows.map((r) => ({
    ...r,
    styles: safeParseArray(r.styles),
    recommendedFor: safeParseArray(r.recommendedFor),
  }));
}

function safeParseArray(json) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function upsertItems(items) {
  if (!Array.isArray(items)) return 0;
  const toSave = items.map(normalizeItem).filter((i) => i.id && i.name && i.src);
  const stmt = db.prepare(`
    INSERT INTO catalog_items (id, name, src, styles, recommended_for, reasoning)
    VALUES (@id, @name, @src, @styles, @recommendedFor, @reasoning)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      src=excluded.src,
      styles=excluded.styles,
      recommended_for=excluded.recommended_for,
      reasoning=excluded.reasoning
  `);
  const trx = db.transaction((arr) => {
    let count = 0;
    for (const it of arr) {
      stmt.run({
        id: it.id,
        name: it.name,
        src: it.src,
        styles: JSON.stringify(it.styles || []),
        recommendedFor: JSON.stringify(it.recommendedFor || []),
        reasoning: it.reasoning || '',
      });
      count += 1;
    }
    return count;
  });
  return trx(toSave);
}

export function deleteItemById(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return 0;
  const info = db.prepare('DELETE FROM catalog_items WHERE id = ?').run(cleanId);
  return info?.changes || 0;
} 