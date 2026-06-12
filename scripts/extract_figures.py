#!/usr/bin/env python3
"""Extract figure images from a PDF by cropping the rendered page.

Study Mate uses this to embed REAL book figures (large/real networks, charts,
photos — things we can't faithfully recreate as a <GraphFigure>) inline in a
lesson, instead of a "open the source at page N" pointer.

Input (argv): <pdf_path> <out_dir> <figures_json>
  figures_json: a JSON file holding [{"label","page","caption"}], where `page`
  is the 1-based physical PDF page (as produced by `study-mate figures`).

Output: writes one PNG per figure into out_dir and prints a JSON manifest
  [{"label","page","image","bbox","ok"} | {"label","ok":false,"reason"}] to stdout.

Approach: a book figure is a band of vector drawings / raster images sitting
ABOVE its caption. We locate the caption text, union the graphic rects above it
(bounded so we don't swallow the previous figure or body text), and rasterise
just that clip at high DPI. Vector-aware, so it works for line-drawn graphs
(the karate club) as well as embedded photos.
"""
import json
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    print(json.dumps({"error": "pymupdf-not-installed"}))
    sys.exit(3)

RENDER_SCALE = 3.0          # ~216 DPI — crisp on retina
MAX_FIG_HEIGHT = 580.0      # pt; figures taller than this are rare — guards the top
PAD = 7.0                   # pt of breathing room around the union box


def slug(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def find_caption_rect(page, label, caption):
    """Return the Rect of the figure's caption line, or None."""
    cap = re.sub(r"\s+", " ", caption or "").strip()
    candidates = []
    if cap:
        candidates.append(f"{label}: {cap[:24]}".strip())
    candidates.append(f"{label}:")
    candidates.append(label)
    for needle in candidates:
        hits = page.search_for(needle)
        if hits:
            # Captions sit below the figure; if several match (rare), take the lowest.
            return max(hits, key=lambda r: r.y0)
    return None


def figure_bbox(page, caption_rect):
    """Union the graphic rects that lie above the caption into a figure box."""
    pr = page.rect
    header = pr.height * 0.06
    footer = pr.height * 0.95
    top_floor = max(header, caption_rect.y0 - MAX_FIG_HEIGHT)
    cap_top = caption_rect.y0

    rects = []

    def consider(r):
        r = fitz.Rect(r)
        if r.is_empty or r.is_infinite:
            return
        # Above the caption, inside the printable band.
        if r.y1 > cap_top + 2 or r.y0 < top_floor or r.y1 > footer:
            return
        # Skip a full-page border box.
        if r.width > pr.width * 0.92 and r.height > pr.height * 0.92:
            return
        # Skip full-width hairline rules.
        if r.width > pr.width * 0.85 and r.height < 3:
            return
        rects.append(r)

    for d in page.get_drawings():
        consider(d["rect"])
    try:
        for im in page.get_image_info():
            consider(im["bbox"])
    except Exception:
        pass

    if not rects:
        return None
    box = rects[0]
    for r in rects[1:]:
        box |= r  # union
    box = box + (-PAD, -PAD, PAD, PAD)
    box &= pr  # clip to page
    return refine_box(page, box, cap_top)


def refine_box(page, box, cap_top):
    """Trim slivers that bleed into the crop: the caption below, and a body-text
    line immediately above the figure (graphics-union can reach a hair too high)."""
    box = fitz.Rect(box)
    box.y1 = min(box.y1, cap_top - 3)  # never include the caption
    top_zone = box.y0 + 42
    new_top = box.y0
    for b in page.get_text("blocks"):
        if len(b) < 7 or b[6] != 0:  # text blocks only
            continue
        x0, y0, x1, y1, txt = b[0], b[1], b[2], b[3], b[4]
        # A wide multi-word line near the top edge is prose, not node labels.
        wide = (x1 - x0) > box.width * 0.5
        prose = " " in txt.strip()
        if wide and prose and (y1 - y0) < 40 and y0 < top_zone and y1 < box.y0 + 60:
            new_top = max(new_top, y1 + 3)
    box.y0 = new_top
    return box


def extract(pdf_path, out_dir, figures):
    doc = fitz.open(pdf_path)
    out = []
    for fig in figures:
        label, page_no, caption = fig["label"], int(fig["page"]), fig.get("caption", "")
        try:
            page = doc[page_no - 1]  # JSON page is 1-based physical
            cap = find_caption_rect(page, label, caption)
            if cap is None:
                out.append({"label": label, "ok": False, "reason": "caption-not-found"})
                continue
            box = figure_bbox(page, cap)
            if box is None or box.height < 18 or box.width < 18:
                out.append({"label": label, "ok": False, "reason": "no-graphics-above-caption"})
                continue
            pix = page.get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE), clip=box)
            fname = f"{slug(label)}.png"
            pix.save(f"{out_dir}/{fname}")
            out.append({
                "label": label,
                "page": page_no,
                "image": fname,
                "bbox": [round(box.x0, 1), round(box.y0, 1), round(box.x1, 1), round(box.y1, 1)],
                "w": pix.width,
                "h": pix.height,
                "ok": True,
            })
        except Exception as e:  # noqa: BLE001 — report, don't crash the batch
            out.append({"label": label, "ok": False, "reason": str(e)})
    return out


def main():
    if len(sys.argv) != 4:
        print(json.dumps({"error": "usage: extract_figures.py <pdf> <out_dir> <figures_json>"}))
        sys.exit(2)
    pdf_path, out_dir, figures_json = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(figures_json) as f:
        figures = json.load(f)
    manifest = extract(pdf_path, out_dir, figures)
    print(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main()
