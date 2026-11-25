import { _decorator, Button, Color, Component, EventTouch, Graphics, Label, Node, Sprite, tween, Tween, UIOpacity, UITransform, Vec3 } from "cc";
import { DATA } from "./data";
import { GameState, type BoardItem } from "./core/state";
import { TextureLibrary } from "./TextureLibrary";
import { C, makeLabel, makeNode, makeRect, makeSprite } from "./CocosUI";
const { ccclass } = _decorator;

interface ViewInfo {
  node: Node;
  index: number;
  item: BoardItem;
}

interface DragInfo {
  info: ViewInfo;
  touchId: number;
  start: Vec3;
  moved: boolean;
  hover: number;
}

@ccclass("BoardController")
export class BoardController extends Component {
  private state!: GameState;
  private textures!: TextureLibrary;
  private cells: Node[] = [];
  private views = new Map<number, ViewInfo>();
  private drag: DragInfo | null = null;
  private selected = -1;
  private visualAction: Record<string, unknown> | null = null;
  private inputEnabled = true;
  private readonly step = 80;
  private readonly cellSize = 74;

  init(state: GameState, textures: TextureLibrary): void {
    this.state = state;
    this.textures = textures;
    this.node.setPosition(0, -165, 0);
    makeRect(this.node, "Board frame", 0, 0, 584, 660, new Color(14, 24, 39, 235), 28);
    for (let index = 0; index < DATA.boardSize; index++) {
      const position = this.cellPosition(index);
      const cell = makeRect(this.node, `Cell ${index}`, position.x, position.y, this.cellSize, this.cellSize, C.cell, 15);
      this.cells.push(cell);
    }
    this.state.on("spawn", (detail) => { this.visualAction = { type: "spawn", ...detail }; });
    this.state.on("merge", (detail) => { this.visualAction = { type: "merge", ...detail }; });
    this.state.on("deliver", (detail) => { this.visualAction = { type: "deliver", ...detail }; });
    this.state.on("chest", (detail) => { this.visualAction = { type: "chest", ...detail }; });
    this.state.on("change", () => this.sync());
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    this.sync(false);
  }

  protected onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private cellPosition(index: number): Vec3 {
    return new Vec3((index % DATA.columns - 3) * this.step, (3.5 - Math.floor(index / DATA.columns)) * this.step, 0);
  }

  private cellAt(position: Vec3): number {
    const col = Math.round(position.x / this.step + 3);
    const row = Math.round(3.5 - position.y / this.step);
    if (col < 0 || col >= DATA.columns || row < 0 || row >= DATA.rows) return -1;
    const index = row * DATA.columns + col;
    const center = this.cellPosition(index);
    return Math.abs(position.x - center.x) <= this.cellSize / 2 + 4 && Math.abs(position.y - center.y) <= this.cellSize / 2 + 4 ? index : -1;
  }

