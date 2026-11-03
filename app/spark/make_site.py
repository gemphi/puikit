"""Fill the Lora's Spark page from the finished show: writes public/data/spark.json and public/show/*.jpg.

    py -3.13 make_site.py

Reads Downloads/phiber/LAVA-POSES (show.json and show/*.png); those are only read. Rerun it as
renders land: a look appears with whichever of its angles exist so far.
"""
import json
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
SHOW = os.path.join(os.path.expanduser("~"), "Downloads", "phiber", "LAVA-POSES")
OUT = os.path.join(HERE, "public", "show")
SIZE = 1200
ANGLES = (("front", "Front"), ("three_quarter", "Three-quarter"), ("side", "Side"), ("back", "Back"))
NAMES = {"phantom_gold": "Phantom Gold", "phantom_red": "Phantom Red", "phantom_black": "Phantom Black", "piggy_bank": "Piggy Bank", "sunrise": "Sunrise", "tornado_ice": "Tornado Ice", "grape": "Grape", "pearl": "Pearl"}


def export(camera, name):
    """A render as a web image, or None if it has not finished yet."""
    src = os.path.join(SHOW, "show", f"{camera}_0001.png")
    if not os.path.exists(src):
        return None
    dst = os.path.join(OUT, name + ".jpg")
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = bpy.data.images.load(src)
        im.scale(SIZE, SIZE)
        im.file_format = "JPEG"
        scene = bpy.context.scene
        scene.render.image_settings.file_format = "JPEG"
        scene.render.image_settings.quality = 88
        im.save_render(dst, scene=scene)
        bpy.data.images.remove(im)
    return "show/" + name + ".jpg"


def cut_of(look):
    if look.get("tweed"):
        return "tweed"
    if look.get("ruffles"):
        return "ruffle"
    if look.get("net") is not None:
        return "slant" if look.get("hem") else "net"
    return "plain"


CUTS = {
    "tweed": ("Tweed minidress", "Tweed cut in panels that cross at the waist, banded at the hem."),
    "ruffle": ("Ruffled dress", "Soft gathered tiers falling into a rounded bubble hem."),
    "net": ("Net dress", "A solid bodice over an open diamond net."),
    "slant": ("Slant-hem net dress", "An open diamond net, the hem cut on a slant."),
    "plain": ("Silk minidress", "One colour, cut close, with short sleeves."),
}

os.makedirs(OUT, exist_ok=True)
show = json.load(open(os.path.join(SHOW, "show.json"), encoding="utf-8"))
looks = []
for i, look in enumerate(show["looks"]):
    color = look["color"]
    tag = f"Look-{i + 1:02}-{color}"
    views = []
    for angle, label in ANGLES:
        image = export(f"SHOW-{tag}-{angle}", f"look{i + 1:02}-{angle}")
        if image:
            views.append({"label": label, "image": image})
    if not views:
        continue
    cut = cut_of(look)
    title, about = CUTS[cut]
    shade = NAMES[color]
    looks.append({
        "id": f"look-{i + 1:02}",
        "number": i + 1,
        "title": f"{title} in {shade}",
        "color": {"name": shade, "hex": show["colors"][color]["hex"]},
        "cut": cut,
        "about": about,
        "items": [
            {"name": title, "about": shade},
            {"name": "Thigh-high boots", "about": f"Clear, with a {shade} cap toe"},
            {"name": "Brim hat", "about": f"Clear brim, {shade} band"},
        ],
        "views": views,
    })
hero = export("SHOW-line", "line")
wide = export("SHOW-above", "above")
site = {
    "app": "spark",
    "start": "show",
    "bare": True,
    "nav": [{"id": "show", "label": "The show", "icon": "sparkles"}],
    "views": {"show": {"title": "", "blocks": [{"kind": "runway", "wordmark": "Lora's Spark", "wordmarkFont": "Lora's Spark", "hero": hero, "heroAlt": "Models walking the winding wooden runway through the city", "sub": "Sixteen looks on a winding wooden runway, through a city of phantom gold, phantom red and piggy bank.", "wide": [wide] if wide else [], "looks": looks}]}},
}
json.dump(site, open(os.path.join(HERE, "public", "data", "spark.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("SITE looks", len(looks), "images", sum(len(l["views"]) for l in looks))
