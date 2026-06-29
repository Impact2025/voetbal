"""
Generate OG cover images for all Skillkaart blog posts.
1200x630 px, dark gradient bg with neon accent, word-wrapped title.
"""
import os, textwrap
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = r"D:\APPS\Voetbal\player-hub\public\og"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Brand colors
BG_TOP = "#0D0D0D"
BG_BOTTOM = "#1a1a2e"
ACCENT = "#00FF9D"
TEXT_COLOR = "#ffffff"
SUBTLE = "#94a3b8"

POSTS = [
    ("ai-in-jeugdvoetbal-kansen-trainer", "AI in het jeugdvoetbal: 5 toepassingen voor elke trainer"),    ("radarchart-spelersontwikkeling-coach", "Waarom een radarchart de beste manier is om spelersgroei te visualiseren"),    ("avg-privacy-jeugdvoetbalclub-wat-mag-wel", "AVG en privacy voor jeugdvoetbalclubs: wat mag wel? (gids 2026)"),    ("gamificatie-jeugdvoetbal-training-motivatie", "Gamificatie in de jeugdvoetbaltraining: meer plezier, meer retentie"),    ("ouderbetrokkenheid-jeugdvoetbal-tips", "Ouderbetrokkenheid in het jeugdvoetbal: van last naar kracht"),    ("trainingsmentaliteit-ontwikkelen-jeugdvoetbal", "Trainingsmentaliteit bij jeugdvoetballers ontwikkelen"),    ("wat-is-een-skillkaart-jeugdvoetbal", "Wat is een skillkaart in het jeugdvoetbal? (en waarom elke club er een nodig heeft)"),    ("kan-ik-mijn-skillkaart-profielkaart-delen", "Kan ik mijn Skillkaart-profielkaart delen?"),    ("hoe-veilig-zijn-de-gegevens-van-mijn-kind", "Hoe veilig zijn de gegevens van mijn kind?"),    ("wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze", "Wat zijn huiswerkopdrachten en hoe doe ik ze?"),    ("skillkaart-aanpassen-clubkleuren-branding", "Kunnen we Skillkaart aanpassen met clubkleuren?"),    ("wat-kost-skillkaart-voor-een-voetbalclub", "Wat kost Skillkaart voor een voetbalclub?"),    ("kan-ik-als-trainer-trainingsplannen-laten-genereren", "Kan ik als trainer trainingsplannen laten genereren?"),    ("hoe-log-ik-in-op-skillkaart-met-mijn-pincode", "Hoe log ik in op Skillkaart met mijn PIN-code?"),    ("skillkaart-pilot-starten-in-je-club", "Hoe start ik een pilot met Skillkaart in mijn club?"),    ("ontvang-ik-als-ouder-wekelijkse-rapportages", "Ontvang ik als ouder wekelijkse updates of rapportages?"),    ("wat-zijn-de-7-kernskills-die-skillkaart-meet", "Wat zijn de 7 kernskills die Skillkaart meet?"),    ("hoe-verdien-ik-xp-en-stijg-ik-in-level", "Hoe verdien ik XP en stijg ik in level?"),    ("skillkaart-avg-privacy-jeugdspelers", "Voldoet Skillkaart aan de AVG-privacywet voor jeugdspelers?"),    ("wat-ziet-mijn-kind-in-het-skillkaart-dashboard", "Wat ziet mijn kind in het Skillkaart-dashboard?"),    ("hoe-werkt-de-ai-feedback-precies", "Hoe werkt de AI-feedback precies?"),    ("wat-betekenen-de-radardiagrammen", "Wat betekenen de radardiagrammen en hoe lees ik ze?"),    ("hoeveel-teams-toevoegen-skillkaart", "Hoeveel teams kan ik toevoegen en beheren in Skillkaart?"),    ("hoe-krijg-ik-als-ouder-toegang-tot-skillkaart", "Hoe krijg ik als ouder toegang tot het dashboard van mijn kind?"),    ("hoeveel-tijd-kost-een-evaluatie-op-skillkaart", "Hoeveel tijd kost een evaluatie op Skillkaart?"),    ("verschil-skillkaart-knvb-rinus-vton", "Wat is het verschil tussen Skillkaart, KNVB Rinus en VTON?"),    ("werkt-skillkaart-ook-op-mijn-telefoon", "Werkt Skillkaart ook op mijn telefoon?"),]

def generate_og(slug: str, title: str):
    """Generate 1200x630 OG image."""
    img = Image.new("RGB", (1200, 630))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(630):
        r = int(13 + (26 - 13) * y / 630)
        g = int(13 + (26 - 13) * y / 630)
        b = int(46 + (46 - 46) * y / 630)
        draw.line([(0, y), (1200, y)], fill=(r, g, b))

    # Accent line at top
    draw.rectangle([(0, 0), (1200, 4)], fill=(0, 255, 157))

    # Try to load font
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 52)
                break
            except:
                pass
    if font is None:
        font = ImageFont.load_default()

    small_font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                small_font = ImageFont.truetype(fp, 28)
                break
            except:
                pass
    if small_font is None:
        small_font = ImageFont.load_default()

    # Brand
    draw.text((60, 40), "SKILLKAART", fill=ACCENT, font=small_font)

    # Website
    draw.text((60, 80), "skillkaart.nl", fill=SUBTLE, font=small_font)

    # Title wrapped
    wrapper = textwrap.TextWrapper(width=25, max_lines=4)
    try:
        wrapped = wrapper.wrap(title)
    except:
        wrapped = [title]

    y_start = 220
    for i, line in enumerate(wrapped):
        draw.text((60, y_start + i * 68), line, fill=TEXT_COLOR, font=font)

    # Bottom accent bar
    draw.rectangle([(0, 626), (1200, 630)], fill=ACCENT)

    # Save
    outpath = os.path.join(OUTPUT_DIR, f"{slug}.jpg")
    img.save(outpath, "JPEG", quality=85)
    return outpath


if __name__ == "__main__":
    for slug, title in POSTS:
        path = generate_og(slug, title)
        print(f"Generated: {path}")
    print("\nDone! All OG images generated.")
