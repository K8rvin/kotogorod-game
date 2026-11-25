import Phaser from "phaser";
import { DATA } from "../data";
import type { BoardItem, ChainId, GameProfile } from "../core/state";
import { GameState } from "../core/state";

interface ItemView extends Phaser.GameObjects.Container {
  itemId?: number;
  cellIndex?: number;
}

interface Layout {
  mainWidth: number;
  city: { x: number; y: number; w: number; h: number };
  board: { x: number; y: number; cell: number; gap: number; w: number; h: number };
}

interface DragState {
  view: ItemView;
  from: number;
  startX: number;
  startY: number;
  moved: boolean;
  hover: number;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private layoutInfo!: Layout;
  private cellGraphics: Phaser.GameObjects.Graphics[] = [];
  private itemViews = new Map<number, ItemView>();
  private boardFrame?: Phaser.GameObjects.Graphics;
  private cityGraphics?: Phaser.GameObjects.Graphics;
  private rainGraphics?: Phaser.GameObjects.Graphics;
  private cityGlow?: Phaser.GameObjects.Image;
  private resident?: Phaser.GameObjects.Image;
  private rain: Array<{ x: number; y: number; speed: number; length: number }> = [];
  private drag: DragState | null = null;
  private selected = -1;
  private visualAction: Record<string, unknown> | null = null;
  private interactionsEnabled = true;
  private lastWidth = 0;
  private lastHeight = 0;
  private lastDistrict = -1;
  private lastProgress = -1;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    super("game");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
    this.boardFrame = this.add.graphics().setDepth(8);
    this.cityGraphics = this.add.graphics().setDepth(1);
    this.rainGraphics = this.add.graphics().setDepth(3);
    this.createResident();
    this.createCells();
    this.state.on("change", () => this.syncBoard());
    this.state.on("spawn", (detail) => { this.visualAction = { type: "spawn", ...detail }; });
    this.state.on("merge", (detail) => { this.visualAction = { type: "merge", ...detail }; });
    this.state.on("deliver", (detail) => { this.visualAction = { type: "deliver", ...detail }; });
    this.state.on("chest", (detail) => { this.visualAction = { type: "chest", ...detail }; });
    this.state.on("restore", (detail) => this.animateRestore(Number(detail.progress), Boolean(detail.completed)));
    this.state.on("district", () => {
      this.lastDistrict = -1;
      this.selected = -1;
      this.time.delayedCall(50, () => this.layout(true));
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));
    this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));
    this.scale.on("resize", () => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.layout(true), 80);
    });
    this.layout(true);
    this.syncBoard();
    this.tweens.add({ targets: this.resident, scaleY: "-=0.025", scaleX: "+=0.015", duration: 1450, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.game.events.emit("scene:ready");
  }

  private createCells(): void {
    this.cellGraphics.forEach((graphic) => graphic.destroy());
    this.cellGraphics = [];
    for (let i = 0; i < DATA.boardSize; i++) {
      const graphic = this.add.graphics().setDepth(9);
      this.cellGraphics.push(graphic);
    }
  }

  private createResident(): void {
    this.resident?.destroy();
    const id = this.state?.currentDistrict.resident ?? "motya";
    this.resident = this.add.image(0, 0, `cat-${id}`).setDepth(5).setOrigin(0.5, 1);
  }

  private computeLayout(): Layout {
    const width = this.scale.width;
    const height = this.scale.height;
    const mobile = width <= 760;
    const mainWidth = mobile ? width : width - (width <= 1100 ? 340 : 390);
    let city: Layout["city"];
    let boardTop: number;
    let boardBottom: number;
    if (mobile) {
      const compact = height < 720;
      city = { x: 10, y: compact ? 145 : 158, w: width - 20, h: compact ? 82 : 112 };
      boardTop = city.y + city.h + 12;
      boardBottom = height - 151;
    } else {
      const compact = height < 760;
      const cityX = Math.min(380, mainWidth * 0.48);
      city = { x: cityX, y: compact ? 76 : 91, w: Math.max(250, mainWidth - cityX - 18), h: compact ? 170 : 224 };
      boardTop = city.y + city.h + 16;
      boardBottom = height - 107;
    }
    const cell = Math.max(28, Math.min((mainWidth - 38) / DATA.columns, (boardBottom - boardTop - 16) / DATA.rows, mobile ? 64 : 83));
    const gap = Math.max(3, cell * 0.075);
    const boardWidth = cell * DATA.columns;
    const boardHeight = cell * DATA.rows;
    return {
      mainWidth,
      city,
      board: { x: (mainWidth - boardWidth) / 2, y: boardTop + Math.max(0, (boardBottom - boardTop - boardHeight) / 2), cell: cell - gap, gap, w: boardWidth, h: boardHeight }
    };
  }

  private layout(force = false): void {
    const width = this.scale.width, height = this.scale.height;
    if (!force && width === this.lastWidth && height === this.lastHeight) return;
    this.lastWidth = width;
    this.lastHeight = height;
    this.layoutInfo = this.computeLayout();
    const { board } = this.layoutInfo;
    this.boardFrame?.clear();
    this.boardFrame?.fillStyle(0x111b2c, 0.88);
    this.boardFrame?.fillRoundedRect(board.x - 12, board.y - 12, board.w + 24, board.h + 24, 23);
    this.boardFrame?.lineStyle(1.5, 0xffe0b0, 0.13);
    this.boardFrame?.strokeRoundedRect(board.x - 12, board.y - 12, board.w + 24, board.h + 24, 23);
    this.cellGraphics.forEach((_, index) => this.drawCell(index));
    this.itemViews.forEach((view, id) => {
      const item = this.state.profile.board.find((entry) => entry?.id === id);
      if (item) {
        const index = this.state.profile.board.indexOf(item);
        const center = this.cellCenter(index);
        view.setPosition(center.x, center.y);
        view.setSize(board.cell, board.cell);
        const sprite = view.first as Phaser.GameObjects.Image;
        sprite?.setDisplaySize(board.cell * 0.92, board.cell * 0.92);
      }
    });
    this.drawCity();
    this.makeRain();
    this.syncBoard(false);
  }

  private cellCenter(index: number): { x: number; y: number } {
    const { board } = this.layoutInfo;
    const step = board.cell + board.gap;
    return { x: board.x + (index % DATA.columns) * step + board.cell / 2, y: board.y + Math.floor(index / DATA.columns) * step + board.cell / 2 };
  }

  private cellAt(x: number, y: number): number {
    const { board } = this.layoutInfo;
    const step = board.cell + board.gap;
    const column = Math.floor((x - board.x) / step);
    const row = Math.floor((y - board.y) / step);
    if (column < 0 || column >= DATA.columns || row < 0 || row >= DATA.rows) return -1;
    const index = row * DATA.columns + column;
    const center = this.cellCenter(index);
    return Math.abs(x - center.x) <= board.cell / 2 + 2 && Math.abs(y - center.y) <= board.cell / 2 + 2 ? index : -1;
  }

  private drawCell(index: number, highlight: "none" | "match" | "hover" | "selected" = "none"): void {
    const graphic = this.cellGraphics[index];
    if (!graphic || !this.layoutInfo) return;
    const { board } = this.layoutInfo;
    const center = this.cellCenter(index);
    const row = Math.floor(index / DATA.columns), col = index % DATA.columns;
    let fill = (row + col) % 2 ? 0x29374a : 0x2c3b4f;
    let alpha = 0.92;
    let line = 0x718198;
    let lineAlpha = 0.12;
    let lineWidth = 1;
    if (highlight === "match") { fill = 0x426554; line = 0xa0e5b8; lineAlpha = 0.65; }
    if (highlight === "hover") { fill = 0x6a5a43; line = 0xffd58b; lineAlpha = 0.9; lineWidth = 2; }
    if (highlight === "selected") { fill = 0x4b5262; line = 0xffd58b; lineAlpha = 0.85; lineWidth = 2; }
    graphic.clear();
    graphic.fillStyle(fill, alpha);
    graphic.fillRoundedRect(center.x - board.cell / 2, center.y - board.cell / 2, board.cell, board.cell, Math.max(7, board.cell * 0.17));
    graphic.lineStyle(lineWidth, line, lineAlpha);
    graphic.strokeRoundedRect(center.x - board.cell / 2, center.y - board.cell / 2, board.cell, board.cell, Math.max(7, board.cell * 0.17));
  }

  private syncBoard(animate = true): void {
    if (!this.layoutInfo) return;
    const profile = this.state.profile;
    if (this.lastDistrict !== profile.currentDistrict) {
      this.lastDistrict = profile.currentDistrict;
      this.lastProgress = -1;
      this.createResident();
      this.drawCity();
      this.tweens.add({ targets: this.resident, scaleY: "-=0.025", scaleX: "+=0.015", duration: 1450, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
    const action = this.visualAction;
    this.visualAction = null;
    const alive = new Set<number>();
    const nextPositions = new Map<number, number>();
    profile.board.forEach((item, index) => {
      if (!item) return;
      alive.add(item.id);
      nextPositions.set(item.id, index);
      let view = this.itemViews.get(item.id);
      if (!view) {
        view = this.createItemView(item, index);
        if (animate && action?.type === "merge" && Array.isArray(action.outputs) && action.outputs.includes(index)) {
          view.setScale(0.1);
          view.setAlpha(0);
          this.tweens.add({ targets: view, scale: 1, alpha: 1, duration: 420, delay: 180, ease: "Back.Out", easeParams: [2.4] });
        } else if (animate && (action?.type === "spawn" || action?.type === "chest")) {
          const targetY = view.y;
          view.y = this.scale.height - 70;
          view.setScale(0.4);
          this.tweens.add({ targets: view, y: targetY, scale: 1, duration: 480, ease: "Back.Out", easeParams: [1.7] });
        } else if (animate) {
          view.setScale(0.4);
          this.tweens.add({ targets: view, scale: 1, duration: 250, ease: "Back.Out" });
        }
      } else {
        const center = this.cellCenter(index);
        if (Math.abs(view.x - center.x) > 1 || Math.abs(view.y - center.y) > 1) {
          this.tweens.add({ targets: view, x: center.x, y: center.y, duration: animate ? 230 : 0, ease: "Sine.Out" });
        }
        view.cellIndex = index;
      }
    });

    this.itemViews.forEach((view, id) => {
      if (alive.has(id)) return;
      this.itemViews.delete(id);
      if (this.drag?.view === view) this.drag = null;
      const fromIndex = view.cellIndex ?? 0;
      const from = { x: view.x, y: view.y };
      this.tweens.killTweensOf(view);
      if (animate && action?.type === "merge" && Array.isArray(action.sources) && action.sources.includes(fromIndex)) {
        const target = this.cellCenter(Number(action.to));
        view.setDepth(70);
        this.tweens.add({ targets: view, x: target.x, y: target.y, scale: 0.25, alpha: 0, angle: Phaser.Math.Between(-35, 35), duration: 260, ease: "Cubic.In", onComplete: () => view.destroy() });
      } else if (animate && action?.type === "deliver" && action.itemIndex === fromIndex) {
        const target = this.resident ? { x: this.resident.x, y: this.resident.y - 65 } : this.layoutInfo.city;
        this.tweens.add({ targets: view, x: target.x, y: target.y, scale: 0.25, alpha: 0, duration: 520, ease: "Cubic.In", onComplete: () => view.destroy() });
        this.happyCat();
      } else {
        this.tweens.add({ targets: view, scale: 0.2, alpha: 0, duration: 170, onComplete: () => view.destroy() });
      }
    });

    if (animate && action?.type === "merge") {
      const center = this.cellCenter(Number(action.to));
      this.time.delayedCall(170, () => {
        this.burst(center.x, center.y, Boolean(action.bonus) ? 28 : 18);
        this.floatText(center.x, center.y - 15, action.recycled ? `+${action.stars} ★  +${action.coins} монет` : Boolean(action.bonus) ? "СЛИЯНИЕ ПЯТИ! ×2" : `Новый предмет · уровень ${(action.item as BoardItem)?.tier ?? ""}`, action.bonus ? "#ffb7cb" : "#ffe1a0");
        this.cameras.main.shake(110, action.bonus ? 0.004 : 0.0016);
      });
    }
    if (action?.type === "chest") {
      const center = this.cellCenter(Number((action.drops as Array<{ index: number }>)?.[0]?.index ?? 0));
      this.burst(center.x, center.y, 35);
    }
    this.updateRestoreVisual();
  }

  private createItemView(item: BoardItem, index: number): ItemView {
    const center = this.cellCenter(index);
    const size = this.layoutInfo.board.cell;
    const view = this.add.container(center.x, center.y) as ItemView;
    const sprite = this.add.image(0, -size * 0.02, `item-${item.chain}-${item.tier}`).setDisplaySize(size * 0.92, size * 0.92);
    view.add(sprite);
    if (item.tier > 1) {
      const badge = this.add.graphics();
      badge.fillStyle(0x152237, 0.85).fillRoundedRect(size * 0.13, size * 0.23, size * 0.26, size * 0.19, 6);
      const text = this.add.text(size * 0.26, size * 0.325, `${item.tier}`, { fontFamily: "Segoe UI, sans-serif", fontSize: `${Math.max(9, size * 0.16)}px`, color: "#ffe2a0", fontStyle: "bold" }).setOrigin(0.5);
      view.add([badge, text]);
    }
    view.itemId = item.id;
    view.cellIndex = index;
    view.setSize(size, size);
    view.setDepth(20 + index);
    view.setInteractive({ useHandCursor: true });
    view.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.interactionsEnabled || this.drag) return;
      this.drag = { view, from: index, startX: pointer.worldX, startY: pointer.worldY, moved: false, hover: -1 };
    });
    view.on("pointerover", () => {
      if (!this.drag && this.interactionsEnabled) this.tweens.add({ targets: view, scale: 1.06, duration: 130 });
      this.game.events.emit("ui:itemhint", { item, index, visible: true });
    });
    view.on("pointerout", () => {
      if (!this.drag?.moved) this.tweens.add({ targets: view, scale: 1, duration: 130 });
      this.game.events.emit("ui:itemhint", { visible: false });
    });
    this.itemViews.set(item.id, view);
    return view;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const drag = this.drag;
    if (!drag || !this.interactionsEnabled) return;
    const distance = Phaser.Math.Distance.Between(drag.startX, drag.startY, pointer.worldX, pointer.worldY);
    if (!drag.moved && distance > 7) {
      drag.moved = true;
      drag.view.setDepth(100);
      this.tweens.add({ targets: drag.view, scale: 1.14, duration: 100 });
      this.selected = -1;
      this.game.events.emit("ui:select", { index: -1 });
    }
    if (!drag.moved) return;
    drag.view.setPosition(pointer.worldX, pointer.worldY);
    const hover = this.cellAt(pointer.worldX, pointer.worldY);
    if (hover !== drag.hover) {
      drag.hover = hover;
      this.cellGraphics.forEach((_, index) => this.drawCell(index));
      const source = this.state.profile.board[drag.from];
      if (source) {
        this.state.profile.board.forEach((item, index) => {
          if (index !== drag.from && item?.chain === source.chain && item.tier === source.tier) this.drawCell(index, "match");
        });
      }
      if (hover >= 0 && hover !== drag.from) this.drawCell(hover, "hover");
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    this.cellGraphics.forEach((_, index) => this.drawCell(index));
    if (!this.interactionsEnabled) {
      this.syncBoard(false);
      return;
    }
    if (drag.moved) {
      const to = this.cellAt(pointer.worldX, pointer.worldY);
      if (to < 0 || to === drag.from) {
        const center = this.cellCenter(drag.from);
        this.tweens.add({ targets: drag.view, x: center.x, y: center.y, scale: 1, duration: 210, ease: "Back.Out" });
      } else {
        this.state.moveItem(drag.from, to);
      }
      drag.view.setScale(1);
      return;
    }
    if (this.selected >= 0 && this.selected !== drag.from) {
      const from = this.selected;
      this.selected = -1;
      this.game.events.emit("ui:select", { index: -1 });
      this.state.moveItem(from, drag.from);
      return;
    }
    this.selected = this.selected === drag.from ? -1 : drag.from;
    if (this.selected >= 0) this.drawCell(this.selected, "selected");
    this.game.events.emit("ui:select", { index: this.selected, item: this.state.profile.board[drag.from] });
  }

  selectCell(index: number): void {
    if (index < 0) return;
    this.selected = index;
    this.cellGraphics.forEach((_, i) => this.drawCell(i, i === index ? "selected" : "none"));
    this.game.events.emit("ui:select", { index, item: this.state.profile.board[index] });
  }

  clearSelection(): void {
    this.selected = -1;
    this.cellGraphics.forEach((_, i) => this.drawCell(i));
  }

  setInteractionsEnabled(enabled: boolean): void {
    this.interactionsEnabled = enabled;
    if (!enabled && this.drag) {
      this.drag = null;
      this.syncBoard(false);
    }
  }

  spawn(chain: ChainId): void {
    if (this.interactionsEnabled) this.state.spawn(chain);
  }

  private drawCity(): void {
    if (!this.layoutInfo || !this.cityGraphics) return;
    const { city } = this.layoutInfo;
    const district = this.state.currentDistrict;
    const progress = this.state.profile.districtProgress[this.state.profile.currentDistrict] ?? 0;
    const g = this.cityGraphics;
    g.clear();
    g.fillStyle(0x182a3d, 1).fillRoundedRect(city.x, city.y, city.w, city.h, 25);
    g.fillGradientStyle(0x354e61, 0x354e61, 0x17283a, 0x17283a, 1);
    g.fillRoundedRect(city.x + 2, city.y + 2, city.w - 4, city.h - 4, 23);
    g.fillStyle(0xffe6ad, 0.65).fillCircle(city.x + city.w * 0.82, city.y + city.h * 0.23, Math.max(10, city.h * 0.09));
    g.fillStyle(0x354e61, 0.75).fillCircle(city.x + city.w * 0.85, city.y + city.h * 0.19, Math.max(10, city.h * 0.09));
    const skylineY = city.y + city.h * 0.7;
    g.fillStyle(0x1b2b3c, 0.85);
    for (let i = 0; i < 9; i++) {
      const w = city.w / 8;
      const h = city.h * (0.2 + ((i * 37) % 30) / 100);
      g.fillRect(city.x + i * w - 5, skylineY - h, w + 3, h + city.h * 0.3);
      g.fillTriangle(city.x + i * w - 8, skylineY - h, city.x + i * w + w / 2, skylineY - h - city.h * 0.12, city.x + i * w + w + 8, skylineY - h);
    }
    const hx = city.x + city.w * 0.2, hy = city.y + city.h * 0.38;
    const hw = Math.min(city.w * 0.35, city.h * 1.02), hh = city.h * 0.5;
    const lit = progress > 0;
    g.fillStyle(lit ? 0xc58c66 : 0x46505b, 1).fillRoundedRect(hx, hy, hw, hh, 7);
    g.fillStyle(progress >= 6 ? 0xb96f5b : 0x3b424e, 1).fillTriangle(hx - 12, hy + 4, hx + hw * 0.5, hy - hh * 0.48, hx + hw + 12, hy + 4);
    if (progress === 0) {
      g.fillStyle(0x806247, 1).fillRect(hx + hw * 0.1, hy + hh * 0.25, hw * 0.8, hh * 0.7);
      g.lineStyle(3, 0xb18c63, 1).strokeRect(hx + hw * 0.1, hy + hh * 0.25, hw * 0.8, hh * 0.7);
      g.fillStyle(0x9c7957, 1).fillTriangle(hx + hw * 0.1, hy + hh * 0.25, hx + hw * 0.5, hy - 2, hx + hw * 0.9, hy + hh * 0.25);
    } else {
      const windowColor = progress >= 3 ? 0xffd987 : 0x263849;
      g.fillStyle(windowColor, 1).fillRoundedRect(hx + hw * 0.13, hy + hh * 0.22, hw * 0.22, hh * 0.3, 4);
      g.fillStyle(progress >= 4 ? 0xffd987 : 0x263849, 1).fillRoundedRect(hx + hw * 0.65, hy + hh * 0.22, hw * 0.22, hh * 0.3, 4);
      g.fillStyle(progress >= 5 ? 0xe7aa6e : 0x303945, 1).fillRoundedRect(hx + hw * 0.4, hy + hh * 0.48, hw * 0.22, hh * 0.52, 8);
      if (progress >= 6) {
        g.lineStyle(3, 0xe8b86f, 1);
        g.beginPath(); g.moveTo(hx - 5, hy - 4); g.lineTo(hx + hw * 0.5, hy - hh * 0.43); g.lineTo(hx + hw + 5, hy - 4); g.strokePath();
        for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? 0xf2a6a4 : 0xffd68a, 1).fillCircle(hx + hw * (0.05 + i * 0.18), hy - hh * (0.05 + Math.sin(i * 0.65) * 0.27), 3);
      }
      if (progress >= 7) {
        g.fillStyle(0x78a885, 1).fillCircle(hx + hw * 0.05, hy + hh * 0.8, 13).fillCircle(hx + hw * 0.96, hy + hh * 0.82, 15);
      }
    }
    g.fillStyle(0x233c43, 1).fillRect(city.x + 2, city.y + city.h * 0.9, city.w - 4, city.h * 0.1 - 2);
    g.fillStyle(0x91bdd0, 0.15);
    for (let i = 0; i < 6; i++) g.fillEllipse(city.x + city.w * (0.1 + i * 0.16), city.y + city.h * 0.95, city.w * 0.11, 5);
    if (this.resident) {
      const catHeight = Math.min(city.h * 0.65, 145);
      this.resident.setTexture(`cat-${district.resident}`);
      this.resident.setPosition(city.x + city.w * 0.72, city.y + city.h * 0.94);
      this.resident.setDisplaySize(catHeight * 0.83, catHeight);
      this.resident.setAlpha(progress === 0 ? 0.85 : 1);
    }
    this.cityGlow?.destroy();
    this.cityGlow = this.add.image(hx + hw * 0.5, hy + hh * 0.45, "glow").setDepth(2).setDisplaySize(hw * 2.3, hh * 2.7).setAlpha(progress > 0 ? 0.4 : 0.04);
    this.lastProgress = progress;
    const palette = district.palette;
    this.cameras.main.setBackgroundColor(palette[0]);
  }

  private makeRain(): void {
    const { city } = this.layoutInfo;
    this.rain = [];
    const count = this.state.profile.settings.reducedMotion ? 16 : Math.min(90, Math.floor(city.w * city.h / 1600));
    for (let i = 0; i < count; i++) this.rain.push({ x: Phaser.Math.FloatBetween(city.x, city.x + city.w), y: Phaser.Math.FloatBetween(city.y, city.y + city.h), speed: Phaser.Math.FloatBetween(90, 180), length: Phaser.Math.FloatBetween(5, 12) });
  }

  private updateRestoreVisual(): void {
    const progress = this.state.profile.districtProgress[this.state.profile.currentDistrict] ?? 0;
    if (progress !== this.lastProgress) this.drawCity();
  }

  private animateRestore(progress: number, completed: boolean): void {
    this.time.delayedCall(160, () => {
      this.drawCity();
      const { city } = this.layoutInfo;
      this.cityGlow?.setAlpha(0.85);
      this.tweens.add({ targets: this.cityGlow, alpha: 0.42, duration: 1400, ease: "Sine.Out" });
      this.burst(city.x + city.w * 0.4, city.y + city.h * 0.5, completed ? 65 : 35);
      this.happyCat();
      this.cameras.main.flash(180, 255, 221, 154, false);
      const fade = document.getElementById("fade-layer");
      fade?.classList.remove("flash");
      void fade?.offsetWidth;
      fade?.classList.add("flash");
      if (completed) this.cameras.main.shake(350, 0.004);
      this.game.events.emit("ui:restored", { progress, completed });
    });
  }

  private happyCat(): void {
    if (!this.resident) return;
    this.tweens.add({ targets: this.resident, y: this.resident.y - 22, duration: 210, yoyo: true, repeat: 1, ease: "Sine.Out" });
    for (let i = 0; i < 5; i++) {
      const heart = this.add.image(this.resident.x + Phaser.Math.Between(-40, 40), this.resident.y - 75, "heart").setDepth(75).setScale(0.4 + Math.random() * 0.5).setAlpha(0.9);
      this.tweens.add({ targets: heart, y: heart.y - Phaser.Math.Between(45, 85), x: heart.x + Phaser.Math.Between(-25, 25), alpha: 0, angle: Phaser.Math.Between(-25, 25), duration: 1000 + i * 100, onComplete: () => heart.destroy() });
    }
  }

  private burst(x: number, y: number, quantity: number): void {
    const emitter = this.add.particles(x, y, "particle", {
      speed: { min: 55, max: 210 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 450, max: 1050 },
      scale: { start: 0.85, end: 0 },
      alpha: { start: 0.95, end: 0 },
      gravityY: 150,
      quantity: 1,
      emitting: false,
      tint: [0xffd785, 0xffa8a0, 0x9fe0ba, 0xa8d9ee]
    }).setDepth(80);
    emitter.explode(quantity, x, y);
    this.time.delayedCall(1200, () => emitter.destroy());
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, { fontFamily: "Segoe UI, sans-serif", fontSize: "16px", fontStyle: "bold", color, stroke: "#172133", strokeThickness: 5 }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: label, y: y - 65, scale: { from: 0.65, to: 1.05 }, alpha: { from: 1, to: 0 }, duration: 1350, ease: "Cubic.Out", onComplete: () => label.destroy() });
  }

  update(_time: number, delta: number): void {
    if (!this.rainGraphics || !this.layoutInfo) return;
    const { city } = this.layoutInfo;
    const dt = Math.min(delta, 50) / 1000;
    this.rainGraphics.clear();
    this.rainGraphics.lineStyle(1.2, 0xadd3e2, 0.22);
    this.rain.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.x -= drop.speed * dt * 0.16;
      if (drop.y > city.y + city.h || drop.x < city.x) {
        drop.y = city.y + Math.random() * 20;
        drop.x = Phaser.Math.FloatBetween(city.x, city.x + city.w + 20);
      }
      this.rainGraphics?.beginPath();
      this.rainGraphics?.moveTo(drop.x, drop.y);
      this.rainGraphics?.lineTo(drop.x - drop.length * 0.16, drop.y + drop.length);
      this.rainGraphics?.strokePath();
    });
  }
}
