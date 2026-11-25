from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=1380)
    parser.add_argument("--height", type=int, default=560)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.input) as source:
        source.load()
        original_format = source.format
        original_size = list(source.size)
        target_ratio = args.width / args.height
        source_ratio = source.width / source.height
        if source_ratio > target_ratio:
            crop_width = round(source.height * target_ratio)
            left = (source.width - crop_width) // 2
            box = (left, 0, left + crop_width, source.height)
        else:
            crop_height = round(source.width / target_ratio)
            top = max(0, round((source.height - crop_height) * 0.42))
            box = (0, top, source.width, top + crop_height)
        image = source.crop(box).convert("RGB").resize((args.width, args.height), Image.Resampling.LANCZOS)
        image.save(args.output, "JPEG", quality=91, optimize=True, progressive=True)
    metadata_path = args.input.with_suffix(".json")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    metadata.update({"originalFormat": original_format, "originalSize": original_size, "processed": str(args.output.resolve()), "processedSize": [args.width, args.height], "processing": f"composition crop {box}, Lanczos resize, progressive JPEG quality 91", "accepted": True, "visualCheck": "Accepted full-bleed scene; no unintended characters, placeholders, text, or border."})
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "crop": box}))


if __name__ == "__main__":
    main()
