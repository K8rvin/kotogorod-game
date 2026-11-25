from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from remove_background import cutout


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("prefix")
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--inset", type=int, default=0)
    parser.add_argument("--top-inset", type=int)
    parser.add_argument("--directory", default="items")
    parser.add_argument("--height", type=int)
    parser.add_argument("--names")
    args = parser.parse_args()
    output_height = args.height or args.size
    names = args.names.split(",") if args.names else []
    output_dir = Path("assets/resources/textures") / args.directory
    output_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(args.input) as source:
        source.load()
        original_format = source.format
        original_size = list(source.size)
        width, height = source.size
        cell_width, cell_height = width / args.columns, height / args.rows
        outputs = []
        for index in range(args.rows * args.columns):
            row, column = divmod(index, args.columns)
            inset = args.top_inset if row == 0 and args.top_inset is not None else args.inset
            box = (round(column * cell_width) + inset, round(row * cell_height) + inset, round((column + 1) * cell_width) - inset, round((row + 1) * cell_height) - inset)
            cell = source.crop(box)
            image, area = cutout(cell, keep_all=True)
            scale = min((args.size - 16) / image.width, (output_height - 16) / image.height, 2.0)
            resized_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
            resized = image.convert("RGBa").resize(resized_size, Image.Resampling.LANCZOS).convert("RGBA")
            canvas = Image.new("RGBA", (args.size, output_height), (0, 0, 0, 0))
            canvas.alpha_composite(resized, ((args.size - resized.width) // 2, (output_height - resized.height) // 2))
            output_name = names[index] if index < len(names) else f"{args.prefix}-{index + 1}"
            output = output_dir / f"{output_name}.png"
            canvas.save(output, "PNG", optimize=True)
            assert canvas.getchannel("A").getextrema()[0] == 0
            assert canvas.getchannel("A").getextrema()[1] > 0
            outputs.append({"output": str(output), "cell": box, "foregroundArea": area})
    metadata_path = args.input.with_suffix(".json")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    metadata.update({"originalFormat": original_format, "originalSize": original_size, "processing": "equal-cell crop, edge-connected background removal, components above 80 pixels retained, premultiplied-alpha resize", "outputs": outputs})
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    contact = Image.new("RGBA", (args.size * args.columns * 2, output_height * args.rows), (0, 0, 0, 255))
    for row in range(args.rows):
        for column in range(args.columns * 2):
            contact.paste((239, 230, 211, 255) if column < args.columns else (25, 36, 54, 255), (column * args.size, row * output_height, (column + 1) * args.size, (row + 1) * output_height))
    for index, entry in enumerate(outputs):
        row, column = divmod(index, args.columns)
        with Image.open(entry["output"]) as image:
            contact.alpha_composite(image, (column * args.size, row * output_height))
            contact.alpha_composite(image, ((column + args.columns) * args.size, row * output_height))
    check = Path(".cache/asset-tools") / f"{args.prefix}-sheet-check.png"
    check.parent.mkdir(parents=True, exist_ok=True)
    contact.convert("RGB").save(check, "PNG")
    print(json.dumps({"outputs": len(outputs), "check": str(check)}))


if __name__ == "__main__":
    main()
