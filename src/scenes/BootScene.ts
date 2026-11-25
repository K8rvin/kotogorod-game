import Phaser from "phaser";
import { cats, chains } from "../data";
import { catUri, itemUri } from "../art";
import type { ChainId } from "../core/state";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    const progress = document.getElementById("boot-progress");
    this.load.on("progress", (value: number) => {
      if (progress) progress.style.width = `${Math.max(5, value * 100)}%`;
    });
    (Object.keys(chains) as ChainId[]).forEach((chain) => {
      for (let tier = 1; tier <= 7; tier++) this.load.svg(`item-${chain}-${tier}`, itemUri(chain, tier), { width: 128, height: 128 });
    });
    cats.forEach((cat) => this.load.svg(`cat-${cat.id}`, catUri(cat.id), { width: 200, height: 230 }));
  }

  create(): void {
    const glow = this.textures.createCanvas("glow", 128, 128);
    if (glow) {
      const context = glow.getContext();
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,237,174,0.9)");
      gradient.addColorStop(0.25, "rgba(255,199,104,0.45)");
      gradient.addColorStop(1, "rgba(255,176,75,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      glow.refresh();
    }
    const dot = this.add.graphics();
    dot.fillStyle(0xffe4a0, 1).fillCircle(6, 6, 6);
    dot.generateTexture("particle", 12, 12);
    dot.clear();
    dot.fillStyle(0xffa6af, 1);
    dot.fillCircle(8, 10, 7).fillCircle(18, 10, 7);
    dot.fillTriangle(1, 13, 25, 13, 13, 29);
    dot.generateTexture("heart", 26, 30);
    dot.destroy();
    this.scene.start("game");
  }
}
