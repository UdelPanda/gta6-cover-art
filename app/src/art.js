// Vice City Case Files — the original Vice City world, drawn from scratch,
// in the classic GTA cover style: bold black outlines, cel shading, painterly
// colour — a comic-book collage with a painted sunset. The centrepiece is the
// dark ponytail and a man in a white tank top, standing close together on a
// Vice City beach at sunset. No character, logo, artwork or font from any
// game is drawn here — only the city's own language: sun, palms, skyline,
// cars, neon, and the two original leads.

/** The illustrated scenes the editor offers, with their button labels. */
export const ART_SCENES = {
  duo: { label: 'The Duo' },
  car: { label: 'Ocean Drive' },
  neon: { label: 'Neon Street' },
  beach: { label: 'Beach & Wheel' },
  skyline: { label: 'Skyline' },
  chase: { label: 'The Chase' },
  plan: { label: 'The Plan' },
};

/** The ink: the bold dark outline every GTA-style shape carries. */
const INK = '#14081f';

/** Fills the current path, then strokes it with the ink. */
function fillStroke(ctx, fill, lw = 2.5) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/** A vertical sky gradient, returned so the sun can reuse the sky behind it. */
function skyGradient(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 400, 300);
  return g;
}

/** A soft glowing sun: a warm disc with a halo, painterly, plain. */
function softSun(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.4);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.6, '#ffd166');
  g.addColorStop(1, '#ff7a59');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Soft painterly clouds: pale ellipses, low alpha, never hard bands. */
function clouds(ctx, list) {
  ctx.save();
  for (const [cx, cy, rx, color] of list) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, rx * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** One thick blade of a palm frond: out along a curve, back along a near-parallel one. */
function blade(ctx, x0, y0, cx, cy, x1, y1, w) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.quadraticCurveTo((x0 + x1) / 2 + w, (y0 + y1) / 2 + w * 0.6, x0, y0);
  ctx.closePath();
  ctx.fill();
}

/** A palm silhouette: a leaning, tapering trunk and drooping fronds. */
function palm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  // Trunk: wide at the base, curving as it rises.
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.quadraticCurveTo(-3, -42, 7, -76);
  ctx.lineTo(13, -76);
  ctx.quadraticCurveTo(3, -42, 4, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds from the crown (10, -76): thick blades that arc out and droop down.
  const crown = [10, -76];
  const fronds = [
    [-30, -88, -16, -92],
    [-42, -66, -28, -78],
    [-38, -44, -30, -58],
    [42, -90, 28, -94],
    [52, -68, 38, -80],
    [46, -46, 36, -60],
    [12, -104, 10, -94],
  ];
  for (const [tx, ty, cx, cy] of fronds) {
    blade(ctx, crown[0], crown[1], cx, cy, tx, ty, 3.5);
  }
  // Coconuts at the crown.
  ctx.beginPath();
  ctx.arc(6, -72, 2.6, 0, Math.PI * 2);
  ctx.arc(13, -71, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** An Art Deco skyline: stepped ziggurat towers with lit windows, all inked. */
function skyline(ctx, x0, x1, yBase, color, tall) {
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 22 + ((i * 37) % 26);
    const h = (tall ? 40 : 26) + ((i * 53) % 44);
    const top = yBase - h;
    ctx.beginPath();
    ctx.rect(x, top, w, h);
    fillStroke(ctx, color, 2);
    // A stepped cap, the Art Deco ziggurat.
    ctx.fillStyle = color;
    ctx.fillRect(x + w * 0.28, top - 9, w * 0.44, 9);
    ctx.fillRect(x + w * 0.38, top - 15, w * 0.24, 6);
    // A few lit windows.
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    for (let k = 0; k < 4; k += 1) {
      const wx = x + 4 + ((i * 7 + k * 11) % (w - 8));
      const wy = top + 6 + ((i * 13 + k * 17) % (h - 12));
      ctx.fillRect(wx, wy, 2.5, 3.5);
    }
    x += w + 4;
    i += 1;
  }
}

/** A Ferris wheel silhouette: rim, spokes, gondolas, and legs. */
function ferrisWheel(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  for (let a = 0; a < 8; a += 1) {
    const t = (a / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(t) * r, cy + Math.sin(t) * r, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.9);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + r * 0.45, cy + r * 0.9);
  ctx.stroke();
  ctx.restore();
}

/** A limb: a thick capsule with the ink underneath so it reads as outlined. */
function limb(ctx, x1, y1, x2, y2, w, color) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** A face: two eyes, brows, a nose line, and lips — minimal, comic-book. */
function face(ctx, cx, cy, skin, lip) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx - 7, cy - 2, 2.6, 3.4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 7, cy - 2, 2.6, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 8);
  ctx.lineTo(cx - 4, cy - 9);
  ctx.moveTo(cx + 4, cy - 9);
  ctx.lineTo(cx + 10, cy - 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20, 8, 31, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx - 1, cy + 8);
  ctx.stroke();
  ctx.fillStyle = lip;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 13);
  ctx.quadraticCurveTo(cx, cy + 16.5, cx + 6, cy + 13);
  ctx.quadraticCurveTo(cx, cy + 18, cx - 6, cy + 13);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The woman: dark ponytail, dark tank top, jeans — an original character. */
