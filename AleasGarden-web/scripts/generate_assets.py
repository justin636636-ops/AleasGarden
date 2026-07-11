from pathlib import Path
import json

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
PDF = PROJECT / "Rules" / "AleasGarden_1cardLayout_v1-3.pdf"
OUT = ROOT / "assets" / "cards"
CROP_BOX = (52, 52, 481, 654)


def page_kind(page_number: int) -> str:
    if 1 <= page_number <= 52:
        return "garden"
    if 53 <= page_number <= 84:
        return "action"
    return "reference"


def generate_track_board() -> None:
    left = Image.open(OUT / "card-87.jpg").convert("RGB").rotate(-90, expand=True)
    right = Image.open(OUT / "card-89.jpg").convert("RGB").rotate(90, expand=True)
    board = Image.new("RGB", (left.width + right.width, max(left.height, right.height)), (248, 243, 223))
    board.paste(left, (0, 0))
    board.paste(right, (left.width, 0))
    board.save(OUT / "track-board.jpg", quality=92)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    cards = []
    matrix = fitz.Matrix(2.4, 2.4)
    for index, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        filename = f"card-{index:02d}.jpg"
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        image = image.crop(CROP_BOX)
        image.save(OUT / filename, quality=90)
        cards.append(
            {
                "page": index,
                "kind": page_kind(index),
                "src": f"assets/cards/{filename}",
                "width": image.width,
                "height": image.height,
            }
        )
    generate_track_board()
    (OUT / "manifest.json").write_text(json.dumps(cards, indent=2), encoding="utf-8")
    print(f"Generated {len(cards)} card images and track-board.jpg in {OUT}")


if __name__ == "__main__":
    main()
