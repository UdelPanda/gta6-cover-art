// Fixed scenes for screenshots: ?shot=editor shows the page with a photo loaded; ?shot=cover shows the cover alone at the query's size.
// Query: template (story in three acts), art (illustration names, one per panel), photo (sample name, fills every panel),
// photos (comma list, one per panel), grades (comma list, one per panel), caption, stats, wanted, layout, grade, size, w, h.
// window.__shotReady is set once painted.
import { drawCover, ensureDisplayFont } from './cover.js';

const SAMPLES = {
  'rooftop-terrace': 'samples/rooftop-terrace.jpg',
  'marina-yacht': 'samples/marina-yacht.jpg',
  'jet-ski': 'samples/jet-ski.jpg',
  'gas-station': 'samples/gas-station.jpg',
};

export async function runShot(shot, query, api) {
  const { state, SIZES, loadImage, redraw, syncControls, setLayout, applyTemplate, setCaption, setTagline, setStrip, setStats, setWanted } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const template = query.get('template');
  if (template) applyTemplate(template);
  const layout = query.get('layout');
  if (layout) setLayout(layout);
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  setCaption(query.get('caption') ?? state.caption);
  if (query.get('tagline')) setTagline(query.get('tagline'));
  if (query.get('strip')) setStrip(query.get('strip'));
  setStats(query.get('stats') ?? state.stats);
  if (query.get('wanted')) setWanted(Number(query.get('wanted')));
  const sizeKey = query.get('size');
  if (sizeKey && SIZES[sizeKey]) state.size = sizeKey;

  // Illustrations: one per panel, or one illustration in every panel.
  const arts = query.get('art') ? query.get('art').split(',') : null;
  if (arts) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].art = arts[i % arts.length].trim();
      state.panels[i].photo = null;
      state.panels[i].scale = 1;
      state.panels[i].dx = 0;
      state.panels[i].dy = 0;
    }
  }
  // Act labels per panel: the story's acts, or one photo's three lives.
  const acts = query.get('acts') ? query.get('acts').split(',') : null;
  if (acts) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].act = acts[i % acts.length].trim() || null;
    }
  }
  // Location labels per panel: place name and time, one per panel.
  const places = query.get('places') ? query.get('places').split(',') : null;
  if (places) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].place = places[i % places.length].trim() || null;
    }
  }
  const times = query.get('times') ? query.get('times').split(',') : null;
  if (times) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].time = times[i % times.length].trim() || null;
    }
  }
  // Grades per panel: one photo, three lives.
  const grades = query.get('grades') ? query.get('grades').split(',') : null;
  if (grades) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].grade = grades[i % grades.length].trim() || null;
    }
  }
  // Comic per panel: illustrate the photo into a GTA-style panel (1 = on).
  const comics = query.get('comic') ? query.get('comic').split(',') : null;
  if (comics) {
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].comic = comics[i % comics.length].trim() === '1';
    }
  }
  // Photos: one per panel, or one photo in every panel.
  if (query.get('photos') || query.get('photo')) {
    const names = (query.get('photos') || query.get('photo')).split(',');
    const images = [];
    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      images.push(await loadImage(SAMPLES[name.trim()] || SAMPLES['rooftop-terrace']));
    }
    for (let i = 0; i < state.panels.length; i += 1) {
      state.panels[i].photo = images[i % images.length];
      state.panels[i].art = null;
      state.panels[i].scale = 1;
      state.panels[i].dx = 0;
      state.panels[i].dy = 0;
    }
    // A hero shot crops the hero panel a touch tighter, like a poster.
    if (state.layout === 'hero' && state.panels[0] && state.panels[0].photo) state.panels[0].scale = 1.12;
  }
  // Crop offsets per panel, as fractions of panel width/height: pans a photo
  // inside its panel (negative dx shows more of the photo's right side).
  // After the photos block, which resets scale/dx/dy.
  const dxs = query.get('dx') ? query.get('dx').split(',') : null;
  if (dxs) {
    for (let i = 0; i < state.panels.length; i += 1) {
      const v = Number(dxs[i % dxs.length]);
      if (Number.isFinite(v)) state.panels[i].dx = v;
    }
  }
  const dys = query.get('dy') ? query.get('dy').split(',') : null;
  if (dys) {
    for (let i = 0; i < state.panels.length; i += 1) {
      const v = Number(dys[i % dys.length]);
      if (Number.isFinite(v)) state.panels[i].dy = v;
    }
  }

  syncControls();
  await ensureDisplayFont();
  if (shot === 'cover') {
    const w = Number(query.get('w')) || SIZES[state.size].w;
    const h = Number(query.get('h')) || SIZES[state.size].h;
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