function drawWoman(ctx) {
  const skin = '#c98a5e';
  // Hair behind the head: a dark mass framing the face, down to the shoulders.
  ctx.beginPath();
  ctx.moveTo(148, 140);
  ctx.bezierCurveTo(142, 110, 148, 90, 166, 88);
  ctx.bezierCurveTo(184, 90, 190, 110, 184, 140);
  ctx.lineTo(180, 158);
  ctx.bezierCurveTo(178, 140, 174, 126, 166, 126);
  ctx.bezierCurveTo(158, 126, 154, 140, 152, 158);
  ctx.closePath();
  fillStroke(ctx, '#1a1218', 2.5);
  // The ponytail, flowing down to her left, with a pink tie — drawn wide
  // and curved so it reads as a ponytail against the sky, not as hair mass.
  ctx.beginPath();
  ctx.moveTo(150, 112);
  ctx.quadraticCurveTo(130, 128, 124, 152);
  ctx.quadraticCurveTo(121, 172, 128, 180);
  ctx.quadraticCurveTo(136, 172, 140, 154);
  ctx.quadraticCurveTo(144, 134, 152, 122);
  ctx.closePath();
  fillStroke(ctx, '#1a1218', 2.5);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(146, 110, 9, 5);
  // Neck and face.
  ctx.beginPath();
  ctx.rect(160, 142, 12, 14);
  fillStroke(ctx, skin, 2);
  ctx.beginPath();
  ctx.ellipse(166, 126, 15, 18, 0, 0, Math.PI * 2);
  fillStroke(ctx, skin, 2);
  face(ctx, 166, 126, skin, '#c94f5e');
  // Tank top: dark, with a cel shade on her right side.
  ctx.beginPath();
  ctx.moveTo(138, 154);
  ctx.lineTo(194, 154);
  ctx.lineTo(190, 212);
  ctx.lineTo(142, 212);
  ctx.closePath();
  fillStroke(ctx, '#26262e', 2.5);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.moveTo(176, 154);
  ctx.lineTo(194, 154);
  ctx.lineTo(190, 212);
  ctx.lineTo(174, 212);
  ctx.closePath();
  ctx.fill();
  // Arms at her sides.
  limb(ctx, 141, 158, 134, 208, 10, skin);
  limb(ctx, 191, 158, 198, 206, 10, skin);
  ctx.beginPath();
  ctx.arc(134, 210, 5.5, 0, Math.PI * 2);
  ctx.arc(198, 208, 5.5, 0, Math.PI * 2);
  fillStroke(ctx, skin, 2);
  // Jeans, with a cel shade on the right leg, and shoes.
  ctx.beginPath();
  ctx.moveTo(144, 210);
  ctx.lineTo(168, 210);
  ctx.lineTo(166, 282);
  ctx.lineTo(144, 282);
  ctx.closePath();
  fillStroke(ctx, '#2e3a5c', 2.5);
  ctx.beginPath();
  ctx.moveTo(170, 210);
  ctx.lineTo(190, 210);
  ctx.lineTo(192, 282);
  ctx.lineTo(170, 282);
  ctx.closePath();
  fillStroke(ctx, '#2e3a5c', 2.5);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(182, 210);
  ctx.lineTo(190, 210);
  ctx.lineTo(192, 282);
  ctx.lineTo(184, 282);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(142, 280, 26, 9, 3);
  ctx.roundRect(170, 280, 26, 9, 3);
  fillStroke(ctx, '#1a1218', 2);
}

