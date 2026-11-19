// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone at the query's size.
// Query: photo (sample name, fills every panel), photos (comma list, one
// per panel), caption, tagline, layout, grade, size, w, h.
// window.__shotReady is set once painted.
import { drawCover, ensureDisplayFont } from './cover.js';

const SAMPLES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

export async function runShot(shot, query, api) {
  const { state, SIZES, loadImage, redraw, setLayout, setCaption, setTagline } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  if (layout) setLayout(layout);
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  setCaption(query.get('caption') ?? 'Sunset Heist');
  setTagline(query.get('tagline') ?? 'Every sunset has a price');
  const sizeKey = query.get('size');
  if (sizeKey && SIZES[sizeKey]) state.size = sizeKey;

  // Load the scene's photos: one per panel, or one photo in every panel.
  const names = (query.get('photos') || query.get('photo') || 'pier').split(',');
  const images = [];
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    images.push(await loadImage(SAMPLES[name.trim()] || SAMPLES.pier));
  }
  const count = state.panels.length;
  for (let i = 0; i < count; i += 1) {
    state.panels[i].photo = images[i % images.length];
    state.panels[i].scale = 1;
    state.panels[i].dx = 0;
    state.panels[i].dy = 0;
  }
  // A hero shot crops the hero panel a touch tighter, like a poster.
  if (state.layout === 'hero' && state.panels[0]) state.panels[0].scale = 1.12;

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