  private touchPosition(event: EventTouch): Vec3 {
    const location = event.getUILocation();
    return this.node.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private redrawCell(index: number, mode: "idle" | "match" | "hover" | "selected" = "idle"): void {
    const graphics = this.cells[index].getComponent(Graphics)!;
    const colors = {
      idle: new Color(46 + (Math.floor(index / 7) + index % 7) % 2 * 3, 61 + (Math.floor(index / 7) + index % 7) % 2 * 3, 79 + (Math.floor(index / 7) + index % 7) % 2 * 3, 255),
      match: new Color(60, 99, 79, 255),
      hover: new Color(113, 89, 57, 255),
      selected: new Color(79, 80, 94, 255)
    };
    graphics.clear();
    graphics.fillColor = colors[mode];
    graphics.roundRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize, 15);
    graphics.fill();
    graphics.lineWidth = mode === "idle" ? 1 : 3;
    graphics.strokeColor = mode === "match" ? C.mint : mode === "idle" ? new Color(133, 151, 171, 35) : C.amber;
    graphics.roundRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize, 15);
    graphics.stroke();
  }

  private createView(item: BoardItem, index: number): ViewInfo {
    const position = this.cellPosition(index);
    const node = makeNode(`Item ${item.id}`, this.node, position.x, position.y, this.cellSize, this.cellSize);
    makeSprite(node, this.textures.item(item.chain, item.tier), 0, 2, 70, 70, "Item sprite");
    const badge = makeRect(node, "Tier badge", 23, -24, 24, 20, new Color(17, 29, 46, 225), 7);
    const badgeLabel = makeLabel(node, `${item.tier}`, 23, -24, 15, C.amber, 22, Label.HorizontalAlign.CENTER);
    badgeLabel.node.name = "Tier label";
    badge.active = badgeLabel.node.active = item.tier > 1;
    const info: ViewInfo = { node, index, item };
    node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      if (!this.inputEnabled || this.drag) return;
      event.propagationStopped = true;
      this.drag = { info, touchId: event.getID() ?? -1, start: this.touchPosition(event), moved: false, hover: -1 };
    });
    this.views.set(item.id, info);
    return info;
  }

  private onTouchMove(event: EventTouch): void {
    const drag = this.drag;
    if (!drag || !this.inputEnabled || event.getID() !== drag.touchId) return;
    const position = this.touchPosition(event);
    if (!drag.moved && Vec3.distance(position, drag.start) > 9) {
      drag.moved = true;
      drag.info.node.setSiblingIndex(this.node.children.length - 1);
      tween(drag.info.node).to(0.1, { scale: new Vec3(1.14, 1.14, 1) }).start();
      this.selected = -1;
    }
    if (!drag.moved) return;
    drag.info.node.setPosition(position);
    const hover = this.cellAt(position);
    if (hover === drag.hover) return;
    drag.hover = hover;
    this.cells.forEach((_, index) => this.redrawCell(index));
    const source = this.state.board[drag.info.index];
    if (source) this.state.board.forEach((item, index) => {
      if (index !== drag.info.index && item?.chain === source.chain && item.tier === source.tier) this.redrawCell(index, "match");
    });
    if (hover >= 0 && hover !== drag.info.index) this.redrawCell(hover, "hover");
  }

  private onTouchEnd(event: EventTouch): void {
    const drag = this.drag;
    if (!drag || event.getID() !== drag.touchId) return;
    this.drag = null;
    this.cells.forEach((_, index) => this.redrawCell(index));
    if (!this.inputEnabled) {
      this.sync(false);
      return;
    }
    if (drag.moved) {
      const target = this.cellAt(this.touchPosition(event));
      if (target < 0 || target === drag.info.index) {
        const home = this.cellPosition(drag.info.index);
        tween(drag.info.node).to(0.2, { position: home, scale: Vec3.ONE }, { easing: "backOut" }).start();
      } else {
        this.state.moveItem(drag.info.index, target);
      }
      return;
    }
    if (this.selected >= 0 && this.selected !== drag.info.index) {
      const from = this.selected;
      this.selected = -1;
      this.state.moveItem(from, drag.info.index);
      return;
    }
    this.selected = this.selected === drag.info.index ? -1 : drag.info.index;
    if (this.selected >= 0) this.redrawCell(this.selected, "selected");
  }

  private sync(animate = true): void {
    animate = animate && !this.state.profile.settings.reducedMotion;
    const action = this.visualAction;
    this.visualAction = null;
    const alive = new Set<number>();
    this.state.board.forEach((item, index) => {
      if (!item) return;
      alive.add(item.id);
      let info = this.views.get(item.id);
      if (!info) {
        info = this.createView(item, index);
        if (animate && action?.type === "merge" && Array.isArray(action.outputs) && action.outputs.includes(index)) {
          info.node.setScale(0.1, 0.1, 1);
          const opacity = info.node.addComponent(UIOpacity);
          opacity.opacity = 0;
          tween(info.node).delay(0.18).to(0.38, { scale: Vec3.ONE }, { easing: "backOut" }).start();
          tween(opacity).delay(0.18).to(0.2, { opacity: 255 }).start();
        } else if (animate && (action?.type === "spawn" || action?.type === "chest")) {
          const target = info.node.position.clone();
          info.node.setPosition(target.x, -410, 0);
          info.node.setScale(0.35, 0.35, 1);
          tween(info.node).to(0.46, { position: target, scale: Vec3.ONE }, { easing: "backOut" }).start();
        }
      } else {
        info.index = index;
        info.item = item;
        const sprite = info.node.getComponentInChildren(Sprite);
        if (sprite) sprite.spriteFrame = this.textures.item(item.chain, item.tier);
        const badge = info.node.getChildByName("Tier badge");
        const badgeLabel = info.node.getChildByName("Tier label")?.getComponent(Label);
        if (badge) badge.active = item.tier > 1;
        if (badgeLabel) {
          badgeLabel.string = `${item.tier}`;
          badgeLabel.node.active = item.tier > 1;
        }
        const position = this.cellPosition(index);
        if (Vec3.distance(info.node.position, position) > 1) tween(info.node).to(animate ? 0.22 : 0, { position }, { easing: "sineOut" }).start();
      }
    });

    this.views.forEach((info, id) => {
      if (alive.has(id)) return;
      this.views.delete(id);
      Tween.stopAllByTarget(info.node);
      if (animate && action?.type === "merge" && Array.isArray(action.sources) && action.sources.includes(info.index)) {
        const target = this.cellPosition(Number(action.to));
        const opacity = info.node.getComponent(UIOpacity) ?? info.node.addComponent(UIOpacity);
        tween(info.node).to(0.25, { position: target, scale: new Vec3(0.2, 0.2, 1), angle: Math.random() * 40 - 20 }, { easing: "cubicIn" }).call(() => info.node.destroy()).start();
        tween(opacity).to(0.25, { opacity: 0 }).start();
      } else if (animate && action?.type === "deliver") {
        const opacity = info.node.getComponent(UIOpacity) ?? info.node.addComponent(UIOpacity);
        tween(info.node).to(0.45, { position: new Vec3(180, 530, 0), scale: new Vec3(0.15, 0.15, 1) }, { easing: "cubicIn" }).call(() => info.node.destroy()).start();
        tween(opacity).to(0.45, { opacity: 0 }).start();
      } else {
        const opacity = info.node.getComponent(UIOpacity) ?? info.node.addComponent(UIOpacity);
        tween(info.node).to(0.16, { scale: new Vec3(0.15, 0.15, 1) }).call(() => info.node.destroy()).start();
        tween(opacity).to(0.16, { opacity: 0 }).start();
      }
    });

    if (animate && action?.type === "merge") {
      const point = this.cellPosition(Number(action.to));
      this.scheduleOnce(() => {
        this.burst(point, action.bonus ? 26 : 17);
        const text = action.recycled ? `+${action.stars} ★` : action.bonus ? "СЛИЯНИЕ ПЯТИ! ×2" : `Новый предмет · уровень ${(action.item as BoardItem)?.tier ?? ""}`;
        this.floatText(point, text, action.bonus ? C.rose : C.amber);
      }, 0.17);
    }
    if (action?.type === "chest") this.burst(new Vec3(0, 0, 0), 32);
  }

  private burst(point: Vec3, quantity: number): void {
    if (this.state.profile.settings.reducedMotion) return;
    for (let i = 0; i < quantity; i++) {
      const sprite = makeSprite(this.node, this.textures.get("spark"), point.x, point.y, 12 + Math.random() * 10, 12 + Math.random() * 10, "Spark");
      const opacity = sprite.addComponent(UIOpacity);
      const angle = Math.random() * Math.PI * 2;
      const distance = 45 + Math.random() * 95;
      const destination = new Vec3(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance - 35, 0);
      sprite.setScale(0.4, 0.4, 1);
      tween(sprite).to(0.55 + Math.random() * 0.35, { position: destination, scale: new Vec3(0.05, 0.05, 1) }, { easing: "quadOut" }).call(() => sprite.destroy()).start();
      tween(opacity).to(0.8, { opacity: 0 }).start();
    }
  }

  private floatText(point: Vec3, text: string, color: Color): void {
    const label = makeLabel(this.node, text, point.x, point.y + 18, 22, color, 480, Label.HorizontalAlign.CENTER);
    const opacity = label.node.addComponent(UIOpacity);
    label.node.setScale(0.6, 0.6, 1);
    tween(label.node).to(1.15, { position: new Vec3(point.x, point.y + 95, 0), scale: new Vec3(1, 1, 1) }, { easing: "cubicOut" }).call(() => label.node.destroy()).start();
    tween(opacity).delay(0.55).to(0.6, { opacity: 0 }).start();
  }

  get selectedIndex(): number {
    return this.selected;
  }

  clearSelection(): void {
    if (this.selected >= 0) this.redrawCell(this.selected);
    this.selected = -1;
  }

  setEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.drag = null;
      this.sync(false);
    }
  }

  celebrateDelivery(): void {
    this.burst(new Vec3(180, 500, 0), 16);
  }
}