/** The man: short dark hair, white tank top, jeans — an original character, a touch taller. */
function drawMan(ctx) {
  const skin = '#b97a52';
  ctx.save();
  // A touch taller than the woman: scale about his feet.
  ctx.translate(241, 282);
  ctx.scale(1.06, 1.06);
  ctx.translate(-241, -282);
  // Short dark crop: a cap over the top of the head.
  ctx.beginPath();
  ctx.moveTo(222, 118);
  ctx.bezierCurveTo(220, 96, 230, 88, 241, 88);
  ctx.bezierCurveTo(254, 88, 262, 98, 260, 118);
  ctx.bezierCurveTo(258, 104, 250, 98, 241, 98);
  ctx.bezierCurveTo(232, 98, 224, 104, 222, 118);
  ctx.closePath();
  fillStroke(ctx, '#1a1218', 2.5);
  // Neck and face.
  ctx.beginPath();
  ctx.rect(235, 134, 12, 14);
  fillStroke(ctx, skin, 2);
  ctx.beginPath();
  ctx.ellipse(241, 116, 17, 20, 0, 0, Math.PI * 2);
  fillStroke(ctx, skin, 2);
  face(ctx, 241, 116, skin, '#a04a52');
  // A hint of stubble along the jaw.
  ctx.fillStyle = 'rgba(20, 8, 31, 0.14)';
  ctx.beginPath();
  ctx.ellipse(241, 130, 13, 7, 0, 0, Math.PI);
  ctx.fill();
  // White tank top, cel-shaded on his right side.
  ctx.beginPath();
  ctx.moveTo(212, 146);
  ctx.lineTo(270, 146);
  ctx.lineTo(266, 212);
  ctx.lineTo(216, 212);
  ctx.closePath();
  fillStroke(ctx, '#f2f2ea', 2.5);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.moveTo(254, 146);
  ctx.lineTo(270, 146);
  ctx.lineTo(266, 212);
  ctx.lineTo(252, 212);
  ctx.closePath();
  ctx.fill();
  // His left arm rests on her shoulder; his right arm hangs at his side.
  limb(ctx, 216, 150, 197, 157, 12, skin);
  ctx.beginPath();
  ctx.arc(195, 158, 6, 0, Math.PI * 2);
  fillStroke(ctx, skin, 2);
  limb(ctx, 268, 150, 274, 208, 12, skin);
  ctx.beginPath();
  ctx.arc(275, 210, 6, 0, Math.PI * 2);
  fillStroke(ctx, skin, 2);
  // Jeans, with a cel shade on the right leg, and shoes.
  ctx.beginPath();
  ctx.moveTo(218, 210);
  ctx.lineTo(242, 210);
  ctx.lineTo(240, 282);
  ctx.lineTo(216, 282);
  ctx.closePath();
  fillStroke(ctx, '#2e3a5c', 2.5);
  ctx.beginPath();
  ctx.moveTo(244, 210);
  ctx.lineTo(268, 210);
  ctx.lineTo(270, 282);
  ctx.lineTo(246, 282);
  ctx.closePath();
  fillStroke(ctx, '#2e3a5c', 2.5);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(258, 210);
  ctx.lineTo(268, 210);
  ctx.lineTo(270, 282);
  ctx.lineTo(260, 282);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(216, 280, 26, 9, 3);
  ctx.roundRect(244, 280, 26, 9, 3);
  fillStroke(ctx, '#1a1218', 2);
  ctx.restore();
}

