// Neon Coast Cover Studio — the editor wiring.
//
// Photo pickers per panel, caption and tagline editing, layout and grade
// switching, crop and position by dragging the preview, zoom, effects,
// and one-click export at 1080 x 1080, 1080 x 1350 and 1920 x 1080.
// Photos stay on the user's machine: they are read with object URLs and
// are never uploaded anywhere.
import { drawCover, renderCover, ensureDisplayFont, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const statusEl = document.getElementById('status');
const panelList = document.getElementById('panel-list');
const zoomInput = document.getElementById('zoom');

const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'Sunset Heist',
  tagline: 'Every sunset has a price',
  captionGradient: true,
  size: 'wide',
  effects: { halftone: true, grain: true, vignette: true, shadows: true },
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

/** Rebuilds the panel list for the current layout, keeping photos in order. */
function rebuildPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  const old = state.panels;
  state.panels = [];
  for (let i = 0; i < count; i += 1) {
    const prev = old[i] || old[0] || { photo: null, scale: 1, dx: 0, dy: 0 };
    state.panels.push({ photo: prev.photo, scale: prev.scale, dx: prev.dx, dy: prev.dy });
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

/** Renders the per-panel controls for the selected panel. */
function renderPanelList() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.selected ? ' selected' : '');
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'panel-name';
    label.textContent = `Panel ${i + 1}${panel.photo ? '' : ' — empty'}`;
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
      panel.scale = 1;
      panel.dx = 0;
      panel.dy = 0;
      state.selected = i;
      zoomInput.value = '100';
      redraw();
    });
    pick.append(file);
    row.append(label, pick);
    panelList.append(row);
  });
}

/** Fills every panel with the selected panel's photo. */
function fillAllWithSelected() {
  const photo = state.panels[state.selected].photo;
  if (!photo) return;
  state.panels.forEach((panel) => {
    panel.photo = photo;
    panel.scale = 1;
    panel.dx = 0;
    panel.dy = 0;
  });
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
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

/** Sets the layout and rebuilds the panel list to match its panel count. */
function setLayout(name) {
  state.layout = name;
  rebuildPanels();
}

function wireControls() {
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLayout(btn.dataset.layout);
      document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
  document.querySelectorAll('[data-effect]').forEach((box) => {
    box.addEventListener('change', () => {
      state.effects[box.dataset.effect] = box.checked;
      redraw();
    });
  });
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    redraw();
  });
  taglineInput.addEventListener('input', () => {
    state.tagline = taglineInput.value;
    redraw();
  });
  document.getElementById('caption-gradient').addEventListener('change', (e) => {
    state.captionGradient = e.target.checked;
    redraw();
  });
  document.getElementById('fill-all').addEventListener('click', fillAllWithSelected);
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
      panel.scale = 1;
      panel.dx = 0;
      panel.dy = 0;
      zoomInput.value = '100';
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
  rebuildPanels();
  await ensureDisplayFont();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state,
      SIZES,
      loadImage,
      redraw,
      setLayout,
      setCaption: (text) => {
        state.caption = text;
        captionInput.value = text;
      },
      setTagline: (text) => {
        state.tagline = text;
        taglineInput.value = text;
      },
    });
  } else {
    redraw();
  }
}

init();
