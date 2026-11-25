import { _decorator, Color, Component, Graphics, Label, Node, Sprite, tween, Tween, UIOpacity, UITransform, Vec3 } from "cc";
import { GameState } from "./core/state";
import { TextureLibrary } from "./TextureLibrary";
import { C, makeLabel, makeNode, makeRect, makeSprite } from "./CocosUI";
const { ccclass } = _decorator;

@ccclass("CityController")
export class CityController extends Component {
  private state!: GameState;
  private textures!: TextureLibrary;
  private background?: Node;
  private artwork?: Node;
  private graphics?: Graphics;
  private rainGraphics?: Graphics;
  private cat?: Node;
  private glow?: Node;
  private rain: Array<{ x: number; y: number; speed: number; length: number }> = [];
  private currentDistrict = -1;
  private progress = -1;

  init(state: GameState, textures: TextureLibrary): void {
    this.state = state;
    this.textures = textures;
    this.node.setPosition(0, 390, 0);
    this.background = makeNode("City background", this.node, 0, 0, 690, 280);
    this.graphics = this.background.addComponent(Graphics);
    this.artwork = makeSprite(this.node, null, 0, 0, 690, 280, "City artwork");
    this.cat = makeSprite(this.node, null, 180, -100, 175, 200, "Resident");
    this.glow = makeSprite(this.node, textures.get("glow"), -80, 0, 360, 290, "Warm glow");
    this.glow.setSiblingIndex(1);
    const opacity = this.glow.addComponent(UIOpacity);
    opacity.opacity = 50;
    const rainNode = makeNode("Rain", this.node, 0, 0, 690, 280);
    this.rainGraphics = rainNode.addComponent(Graphics);
    for (let i = 0; i < 55; i++) this.rain.push({ x: Math.random() * 680 - 340, y: Math.random() * 280 - 140, speed: 150 + Math.random() * 180, length: 7 + Math.random() * 12 });
    this.state.on("restore", () => this.scheduleOnce(() => this.restoreAnimation(), 0.12));
    this.state.on("district", () => { this.currentDistrict = -1; this.refresh(); });
    this.state.on("deliver", () => this.happyCat());
    this.refresh();
    if (!state.profile.settings.reducedMotion) tween(this.cat).repeatForever(tween().to(1.35, { scale: new Vec3(1.018, 0.975, 1) }, { easing: "sineInOut" }).to(1.35, { scale: Vec3.ONE }, { easing: "sineInOut" })).start();
  }

  refresh(): void {
    const districtIndex = this.state.profile.currentDistrict;
    const progress = this.state.profile.districtProgress[districtIndex] ?? 0;
    if (districtIndex === this.currentDistrict && progress === this.progress) return;
    this.currentDistrict = districtIndex;
    this.progress = progress;
    const district = this.state.currentDistrict;
    const g = this.graphics!;
    g.clear();
    const top = new Color(district.palette[1]);
    const bottom = new Color(district.palette[0]);
    for (let i = 0; i < 14; i++) {
      const ratio = i / 13;
      g.fillColor = new Color(top.r + (bottom.r - top.r) * ratio, top.g + (bottom.g - top.g) * ratio, top.b + (bottom.b - top.b) * ratio, 255);
      g.rect(-345, 140 - (i + 1) * 20, 690, 21);
      g.fill();
    }
    g.fillColor = new Color(255, 235, 177, 150);
    g.circle(235, 80, 27);
    g.fill();
    g.fillColor = new Color(30, 43, 57, 180);
    for (let i = 0; i < 9; i++) {
      const width = 65 + (i % 3) * 20;
      const height = 55 + (i * 31 % 70);
      g.rect(-355 + i * 82, -140, width, height);
      g.fill();
      fillTriangle(g, -360 + i * 82, -140 + height, -320 + i * 82, -105 + height, -280 + i * 82, -140 + height);
      g.fill();
    }
    const houseX = -245, houseY = -95;
    g.fillColor = new Color(progress > 0 ? 190 : 65, progress > 0 ? 137 : 76, progress > 0 ? 98 : 88, 255);
    g.roundRect(houseX, houseY, 250, 135, 10);
    g.fill();
    g.fillColor = new Color(progress >= 6 ? 179 : 55, progress >= 6 ? 105 : 62, progress >= 6 ? 85 : 73, 255);
    fillTriangle(g, houseX - 15, houseY + 135, houseX + 125, houseY + 205, houseX + 265, houseY + 135);
    g.fill();
    if (progress === 0) {
      g.fillColor = new Color(125, 92, 62, 255);
      g.rect(houseX + 35, houseY, 180, 88);
      g.fill();
      g.strokeColor = new Color(173, 134, 87, 255);
      g.lineWidth = 4;
      g.rect(houseX + 35, houseY, 180, 88);
      g.stroke();
      g.fillColor = new Color(151, 114, 72, 255);
      fillTriangle(g, houseX + 35, houseY + 88, houseX + 125, houseY + 135, houseX + 215, houseY + 88);
      g.fill();
    } else {
      g.fillColor = new Color(progress >= 3 ? 255 : 35, progress >= 3 ? 216 : 51, progress >= 3 ? 135 : 65, 255);
      g.roundRect(houseX + 28, houseY + 55, 48, 48, 6);
      g.fill();
      g.fillColor = new Color(progress >= 4 ? 255 : 35, progress >= 4 ? 216 : 51, progress >= 4 ? 135 : 65, 255);
      g.roundRect(houseX + 174, houseY + 55, 48, 48, 6);
      g.fill();
      g.fillColor = new Color(progress >= 5 ? 232 : 44, progress >= 5 ? 164 : 51, progress >= 5 ? 103 : 59, 255);
      g.roundRect(houseX + 104, houseY, 48, 78, 12);
      g.fill();
      if (progress >= 7) {
        g.fillColor = new Color(112, 164, 119, 255);
        g.circle(houseX + 8, houseY + 15, 28); g.circle(houseX + 245, houseY + 12, 31);
        g.fill();
      }
    }
    g.fillColor = new Color(31, 57, 61, 255);
    g.rect(-345, -140, 690, 35);
    g.fill();
    const catFrame = this.textures.cat(district.resident);
    this.cat!.getComponent(Sprite)!.spriteFrame = catFrame;
    this.glow!.getComponent(UIOpacity)!.opacity = progress > 0 ? 105 : 12;
    const backgroundFrame = this.textures.get(`bg-${district.background}`);
    if (backgroundFrame) {
      this.artwork!.getComponent(Sprite)!.spriteFrame = backgroundFrame;
      g.clear();
    }
  }