/** The duo: two original leads, close together, on a Vice City beach at sunset.
 *  Crop-safe: the sun stays clear of the skyline, the skyline stays low and
 *  distant, and the pair stand on the sand with their feet inside the band
 *  a wide hero panel keeps (the scene is cropped top and bottom there). */
function drawDuo(ctx) {
  skyGradient(ctx, [[0, '#5b1a5e'], [0.45, '#c23a6e'], [0.7, '#ff7a59'], [1, '#ffc46b']]);
  softSun(ctx, 300, 132, 30);
  clouds(ctx, [
    [90, 60, 26, 'rgba(255, 255, 255, 0.28)'],
    [180, 38, 30, 'rgba(255, 180, 200, 0.3)'],
    [330, 92, 22, 'rgba(255, 255, 255, 0.22)'],
  ]);
  // The skyline across the water: low and distant, its tops well below the sun.
  ctx.fillStyle = '#241238';
  let x = 0;
  let i = 0;
  while (x < 400) {
    const w = 20 + ((i * 37) % 24);
    const h = 10 + ((i * 53) % 14);
    ctx.fillRect(x, 172 - h, w, h);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    for (let k = 0; k < 2; k += 1) {
      ctx.fillRect(x + 4 + ((i * 7 + k * 11) % (w - 8)), 172 - h + 4 + ((i * 13 + k * 17) % Math.max(4, h - 8)), 2.5, 3.5);
    }
    ctx.fillStyle = '#241238';
    x += w + 4;
    i += 1;
  }
  // The sea, with the sun's reflection.
  const sea = ctx.createLinearGradient(0, 172, 0, 228);
  sea.addColorStop(0, '#0e4a6e');
  sea.addColorStop(1, '#06283f');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 172, 400, 56);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
  for (let k = 0; k < 5; k += 1) {
    const y = 180 + k * 10;
    const w = 56 - k * 7;
    ctx.fillRect(300 - w / 2, y, w, 3);
  }
  // The sand.
  const sand = ctx.createLinearGradient(0, 228, 0, 300);
  sand.addColorStop(0, '#e8b06b');
  sand.addColorStop(1, '#c98a4a');
  ctx.fillStyle = sand;
  ctx.fillRect(0, 228, 400, 72);
  // Palms framing the scene.
  palm(ctx, 26, 300, 0.95, '#160a24');
  palm(ctx, 382, 300, 0.85, '#160a24');
  // The pair, shifted up so their feet stay inside a wide panel's crop.
  ctx.save();
  ctx.translate(0, -14);
  // The pair's shadow on the sand.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(203, 288, 80, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  drawWoman(ctx);
  drawMan(ctx);
  ctx.restore();
}

/** A red muscle car in side profile, facing left, inked and cel-shaded. */
function muscleCar(ctx, cx, cy, s, body = '#d92038') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // Body: long, low, with a fastback roofline.
  ctx.beginPath();
  ctx.moveTo(-100, 8);
  ctx.lineTo(-97, -14);
  ctx.lineTo(-62, -18);
  ctx.lineTo(-38, -34);
  ctx.lineTo(28, -34);
  ctx.lineTo(52, -16);
  ctx.lineTo(96, -12);
  ctx.lineTo(100, 6);
  ctx.lineTo(92, 10);
  ctx.lineTo(-92, 10);
  ctx.closePath();
  fillStroke(ctx, body, 3);
  // A cel shade along the lower body.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-92, 10);
  ctx.lineTo(92, 10);
  ctx.lineTo(100, 6);
  ctx.lineTo(96, -2);
  ctx.lineTo(-96, -2);
  ctx.closePath();
  ctx.fill();
  // A sunset rim-light along the roof and hood.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-62, -18);
  ctx.lineTo(-38, -34);
  ctx.lineTo(28, -34);
  ctx.lineTo(52, -16);
  ctx.lineTo(96, -12);
  ctx.stroke();
  // Cabin glass.
  ctx.beginPath();
  ctx.moveTo(-34, -30);
  ctx.lineTo(24, -30);
  ctx.lineTo(44, -17);
  ctx.lineTo(-56, -17);
  ctx.closePath();
  fillStroke(ctx, '#160a24', 2);
  // Chrome side stripe and door line.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(-92, -2, 184, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(6, -14, 2, 22);
  // Wheels: dark tyres, pale hubs, inked.
  for (const wx of [-58, 58]) {
    ctx.beginPath();
    ctx.arc(wx, 10, 16, 0, Math.PI * 2);
    fillStroke(ctx, '#0d0618', 2);
    ctx.beginPath();
    ctx.arc(wx, 10, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#cfd6dd';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, 10, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0618';
    ctx.fill();
  }
  ctx.restore();
}

