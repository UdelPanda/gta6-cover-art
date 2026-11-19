// Vice City Case Files — a gta6-cover-art-01 entry (Node 22, standard library only): the app is this directory's
// app/ folder, plain static files a desktop browser loads offline (app/index.html and its ES modules, no library
// and no network request), and the program hands it in. It copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with the vendored make.fun library.
// The app turns a person's own photos and a nickname into a multi-panel poster cover in the classic GTA cover
// style — by default a clean photographic collage of the app's own Vice City photos (a rooftop terrace at
// sunset, a marina yacht at golden hour, a jet-ski couple, a neon gas station at night — all made for this
// entry with an image model, free to use), sharp and unfiltered with a gentle sunset or neon colour grade; an
// optional comic filter illustrates any photo into a cover panel, and an illustrated comic-book collage drawn
// from scratch (the duo, Ocean Drive, neon street, beach and wheel, skyline, the chase, the plan: bold
// outlines, cel shading, painterly colour) is one click away per panel. Story templates in three acts (Heist,
// Getaway, Night Drive, Beach Day), a wanted file with a nickname, a star level and an editable stats line,
// one photo in three lives, hero, hero-4, grid, trio and solo layouts, a sunset, neon-night or day colour
// grade, crop and position per panel, vignette and panel-shadow effects, and one-click PNG export at
// 1080 x 1080, 1080 x 1350 and 1920 x 1080. Its lettering is set in Anton, an SIL Open Font License face
// vendored under app/fonts/, and its script tagline in Pacifico, another SIL Open Font License face
// vendored beside it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
