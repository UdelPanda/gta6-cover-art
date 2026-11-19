// Vice City Case Files — the cover renderer.
//
// Draws a multi-panel poster cover onto a canvas at its own pixel size:
// a grid of comic-book panels (each holding a photo the user cropped and
// positioned, or one of the app's own original Vice City illustrations),
// a Vice City-style sunset or neon colour grade, act labels for the story
// templates, and a caption band styled as a police case file — case
// number, wanted level, and the poster's stats. All art is drawn here from
// scratch; nothing is copied from any game.
import { drawArtScene } from './art.js';

/** Panel layouts: each panel and the title zone as fractions of the canvas.
 * The panels take the top three fifths; the title zone below them is two
 * fifths tall, so the caption is the poster's dominant element, not a strip. */
export const LAYOUTS = {
  hero: {
    label: 'Hero',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.60 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.30 },
      { x: 0.62, y: 0.30, w: 0.38, h: 0.30 },
    ],
    band: { x: 0.0, y: 0.60, w: 1.0, h: 0.40 },
  },
  hero4: {
    label: 'Hero 4',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.60 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.20 },
      { x: 0.62, y: 0.20, w: 0.38, h: 0.20 },
      { x: 0.62, y: 0.40, w: 0.38, h: 0.20 },
    ],
    band: { x: 0.0, y: 0.60, w: 1.0, h: 0.40 },
  },
  grid: {
    label: 'Grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.30 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.30 },
      { x: 0.0, y: 0.30, w: 0.5, h: 0.30 },
      { x: 0.5, y: 0.30, w: 0.5, h: 0.30 },
    ],
    band: { x: 0.0, y: 0.60, w: 1.0, h: 0.40 },
  },
  trio: {
    label: 'Trio',
    panels: [
      { x: 0.0, y: 0.0, w: 0.333, h: 0.60 },
      { x: 0.333, y: 0.0, w: 0.334, h: 0.60 },
      { x: 0.667, y: 0.0, w: 0.333, h: 0.60 },
    ],
    band: { x: 0.0, y: 0.60, w: 1.0, h: 0.40 },
  },
  solo: {
    label: 'Solo',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 0.60 }],
    band: { x: 0.0, y: 0.60, w: 1.0, h: 0.40 },
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
    // Kept gentle on purpose: a heavy multiply wash crushes night photos into mud.
    filter: 'saturate(1.35) contrast(1.10) brightness(0.96)',
    washes: [
      { stops: [[0, 'rgba(255, 40, 160, 0.18)'], [1, 'rgba(40, 10, 90, 0.20)']], blend: 'multiply' },
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

/** Waits until the display faces are usable on canvas, then resolves. */
export async function ensureDisplayFont() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('100px Pacifico');
    await document.fonts.ready;
  } catch {
    // The canvas falls back to a bold system face.
  }
}

const comicCache = new Map();
/**
 * The comic filter: turns a photo into a GTA-style illustrated panel.
 * Posterizes the colours (6 levels a channel), boosts saturation, then
 * runs a Sobel edge pass and inks the strong edges dark — so any photo
 * matches the illustrated cover. Processed at a capped size (720 px on
 * the long side) and cached per photo + crop, so live preview stays fast.
 */
function comicCanvas(img, pw, ph, panel) {
  const cap = 720;
  const s = Math.min(1, cap / Math.max(pw, ph));
  const ow = Math.max(2, Math.round(pw * s));
  const oh = Math.max(2, Math.round(ph * s));
  const key = `${img.src}|${ow}x${oh}|${(panel.scale || 1).toFixed(3)}|${(panel.dx || 0).toFixed(3)}|${(panel.dy || 0).toFixed(3)}`;
  if (comicCache.has(key)) return comicCache.get(key);
  const c = document.createElement('canvas');
  c.width = ow;
  c.height = oh;
  const g = c.getContext('2d');
  const base = Math.max(ow / img.naturalWidth, oh / img.naturalHeight);
  const sc = base * (panel.scale || 1);
  const dw = img.naturalWidth * sc;
  const dh = img.naturalHeight * sc;
  const dx = (ow - dw) / 2 + (panel.dx || 0) * ow;
  const dy = (oh - dh) / 2 + (panel.dy || 0) * oh;
  g.drawImage(img, dx, dy, dw, dh);
  const data = g.getImageData(0, 0, ow, oh);
  const d = data.data;
  const levels = 6;
  const post = (v) => Math.max(0, Math.min(255, (Math.round((v / 255) * (levels - 1)) / (levels - 1)) * 255));
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = post(lum + (d[i] - lum) * 1.35);
    d[i + 1] = post(lum + (d[i + 1] - lum) * 1.35);
    d[i + 2] = post(lum + (d[i + 2] - lum) * 1.35);
  }
  // Sobel on the posterized luminance; strong edges get inked dark.
  const lum = new Float32Array(ow * oh);
  for (let i = 0; i < ow * oh; i += 1) {
    lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  for (let y = 1; y < oh - 1; y += 1) {
    for (let x = 1; x < ow - 1; x += 1) {
      const i = y * ow + x;
      const gx = -lum[i - ow - 1] - 2 * lum[i - 1] - lum[i + ow - 1]
        + lum[i - ow + 1] + 2 * lum[i + 1] + lum[i + ow + 1];
      const gy = -lum[i - ow - 1] - 2 * lum[i - ow] - lum[i - ow + 1]
        + lum[i + ow - 1] + 2 * lum[i + ow] + lum[i + ow + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 110) {
        const a = Math.min(1, (mag - 110) / 160) * 0.92;
        const j = i * 4;
        d[j] = d[j] * (1 - a) + 20 * a;
        d[j + 1] = d[j + 1] * (1 - a) + 8 * a;
        d[j + 2] = d[j + 2] * (1 - a) + 31 * a;
      }
    }
  }
  g.putImageData(data, 0, 0);
  if (comicCache.size > 12) comicCache.clear();
  comicCache.set(key, c);
  return c;
}