/** The red muscle car on Ocean Drive: Art Deco facades, neon, palms, painterly sunset. */
function drawCar(ctx) {
  skyGradient(ctx, [[0, '#5b1a5e'], [0.5, '#c23a6e'], [0.8, '#ff7a59'], [1, '#ffc46b']]);
  softSun(ctx, 330, 66, 26);
  clouds(ctx, [[110, 48, 26, 'rgba(255, 255, 255, 0.26)'], [230, 34, 22, 'rgba(255, 180, 200, 0.28)']]);
  // Left facade: pastel pink, inked, with a pink neon strip.
  ctx.beginPath();
  ctx.rect(0, 118, 122, 182);
  fillStroke(ctx, '#ff9a8b', 2.5);
  ctx.fillStyle = 'rgba(20, 8, 31, 0.8)';
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) ctx.fillRect(12 + c * 28, 148 + r * 32, 16, 20);
  }
  ctx.save();
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(100, 130, 8, 92);
  ctx.restore();
  // Right facade: turquoise, inked, with a cyan neon strip.
  ctx.beginPath();
  ctx.rect(278, 106, 122, 194);
  fillStroke(ctx, '#7ad9d9', 2.5);
  ctx.fillStyle = 'rgba(20, 8, 31, 0.8)';
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) ctx.fillRect(290 + c * 28, 138 + r * 32, 16, 20);
  }
  ctx.save();
  ctx.shadowColor = '#00dcff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#00dcff';
  ctx.fillRect(292, 120, 8, 92);
  ctx.restore();
  // The street: sidewalks, road, crosswalk, neon reflections.
  ctx.fillStyle = '#2c1440';
  ctx.fillRect(122, 196, 156, 104);
  ctx.fillStyle = '#12061f';
  ctx.beginPath();
  ctx.moveTo(162, 196);
  ctx.lineTo(238, 196);
  ctx.lineTo(252, 300);
  ctx.lineTo(148, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(198, 206 + i * 24, 4, 11);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(152 + i * 20, 262, 12, 7);
  }
  ctx.fillStyle = 'rgba(255, 46, 136, 0.35)';
  ctx.fillRect(152, 244, 10, 56);
  ctx.fillStyle = 'rgba(0, 220, 255, 0.35)';
  ctx.fillRect(240, 244, 10, 56);
  muscleCar(ctx, 200, 252, 1.05);
  // A long shadow under the car.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(200, 276, 110, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  palm(ctx, 34, 300, 0.85, '#160a24');
  palm(ctx, 372, 300, 0.85, '#160a24');
}

