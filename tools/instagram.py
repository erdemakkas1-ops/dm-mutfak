"""Make the site's project photos from D&M's own Instagram posts (instagram-raw/, 640 px thumbnails).

  py -3 tools/instagram.py

instagram-raw/ is kept out of git; it holds <shortcode>.jpg for each post and profile.jpg.
Each entry: post shortcode -> output name, crop box (left, top, right, bottom) in source pixels or None.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "instagram-raw")
OUT = os.path.join(ROOT, "img", "proje")

PHOTOS = {
    "DZXOvlrIF4Z": ("ada-siyah-detay", None),        # adalı mutfak, camlı vitrin, siyah detaylar (9 Haz)
    "DZMZ7c_CL2s": ("kulpsuz-toprak", None),         # mat toprak tonları, kulpsuz, ada (4 Haz)
    "DZZZWBiCIJH": ("gri-lake-klasik", None),        # gri lake klasik, kristal sarkıtlar (10 Haz)
    "DZC9-IjIEBc": ("krem-klasik", None),            # krem klasik, siyah ankastre (1 Haz)
    "DYmlytyiLtU": ("beyaz-pastel", None),           # beyaz, pastel ve altın detaylı mutfak (21 May)
    "DZ9WERmiFMa": ("tv-mermer-cita", None),         # siyah mermer, ahşap çıta, şömine (23 Haz)
    "DYokjtaCDBo": ("tv-lake-konsol", None),         # lake TV ünitesi, yüzer konsol (22 May)
    "DZIOhs-Ij9G": ("salon-ceviz-panel", None),      # salon duvarı, ahşap panel, gizli LED (3 Haz)
    "DZKSh4jIVeo": ("calisma-kosesi", None),         # yatak odası ve çalışma köşesi (4 Haz)
    "DYzJHW7oy_E": ("genc-odasi", None),             # pastel genç kız odası (26 May)
    "Dd_bpeIIWTv": ("ticaret-odasi", None),          # Kırklareli Ticaret Odası proje teslimi (2 Eki)
    "profile": ("magaza", None),                     # mağaza cephesi, 150 px profil fotoğrafı
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for code, (name, box) in PHOTOS.items():
        im = Image.open(os.path.join(RAW, code + ".jpg")).convert("RGB")
        if box:
            im = im.crop(box)
        im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=84, method=6)
        print(name, im.size)


if __name__ == "__main__":
    main()
