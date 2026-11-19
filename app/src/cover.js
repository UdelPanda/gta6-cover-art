// Neon Coast Cover Studio — the cover renderer.
//
// Draws a multi-panel poster cover onto a canvas at its own pixel size:
// a grid of comic-book panels (each holding a photo the user cropped and
// positioned), a Vice City-style sunset or neon colour grade, and a bold
// caption band in an original display face. All art is drawn here from
// scratch; nothing is copied from any game.

/** Panel layouts: each panel and the caption band as fractions of the canvas. */
export const LAYOUTS = {
  hero: {
    label: 'Hero',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.78 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.385 },
      { x: 0.62, y: 0.385, w: 0.38, h: 0.395 },
    ],
    band: { x: 0.0, y: 0.78, w: 1.0, h: 0.22 },
  },
  grid: {
    label: 'Grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.0, y: 0.39, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.39, w: 0.5, h: 0.39 },
    ],
    band: { x: 0.0, y: 0.78, w: 1.0, h: 0.22 },
  },
  trio: {
    label: 'Trio',
    panels: [
      { x: 0.0, y: 0.0, w: 0.333, h: 0.78 },
      { x: 0.333, y: 0.0, w: 0.334, h: 0.78 },
      { x: 0.667, y: 0.0, w: 0.333, h: 0.78 },
    ],
    band: { x: 0.0, y: 0.78, w: 1.0, h: 0.22 },
  },
  solo: {
    label: 'Solo',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 0.78 }],
    band: { x: 0.0, y: 0.78, w: 1.0, h: 0.22 },
  },
};

/** Colour grades: a photo filter plus the overlay washes drawn over a panel. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.28) contrast(1.06) brightness(1.02)',
    washes: [
      { stops: [[0, 'rgba(255, 140, 60, 0.20)'], [1, 'rgba(190, 30, 110, 0.28)']], blend: 'overlay' },
      { stops: [[0, 'rgba(255, 90, 120, 0)'], [1, 'rgba(120, 20, 90, 0.22)']], blend: 'multiply' },
    ],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.45) contrast(1.16) brightness(0.9)',
    washes: [
      { stops: [[0, 'rgba(255, 40, 160, 0.30)'], [1, 'rgba(40, 10, 90, 0.34)']], blend: 'multiply' },
      { stops: [[0, 'rgba(0, 220, 255, 0.10)'], [0.5, 'rgba(0, 220, 255, 0)'], [1, 'rgba(255, 40, 160, 0.16)']], blend: 'screen' },
    ],
  },
  day: {
    label: 'Day',
    filter: 'saturate(1.18) contrast(1.03) brightness(1.09)',
    washes: [
      { stops: [[0, 'rgba(255, 220, 140, 0.14)'], [1, 'rgba(0, 190, 200, 0.12)']], blend: 'overlay' },
      { stops: [[0, 'rgba(255, 255, 255, 0.06)'], [1, 'rgba(0, 60, 90, 0.10)']], blend: 'multiply' },
    ],
  },
};

/** The gap between panels, in canvas pixels at a 1080-wide render. */
const GAP = 10;
/** The caption band's deep violet-black. */
const BAND = '#14081f';

let noiseTile = null;
/** A small pre-generated grain tile, reused for every grain overlay. */
function grainTile() {
  if (noiseTile) return noiseTile;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const data = g.createImageData(s, s);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

let dotTile = null;
/** A halftone dot tile, reused for every halftone overlay. */
function halftoneTile() {
  if (dotTile) return dotTile;
  const s = 14;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  g.clearRect(0, 0, s, s);
  g.fillStyle = 'rgba(0, 0, 0, 0.55)';
  g.beginPath();
  g.arc(s / 2, s / 2, 2.1, 0, Math.PI * 2);
  g.fill();
  dotTile = c;
  return c;
}

/** Waits until the display face is usable on canvas, then resolves. */
export async function ensureDisplayFont() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch {
    // The canvas falls back to a bold system face.
  }
}

