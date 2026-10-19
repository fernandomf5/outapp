#!/usr/bin/env python3
"""Build Out App brand images from the same supplied logo used on the site's video.
Outputs actual PNG files so browsers, WhatsApp, Facebook, X, and PWA previews can use them.
The source of truth is the already committed inlined logo in public/outapp-video-logo.svg.
"""
from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
import math
import random
import re

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = (PUBLIC / "outapp-video-logo.svg").read_text(encoding="utf8")
match = re.search(r"data:image/webp;base64,([A-Za-z0-9+/=]+)", SOURCE)
if not match:
    raise RuntimeError("The Out App logo asset is missing its embedded image")
logo = Image.open(BytesIO(base64.b64decode(match.group(1)))).convert("RGBA")


def icon_image(size: int) -> Image.Image:
    target = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Preserve the original composition and alpha; avoid introducing a square background.
    icon = logo.copy()
    icon.thumbnail((int(size * .94), int(size * .94)), Image.Resampling.LANCZOS)
    target.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return target


for size, filename in [
    (64, "favicon.png"),
    (180, "apple-touch-icon.png"),
    (192, "outapp-icon-192.png"),
    (512, "outapp-icon-512.png"),
]:
    icon_image(size).save(PUBLIC / filename, optimize=True)


W, H = 1200, 630
im = Image.new("RGB", (W, H))
p = im.load()
for y in range(H):
    ny = y / H
    for x in range(W):
        nx = x / W
        halo = max(0, 1 - math.hypot((nx - .5) * 1.5, (ny - .37) * 1.3))
        p[x, y] = (
            int(3 + 7 * halo),
            int(8 + 27 * halo + 7 * (1 - ny)),
            int(25 + 53 * halo + 9 * (1 - nx)),
        )

base = im.convert("RGBA")
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse((345, -105, 860, 410), fill=(22, 123, 253, 105))
glow_draw.ellipse((510, -95, 750, 165), fill=(162, 66, 255, 80))
glow = glow.filter(ImageFilter.GaussianBlur(85))
base = Image.alpha_composite(base, glow)
draw = ImageDraw.Draw(base)

random.seed(102019)
for _ in range(140):
    x, y = random.randrange(W), random.randrange(H)
    draw.ellipse((x, y, x + random.choice([1, 1, 2]), y + 1), fill=(45, 142, 210, random.randint(30, 95)))

# Futuristic orbital grid, accents and semicircular interfaces
for dx in [0, 16, 34]:
    draw.ellipse((360-dx, -122-dx, 840+dx, 358+dx), outline=(34, 125, 220, 120 if dx == 0 else 42), width=2)
draw.arc((315, -170, 885, 400), start=200, end=318, fill=(46, 226, 255, 220), width=3)
draw.arc((370, -135, 860, 355), start=25, end=140, fill=(154, 88, 255, 230), width=3)
draw.arc((315, -180, 885, 390), start=12, end=90, fill=(89, 128, 255, 140), width=2)
for row in range(9):
    y = 435 + row * 25
    draw.line((70, y, 1130, y), fill=(21, 55, 105, max(8, 70-row*8)), width=1)

# Small off-axis dashboard cards evoke the real new UI without suggesting fake KPIs.
def panel(rect, header: str, bars: list[int], color):
    x1, y1, x2, y2 = rect
    draw.rounded_rectangle(rect, radius=17, fill=(5, 24, 50, 216), outline=(43, 111, 190, 155), width=2)
    f = font(16, bold=True)
    draw.text((x1+16, y1+13), header, font=f, fill=(132, 209, 252, 230))
    for i, height in enumerate(bars):
        a = x1+20+i*19
        b = y2-17
        draw.rounded_rectangle((a, b-height, a+10, b), radius=3, fill=(*color, 165+int(i/len(bars)*70)))


def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


panel((55, 100, 260, 255), "FINANCEIRO", [14, 30, 41, 57, 44, 75, 88], (23, 185, 244))
panel((940, 112, 1142, 249), "ORGANIZAÇÃO", [25, 49, 33, 72, 85, 93, 104], (159, 100, 253))

# Place logo in the centre: taken from the user's supplied circular brand mark.
large = logo.resize((260, 260), Image.Resampling.LANCZOS)
mark_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
mg = ImageDraw.Draw(mark_glow)
mg.ellipse((465, 0, 735, 278), fill=(55, 138, 255, 135))
mark_glow = mark_glow.filter(ImageFilter.GaussianBlur(30))
base = Image.alpha_composite(base, mark_glow)
base.alpha_composite(large, (470, -7))
draw = ImageDraw.Draw(base)

# Centered, high contrast branding.
def center(text, top, text_font, color, tracking=0):
    if tracking:
        widths = [draw.textbbox((0,0), c, font=text_font)[2] for c in text]
        full = sum(widths) + tracking * (len(text)-1)
        x = (W-full)/2
        for i, c in enumerate(text):
            draw.text((round(x), top), c, font=text_font, fill=color)
            x += widths[i] + tracking
    else:
        rect = draw.textbbox((0,0), text, font=text_font)
        draw.text(((W - (rect[2]-rect[0]))/2, top), text, font=text_font, fill=color)


center("Out App", 263, font(85, bold=True), (242, 252, 255, 255))
center("GESTÃO LIVRE", 369, font(39, bold=True), (82, 210, 251, 255), tracking=5)
center("Seu negócio no centro de tudo", 427, font(23), (200, 222, 243, 255))

# The five real navigation categories; no legacy/out-of-scope marketing.
chips = [("Financeiro", (30, 205, 234)), ("Tarefas", (157, 106, 255)),
         ("Agenda", (59, 149, 255)), ("Rotina", (226, 92, 226)),
         ("Recursos Úteis", (64, 196, 238))]
widths = [171, 148, 148, 140, 226]
spacing = 12
x = (W - sum(widths) - (len(widths)-1) * spacing) // 2
for (name, color), width in zip(chips, widths):
    rect = (x, 519, x+width, 580)
    draw.rounded_rectangle(rect, radius=25, fill=(8, 30, 67, 250), outline=(*color, 230), width=2)
    tw = draw.textbbox((0,0), name, font=font(17, bold=True))[2]
    draw.text((x+(width-tw)/2, 538), name, font=font(17, bold=True), fill=(235, 248, 255, 255))
    x += width + spacing

base.convert("RGB").save(PUBLIC / "social-outapp.png", optimize=True)
print("Created Out App favicon, mobile icons and social preview from the saved user logo.")