/** Neon street at night: glowing signs over a wet road, inked buildings. */
function drawNeon(ctx) {
  ctx.fillStyle = '#0b0512';
  ctx.fillRect(0, 0, 400, 300);
  // A few stars.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (const [x, y] of [[60, 30], [150, 18], [260, 26], [340, 44], [200, 52]]) {
    ctx.fillRect(x, y, 2, 2);
  }
  // Building edges, inked, with lit windows.
  ctx.beginPath();
  ctx.rect(0, 0, 26, 300);
  fillStroke(ctx, '#160a24', 2);
  ctx.beginPath();
  ctx.rect(374, 0, 26, 300);
  fillStroke(ctx, '#160a24', 2);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(6, 30 + i * 44, 5, 7);
    ctx.fillRect(389, 30 + i * 44, 5, 7);
  }
  // A pink ring and a cyan frame, glowing, centred so they survive a tall crop.
  ctx.save();
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(200, 92, 54, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.shadowColor = '#00dcff';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = '#00dcff';
  ctx.lineWidth = 4;
  ctx.strokeRect(148, 168, 104, 52);
  ctx.restore();
  // Magenta and amber bars, like a club front.
  ctx.save();
  ctx.shadowColor = '#ff5a6e';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ff5a6e';
  ctx.fillRect(160, 236, 80, 8);
  ctx.fillRect(172, 252, 56, 8);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(310, 200, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The wet street and its neon reflections.
  ctx.fillStyle = '#12061f';
  ctx.fillRect(0, 224, 400, 76);
  const reflections = [
    [176, '#ff2e88', 14], [206, '#00dcff', 14], [150, '#ff5a6e', 10],
    [232, '#ffd166', 8],
  ];
  for (const [x, color, w] of reflections) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x, 228, w, 68);
    ctx.globalAlpha = 1;
  }
  palm(ctx, 44, 300, 0.8, '#05020a');
}

/** A beach: ocean, sun, sand, a Ferris wheel over the water, an umbrella, a pier, palms. */
function drawBeach(ctx) {
  skyGradient(ctx, [[0, '#2a6a8a'], [0.5, '#7ac4c9'], [0.8, '#ffb46b'], [1, '#ff8a4d']]);
  softSun(ctx, 200, 72, 34);
  clouds(ctx, [
    [90, 48, 26, 'rgba(255, 255, 255, 0.5)'],
    [300, 40, 30, 'rgba(255, 255, 255, 0.45)'],
    [160, 108, 20, 'rgba(255, 255, 255, 0.4)'],
  ]);
  // The Ferris wheel over the water, left of centre.
  ferrisWheel(ctx, 76, 148, 42, '#160a24');
  // Ocean.
  const sea = ctx.createLinearGradient(0, 132, 0, 208);
  sea.addColorStop(0, '#19b8c4');
  sea.addColorStop(1, '#0b3a5c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 132, 400, 76);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(10 + i * 30, 150 + i * 16);
    ctx.quadraticCurveTo(120 + i * 40, 144 + i * 16, 240 + i * 30, 150 + i * 16);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 209, 102, 0.55)';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(200 - 26 + i * 4, 140 + i * 13, 52 - i * 8, 3);
  }
  // Sand.
  const sand = ctx.createLinearGradient(0, 208, 0, 300);
  sand.addColorStop(0, '#e8b06b');
  sand.addColorStop(1, '#b06a3c');
  ctx.fillStyle = sand;
  ctx.fillRect(0, 208, 400, 92);
  ctx.fillStyle = 'rgba(120, 60, 30, 0.5)';
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.arc(30 + ((i * 53) % 340), 226 + ((i * 31) % 60), 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // The pier, running from mid-scene into the water, so a cropped panel
  // still shows deck and posts — a pier, never a lone T.
  ctx.fillStyle = '#6d4a2f';
  ctx.fillRect(80, 168, 180, 10);
  ctx.fillRect(80, 178, 180, 4);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(98 + i * 50, 178, 6, 34);
  }
  // A striped beach umbrella, the centre of the scene.
  ctx.save();
  ctx.translate(200, 252);
  ctx.fillStyle = '#6d4a2f';
  ctx.fillRect(-2, 0, 4, 44);
  ctx.beginPath();
  ctx.arc(0, 0, 44, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#ff2e88' : '#fff3e0';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 44, Math.PI + (i / 6) * Math.PI, Math.PI + ((i + 1) / 6) * Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  palm(ctx, 118, 300, 0.8, '#160a24');
  palm(ctx, 366, 300, 0.95, '#160a24');
}