/** Draws one panel's photo, cropped and positioned by the panel's transform. */
function drawPanelPhoto(ctx, px, py, pw, ph, panel) {
  const img = panel.photo;
  if (!img) {
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, '#3a1c52');
    g.addColorStop(1, '#1c0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `bold ${Math.max(14, ph * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
    return;
  }
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
  const scale = base * (panel.scale || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = px + (pw - dw) / 2 + (panel.dx || 0) * pw;
  const dy = py + (ph - dh) / 2 + (panel.dy || 0) * ph;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Washes the panel with the grade's colour overlays. */
function drawGradeWashes(ctx, px, py, pw, ph, grade) {
  for (const wash of grade.washes) {
    const g = ctx.createLinearGradient(px, py, px, py + ph);
    for (const [at, color] of wash.stops) g.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = wash.blend;
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }
}

/** Draws a panel: photo, grade, border, and optional drop shadow. */
function drawPanel(ctx, rect, panel, grade, effects, scale) {
  const gap = GAP * scale;
  const px = rect.x + gap / 2;
  const py = rect.y + gap / 2;
  const pw = rect.w - gap;
  const ph = rect.h - gap;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = grade.filter;
  drawPanelPhoto(ctx, px, py, pw, ph, panel);
  ctx.filter = 'none';
  drawGradeWashes(ctx, px, py, pw, ph, grade);
  if (effects.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(halftoneTile(), 'repeat');
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }
  ctx.restore();
  if (effects.shadows) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 14 * scale;
    ctx.shadowOffsetY = 5 * scale;
    ctx.strokeStyle = '#0b0512';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(px, py, pw, ph);
}

/** A small synthwave sun: a disc with horizontal slits, drawn in a gradient. */
function drawSunEmblem(ctx, cx, cy, r) {
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffd166');
  g.addColorStop(0.55, '#ff7a59');
  g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = BAND;
  const slits = [0.12, 0.3, 0.5, 0.68];
  slits.forEach((at, i) => {
    const y = cy + r * at;
    ctx.fillRect(cx - r, y, r * 2, r * (0.06 + i * 0.03));
  });
  ctx.restore();
}

/** A small palm silhouette: one leaning trunk and five thin blades that arc out from its crown and droop. */
function drawPalmEmblem(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ff2e88';
  // Trunk: a leaning, tapering curve, drawn wide enough to read as a trunk.
  ctx.beginPath();
  ctx.moveTo(-2.5, 0);
  ctx.quadraticCurveTo(-1, -16, 6, -30);
  ctx.lineTo(10, -30);
  ctx.quadraticCurveTo(3, -16, 2.5, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: thin blades from the crown (8,-30), all arcing out and drooping.
  const crown = [8, -30];
  const blades = [
    [-22, -34, -10, -36],
    [-28, -14, -18, -24],
    [34, -34, 22, -36],
    [30, -14, 22, -24],
    [10, -48, 8, -40],
  ];
  for (const [tx, ty, cx, cy] of blades) {
    // A thin blade: out along the curve, back along a near-parallel one.
    const mx = (crown[0] + tx) / 2;
    const my = (crown[1] + ty) / 2;
    ctx.beginPath();
    ctx.moveTo(crown[0], crown[1]);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.quadraticCurveTo(mx + (cx - mx) * 0.35, my + (cy - my) * 0.35, crown[0], crown[1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Fits the caption to the band, shrinking it until it fits. */
function fitCaptionSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `400 ${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `400 ${size}px Anton, sans-serif`;
  }
  return size;
}

/** Draws the caption band: sun and palm emblems, caption, tagline, rules. */
function drawCaptionBand(ctx, band, state, scale) {
  const { x: bx, y: by, w: bw, h: bh } = band;
  ctx.fillStyle = BAND;
  ctx.fillRect(bx, by, bw, bh);
  const rule = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  rule.addColorStop(0, '#ff2e88');
  rule.addColorStop(0.5, '#ff7a59');
  rule.addColorStop(1, '#00dcff');
  ctx.fillStyle = rule;
  ctx.fillRect(bx, by, bw, Math.max(3, 4 * scale));

  const caption = (state.caption || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const pad = bw * 0.06;
  const emblemR = Math.min(bh * 0.26, bw * 0.035);
  const textLeft = bx + pad + emblemR * 2.6;
  const textRight = bx + bw - pad - emblemR * 2.6;
  const textWidth = textRight - textLeft;

  drawSunEmblem(ctx, bx + pad + emblemR, by + bh * 0.5, emblemR);
  drawPalmEmblem(ctx, bx + bw - pad - emblemR * 0.9, by + bh * 0.72, (emblemR * 1.7) / 26);

  if (caption) {
    const size = fitCaptionSize(ctx, caption, textWidth, bh * 0.52);
    const cy = by + bh * (tagline ? 0.48 : 0.56);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${size}px Anton, sans-serif`;
    if (state.captionGradient) {
      const g = ctx.createLinearGradient(textLeft, 0, textRight, 0);
      g.addColorStop(0, '#ff2e88');
      g.addColorStop(0.5, '#ff9a3d');
      g.addColorStop(1, '#ffd166');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.strokeStyle = 'rgba(10, 2, 18, 0.9)';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(caption, (textLeft + textRight) / 2, cy);
    ctx.fillText(caption, (textLeft + textRight) / 2, cy);
    ctx.restore();
  }
  if (tagline) {
    const tSize = Math.max(11, bh * 0.13);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${tSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#8be9ff';
    const spacing = tSize * 0.32;
    const letters = tagline.split('');
    const widths = letters.map((ch) => ctx.measureText(ch).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0) - spacing;
    let lx = (textLeft + textRight) / 2 - total / 2;
    const ty = by + bh * 0.82;
    for (let i = 0; i < letters.length; i += 1) {
      ctx.fillText(letters[i], lx + ctx.measureText(letters[i]).width / 2, ty);
      lx += widths[i];
    }
    ctx.restore();
  }
}

/** Draws the whole cover onto the canvas at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const scale = w / 1080;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const effects = state.effects || {};
  ctx.fillStyle = '#0b0512';
  ctx.fillRect(0, 0, w, h);
  layout.panels.forEach((panelRect, i) => {
    const rect = {
      x: panelRect.x * w,
      y: panelRect.y * h,
      w: panelRect.w * w,
      h: panelRect.h * h,
    };
    const panel = (state.panels && state.panels[i]) || { photo: null, scale: 1, dx: 0, dy: 0 };
    drawPanel(ctx, rect, panel, grade, effects, scale);
  });
  const band = {
    x: layout.band.x * w,
    y: layout.band.y * h,
    w: layout.band.w * w,
    h: layout.band.h * h,
  };
  drawCaptionBand(ctx, band, state, scale);
  if (effects.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5,0,12,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  if (effects.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/** Renders the cover at an exact size and returns the canvas. */
export function renderCover(width, height, state) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
