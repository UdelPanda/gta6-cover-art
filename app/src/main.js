// Vice City Case Files — the editor wiring.
//
// The default cover is a CLEAN photographic multi-panel collage: the app's own Vice City photos (rooftop
// terrace, jet ski, marina yacht, neon gas station), sharp and unfiltered, with a gentle sunset grade and the
// wanted case-file band. The comic filter is an opt-in per panel: it illustrates a photo into a GTA-style
// panel, but it is OFF unless the user turns it on — a photo is never posterized by default. The app's own
// GTA-style illustrated collage (the duo, Ocean Drive, neon street, beach and wheel, skyline, the chase, the
// plan) stays available as an art choice per panel and in the Beach Day template. Story templates in three
// acts, the wanted file (nickname, star level, stats), photo pickers with crop and position by dragging the
// preview, zoom, one photo in three lives, effects, and one-click export at 1080 x 1080, 1080 x 1350 and
// 1920 x 1080. Photos stay on the user's machine: they are read with object URLs and are never uploaded
// anywhere.
import { drawCover, renderCover, ensureDisplayFont, LAYOUTS, GRADES } from './cover.js';
import { ART_SCENES } from './art.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** Story templates: three acts, each an illustrated GTA-style panel, caption, stats, and wanted level — except Getaway, the default, which is the clean photographic cover: the four Vice City photos, sharp and unfiltered. The duo only ever leads a hero layout — its wide composition would crop badly in a narrow trio panel. The dy crops keep every face in frame: the rooftop woman's face sits high in a portrait photo, the marina man's head sits high, the jet-ski couple's faces sit high in a short panel. */
const TEMPLATES = {
  heist: {
    label: 'Heist',
    layout: 'trio',
    caption: 'The Inside Job',
    stats: 'Heists 12 • Getaways 9 • Heat ★★★★☆',
    wanted: 4,
    panels: [
      { art: 'plan', act: 'ACT 1 · THE PLAN' },
      { art: 'chase', act: 'ACT 2 · THE JOB' },
      { art: 'skyline', act: 'ACT 3 · THE GETAWAY' },
    ],
  },
  getaway: {
    label: 'Getaway',
    layout: 'hero4',
    caption: 'Sunset Heist',
    stats: 'Heists 12 • Getaways 9 • Heat ★★★★★',
    wanted: 5,
    panels: [
      { photo: 'rooftop-terrace', act: 'ACT 1 · THE ROOFTOP', scale: 1, dx: 0, dy: 0.24 },
      { photo: 'jet-ski', act: 'ACT 2 · THE RIDE', scale: 1, dx: 0, dy: 0.06 },
      { photo: 'marina-yacht', act: 'ACT 3 · THE MARINA', scale: 1, dx: 0, dy: 0.18 },
      { photo: 'gas-station', act: 'ACT 4 · THE NIGHT', scale: 1, dx: 0, dy: 0 },
    ],
  },
  nightdrive: {
    label: 'Night Drive',
    layout: 'trio',
    caption: 'Midnight Run',
    stats: 'Clubs 21 • Miles 410 • Heat ★★★☆☆',
    wanted: 3,
    panels: [
      { art: 'neon', act: 'ACT 1 · THE CLUB' },
      { art: 'car', act: 'ACT 2 · THE DRIVE' },
      { art: 'skyline', act: 'ACT 3 · THE CITY' },
    ],
  },
  beachday: {
    label: 'Beach Day',
    layout: 'hero',
    caption: 'Coast Run',
    stats: 'Waves 8 • Pier 1 • Heat ★★☆☆☆',
    wanted: 2,
    panels: [
      { art: 'beach', act: 'ACT 2 · THE BEACH' },
      { art: 'skyline', act: 'ACT 1 · THE STRIP' },
      { art: 'duo', act: 'ACT 3 · THE SUNSET' },
    ],
  },
};