/** Skyline, Ferris wheel, and water at golden hour. */
function drawSkyline(ctx) {
  skyGradient(ctx, [[0, '#3a1c52'], [0.5, '#b23a72'], [0.8, '#ff8a4d'], [1, '#ffc46b']]);
  softSun(ctx, 305, 88, 30);
  clouds(ctx, [[120, 46, 24, 'rgba(255, 255, 255, 0.3)'], [220, 30, 20, 'rgba(255, 180, 200, 0.3)']]);
  skyline(ctx, 0, 400, 208, '#1c0b2e', true);
  ferrisWheel(ctx, 112, 148, 44, '#160a24');
  // Water with the sun's reflection and the skyline's shimmer.
  const water = ctx.createLinearGradient(0, 208, 0, 300);
  water.addColorStop(0, '#0e4a6e');
  water.addColorStop(1, '#06283f');
  ctx.fillStyle = water;
  ctx.fillRect(0, 208, 400, 92);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
  for (let i = 0; i < 6; i += 1) {
    const y = 216 + i * 13;
    const w = 60 - i * 6;
    ctx.fillRect(305 - w / 2, y, w, 3);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(20 + ((i * 47) % 360), 222 + ((i * 29) % 64), 26, 2);
  }
  palm(ctx, 368, 300, 0.8, '#0a0512');
}