/** Draws one panel's content: the user's photo, or one of the app's own illustrations. */
function drawPanelPhoto(ctx, px, py, pw, ph, panel) {
  const img = panel.photo;
  if (img) {
    // Comic on: the photo is illustrated first, then drawn like any panel.
    if (panel.comic) {
      ctx.drawImage(comicCanvas(img, pw, ph, panel), px, py, pw, ph);
      return;
    }
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const scale = base * (panel.scale || 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = px + (pw - dw) / 2 + (panel.dx || 0) * pw;
    const dy = py + (ph - dh) / 2 + (panel.dy || 0) * ph;
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  if (panel.art) {
    drawArtScene(ctx, panel.art, px, py, pw, ph);
    return;
  }
  const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
  g.addColorStop(0, '#3a1c52');
  g.addColorStop(1, '#1c0b2e');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `bold ${Math.max(14, ph * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
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

/** Draws a panel's act label chip, top left, when the story template names one. */
function drawActChip(ctx, px, py, scale, text) {
  const size = Math.max(12, 15 * scale);
  ctx.save();
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const pad = 8 * scale;
  const w = ctx.measureText(text).width + pad * 2;
  const h = 26 * scale;
  ctx.beginPath();
  ctx.roundRect(px + 8 * scale, py + 8 * scale, w, h, 4 * scale);
  ctx.fillStyle = 'rgba(10, 2, 18, 0.85)';
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, px + 8 * scale + pad, py + 8 * scale + h / 2);
  ctx.restore();
}

/** Draws a panel's location label, bottom left: the place name over its time, in a black bar like a location card. */
function drawPlaceLabel(ctx, px, py, pw, ph, scale, place, time) {
  if (!place) return;
  const nameSize = Math.max(11, 15 * scale);
  const timeSize = Math.max(10, 12 * scale);
  const pad = 8 * scale;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
  const nameW = ctx.measureText(place.toUpperCase()).width;
  ctx.font = `700 ${timeSize}px system-ui, sans-serif`;
  const timeW = time ? ctx.measureText(time.toUpperCase()).width : 0;
  const w = Math.max(nameW, timeW) + pad * 2;
  const h = nameSize + (time ? timeSize + 3 * scale : 0) + pad * 2;
  const x = px + 8 * scale;
  const y = py + ph - 8 * scale - h;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3 * scale);
  ctx.fillStyle = 'rgba(8, 2, 16, 0.88)';
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${nameSize}px system-ui, sans-serif`;
  ctx.fillText(place.toUpperCase(), x + pad, y + pad + nameSize);
  if (time) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `700 ${timeSize}px system-ui, sans-serif`;
    ctx.fillText(time.toUpperCase(), x + pad, y + pad + nameSize + 3 * scale + timeSize);
  }
  ctx.restore();
}

/** Draws a panel: photo or illustration, grade, border, act label, and optional drop shadow. */
function drawPanel(ctx, rect, panel, grade, effects, scale) {
  const gap = GAP * scale;
  const px = rect.x + gap / 2;
  const py = rect.y + gap / 2;
  const pw = rect.w - gap;
  const ph = rect.h - gap;
  // A panel may carry its own grade (one photo, three lives); otherwise the cover's grade.
  const panelGrade = (panel.grade && GRADES[panel.grade]) || grade;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = panelGrade.filter;
  drawPanelPhoto(ctx, px, py, pw, ph, panel);
  ctx.filter = 'none';
  drawGradeWashes(ctx, px, py, pw, ph, panelGrade);
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
  if (panel.act) drawActChip(ctx, px, py, scale, panel.act);
  if (panel.place) drawPlaceLabel(ctx, px, py, pw, ph, scale, panel.place, panel.time);
}

/** One thick blade of the palm emblem: out along a curve, back along a near-parallel one. */
function emblemBlade(ctx, x0, y0, cx, cy, x1, y1, w) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.quadraticCurveTo((x0 + x1) / 2 + w, (y0 + y1) / 2 + w * 0.5, x0, y0);
  ctx.closePath();
  ctx.fill();
}

