export const layout = {
  container: { padding: 16, maxWidth: 900, margin: "0 auto" },
};

export const text = {
  h1: { margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 700 },
  h2: { margin: 0, marginBottom: 6, fontSize: 18, fontWeight: 700 },
  subtext: { margin: 0, marginBottom: 12, fontSize: 14, color: "#4b5563" },
  label: { fontSize: 12, color: "#4b5563" },
  small: { fontSize: 13 },
};

export const button = {
  primary: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
  },
  primaryOutline: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
  },
  secondary: {
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cursor: "pointer",
  },
  danger: {
    padding: "6px 10px",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    background: "#fff7ed",
    borderRadius: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    cursor: "pointer",
  },
  tile: {
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: 8,
    background: "#ffffff",
    cursor: "pointer",
  },
};

export const card = {
  base: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  subtle: { marginTop: 8, background: "#f9fafb", borderRadius: 8, padding: 8, border: "1px solid #eef2f7" },
  image: { height: 44, borderRadius: 6, border: "1px solid #f3f4f6" },
  canvas: { display: 'block', marginTop: 12, maxWidth: '100%', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
}; 