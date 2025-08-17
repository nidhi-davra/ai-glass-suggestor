// src/utils/classifyFaceShape.js

// Utility math helpers
const distance = (a, b, width = 1, height = 1) => {
  const dx = (a.x - b.x) * width;
  const dy = (a.y - b.y) * height;
  return Math.hypot(dx, dy);
};

const rotatePoint = (p, center, angleRad) => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const x = p.x - center.x;
  const y = p.y - center.y;
  return { x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos };
};

const computeBandWidth = (pointsPx, yStartRatio, yEndRatio, topY, faceLen) => {
  const startY = topY + yStartRatio * faceLen;
  const endY = topY + yEndRatio * faceLen;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let count = 0;
  for (const p of pointsPx) {
    if (p.y >= startY && p.y <= endY) {
      count += 1;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
  }
  if (count < 10) return 0; // not enough samples
  return Math.max(0, maxX - minX);
};

/**
 * Classify face shape from MediaPipe landmarks by comparing widths at
 * forehead, cheekbone (midface), and jaw bands, plus overall length.
 * Normalizes for head tilt via eye-line rotation and uses forehead/chin
 * anchors to place bands more consistently.
 *
 * @param {Array<{x:number,y:number}>} landmarks - normalized [0..1] landmarks
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {{shape: string, metrics: any, scores: Record<string, number>}}
 */
export const classifyFaceShape = (landmarks, canvasWidth, canvasHeight) => {
  if (!landmarks || landmarks.length < 468) {
    return { shape: "unknown", metrics: {}, scores: {} };
  }

  // Convert to pixel coordinates once
  const pts = landmarks.map((p) => ({ x: p.x * canvasWidth, y: p.y * canvasHeight }));

  // Eye-based rotation normalization
  const leftEye = pts[33];
  const rightEye = pts[263];
  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const rotated = pts.map((p) => rotatePoint(p, eyeCenter, -eyeAngle));

  // Use forehead and chin anchors to define vertical face segment
  const forehead = rotatePoint({ x: pts[10].x, y: pts[10].y }, eyeCenter, -eyeAngle);
  const chin = rotatePoint({ x: pts[152].x, y: pts[152].y }, eyeCenter, -eyeAngle);
  let topY = Math.min(forehead.y, chin.y);
  let bottomY = Math.max(forehead.y, chin.y);

  // Fallback if anchors are unreliable
  if (!(bottomY > topY)) {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of rotated) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    topY = minY;
    bottomY = maxY;
  }

  const faceLength = Math.max(1, bottomY - topY);

  // For overall width, use midface band to avoid hair/ears outliers
  const midBandPoints = rotated.filter((p) => p.y >= topY + 0.35 * faceLength && p.y <= topY + 0.60 * faceLength);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const p of midBandPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }
  const overallWidth = Math.max(1, maxX - minX);

  // Measure widths at three horizontal bands using anchors
  const foreheadWidth = computeBandWidth(rotated, 0.05, 0.20, topY, faceLength);
  const cheekboneWidth = computeBandWidth(rotated, 0.35, 0.60, topY, faceLength);
  const jawWidth = computeBandWidth(rotated, 0.75, 0.98, topY, faceLength);

  // Ratios relative to cheekbone width
  const cheek = Math.max(1, cheekboneWidth);
  const lengthToCheek = faceLength / cheek;
  const foreheadToCheek = foreheadWidth / cheek;
  const jawToCheek = jawWidth / cheek;
  const widthToLength = overallWidth / faceLength;

  const scores = {
    round: 0,
    square: 0,
    oval: 0,
    oblong: 0,
    heart: 0,
    diamond: 0,
  };

  // Round: length ~ width, and widths across bands similar
  if (lengthToCheek >= 0.9 && lengthToCheek <= 1.15) scores.round += 0.8;
  if (Math.abs(foreheadToCheek - 1) < 0.08 && Math.abs(jawToCheek - 1) < 0.08) scores.round += 0.7;

  // Square: length slightly > width, band widths similar
  if (lengthToCheek >= 1.05 && lengthToCheek <= 1.35) scores.square += 0.9;
  if (Math.abs(foreheadToCheek - 1) < 0.07 && Math.abs(jawToCheek - 1) < 0.07) scores.square += 0.6;

  // Oval: length clearly > width, cheekbones slightly widest
  if (lengthToCheek >= 1.30 && lengthToCheek <= 1.65) scores.oval += 1.0;
  if (foreheadToCheek < 0.98 && jawToCheek < 0.98) scores.oval += 0.6;

  // Oblong/Rectangle: length much greater than width
  if (lengthToCheek > 1.65 || widthToLength < 0.6) scores.oblong += 1.5;

  // Heart: forehead > cheekbones, jaw narrower
  if (foreheadToCheek >= 1.05 && jawToCheek <= 0.95) scores.heart += 1.2;

  // Diamond: cheekbones widest; both forehead and jaw narrower
  if (foreheadToCheek <= 0.95 && jawToCheek <= 0.95) scores.diamond += 1.1;

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const shape = top && top[1] > 0 ? top[0] : "unknown";

  return {
    shape,
    metrics: {
      faceLength,
      overallWidth,
      foreheadWidth,
      cheekboneWidth,
      jawWidth,
      lengthToCheek,
      foreheadToCheek,
      jawToCheek,
      widthToLength,
    },
    scores,
  };
}; 