/** A real palm, drawn to read at small size: a thick leaning trunk and five thick fronds that arc out and droop. */
function drawPalmEmblem(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ff2e88';
  // Trunk: wide at the base, tapering as it leans up to the crown.
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.quadraticCurveTo(-2.5, -18, 5, -34);
  ctx.lineTo(10, -34);
  ctx.quadraticCurveTo(2.5, -18, 3.5, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds from the crown (7, -34): five thick blades, all arcing out and drooping down.
  const crown = [7, -34];
  const fronds = [
    [-24, -40, -12, -44],
    [-28, -22, -18, -32],
    [-16, -8, -12, -20],
    [36, -42, 24, -46],
    [34, -22, 26, -32],
    [8, -52, 7, -44],
  ];
  for (const [tx, ty, cx, cy] of fronds) {
    emblemBlade(ctx, crown[0], crown[1], cx, cy, tx, ty, 3);
  }
  // Coconuts at the crown.
  ctx.beginPath();
  ctx.arc(4, -31, 2.2, 0, Math.PI * 2);
  ctx.arc(10, -30, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The width of a letterspaced string, for centring it. */
function spacedWidth(ctx, text, spacing) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return w - spacing;
}

/** Draws a letterspaced string, aligned left, centre, or right at x. */
function drawSpaced(ctx, text, x, y, spacing, align = 'left') {
  const total = spacedWidth(ctx, text, spacing);
  let lx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const ch of text) {
    ctx.fillText(ch, lx + ctx.measureText(ch).width / 2, y);
    lx += ctx.measureText(ch).width + spacing;
  }
}

/** The case file line, constant for every cover: number, city, date. */
const CASE_FILE = 'CASE #VC-2026-1119 · VICE CITY, LEONIDA · 19 NOV 2026';

/** Fits the giant title to its width: grows from the start size until it fills the width or hits the cap, then shrinks back if it overshoots. */
function fitTitleSize(ctx, text, maxWidth, startSize, maxSize) {
  let size = startSize;
  ctx.font = `400 ${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width < maxWidth && size < maxSize) {
    size += 4;
    ctx.font = `400 ${size}px Anton, sans-serif`;
  }
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `400 ${size}px Anton, sans-serif`;
  }
  return size;
}

/** A round "EST. 2026" badge: gold disc, dark ring, the year in bold. */
function drawEstBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffe9a3');
  g.addColorStop(0.6, '#ffd166');
  g.addColorStop(1, '#f5a623');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.strokeStyle = '#14081f';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.strokeStyle = 'rgba(20, 8, 31, 0.55)';
  ctx.stroke();
  ctx.fillStyle = '#14081f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${r * 0.34}px system-ui, sans-serif`;
  ctx.fillText('EST.', cx, cy - r * 0.30);
  ctx.font = `900 ${r * 0.52}px system-ui, sans-serif`;
  ctx.fillText('2026', cx, cy + r * 0.28);
  ctx.restore();
}

/** A "VOL. 01" tag: a cyan ticket stub at the cover's top-right corner. */
function drawVolTag(ctx, w, scale) {
  const text = 'VOL. 01';
  const size = Math.max(12, 20 * scale);
  ctx.save();
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  const pad = 10 * scale;
  const tw = ctx.measureText(text).width + pad * 2;
  const th = 30 * scale;
  const x = w - 12 * scale - tw;
  const y = 12 * scale;
  ctx.beginPath();
  ctx.roundRect(x, y, tw, th, 3 * scale);
  ctx.fillStyle = '#00dcff';
  ctx.fill();
  ctx.lineWidth = Math.max(2, 2.5 * scale);
  ctx.strokeStyle = '#14081f';
  ctx.stroke();
  ctx.fillStyle = '#14081f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + tw / 2, y + th / 2 + 1 * scale);
  ctx.restore();
}

/** Draws the title zone as a poster, not a strip: case file and wanted level on top, a GIANT gradient title that dominates the cover, a pink neon script tagline tucked under it, the stats, and a bottom tagline strip with palm silhouettes. */
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
  const tagline = (state.tagline || '').trim();
  const stats = (state.stats || '').trim().toUpperCase();
  const strip = (state.strip || '').trim().toUpperCase();
  const pad = bw * 0.04;

  // Top strip: the case file on the left, WANTED and the star level on the right.
  const wanted = Math.max(1, Math.min(5, state.wanted || 1));
  const stars = '★'.repeat(wanted) + '☆'.repeat(5 - wanted);
  let stripSize = Math.max(10, bh * 0.055);
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${stripSize}px system-ui, sans-serif`;
  const wantedWidth = ctx.measureText('WANTED ').width + ctx.measureText(stars).width;
  const gap = bw * 0.03;
  const caseAvailable = bw - pad * 2 - wantedWidth - gap;
  const caseWidth = spacedWidth(ctx, CASE_FILE, stripSize * 0.18);
  if (caseWidth > caseAvailable && caseWidth > 0) {
    stripSize = Math.max(8, stripSize * (caseAvailable / caseWidth));
    ctx.font = `700 ${stripSize}px system-ui, sans-serif`;
  }
  const stripY = by + bh * 0.055;
  ctx.fillStyle = '#8be9ff';
  ctx.textAlign = 'left';
  drawSpaced(ctx, CASE_FILE, bx + pad, stripY, stripSize * 0.18, 'left');
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('WANTED ', bx + bw - pad - ctx.measureText(stars).width, stripY);
  ctx.fillStyle = '#ff5e7a';
  ctx.fillText(stars, bx + bw - pad, stripY);
  ctx.restore();

  // The EST. 2026 badge sits left of the title, like a collector's seal.
  const badgeR = bh * 0.105;
  const titleCy = by + bh * 0.45;
  drawEstBadge(ctx, bx + pad + badgeR, titleCy, badgeR);
  const textLeft = bx + pad + badgeR * 2 + bw * 0.015;
  const textRight = bx + bw - pad;
  const textWidth = textRight - textLeft;

  // The GIANT title: grown to fill its width, gradient-filled, thick black outline, purple drop shadow.
  if (caption) {
    const size = fitTitleSize(ctx, caption, textWidth, bh * 0.48, bh * 0.58);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${size}px Anton, sans-serif`;
    if (state.captionGradient) {
      const g = ctx.createLinearGradient(textLeft, 0, textRight, 0);
      g.addColorStop(0, '#ff2e88');
      g.addColorStop(0.45, '#ff9a3d');
      g.addColorStop(1, '#ffd166');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#0b0512';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(120, 20, 140, 0.85)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.06;
    ctx.strokeText(caption, (textLeft + textRight) / 2, titleCy);
    ctx.fillText(caption, (textLeft + textRight) / 2, titleCy);
    ctx.restore();
  }

  // The script tagline in pink neon, tucked just under the title's foot.
  if (tagline) {
    const tSize = bh * 0.115;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${tSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff5e9e';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
    ctx.shadowBlur = tSize * 0.45;
    ctx.shadowOffsetY = 0;
    ctx.fillText(tagline, (textLeft + textRight) / 2, by + bh * 0.74);
    ctx.restore();
  }

  // The stats line, small and letterspaced, under the tagline.
  if (stats) {
    const tSize = Math.max(11, bh * 0.058);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${tSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#8be9ff';
    drawSpaced(ctx, stats, (textLeft + textRight) / 2, by + bh * 0.87, tSize * 0.28, 'center');
    ctx.restore();
  }

  // The bottom tagline strip: a gradient rule, the tagline, and small palm silhouettes flanking it.
  if (strip) {
    const ruleY = by + bh * 0.925;
    const sg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    sg.addColorStop(0, 'rgba(255, 46, 136, 0)');
    sg.addColorStop(0.5, 'rgba(255, 46, 136, 0.9)');
    sg.addColorStop(1, 'rgba(255, 46, 136, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(bx, ruleY, bw, Math.max(2, 2.5 * scale));
    const tSize = Math.max(10, bh * 0.052);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${tSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd166';
    const stripY = by + bh * 0.962;
    drawSpaced(ctx, strip, (bx + bw) / 2, stripY, tSize * 0.30, 'center');
    ctx.restore();
    const palmS = bh * 0.0013;
    drawPalmEmblem(ctx, bx + pad * 0.9, by + bh * 0.99, palmS);
    drawPalmEmblem(ctx, bx + bw - pad * 0.9, by + bh * 0.99, palmS);
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
    const panel = (state.panels && state.panels[i]) || { photo: null, art: null, grade: null, act: null, scale: 1, dx: 0, dy: 0 };
    drawPanel(ctx, rect, panel, grade, effects, scale);
  });
  const band = {
    x: layout.band.x * w,
    y: layout.band.y * h,
    w: layout.band.w * w,
    h: layout.band.h * h,
  };
  drawCaptionBand(ctx, band, state, scale);
  drawVolTag(ctx, w, scale);
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