/** The grades one photo takes in its three lives: sunset, neon, day. */
const LIVES = [
  { grade: 'sunset', act: 'LIFE 1 · SUNSET', scale: 1.35, dx: -0.12, dy: 0 },
  { grade: 'neon', act: 'LIFE 2 · NEON', scale: 1.15, dx: 0, dy: 0 },
  { grade: 'day', act: 'LIFE 3 · DAY', scale: 1.35, dx: 0.12, dy: 0 },
];

/** Alias generator word lists: a criminal nickname from a name, or from thin air. */
const ALIAS_FIRST = ['Neon', 'Midnight', 'Velvet', 'Crimson', 'Ghost', 'Silver', 'Turbo', 'Lonely', 'Sugar', 'Voodoo'];
const ALIAS_LAST = ['Ghost', 'Viper', 'King', 'Queen', 'Saint', 'Shark', 'Fox', 'Wolf', 'Angel', 'Drifter'];

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const nameInput = document.getElementById('your-name');
const statsInput = document.getElementById('stats');
const statusEl = document.getElementById('status');
const panelList = document.getElementById('panel-list');
const zoomInput = document.getElementById('zoom');

const state = {
  template: 'getaway',
  layout: 'hero',
  grade: 'sunset',
  caption: 'Sunset Heist',
  stats: 'Heists 12 • Getaways 9 • Heat ★★★★★',
  wanted: 5,
  captionGradient: true,
  size: 'wide',
  // Clean by default: halftone dots and grain muddy a photo, so they start off — the user can turn them on.
  effects: { halftone: false, grain: false, vignette: true, shadows: true },
  panels: [],
  selected: 0,
};

let photos = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The app's own Vice City photos, preloaded so story templates can use them synchronously. */
const NEW_SAMPLES = ['rooftop-terrace', 'marina-yacht', 'jet-ski', 'gas-station'];
const sampleImgs = {};
async function preloadSamples() {
  for (const name of NEW_SAMPLES) {
    try {
      sampleImgs[name] = await loadImage(`samples/${name}.jpg`);
    } catch {
      // A missing photo leaves its panel on the illustration fallback.
    }
  }
}

/** Rebuilds the panel list for the current layout, keeping photos and art in order. */
function rebuildPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  const old = state.panels;
  state.panels = [];
  for (let i = 0; i < count; i += 1) {
    const prev = old[i] || old[0] || { photo: null, art: null, grade: null, act: null, scale: 1, dx: 0, dy: 0, comic: false };
    state.panels.push({
      photo: prev.photo || null,
      art: prev.photo ? null : (prev.art || null),
      grade: prev.grade || null,
      act: prev.act || null,
      scale: prev.scale || 1,
      dx: prev.dx || 0,
      dy: prev.dy || 0,
      comic: prev.comic || false,
    });
  }
  if (state.selected >= count) state.selected = 0;
}