/** The chase: a road to the horizon, the getaway car from behind, police lights, a helicopter. */
function drawChase(ctx) {
  skyGradient(ctx, [[0, '#1c0b2e'], [0.55, '#8a2a6e'], [1, '#ff8a4d']]);
  softSun(ctx, 88, 118, 30);
  clouds(ctx, [[240, 44, 26, 'rgba(255, 180, 200, 0.28)'], [330, 90, 20, 'rgba(255, 255, 255, 0.22)']]);
  // The helicopter, top right, with a searchlight cone.
  ctx.save();
  ctx.fillStyle = '#0d0618';
  ctx.beginPath();
  ctx.ellipse(308, 66, 26, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(330, 60, 26, 5);
  ctx.fillRect(322, 74, 4, 12);
  ctx.strokeStyle = '#0d0618';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(282, 52);
  ctx.lineTo(336, 52);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 220, 0.16)';
  ctx.beginPath();
  ctx.moveTo(300, 78);
  ctx.lineTo(262, 170);
  ctx.lineTo(322, 170);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The road, narrowing to the vanishing point.
  ctx.fillStyle = '#1c1030';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(168, 132);
  ctx.lineTo(232, 132);
  ctx.lineTo(400, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  let y = 150;
  let w = 3;
  while (y < 300) {
    ctx.fillRect(200 - w / 2, y, w, 16);
    y += 30;
    w += 1.2;
  }
  // The police SUV, behind and to the left, light bar flashing.
  ctx.save();
  ctx.beginPath();
  ctx.rect(118, 196, 62, 34);
  fillStroke(ctx, '#0d0618', 2);
  ctx.beginPath();
  ctx.rect(128, 180, 42, 18);
  fillStroke(ctx, '#0d0618', 2);
  ctx.fillStyle = '#e8ecf0';
  ctx.fillRect(132, 182, 34, 12);
  ctx.beginPath();
  ctx.arc(130, 232, 9, 0, Math.PI * 2);
  ctx.arc(168, 232, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#0d0618';
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ff2e4d';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ff2e4d';
  ctx.fillRect(130, 176, 12, 5);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = '#2e7dff';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#2e7dff';
  ctx.fillRect(156, 176, 12, 5);
  ctx.restore();
  ctx.restore();
  // The getaway car from behind, big in the foreground.
  ctx.save();
  ctx.translate(200, 236);
  ctx.beginPath();
  ctx.moveTo(-72, 34);
  ctx.lineTo(-68, -6);
  ctx.lineTo(-52, -26);
  ctx.lineTo(52, -26);
  ctx.lineTo(68, -6);
  ctx.lineTo(72, 34);
  ctx.closePath();
  fillStroke(ctx, '#d92038', 2.5);
  ctx.beginPath();
  ctx.moveTo(-46, -22);
  ctx.lineTo(46, -22);
  ctx.lineTo(40, -4);
  ctx.lineTo(-40, -4);
  ctx.closePath();
  ctx.fillStyle = '#160a24';
  ctx.fill();
  // Taillights, glowing.
  ctx.save();
  ctx.shadowColor = '#ff2e4d';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff5a6e';
  ctx.fillRect(-62, 2, 26, 8);
  ctx.fillRect(36, 2, 26, 8);
  ctx.restore();
  ctx.fillStyle = '#cfd6dd';
  ctx.fillRect(-30, 22, 60, 6);
  ctx.restore();
  palm(ctx, 22, 300, 0.7, '#160a24');
  palm(ctx, 382, 300, 0.7, '#160a24');
}

/** The heist plan: a blueprint map with a dashed route, pins, and marks. */
function drawPlan(ctx) {
  ctx.fillStyle = '#0e2a4a';
  ctx.fillRect(0, 0, 400, 300);
  // Blueprint grid.
  ctx.strokeStyle = 'rgba(140, 200, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 400; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 300);
    ctx.stroke();
  }
  for (let y = 0; y <= 300; y += 25) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(400, y);
    ctx.stroke();
  }
  // Streets, thicker.
  ctx.strokeStyle = 'rgba(140, 200, 255, 0.5)';
  ctx.lineWidth = 3;
  for (const [x1, y1, x2, y2] of [[0, 90, 400, 90], [0, 200, 400, 200], [110, 0, 110, 300], [280, 0, 280, 300]]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  // The dashed escape route, with an arrowhead.
  ctx.strokeStyle = '#ff5a6e';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(60, 250);
  ctx.lineTo(110, 200);
  ctx.lineTo(110, 90);
  ctx.lineTo(280, 90);
  ctx.lineTo(280, 200);
  ctx.lineTo(350, 150);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.moveTo(350, 150);
  ctx.lineTo(332, 142);
  ctx.lineTo(332, 158);
  ctx.closePath();
  ctx.fill();
  // Numbered pins along the route.
  const pins = [[60, 250, '1'], [110, 90, '2'], [280, 90, '3'], [350, 150, 'X']];
  for (const [x, y, label] of pins) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e2a4a';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);
  }
  // X marks on the two hideouts.
  ctx.strokeStyle = '#ff5a6e';
  ctx.lineWidth = 3;
  for (const [x, y] of [[200, 150], [330, 250]]) {
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 9);
    ctx.lineTo(x + 9, y + 9);
    ctx.moveTo(x + 9, y - 9);
    ctx.lineTo(x - 9, y + 9);
    ctx.stroke();
  }
  // A compass rose, top right.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(362, 38, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(362, 22);
  ctx.lineTo(366, 38);
  ctx.lineTo(362, 54);
  ctx.lineTo(358, 38);
  ctx.closePath();
  ctx.fill();
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', 362, 14);
  // A double frame, like a case file.
  ctx.strokeStyle = 'rgba(140, 200, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 384, 284);
}

const SCENES = {
  duo: drawDuo,
  car: drawCar,
  neon: drawNeon,
  beach: drawBeach,
  skyline: drawSkyline,
  chase: drawChase,
  plan: drawPlan,
};

/** Draws one illustrated scene into a panel rect, cover-fitting the 400 x 300 scene. */
export function drawArtScene(ctx, name, px, py, pw, ph) {
  const draw = SCENES[name] || SCENES.duo;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  const s = Math.max(pw / 400, ph / 300);
  ctx.translate(px + (pw - 400 * s) / 2, py + (ph - 300 * s) / 2);
  ctx.scale(s, s);
  draw(ctx);
  ctx.restore();
}
