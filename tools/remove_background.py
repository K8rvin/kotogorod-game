from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def connected_background(candidate: np.ndarray) -> np.ndarray:
    height, width = candidate.shape
    background = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        for y in (0, height - 1):
            if candidate[y, x] and not background[y, x]:
                background[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if candidate[y, x] and not background[y, x]:
                background[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and candidate[ny, nx] and not background[ny, nx]:
                background[ny, nx] = True
                queue.append((ny, nx))
    return background


def largest_component(mask: np.ndarray, keep_all: bool = False, min_area: int = 80) -> np.ndarray:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    result = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []
    for start_y, start_x in zip(*np.where(mask)):
        if visited[start_y, start_x]:
            continue
        component: list[tuple[int, int]] = []
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
        if keep_all and len(component) >= min_area:
            ys, xs = zip(*component)
            result[np.array(ys), np.array(xs)] = True
        if len(component) > len(best):
            best = component
    if not keep_all and best:
        ys, xs = zip(*best)
        result[np.array(ys), np.array(xs)] = True
    return result


def cutout(source: Image.Image, keep_all: bool = False) -> tuple[Image.Image, int]:
    rgba = source.convert("RGBA")
    pixels = np.asarray(rgba).copy()
    rgb = pixels[:, :, :3].astype(np.int16)
    near_white = (rgb.min(axis=2) >= 232) & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 28)
    background = connected_background(near_white)
    foreground = largest_component(~background, keep_all=keep_all)
    mask = Image.fromarray(foreground.astype(np.uint8) * 255, "L").filter(ImageFilter.GaussianBlur(0.75))
    alpha = np.asarray(mask).astype(np.float32) / 255.0
    alpha[alpha < 0.025] = 0
    alpha[alpha > 0.985] = 1
    edge = (alpha > 0.03) & (alpha < 0.99)
    if np.any(edge):
        a = alpha[edge, None]
        original = rgb[edge].astype(np.float32)
        recovered = np.clip((original - 255.0 * (1.0 - a)) / np.maximum(a, 0.08), 0, 255)
        pixels[:, :, :3][edge] = recovered.astype(np.uint8)
    pixels[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
    result = Image.fromarray(pixels, "RGBA")
    bbox = result.getchannel("A").getbbox()
    if bbox:
        margin = 14
        bbox = (max(0, bbox[0] - margin), max(0, bbox[1] - margin), min(result.width, bbox[2] + margin), min(result.height, bbox[3] + margin))
        result = result.crop(bbox)
    return result, int(foreground.sum())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=400)
    parser.add_argument("--height", type=int, default=460)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.input) as source:
        source.load()
        original_format = source.format
        original_size = list(source.size)
        image, area = cutout(source)
    image.thumbnail((args.width, args.height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((args.width - image.width) // 2, args.height - image.height))
    premultiplied = canvas.convert("RGBa")
    canvas = premultiplied.convert("RGBA")
    canvas.save(args.output, "PNG", optimize=True)
    assert canvas.getchannel("A").getextrema()[0] == 0
    assert canvas.getchannel("A").getextrema()[1] > 0
    metadata_path = args.input.with_suffix(".json")
    metadata = {}
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata.update({
        "originalFormat": original_format,
        "originalSize": original_size,
        "processed": str(args.output.resolve()),
        "processedSize": list(canvas.size),
        "processing": "edge-connected near-white background removal, largest foreground component, edge color decontamination, premultiplied-alpha export",
        "foregroundComponentArea": area,
    })
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    check = Image.new("RGBA", (args.width * 2, args.height), (0, 0, 0, 255))
    check.paste((239, 230, 211, 255), (0, 0, args.width, args.height))
    check.paste((25, 36, 54, 255), (args.width, 0, args.width * 2, args.height))
    check.alpha_composite(canvas, (0, 0))
    check.alpha_composite(canvas, (args.width, 0))
    check_path = args.output.parent / f"{args.output.stem}-check.png"
    check.convert("RGB").save(check_path, "PNG")
    print(json.dumps({"output": str(args.output), "check": str(check_path), "foregroundArea": area}))


if __name__ == "__main__":
    main()