  private restoreAnimation(): void {
    this.refresh();
    if (this.state.profile.settings.reducedMotion) {
      this.glow!.getComponent(UIOpacity)!.opacity = 105;
      return;
    }
    const glowOpacity = this.glow!.getComponent(UIOpacity)!;
    glowOpacity.opacity = 220;
    tween(glowOpacity).to(1.2, { opacity: 100 }, { easing: "sineOut" }).start();
    this.happyCat();
    for (let i = 0; i < 28; i++) {
      const spark = makeSprite(this.node, this.textures.get("spark"), -70 + Math.random() * 100 - 50, -20 + Math.random() * 50, 14, 14, "Restoration spark");
      const opacity = spark.addComponent(UIOpacity);
      tween(spark).to(0.7 + Math.random() * 0.5, { position: new Vec3(-250 + Math.random() * 400, -80 + Math.random() * 220, 0), scale: new Vec3(0.1, 0.1, 1) }, { easing: "quadOut" }).call(() => spark.destroy()).start();
      tween(opacity).delay(0.3).to(0.6, { opacity: 0 }).start();
    }
  }

  private happyCat(): void {
    if (!this.cat || this.state.profile.settings.reducedMotion) return;
    const baseY = -100;
    Tween.stopAllByTarget(this.cat);
    tween(this.cat).to(0.2, { position: new Vec3(180, baseY + 35, 0), angle: -5 }, { easing: "sineOut" }).to(0.22, { position: new Vec3(180, baseY, 0), angle: 5 }, { easing: "bounceOut" }).to(0.18, { angle: 0 }).repeatForever(tween().to(1.35, { scale: new Vec3(1.018, 0.975, 1) }).to(1.35, { scale: Vec3.ONE })).start();
    for (let i = 0; i < 5; i++) {
      const heart = makeSprite(this.node, this.textures.get("heart"), 150 + Math.random() * 70, 5, 30, 30, "Heart");
      const opacity = heart.addComponent(UIOpacity);
      tween(heart).to(1 + i * 0.09, { position: new Vec3(heart.position.x + Math.random() * 50 - 25, 90 + Math.random() * 35, 0), angle: Math.random() * 30 - 15 }).call(() => heart.destroy()).start();
      tween(opacity).delay(0.45).to(0.55, { opacity: 0 }).start();
    }
  }

  update(deltaTime: number): void {
    if (!this.rainGraphics) return;
    const g = this.rainGraphics;
    g.clear();
    if (this.state.profile.settings.reducedMotion) return;
    g.strokeColor = new Color(176, 214, 229, 65);
    g.lineWidth = 2;
    const dt = Math.min(deltaTime, 0.05);
    this.rain.forEach((drop) => {
      drop.y -= drop.speed * dt;
      drop.x -= drop.speed * dt * 0.15;
      if (drop.y < -145 || drop.x < -350) {
        drop.y = 150;
        drop.x = Math.random() * 700 - 340;
      }
      g.moveTo(drop.x, drop.y);
      g.lineTo(drop.x - drop.length * 0.15, drop.y - drop.length);
    });
    g.stroke();
  }
}

function fillTriangle(g: Graphics, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineTo(x3, y3);
  g.close();
  g.fill();
}