/** Sizes the preview canvas to the chosen export aspect and redraws. */
function redraw() {
  const size = SIZES[state.size];
  const longest = 880;
  const scale = Math.min(longest / size.w, longest / size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawCover(canvas, state);
  renderPanelList();
}

/** Keeps the editor's buttons in step with the state: template, layout, grade, stars. */
function syncControls() {
  document.querySelectorAll('[data-template]').forEach((b) => b.classList.toggle('active', b.dataset.template === state.template));
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('[data-star]').forEach((b) => b.classList.toggle('active', Number(b.dataset.star) <= state.wanted));
  captionInput.value = state.caption;
  statsInput.value = state.stats;
}

/** Applies a story template: its layout, its three acts, its caption, stats, and wanted level. */
function applyTemplate(name) {
  const template = TEMPLATES[name] || TEMPLATES.getaway;
  state.template = name;
  state.layout = template.layout;
  state.caption = template.caption;
  state.stats = template.stats;
  state.wanted = template.wanted;
  state.panels = template.panels.map((p) => {
    const img = p.photo ? sampleImgs[p.photo] : null;
    return {
      photo: img || null,
      art: img ? null : (p.art || null),
      grade: p.grade || null,
      act: p.act,
      scale: p.scale || 1,
      dx: p.dx || 0,
      dy: p.dy || 0,
      comic: false,
    };
  });
  state.selected = 0;
  zoomInput.value = '100';
  syncControls();
  redraw();
}

/** Renders the per-panel controls for the selected panel. */
function renderPanelList() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.selected ? ' selected' : '');
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'panel-name';
    const what = panel.photo ? (panel.comic ? 'comic photo' : 'photo') : panel.art ? ART_SCENES[panel.art].label : 'empty';
    label.textContent = `Panel ${i + 1} — ${what}`;
    label.addEventListener('click', () => {
      state.selected = i;
      zoomInput.value = String(Math.round((panel.scale || 1) * 100));
      redraw();
    });
    const pick = document.createElement('label');
    pick.className = 'pick';
    pick.textContent = 'Pick photo';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    file.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const img = await loadImage(URL.createObjectURL(f));
      photos.push(img);
      panel.photo = img;
      panel.art = null;
      panel.scale = 1;
      panel.dx = 0;
      panel.dy = 0;
      state.selected = i;
      zoomInput.value = '100';
      redraw();
    });
    pick.append(file);
    const grade = document.createElement('select');
    grade.className = 'panel-grade';
    grade.setAttribute('aria-label', `Grade for panel ${i + 1}`);
    for (const [key, labelText] of [['', 'Grade: auto'], ['sunset', 'Sunset'], ['neon', 'Neon'], ['day', 'Day']]) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = labelText;
      if ((panel.grade || '') === key) opt.selected = true;
      grade.append(opt);
    }
    grade.addEventListener('change', () => {
      panel.grade = grade.value || null;
      redraw();
    });
    // Comic filter: opt-in per panel — illustrates this panel's photo into a GTA-style panel. Off by default.
    const comic = document.createElement('label');
    comic.className = 'check comic';
    const comicBox = document.createElement('input');
    comicBox.type = 'checkbox';
    comicBox.checked = !!panel.comic;
    comicBox.setAttribute('aria-label', `Comic filter for panel ${i + 1}`);
    comicBox.addEventListener('change', () => {
      panel.comic = comicBox.checked;
      redraw();
    });
    comic.append(comicBox, document.createTextNode('Comic filter'));
    row.append(label, pick, grade, comic);
    panelList.append(row);
  });
}

/** Fills every panel with the selected panel's photo or illustration. */
function fillAllWithSelected() {
  const src = state.panels[state.selected];
  if (!src.photo && !src.art) return;
  state.panels.forEach((panel) => {
    panel.photo = src.photo || null;
    panel.art = src.photo ? null : src.art;
    panel.comic = src.comic || false;
    panel.scale = 1;
    panel.dx = 0;
    panel.dy = 0;
  });
  redraw();
}

/** One photo, three lives: one photo across three panels, each cropped and graded differently. */
async function onePhotoThreeLives() {
  let img = state.panels[state.selected].photo;
  if (!img) img = state.panels.find((p) => p.photo)?.photo || null;
  if (!img) {
    img = await loadImage('samples/rooftop-terrace.jpg');
    if (!photos.includes(img)) photos.push(img);
  }
  state.layout = 'trio';
  rebuildPanels();
  state.panels.forEach((panel, i) => {
    const life = LIVES[i % LIVES.length];
    panel.photo = img;
    panel.art = null;
    panel.grade = life.grade;
    panel.act = life.act;
    panel.scale = life.scale;
    panel.dx = life.dx;
    panel.dy = life.dy;
  });
  state.selected = 0;
  zoomInput.value = '100';
  syncControls();
  redraw();
}

/** Generates a criminal nickname: from the typed name when there is one, else from thin air. */
function generateAlias() {
  const name = (nameInput.value || '').trim();
  const last = ALIAS_LAST[Math.floor(Math.random() * ALIAS_LAST.length)];
  if (name) {
    state.caption = `${name} "The ${last}"`;
  } else {
    const first = ALIAS_FIRST[Math.floor(Math.random() * ALIAS_FIRST.length)];
    state.caption = `The ${first} ${last}`;
  }
  captionInput.value = state.caption;
  redraw();
}

