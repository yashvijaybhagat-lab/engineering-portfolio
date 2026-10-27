"""Turn content.json + assets/ into data.js for the site. Run: python3 -I build.py"""
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
content = json.load(open(os.path.join(ROOT, "content.json")))

# Spelling fixes only; wording is Yash's own.
TYPOS = {
    "childrens": "children's", "incorperating": "incorporating", "axis's": "axes",
    "labled": "labeled", "Discription": "Description", "diffrent": "different",
    "utalized": "utilized", "assemly": "assembly", "invocated": "involved",
    "shinny": "shiny", "wind, up": "wind-up", "problem, solving": "problem-solving",
    "This the isometric view of my castle in isometric.": "This is the isometric view of my castle.",
    "an unique": "a unique", "skills.My": "skills. My", "pool.My": "pool. My",
}


def clean(t):
    for a, b in TYPOS.items():
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


DECKS = {"1i9NHpCnH": "simple-machines", "12ryBnMgH": "compound-machine",
         "1fL2wmHMR": "chair-design", "1n_dHEMrc": "fluff-flinger"}
VIDEOS = {"1RQ6f9lAC": "assets/video/puzzle-cube-assembly.mp4",
          "19QQXutdx": "assets/video/trammel-toy.mp4"}

slides_dir = os.path.join(ROOT, "assets", "slides")
slides = {}
for f in sorted(os.listdir(slides_dir)):
    deck = f.rsplit("-", 1)[0]
    slides.setdefault(deck, []).append("assets/slides/" + f)

PROJECTS = [
    dict(slug="puzzle-cube-inventor-project", title="Puzzle Cube", course="IED",
         kicker="CAD · Assemblies · Technical drawing",
         summary="Designed five unique pieces that lock into a 3×3×3 cube, then modeled every piece in Autodesk Inventor with multiview drawings, an exploded assembly and an animated assembly video.",
         skills=["Autodesk Inventor", "Multiview drawings", "Exploded assemblies", "Spatial reasoning", "Animation"],
         cover="assets/img/puzzle-cube-inventor-project-19.jpg"),
    dict(slug="castle-project", title="Castle Project", course="IED",
         kicker="Client brief · 3D modeling",
         summary="A toy castle for a fictional client, Castles R Us, with required architectural elements and a solid motte. Built in Inventor with mirror, pattern, loft, revolve and custom work planes.",
         skills=["Autodesk Inventor", "Loft & revolve", "Work planes", "Sketching", "Design brief"],
         cover="assets/img/castle-project-02.png"),
    dict(slug="trammel-toy", title="Trammel Toy", course="IED",
         kicker="Assemblies · Hardware · BOM",
         summary="A working trammel mechanism modeled as a full assembly: parts created in-context, hardware placed, and an exploded drawing with a ten-item parts list.",
         skills=["Autodesk Inventor", "Assemblies", "Bill of materials", "Exploded views", "Mechanisms"],
         cover="assets/img/trammel-toy-01.png"),
    dict(slug="human-centered-chair-design-project", title="Human-Centered Chair", course="IED",
         kicker="Design process · Ergonomics · Team",
         summary="Team project (Yash, Tanay, Aneesh): each of us sketched concepts, we scored them in a decision matrix, took body measurements, built a paper prototype, then a full-size cardboard chair with internal supports, side walls and a convertible roof.",
         skills=["Design process", "Decision matrix", "Ergonomics", "Prototyping", "Teamwork"],
         cover="assets/slides/chair-design-09.jpg"),
    dict(slug="fluff-flinger", title="Fluff Flinger", course="IED",
         kicker="Prototyping · Testing · Data",
         summary="A cotton-ball launcher built from rubber bands, paper clips and popsicle sticks. Over 12 launches it averaged 88.1 in (max 125.7 in, std. dev. 26.5 in); we analyzed the spread with box plots and traced the one outlier to a misfire.",
         skills=["Rapid prototyping", "Data collection", "Statistics", "Box plots", "Teamwork"],
         cover="assets/slides/fluff-flinger-02.jpg"),
    dict(slug="reverse-engineering", title="Reverse Engineering", course="IED",
         kicker="Visual · Functional · Structural analysis",
         summary="Took apart a wind-up toy to understand it: a spring stores energy from the key and a gear train turns it into motion. Analyzed its look, its function and its structure.",
         skills=["Reverse engineering", "Mechanical systems", "Gear trains", "Product analysis"],
         cover="assets/img/reverse-engineering-01.jpg"),
    dict(slug="simple-machines-presentation", title="Simple Machines", course="POE",
         kicker="Mechanical advantage · IMA / AMA",
         summary="Built a second-class lever to hit target ideal and actual mechanical advantage, then calculated IMA and AMA for every simple machine, with sketches and real-world examples.",
         skills=["Mechanical advantage", "Statics", "Calculations", "Sketching", "Presentation"],
         cover="assets/img/simple-machines-presentation-02.jpg"),
    dict(slug="compound-machine-project", title="Compound Machine", course="POE",
         kicker="VEX · Pulleys · Levers · Wheel & axle",
         summary="Three machines working together, built only from VEX parts, to lift a 1 kg weight 6 inches with an IMA of about 5. The first design failed; the redesign made it work.",
         skills=["VEX robotics", "Compound machines", "Pulleys & levers", "Redesign", "Testing"],
         cover="assets/img/compound-machine-project-02.jpg"),
]


def blocks(items):
    out = []
    for it in items:
        if "h1" in it:
            continue
        if "img" in it:
            out.append({"t": "img", "src": it["img"]})
        elif "iframe" in it:
            src = it["iframe"]
            for k, deck in DECKS.items():
                if k in src:
                    out.append({"t": "deck", "slides": slides[deck], "src": src.split("/embed")[0]})
            for k, v in VIDEOS.items():
                if k in src:
                    out.append({"t": "video", "src": v})
        else:
            text = clean(next(iter(it.values())))
            if text == "Presentation:":
                continue  # label with no embed on the original page
            out.append({"t": "p", "text": text})
    return out


for p in PROJECTS:
    p["blocks"] = blocks(content[p["slug"]]["items"])
    p["counts"] = {
        "images": sum(b["t"] == "img" for b in p["blocks"]),
        "slides": sum(len(b["slides"]) for b in p["blocks"] if b["t"] == "deck"),
        "videos": sum(b["t"] == "video" for b in p["blocks"]),
    }

about = clean([it["p"] for it in content["about-me"]["items"] if "p" in it][0])
data = {"about": about, "photo": "assets/img/about-me-01.jpg", "projects": PROJECTS}

with open(os.path.join(ROOT, "data.js"), "w") as f:
    f.write("window.PORTFOLIO = " + json.dumps(data, indent=1) + ";\n")

total = {k: sum(p["counts"][k] for p in PROJECTS) for k in ("images", "slides", "videos")}
print("projects:", len(PROJECTS), "| totals:", total)
for p in PROJECTS:
    print(f"  {p['slug']}: {p['counts']}")
