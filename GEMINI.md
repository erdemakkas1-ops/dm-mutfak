# Açılış filmi için Gemini görselleri

Açılış, aynı mutfağın aynı kameradan çekilmiş 4 karesiyle oynuyor. Kaydırdıkça sırayla:

| Sıra | Dosya adı | Ne görünüyor | Geçiş |
|---|---|---|---|
| 1 | `1-olcu` | Boş, sıvalı mutfak, tesisat çıkışları, lazer çizgisi | Açılış karesi |
| 2 | `2-govde` | Aynı mutfak, sadece ham dolap gövdeleri takılı | Yumuşak geçişle gelir |
| 3 | `3-gunduz` | Bitmiş mutfak, gündüz | Soldan sağa amber bir tarama çizgisiyle açılır |
| 4 | `4-aksam` | Aynı mutfak, akşam, gizli LED'ler yanık | Yumuşak geçişle gelir |

Geçişlerin çalışması için **4 karede de kamera, pencere, tavan ve duvarlar aynı yerde** olmalı.
Önce 3. kareyi üret, diğer üçünü **o görseli Gemini'de düzenleterek** yap (yeni görsel
ürettirme; aksi halde oda her seferinde değişir).

## Sıra ve promptlar

Görsel oranı **16:9 (yatay)**. İstersen D&M'nin 4 Haziran (mat toprak tonu, kulpsuz, ada) veya
9 Haziran (gri lake, camlı vitrin) gönderisini referans görsel olarak ekle; sonuç onların işine benzer.

**1) Önce `3-gunduz` (bitmiş mutfak, gündüz)**

> Photorealistic interior photograph of a newly fitted kitchen in a Turkish apartment, eye-level camera at 1.5 m, 24 mm lens, 16:9, looking at the main cabinet wall with a kitchen island in the foreground. Handle-less matt cabinet fronts in a warm greige, full-height tall units with a built-in black oven and black fridge column on the left, a run of base and wall cabinets on the back wall, a light marble-look quartz worktop with a full-height matching backsplash, a black tap and an undermount sink. The island has the same worktop with a waterfall edge, a flush black induction hob and three black bar stools. One glass-fronted display cabinet with walnut shelves. A window on the right with a sheer curtain. Light oak floor, flat white ceiling with recessed spots. Soft natural daylight, calm and clean. Architectural photography, no people, no text, no logos.

**2) `4-aksam`** — 3. görseli yükle ve şunu yaz:

> Edit this image. Keep the same kitchen, the same camera angle and every object exactly where it is. Change the time to evening: dark blue sky in the window, the room lit mainly by warm 2700 K hidden LED strips under the wall cabinets, along the top of the tall units, inside the glass display cabinet and under the island overhang, plus a few warm recessed spots. The worktop glows softly from the under-cabinet light. Cosy, premium evening mood, photorealistic.

**3) `2-govde`** — yine 3. görseli yükle:

> Edit this image. Keep the same camera angle, the same window, walls, ceiling and floor. Remove all cabinet doors, the worktop, the backsplash, the appliances, the tap, the stools and the curtain. Leave only the bare cabinet carcasses fixed in place: raw white melamine boxes with visible shelves, hinges plates and drawer runners, the island as an open carcass without its top. A few unopened door panels wrapped in protective film lean against the wall, a cordless drill on the floor. Daylight, photorealistic, a real kitchen mid-installation.

**4) `1-olcu`** — yine 3. görseli yükle:

> Edit this image. Keep the same camera angle, the same window and the same ceiling. Remove every cabinet, the island, the floor finish and all furniture: an empty kitchen with smooth plastered light grey walls, a bare screed floor, water and drain pipe stubs and electrical sockets coming out of the back wall at worktop height. A laser level on a tripod projects a thin red horizontal line across the walls, pencil marks and a tape measure on the floor. Daylight, photorealistic.

Sonucu 3. kareyle üst üste koyup hızlıca karşılaştır: pencere ve tavan kayıyorsa o kareyi yeniden düzenlet.

## Telefon için (önerilir)

3. görseli **9:16 (dikey)** genişlettir (*"Extend this image to a vertical 9:16 frame, keep the island and the cabinet wall centred"*), sonra aynı 3 düzenlemeyi bu dikey görsel üzerinde tekrarla. Adlar: `1-olcu-m`, `2-govde-m`, `3-gunduz-m`, `4-aksam-m`.

## Teslim

Görselleri (png, jpg ya da webp) proje içindeki `gemini/` klasörüne yukarıdaki adlarla koy.
Site kurulurken 1920 × 1080 ve 1080 × 1920 WebP'ye çevrilip `img/film/` altına yazılacak.