/** Exports the cover at the chosen size as a PNG download. */
async function exportCover(sizeKey) {
  await ensureDisplayFont();
  const size = SIZES[sizeKey];
  const out = renderCover(size.w, size.h, state);
  statusEl.textContent = `Exporting ${size.label}…`;
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-case-file-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-city-case-file-${size.w}x${size.h}.png`;
  }, 'image/png');
}

/** Sets the layout and rebuilds the panel list to match its panel count. */
function setLayout(name) {
  state.layout = name;
  rebuildPanels();
}

function wireControls() {
  document.querySelectorAll('[data-template]').forEach((btn) => {
    btn.addEventListener('click', () => applyTemplate(btn.dataset.template));
  });
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLayout(btn.dataset.layout);
      syncControls();
      redraw();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      syncControls();
      redraw();
    });
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      syncControls();
      redraw();
    });
  });
  document.querySelectorAll('[data-effect]').forEach((box) => {
    box.addEventListener('change', () => {
      state.effects[box.dataset.effect] = box.checked;
      redraw();
    });
  });
  document.querySelectorAll('[data-star]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.wanted = Number(btn.dataset.star);
      syncControls();
      redraw();
    });
  });
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    redraw();
  });
  statsInput.addEventListener('input', () => {
    state.stats = statsInput.value;
    redraw();
  });
  document.getElementById('alias-gen').addEventListener('click', generateAlias);
  document.getElementById('caption-gradient').addEventListener('change', (e) => {
    state.captionGradient = e.target.checked;
    redraw();
  });
  document.getElementById('fill-all').addEventListener('click', fillAllWithSelected);
  document.getElementById('lives').addEventListener('click', onePhotoThreeLives);
  document.getElementById('reset-crop').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.scale = 1;
    panel.dx = 0;
    panel.dy = 0;
    zoomInput.value = '100';
    redraw();
  });
  zoomInput.addEventListener('input', () => {
    state.panels[state.selected].scale = Number(zoomInput.value) / 100;
    redraw();
  });
  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const img = await loadImage(`samples/${btn.dataset.sample}.jpg`);
      if (!photos.includes(img)) photos.push(img);
      const panel = state.panels[state.selected];
      panel.photo = img;
      panel.art = null;
      panel.scale = 1;
      panel.dx = 0;
      panel.dy = 0;
      zoomInput.value = '100';
      redraw();
    });
  });
  document.querySelectorAll('[data-art]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      panel.art = btn.dataset.art;
      panel.photo = null;
      panel.scale = 1;
      panel.dx = 0;
      panel.dy = 0;
      redraw();
    });
  });
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => exportCover(btn.dataset.export));
  });
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) {
      // eslint-disable-next-line no-await-in-loop
      await exportCover(key);
    }
  });

  // Drag the preview to pan the selected panel's photo; wheel zooms it.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const layout = LAYOUTS[state.layout];
    const hit = layout.panels.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
    if (hit >= 0) {
      state.selected = hit;
      zoomInput.value = String(Math.round((state.panels[hit].scale || 1) * 100));
      dragging = { x: e.clientX, y: e.clientY, panel: state.panels[hit], rect };
      canvas.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = dragging.panel;
    const layout = LAYOUTS[state.layout];
    const p = layout.panels[state.selected];
    panel.dx += ((e.clientX - dragging.x) / dragging.rect.width) / p.w;
    panel.dy += ((e.clientY - dragging.y) / dragging.rect.height) / p.h;
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    dragging = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.scale = Math.min(4, Math.max(0.5, (panel.scale || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
    zoomInput.value = String(Math.round(panel.scale * 100));
    redraw();
  }, { passive: false });
}

async function init() {
  wireControls();
  await preloadSamples();
  applyTemplate('getaway');
  await ensureDisplayFont();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state,
      SIZES,
      loadImage,
      redraw,
      syncControls,
      setLayout,
      applyTemplate,
      setCaption: (text) => {
        state.caption = text;
        captionInput.value = text;
      },
      setStats: (text) => {
        state.stats = text;
        statsInput.value = text;
      },
      setWanted: (n) => {
        state.wanted = n;
      },
    });
  } else {
    redraw();
  }
}

init();
