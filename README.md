# D&M Mutfak — scroll film demo

One-page demo for D&M Mutfak ve Banyo (@dmmutfak, Kırklareli; DM İnşaat Mobilya Ltd. Şti.):
kitchens, bathrooms, TV units and made-to-measure furniture, measured, built and fitted by one team.
Same family as the Maviron Çelik and Arkhera Mobilya demos: the opener is a film scrubbed by page
scroll. No build step: `index.html`, `css/site.css`, `js/`, `fonts/`, `img/` and `favicon.svg` are the
whole site (about 0.9 MB). The research and open questions are in `HAZIRLIK.md`.

Preview locally: `py -3 -m http.server 5530` in this folder, then http://localhost:5530.

## The film

Four Gemini keyframes of one kitchen from one camera (`img/film/`, 1920 × 1080 and 1080 × 1920 for
portrait screens), scrubbed over film seconds 0–12:

1. **Ölçü** — the empty kitchen, pipes and sockets out of the wall, a laser level (`1-olcu`).
2. **Üretim & montaj** — fades to the bare carcasses fitted, fronts still wrapped (`2-govde`).
3. **Teslim** — a gold line wipes left to right, revealing the finished kitchen by day (`3-gunduz`).
4. **Işık** — fades to the evening, hidden LEDs on (`4-aksam`); closing call to action.

- Prompts and the edit chain are in `GEMINI.md`; the originals sit in `gemini/` (kept out of git).
  `py -3 tools/keyframes.py` aligns each frame to the one it was edited from, crops and scales it,
  and writes `img/film/` plus the share image `img/og.jpg`. The current frames came out of Gemini at
  1024 × 572 / 572 × 1024 and are scaled up, so they are a little soft on large screens.
- `html.live-film` is set by the inline script in the `<head>`, before the first paint. Without it
  (`prefers-reduced-motion`, no JS, or `?still` in the URL) the film is the evening still with the
  four chapters as text.
- Chapters use `data-from`/`data-to` in film seconds. Tags use `data-d` / `data-m`: a point on the
  landscape / portrait image as fractions of its width and height. Re-place them when the images change.
- Portrait frames are chosen with `(max-aspect-ratio:4/5)`, the same query in the `<source>` elements
  and in `js/site.js`, so the tags follow the picture that is shown.
- `__film.seek(t)` in the console jumps the page to film second `t`.

## Other sections

- **Atölye**: who they are, four facts.
- **Projeler**: 11 of their own posts in a column layout with filters (Mutfak, Salon & TV ünitesi,
  Oda, Kurumsal). Each card links to the original post.
- **Işık**: the day and evening frames under a draggable divider (a range input, so it works with
  keys and touch), their own line about light, LED colour temperatures.
- **Mutfağını tasarla**: düz / L / U, wall lengths, island, door style and colour, LED.
  `js/plan.js` works out the layout in cm (60 cm base runs, 35 cm wall cabinets, a 110 cm aisle to
  the island, 100 cm from a side run), the worktop length, module count and island size, and the
  WhatsApp message. `js/kitchen3d.js` builds that layout in 3D with three.js r180 (`js/vendor/`,
  mapped by the import map in `<head>`): plinth, carcasses, drawer and door fronts (handle-less
  with a grip groove, or classic framed with a knob), marble worktop and splash, wall units with a
  glass vitrin, fridge column, sink, hob or hood, island with waterfall ends and stools, and the
  LED strips with warm lights. It loads when the section is ~600 px away, renders on demand, and
  turns by dragging sideways (mouse drags also tilt; arrow keys on the focused view). The turn is
  limited per plan type so a side wall never blocks the view. Without WebGL2, or until three.js
  arrives, the SVG top-down plan shows instead. The figures are a first idea, not a quote.
- **Mağazalar**: Kırklareli shop and Pınarhisar workshop with map links.
- **İletişim**: phones, e-mail and a form that writes a WhatsApp message (no server).

## Content sources

- Bio, phones, the slogan "Tasarımdan üretime, uygulamadan teslime", project captions and dates:
  their Instagram profile and posts (May–October 2026). E-mail and the Pınarhisar address: their
  Facebook page. Shop address: Google Maps. Founding year: an employee's LinkedIn entry (since January 2010).
- Project photos: 640 px thumbnails of their own posts, saved in `instagram-raw/` (kept out of git) and
  converted by `py -3 tools/instagram.py`. The shop photo is the 150 px profile picture.
- The logo mark is redrawn in SVG from the sign in their Ticaret Odası post.
- Fonts (`py -3 tools/fonts.py`, SIL OFL, latin + latin-ext): Jost, Figtree, JetBrains Mono.

## Before going live

- Ask D&M for full-resolution project photos and a vector logo.
- Confirm: 0533 544 98 80 is on WhatsApp; Pınarhisar is the workshop and Kırklareli the shop; whether
  the Lüleburgaz address (Murat Hüdavendigar Cad. 61A, Yandex only) is still open; opening hours;
  "2010'dan beri" and "kendi atölyemiz, kendi montaj ekibimiz"; that the pastel girl's room is a photo,
  not a render; the door and colour options in the planner.
- The film is a visualisation, not one of their kitchens; the Işık section says so.
- dmmutfak.com is theirs and shows only a logo: the site can go live there. Then set absolute
  `og:image` and canonical URLs in `index.html` (they are relative now).
