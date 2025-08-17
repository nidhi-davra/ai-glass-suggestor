// src/utils/openaiVision.js

const FACE_SHAPES = ["round", "square", "oval", "oblong", "heart", "diamond"];

export async function analyzeFrameWithOpenAI({ imageDataUrl, model = "gpt-4o" }) {
  const resp = await fetch("http://localhost:4000/api/openai/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, model }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Proxy error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from OpenAI");
  let parsed;
  try { parsed = JSON.parse(content); } catch { throw new Error("Failed to parse OpenAI JSON"); }

  const recommendedFor = Array.isArray(parsed.recommendedFor)
    ? parsed.recommendedFor.filter((s) => FACE_SHAPES.includes(String(s).toLowerCase()))
    : [];
  const styles = Array.isArray(parsed.styles) ? parsed.styles.map((s) => String(s)) : [];
  const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";
  return { recommendedFor, styles, reasoning };
}

export async function imageUrlToDataUrl(src) {
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
} 